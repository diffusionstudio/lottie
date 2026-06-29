#!/usr/bin/env python3
"""build_redraw.py — additive redraw (handwriting / draw-on) helper.

Input : an SVG (or --d) containing OPEN STROKED path(s) — the redraw-reuse case
        from references/single-line-redraw.md (the centerline is GIVEN).
Output: a minimal Lottie scene (visible stroke + Trim Paths per pen stroke, no
        track matte, no fill layer) and a flat redraw-preview.svg proof.

Does NOT do centerline extraction, rail pairing, or skeletonization — that is the
mask-reveal solver's job (scripts/centerline/derive_rails.py) or the deferred
Phase 2 --from-fill subcommand. This script only REUSES geometry that already is a
stroke.

Béziers are PRESERVED: SVG cubic/quadratic control points are converted into
Lottie's vertex + in/out-tangent form. We never flatten curves to dense polylines
(that would roughen the settled stroke and balloon the point count).

Stdlib only.

  python3 build_redraw.py in.svg [--stagger 0.85] [--cap round|butt]
                                 [--fr 30] [--dur 24] [--out redraw.json]
  python3 build_redraw.py --d "M.. C.. .." --width 14.9
"""
import argparse
import json
import math
import os
import re
import sys

NUM = r"[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?"


# ---------------------------------------------------------------------------
# SVG path parsing — preserves Béziers as Lottie {v, i, o} vertices.
# i = in-tangent offset (control arriving INTO the vertex, relative to vertex)
# o = out-tangent offset (control leaving the vertex, relative to vertex)
# ---------------------------------------------------------------------------

def _tokenize(d):
    return re.findall(r"[MmLlHhVvCcSsQqTtAaZz]|" + NUM, d)


def parse_d(d):
    """Parse a path 'd' into a list of subpaths. Each subpath = dict with
    'verts' (list of {v,i,o}) and 'closed' (bool). One subpath per pen-down (M)."""
    toks = _tokenize(d)
    i = 0
    cur = (0.0, 0.0)
    start = (0.0, 0.0)
    prev_cmd = None
    last_ctrl = None        # last cubic/quad control, for S/T reflection
    subpaths = []
    verts = None            # current subpath's vertex list

    def f(k):
        return float(toks[k])

    def new_subpath(pt):
        nonlocal verts
        verts = [{"v": list(pt), "i": [0.0, 0.0], "o": [0.0, 0.0]}]
        subpaths.append({"verts": verts, "closed": False})

    def line_to(pt):
        verts.append({"v": list(pt), "i": [0.0, 0.0], "o": [0.0, 0.0]})

    def cubic_to(c1, c2, p):
        # out-tangent of the current last vertex points at c1
        verts[-1]["o"] = [c1[0] - cur[0], c1[1] - cur[1]]
        verts.append({"v": list(p), "i": [c2[0] - p[0], c2[1] - p[1]], "o": [0.0, 0.0]})

    while i < len(toks):
        t = toks[i]
        if re.match(r"[A-Za-z]", t):
            cmd = t
            i += 1
        else:
            # implicit repeat of previous command (SVG allows omitting it)
            cmd = prev_cmd
        rel = cmd.islower()
        C = cmd.upper()

        if C == "M":
            x, y = f(i), f(i + 1); i += 2
            if rel and verts is not None:
                x += cur[0]; y += cur[1]
            cur = (x, y); start = cur
            new_subpath(cur)
            last_ctrl = None
            # subsequent implicit coords after M are treated as L
            prev_cmd = "l" if rel else "L"
            continue
        elif C == "L":
            x, y = f(i), f(i + 1); i += 2
            if rel: x += cur[0]; y += cur[1]
            cur = (x, y); line_to(cur); last_ctrl = None
        elif C == "H":
            x = f(i); i += 1
            if rel: x += cur[0]
            cur = (x, cur[1]); line_to(cur); last_ctrl = None
        elif C == "V":
            y = f(i); i += 1
            if rel: y += cur[1]
            cur = (cur[0], y); line_to(cur); last_ctrl = None
        elif C == "C":
            c1 = (f(i), f(i + 1)); c2 = (f(i + 2), f(i + 3)); p = (f(i + 4), f(i + 5)); i += 6
            if rel:
                c1 = (c1[0] + cur[0], c1[1] + cur[1])
                c2 = (c2[0] + cur[0], c2[1] + cur[1])
                p = (p[0] + cur[0], p[1] + cur[1])
            cubic_to(c1, c2, p); last_ctrl = c2; cur = p
        elif C == "S":
            c2 = (f(i), f(i + 1)); p = (f(i + 2), f(i + 3)); i += 4
            if rel:
                c2 = (c2[0] + cur[0], c2[1] + cur[1]); p = (p[0] + cur[0], p[1] + cur[1])
            if prev_cmd and prev_cmd.upper() in ("C", "S") and last_ctrl is not None:
                c1 = (2 * cur[0] - last_ctrl[0], 2 * cur[1] - last_ctrl[1])
            else:
                c1 = cur
            cubic_to(c1, c2, p); last_ctrl = c2; cur = p
        elif C == "Q":
            q = (f(i), f(i + 1)); p = (f(i + 2), f(i + 3)); i += 4
            if rel:
                q = (q[0] + cur[0], q[1] + cur[1]); p = (p[0] + cur[0], p[1] + cur[1])
            c1 = (cur[0] + 2 / 3 * (q[0] - cur[0]), cur[1] + 2 / 3 * (q[1] - cur[1]))
            c2 = (p[0] + 2 / 3 * (q[0] - p[0]), p[1] + 2 / 3 * (q[1] - p[1]))
            cubic_to(c1, c2, p); last_ctrl = q; cur = p
        elif C == "T":
            p = (f(i), f(i + 1)); i += 2
            if rel: p = (p[0] + cur[0], p[1] + cur[1])
            if prev_cmd and prev_cmd.upper() in ("Q", "T") and last_ctrl is not None:
                q = (2 * cur[0] - last_ctrl[0], 2 * cur[1] - last_ctrl[1])
            else:
                q = cur
            c1 = (cur[0] + 2 / 3 * (q[0] - cur[0]), cur[1] + 2 / 3 * (q[1] - cur[1]))
            c2 = (p[0] + 2 / 3 * (q[0] - p[0]), p[1] + 2 / 3 * (q[1] - p[1]))
            cubic_to(c1, c2, p); last_ctrl = q; cur = p
        elif C == "A":
            # Arc — rare in handwriting exports. Degrade to a line to the endpoint.
            p = (f(i + 5), f(i + 6)); i += 7
            if rel: p = (p[0] + cur[0], p[1] + cur[1])
            sys.stderr.write("warning: arc (A) segment approximated as a line\n")
            cur = (p[0], p[1]); line_to(cur); last_ctrl = None
        elif C == "Z":
            if verts is not None:
                subpaths[-1]["closed"] = True
            cur = start; last_ctrl = None
        else:
            i += 1
            continue
        prev_cmd = cmd

    # drop degenerate subpaths (single point / no draw)
    return [s for s in subpaths if len(s["verts"]) >= 2]


# ---------------------------------------------------------------------------
# Geometry helpers (length only — never used for output geometry)
# ---------------------------------------------------------------------------

def _cubic_pts(p0, c1, c2, p3, n=12):
    out = []
    for k in range(1, n + 1):
        t = k / n; u = 1 - t
        out.append((u*u*u*p0[0] + 3*u*u*t*c1[0] + 3*u*t*t*c2[0] + t*t*t*p3[0],
                    u*u*u*p0[1] + 3*u*u*t*c1[1] + 3*u*t*t*c2[1] + t*t*t*p3[1]))
    return out


def subpath_length(verts):
    total = 0.0
    prev = tuple(verts[0]["v"])
    for k in range(1, len(verts)):
        a = verts[k - 1]; b = verts[k]
        c1 = (a["v"][0] + a["o"][0], a["v"][1] + a["o"][1])
        c2 = (b["v"][0] + b["i"][0], b["v"][1] + b["i"][1])
        for pt in _cubic_pts(tuple(a["v"]), c1, c2, tuple(b["v"])):
            total += math.hypot(pt[0] - prev[0], pt[1] - prev[1]); prev = pt
    return total


def verts_to_abs_d(verts):
    """Reconstruct an absolute path 'd' from parsed verts (exact — preserves curves)."""
    v0 = verts[0]["v"]
    out = [f"M {v0[0]:.3f} {v0[1]:.3f}"]
    for k in range(1, len(verts)):
        a = verts[k - 1]; b = verts[k]
        c1 = (a["v"][0] + a["o"][0], a["v"][1] + a["o"][1])
        c2 = (b["v"][0] + b["i"][0], b["v"][1] + b["i"][1])
        out.append(f"C {c1[0]:.3f} {c1[1]:.3f} {c2[0]:.3f} {c2[1]:.3f} {b['v'][0]:.3f} {b['v'][1]:.3f}")
    return " ".join(out)


# ---------------------------------------------------------------------------
# SVG source extraction
# ---------------------------------------------------------------------------

def extract_from_svg(text):
    paths = re.findall(r'\bd="([^"]+)"', text)
    if not paths:
        paths = re.findall(r"\bd='([^']+)'", text)
    wm = re.search(r'stroke-width\s*[=:]\s*["\']?\s*(' + NUM + r')', text)
    width = float(wm.group(1)) if wm else None
    cm = re.search(r'stroke\s*[=:]\s*["\']?\s*(#[0-9A-Fa-f]{3,6})', text)
    color = cm.group(1) if cm else "#000000"
    vbm = re.search(r'viewBox\s*=\s*["\']\s*(' + NUM + r")\s+(" + NUM + r")\s+(" + NUM + r")\s+(" + NUM + r')', text)
    vb = [float(vbm.group(k)) for k in range(1, 5)] if vbm else None
    stroked = bool(re.search(r'fill\s*[=:]\s*["\']?\s*none', text))
    return paths, width, color, vb, stroked


def hex_to_rgba(h):
    h = h.lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    r, g, b = (int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))
    return [round(r, 4), round(g, 4), round(b, 4), 1]


# ---------------------------------------------------------------------------
# Build outputs
# ---------------------------------------------------------------------------

def build_strokes(svg_paths):
    """Flatten all <path> d= into ordered pen strokes (one per subpath/pen-down),
    sorted baseline left-to-right by the stroke's min-x, SVG order as tiebreak."""
    strokes = []
    for order, d in enumerate(svg_paths):
        for sp in parse_d(d):
            xs = [v["v"][0] for v in sp["verts"]]
            strokes.append({"verts": sp["verts"], "minx": min(xs),
                            "start": sp["verts"][0]["v"], "svg_order": order})
    strokes.sort(key=lambda s: (round(s["minx"], 3), s["svg_order"]))
    return strokes


def build_lottie(strokes, width, color, vb, cap, fr, dur, stagger):
    w = vb[2] if vb else 512
    h = vb[3] if vb else 512
    lc = 2 if cap == "round" else 1
    lj = 2 if cap == "round" else 1
    step = max(1, round(dur * stagger))
    op = (len(strokes) - 1) * step + dur
    rgba = hex_to_rgba(color)
    layers = []
    for idx, s in enumerate(strokes):
        t0 = idx * step
        t1 = t0 + dur
        verts = s["verts"]
        layers.append({
            "ind": idx + 1, "ty": 4, "nm": f"redraw-{idx + 1}",
            "ip": t0, "op": op, "st": 0, "sr": 1, "bm": 0,
            "ks": {"o": {"a": 0, "k": 100}, "r": {"a": 0, "k": 0},
                   "p": {"a": 0, "k": [0, 0, 0]}, "a": {"a": 0, "k": [0, 0, 0]},
                   "s": {"a": 0, "k": [100, 100, 100]}},
            "shapes": [{"ty": "gr", "nm": f"stroke-{idx + 1}", "it": [
                {"ty": "sh", "nm": "pen-path", "ks": {"a": 0, "k": {
                    "i": [v["i"] for v in verts],
                    "o": [v["o"] for v in verts],
                    "v": [v["v"] for v in verts],
                    "c": False}}},
                {"ty": "tm", "nm": "write-on",
                 "s": {"a": 0, "k": 0},
                 "e": {"a": 1, "k": [
                     {"t": t0, "s": [0], "o": {"x": [0.42], "y": [0.0]}, "i": {"x": [0.58], "y": [1.0]}},
                     {"t": t1, "s": [100]}]},
                 "o": {"a": 0, "k": 0}, "m": 1},
                {"ty": "st", "nm": "ink",
                 "c": {"a": 0, "k": rgba, "sid": "textColor"},
                 "o": {"a": 0, "k": 100},
                 "w": {"a": 0, "k": width},
                 "lc": lc, "lj": lj, "ml": 4},
                {"ty": "tr", "p": {"a": 0, "k": [0, 0]}, "a": {"a": 0, "k": [0, 0]},
                 "s": {"a": 0, "k": [100, 100]}, "r": {"a": 0, "k": 0}, "o": {"a": 0, "k": 100}}
            ]}]
        })
    return {"v": "5.7.0", "fr": fr, "ip": 0, "op": op, "w": int(round(w)), "h": int(round(h)),
            "nm": "redraw", "ddd": 0, "assets": [], "layers": layers}


def build_preview(strokes, width, vb, cap):
    w = vb[2] if vb else 512
    h = vb[3] if vb else 512
    linecap = "round" if cap == "round" else "butt"
    parts = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:g} {h:g}" '
             f'width="{w:g}" height="{h:g}">',
             '<rect width="100%" height="100%" fill="#ffffff"/>',
             '<!-- redraw-preview: each stroke at its width, numbered in draw order, start dot -->']
    for idx, s in enumerate(strokes):
        d = verts_to_abs_d(s["verts"])
        parts.append(f'<path d="{d}" fill="none" stroke="#c8ccd2" stroke-width="{width:g}" '
                     f'stroke-linecap="{linecap}" stroke-linejoin="round"/>')
    for idx, s in enumerate(strokes):
        sx, sy = s["start"]
        parts.append(f'<circle cx="{sx:.2f}" cy="{sy:.2f}" r="{max(3, width*0.32):.2f}" fill="#e8482b"/>')
        parts.append(f'<text x="{sx + width*0.6:.2f}" y="{sy - width*0.6:.2f}" '
                     f'font-family="sans-serif" font-size="{max(12, width):.0f}" '
                     f'fill="#1a1a1a" font-weight="700">{idx + 1}</text>')
    parts.append("</svg>")
    return "\n".join(parts)


def main():
    ap = argparse.ArgumentParser(description="Redraw (handwriting/draw-on) builder.")
    ap.add_argument("svg", nargs="?", help="input SVG with open stroked paths")
    ap.add_argument("--d", help="inline path data instead of an SVG file")
    ap.add_argument("--width", type=float, help="stroke width (overrides SVG)")
    ap.add_argument("--color", default=None, help="stroke color hex (overrides SVG)")
    ap.add_argument("--cap", choices=["round", "butt"], default="round")
    ap.add_argument("--stagger", type=float, default=0.85,
                    help="next stroke starts at this fraction of the previous duration")
    ap.add_argument("--fr", type=float, default=30.0)
    ap.add_argument("--dur", type=int, default=24, help="frames per stroke")
    ap.add_argument("--out", default="redraw.json")
    args = ap.parse_args()

    vb = None; stroked = True; svg_color = "#000000"; svg_width = None
    if args.d:
        paths = [args.d]
    elif args.svg:
        text = open(args.svg).read()
        paths, svg_width, svg_color, vb, stroked = extract_from_svg(text)
        if not paths:
            sys.exit("no <path d=...> found in " + args.svg)
    else:
        ap.error("provide an SVG file or --d")

    if not stroked and not args.d:
        sys.stderr.write(
            "warning: source has no fill=\"none\" — this looks FILLED, not stroked.\n"
            "         Redraw reuse needs open stroked paths. If this is a filled mark,\n"
            "         request stroke data (see references/single-line-redraw.md), do not\n"
            "         invert the fill here.\n")

    width = args.width or svg_width or 8.0
    color = args.color or svg_color
    strokes = build_strokes(paths)
    if not strokes:
        sys.exit("no drawable strokes parsed")

    lottie = build_lottie(strokes, width, color, vb, args.cap, args.fr, args.dur, args.stagger)
    with open(args.out, "w") as fh:
        json.dump(lottie, fh, indent=2)

    preview_path = os.path.join(os.path.dirname(args.out) or ".", "redraw-preview.svg")
    with open(preview_path, "w") as fh:
        fh.write(build_preview(strokes, width, vb, args.cap))

    total_len = sum(subpath_length(s["verts"]) for s in strokes)
    print(json.dumps({
        "strokes": len(strokes),
        "draw_order": [{"n": i + 1, "start": [round(s["start"][0], 1), round(s["start"][1], 1)],
                        "points": len(s["verts"])} for i, s in enumerate(strokes)],
        "width": width, "cap": args.cap, "fr": args.fr, "op": lottie["op"],
        "total_path_length": round(total_len, 1),
        "out": args.out, "preview": preview_path,
        "mode": "redraw-reuse",
    }, indent=2))


if __name__ == "__main__":
    main()
