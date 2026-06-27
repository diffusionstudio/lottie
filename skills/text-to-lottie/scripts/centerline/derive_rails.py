#!/usr/bin/env python3
"""
Derive a single-line CENTERLINE for a filled ribbon/tube/folded-flag mark by
CONTOUR RAIL PAIRING (no raster skeleton). Standard library only.

This is the bundled reference solver for `single-line-vectorization.md`. Copy it
into a per-project sandbox (`scripts/<slug>-centerline/`), point it at the mark's
filled subpath, run it, read the balance report, then carry `centerline_d` +
`recommended_matte_width` + `route_decision` into the production matte (see
`build_matte_snippet.md`).

Why rail pairing and not a raster skeleton:
  A ribbon/tube mark's boundary is one closed contour that runs out along one
  rail, U-turns at an end CAP, and runs back along the opposite rail to the other
  cap. Splitting at the caps and pairing the two rails BY ROUTE ORDER gives an
  exact centerline. This is robust even when the two rails have different lengths
  (folds) — so unequal rail length / a fold-back is NOT a reason to abandon
  pairing. Raster skeletonization is a fallback only for genuine topological
  branching (>=3 true caps / a Y or T junction), never the first move here.

Topology gate:
  Caps are detected as the short edges where the boundary U-turns (a cap edge's
  neighbouring rail edges run anti-parallel). The COUNT of true caps is the
  topology signal: exactly 2 => single folded ribbon (this tool's target). If the
  data does not yield a clean 2-cap split, the tool says so — reconsider topology
  (split into multiple driver paths) instead of forcing a bad single path.

Rail-mode gate (objective, not by example):
  After splitting, the SHARP-CORNER FRACTION of the rail vertices decides the
  pairing math:
    - high fraction  => POLYGONAL rails -> midline-intersection (exact sharp
                        corners). Primary, proven path.
    - low fraction   => CURVED/organic rails -> NORMAL-FOOT pairing (perpendicular
                        from each sample to the nearest foot on the opposite rail,
                        then midpoint). Fold-tolerant. SECONDARY/UNPROVEN: validate
                        against a real folding-curved fixture before trusting it.
  Note: uniform-resample-by-arclength-then-pair-by-index is normalized-arclength
  correspondence in disguise and is NOT used — it would fold-fail like the brittle
  original. Pairing is always by route order (polygonal) or normal foot (curved).

Usage:
  python derive_rails.py --d "M.. L.. Z"            # inline path
  python derive_rails.py mark.svg                   # .svg: picks largest subpath
  python derive_rails.py mark.svg --index 2         # pick a specific subpath
  python derive_rails.py path.txt                   # file holding one `d` string
  options: --out centerline.json  --corner-deg 25  --cap-anti -0.6
           --start-cap A|B  --samples 2
"""
import argparse
import json
import math
import os
import re
import sys


# ---------- tiny vec helpers ----------
def sub(a, b): return (a[0] - b[0], a[1] - b[1])
def add(a, b): return (a[0] + b[0], a[1] + b[1])
def mul(a, s): return (a[0] * s, a[1] * s)
def dot(a, b): return a[0] * b[0] + a[1] * b[1]
def cross(a, b): return a[0] * b[1] - a[1] * b[0]
def length(a): return math.hypot(a[0], a[1])
def mid(a, b): return ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2)


def norm(a):
    L = length(a) or 1.0
    return (a[0] / L, a[1] / L)


# ---------- SVG path -> flattened polygon ----------
TOKEN = re.compile(r"[MmLlHhVvCcSsQqTtAaZz]|-?\d*\.?\d+(?:[eE]-?\d+)?")


def _cubic(p0, p1, p2, p3, n=16):
    out = []
    for k in range(1, n + 1):
        t = k / n
        u = 1 - t
        x = (u * u * u * p0[0] + 3 * u * u * t * p1[0]
             + 3 * u * t * t * p2[0] + t * t * t * p3[0])
        y = (u * u * u * p0[1] + 3 * u * u * t * p1[1]
             + 3 * u * t * t * p2[1] + t * t * t * p3[1])
        out.append((x, y))
    return out


def _quad(p0, p1, p2, n=12):
    out = []
    for k in range(1, n + 1):
        t = k / n
        u = 1 - t
        x = u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0]
        y = u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]
        out.append((x, y))
    return out


def flatten_subpath(d):
    """Flatten one SVG subpath `d` to an ordered list of (x, y) vertices.

    Supports M L H V C S Q T A Z, absolute and relative. Curves are sampled to
    line segments (centerline geometry works on the flattened polygon).
    """
    toks = TOKEN.findall(d)
    i = 0
    cur = (0.0, 0.0)
    start = (0.0, 0.0)
    cmd = None
    prev_cubic_ctrl = None
    prev_quad_ctrl = None
    pts = []

    def num():
        nonlocal i
        v = float(toks[i]); i += 1
        return v

    while i < len(toks):
        t = toks[i]
        if t.isalpha():
            cmd = t; i += 1
        rel = cmd.islower()
        c = cmd.upper()
        base = cur if rel else (0.0, 0.0)
        if c == "M":
            cur = (base[0] + num(), base[1] + num()); start = cur
            pts.append(cur); cmd = "l" if rel else "L"
            prev_cubic_ctrl = prev_quad_ctrl = None
        elif c == "L":
            cur = (base[0] + num(), base[1] + num()); pts.append(cur)
            prev_cubic_ctrl = prev_quad_ctrl = None
        elif c == "H":
            cur = ((cur[0] if rel else 0.0) + num(), cur[1]); pts.append(cur)
            prev_cubic_ctrl = prev_quad_ctrl = None
        elif c == "V":
            cur = (cur[0], (cur[1] if rel else 0.0) + num()); pts.append(cur)
            prev_cubic_ctrl = prev_quad_ctrl = None
        elif c in ("C", "S"):
            if c == "C":
                p1 = (base[0] + num(), base[1] + num())
                p2 = (base[0] + num(), base[1] + num())
            else:  # smooth: reflect previous second control point
                p1 = (2 * cur[0] - prev_cubic_ctrl[0], 2 * cur[1] - prev_cubic_ctrl[1]) \
                    if prev_cubic_ctrl else cur
                p2 = (base[0] + num(), base[1] + num())
            p3 = (base[0] + num(), base[1] + num())
            pts.extend(_cubic(cur, p1, p2, p3))
            prev_cubic_ctrl = p2; prev_quad_ctrl = None; cur = p3
        elif c in ("Q", "T"):
            if c == "Q":
                p1 = (base[0] + num(), base[1] + num())
            else:
                p1 = (2 * cur[0] - prev_quad_ctrl[0], 2 * cur[1] - prev_quad_ctrl[1]) \
                    if prev_quad_ctrl else cur
            p2 = (base[0] + num(), base[1] + num())
            pts.extend(_quad(cur, p1, p2))
            prev_quad_ctrl = p1; prev_cubic_ctrl = None; cur = p2
        elif c == "A":
            num(); num(); num(); num(); num()        # rx ry rot large sweep
            p = (base[0] + num(), base[1] + num())
            pts.append(p); cur = p                    # chord approximation
            prev_cubic_ctrl = prev_quad_ctrl = None
        elif c == "Z":
            cur = start; cmd = None
            prev_cubic_ctrl = prev_quad_ctrl = None
    # drop closing duplicate
    if len(pts) > 1 and length(sub(pts[0], pts[-1])) < 1e-6:
        pts.pop()
    return pts


def split_subpaths(d):
    return [p for p in re.split(r"(?=[Mm])", d) if p.strip()]


def merge_close(pts, tol=0.6):
    out = [pts[0]]
    for p in pts[1:]:
        if length(sub(p, out[-1])) > tol:
            out.append(p)
    if len(out) > 1 and length(sub(out[0], out[-1])) <= tol:
        out.pop()
    return out


# ---------- geometry ----------
def line_intersect(p1, d1, p2, d2):
    den = cross(d1, d2)
    if abs(den) < 1e-9:
        return mid(p1, p2)
    t = cross(sub(p2, p1), d2) / den
    return add(p1, mul(d1, t))


def point_polyline_nearest(p, poly):
    best = (1e18, poly[0])
    for k in range(len(poly) - 1):
        a, b = poly[k], poly[k + 1]
        ab = sub(b, a); L2 = dot(ab, ab)
        t = 0.0 if L2 == 0 else max(0.0, min(1.0, dot(sub(p, a), ab) / L2))
        foot = add(a, mul(ab, t))
        dd = length(sub(p, foot))
        if dd < best[0]:
            best = (dd, foot)
    return best  # (dist, foot)


def turn_angle_deg(a, b, c):
    """Interior turn (deviation from straight) at vertex b, in degrees."""
    d1 = norm(sub(b, a)); d2 = norm(sub(c, b))
    return math.degrees(math.acos(max(-1.0, min(1.0, dot(d1, d2)))))


# ---------- cap detection / rail split ----------
def detect_caps(poly, anti_thresh):
    """Return sorted [i, j] cap edge indices, plus all U-turn candidates."""
    n = len(poly)
    edir = [norm(sub(poly[(i + 1) % n], poly[i])) for i in range(n)]
    elen = [length(sub(poly[(i + 1) % n], poly[i])) for i in range(n)]
    cand = []
    for i in range(n):
        pd = edir[(i - 1) % n]; nd = edir[(i + 1) % n]
        anti = dot(pd, nd)
        if anti < anti_thresh:                  # neighbours roughly anti-parallel
            cand.append((elen[i], anti, i))
    cand.sort()                                  # shortest first => the caps
    if len(cand) < 2:
        return None, cand
    return sorted([cand[0][2], cand[1][2]]), cand


def arc(poly, start, end):
    n = len(poly); out = []; k = start
    while True:
        out.append(poly[k % n])
        if k % n == end % n:
            break
        k += 1
    return out


def sharp_corner_fraction(rail, corner_deg):
    """Fraction of interior rail vertices whose turn exceeds corner_deg."""
    if len(rail) < 3:
        return 1.0
    sharp = sum(1 for k in range(1, len(rail) - 1)
                if turn_angle_deg(rail[k - 1], rail[k], rail[k + 1]) >= corner_deg)
    return sharp / (len(rail) - 2)


# ---------- pairing methods ----------
def centerline_polygonal(railA, railB_rev, capA, capB):
    """Midline-intersection (exact sharp corners). Requires equal rail counts."""
    nseg = len(railA) - 1
    midlines = []; widths = []
    for k in range(nseg):
        a0, a1 = railA[k], railA[k + 1]
        b0, b1 = railB_rev[k], railB_rev[k + 1]
        da = norm(sub(a1, a0))
        perp = (-da[1], da[0])
        widths.append(abs(dot(sub(b0, a0), perp)))
        pa = mid(a0, a1); pb = mid(b0, b1)
        midlines.append((mid(pa, pb), da))
    verts = [mid(*capA)]
    for k in range(nseg - 1):
        p1, d1 = midlines[k]; p2, d2 = midlines[k + 1]
        verts.append(line_intersect(p1, d1, p2, d2))
    verts.append(mid(*capB))
    return verts, widths


def centerline_normal_foot(railA, railB, capA, capB, samples_per_seg):
    """Normal-foot pairing (fold-tolerant). Walk railA; midpoint each sample with
    its nearest foot on railB. Endpoints are cap midpoints. Then simplify."""
    raw = [mid(*capA)]
    widths = []
    for k in range(len(railA) - 1):
        a, b = railA[k], railA[k + 1]
        steps = max(1, samples_per_seg)
        for s in range(steps):
            t = s / steps
            p = add(a, mul(sub(b, a), t))
            d, foot = point_polyline_nearest(p, railB)
            raw.append(mid(p, foot))
            widths.append(d)
    raw.append(mid(*capB))
    verts = rdp(raw, epsilon=0.8)
    return verts, widths


def rdp(pts, epsilon):
    """Ramer-Douglas-Peucker simplification."""
    if len(pts) < 3:
        return pts[:]
    a, b = pts[0], pts[-1]
    ab = sub(b, a); L2 = dot(ab, ab)
    dmax, idx = 0.0, 0
    for i in range(1, len(pts) - 1):
        if L2 == 0:
            d = length(sub(pts[i], a))
        else:
            t = dot(sub(pts[i], a), ab) / L2
            foot = add(a, mul(ab, t))
            d = length(sub(pts[i], foot))
        if d > dmax:
            dmax, idx = d, i
    if dmax > epsilon:
        left = rdp(pts[:idx + 1], epsilon)
        right = rdp(pts[idx:], epsilon)
        return left[:-1] + right
    return [a, b]


# ---------- balance report ----------
def balance_report(verts, railA, railB, samples_per_seg, ambig_thresh):
    samples = []
    for k in range(len(verts) - 1):
        a, b = verts[k], verts[k + 1]
        steps = max(1, samples_per_seg)
        for s in range(steps):
            samples.append(add(a, mul(sub(b, a), s / steps)))
    samples.append(verts[-1])
    report = []; max_imb = 0.0
    for s in samples:
        dl, fl = point_polyline_nearest(s, railA)
        dr, fr = point_polyline_nearest(s, railB)
        imb = abs(dl - dr); max_imb = max(max_imb, imb)
        report.append({"p": [round(s[0], 2), round(s[1], 2)],
                       "left": round(dl, 2), "right": round(dr, 2),
                       "imbalance": round(imb, 2), "width": round(dl + dr, 2),
                       "left_foot": [round(fl[0], 2), round(fl[1], 2)],
                       "right_foot": [round(fr[0], 2), round(fr[1], 2)],
                       "ambiguous": imb > ambig_thresh})
    return report, max_imb


# ---------- input loading ----------
def load_d(args):
    if args.d:
        return args.d
    src = args.input
    if not src:
        sys.exit("error: provide a path string with --d, or an input file")
    with open(src) as f:
        text = f.read()
    if src.lower().endswith(".svg") or "<svg" in text:
        ds = re.findall(r'd="([^"]+)"', text)
        if not ds:
            sys.exit("error: no <path d=..> found in SVG")
        # one big d may hold several subpaths; flatten all candidates
        subs = []
        for dd in ds:
            subs.extend(split_subpaths(dd))
        scored = []
        for sd in subs:
            pl = flatten_subpath(sd)
            if len(pl) >= 4:
                scored.append((len(pl), sd))
        scored.sort(reverse=True)
        if args.index is not None:
            return subs[args.index]
        return scored[0][1]               # default: richest subpath
    return text.strip()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("input", nargs="?", help=".svg, or a file holding a `d` string")
    ap.add_argument("--d", help="inline SVG path data")
    ap.add_argument("--index", type=int, help="subpath index when SVG has many")
    ap.add_argument("--out", default="centerline.json")
    ap.add_argument("--corner-deg", type=float, default=25.0,
                    help="turn angle (deg) counted as a sharp corner")
    ap.add_argument("--cap-anti", type=float, default=-0.6,
                    help="dot(prev,next) below this = a U-turn cap candidate")
    ap.add_argument("--start-cap", choices=["A", "B"], default="B",
                    help="which cap the reveal starts from (drives Trim direction)")
    ap.add_argument("--samples", type=int, default=2,
                    help="balance/curve samples per centerline segment")
    args = ap.parse_args()

    d = load_d(args)
    poly = merge_close(flatten_subpath(d))
    n = len(poly)
    print(f"contour vertices (merged): {n}")

    caps, cand = detect_caps(poly, args.cap_anti)
    print("U-turn candidates (len, anti, idx): "
          + str([(round(l, 1), round(a, 2), i) for l, a, i in cand]))
    if caps is None:
        sys.exit("error: fewer than 2 U-turn caps found — this may not be a "
                 "ribbon mark. Reconsider topology / use multiple driver paths.")
    # The 2 shortest U-turns are the caps. Extra strong short candidates hint at
    # branching: surface that so the agent can reconsider instead of forcing one path.
    short_caps = [c for c in cand if c[0] <= cand[1][0] * 1.5]
    if len(short_caps) > 2:
        print(f"WARNING: {len(short_caps)} short U-turn caps detected — the mark "
              "may branch (>=3 true caps). A clean 2-rail split may not exist; "
              "consider splitting into multiple driver paths.")

    c0, c1 = caps
    railA = arc(poly, c0 + 1, c1)
    railB = arc(poly, c1 + 1, c0)
    railB_rev = railB[::-1]
    capA = (poly[c0], poly[c0 + 1])
    capB = (poly[c1], poly[c1 + 1])
    print(f"railA ({len(railA)}) / railB ({len(railB)})")

    fracA = sharp_corner_fraction(railA, args.corner_deg)
    fracB = sharp_corner_fraction(railB, args.corner_deg)
    frac = max(fracA, fracB)
    polygonal = (frac >= 0.5)
    equal = (len(railA) == len(railB_rev))
    print(f"sharp-corner fraction: railA={fracA:.2f} railB={fracB:.2f} "
          f"-> {'POLYGONAL' if polygonal else 'CURVED'}; equal rail counts={equal}")

    if polygonal and equal:
        method = "polygonal-midline-intersection"
        verts, widths = centerline_polygonal(railA, railB_rev, capA, capB)
    else:
        # CURVED, or polygonal-but-unequal: normal-foot pairing (secondary/unproven)
        method = "curved-normal-foot" if not polygonal else "irregular-normal-foot"
        verts, widths = centerline_normal_foot(railA, railB, capA, capB, args.samples)
        print(f"NOTE: using {method} (SECONDARY/UNPROVEN). Validate against a "
              "folding-curved fixture before trusting it.")

    verts = [(round(x, 3), round(y, 3)) for (x, y) in verts]
    report, max_imb = balance_report(verts, railA, railB, args.samples, 3.0)

    # route_decision: which cap starts the reveal, and the vertex order to use
    start_is_A = (args.start_cap == "A")
    cap_A_pt = [round(v, 3) for v in mid(*capA)]
    cap_B_pt = [round(v, 3) for v in mid(*capB)]
    # verts run capA -> capB; reverse if reveal should start from cap B
    matte_order = verts if start_is_A else verts[::-1]

    d_out = "M" + " L".join(f"{x},{y}" for (x, y) in verts)
    out = {
        "method": method,
        "centerline_vertices": verts,
        "centerline_d": d_out,
        "section_widths": [round(w, 2) for w in widths],
        "recommended_matte_width": round(max(widths), 1) if widths else 0.0,
        "max_balance_imbalance": round(max_imb, 2),
        "caps": {"A": [list(capA[0]), list(capA[1])],
                 "B": [list(capB[0]), list(capB[1])]},
        "railA_outer": [list(p) for p in railA],
        "railB_inner": [list(p) for p in railB_rev],
        "balance_report": report,
        "route_decision": {
            "start_cap": args.start_cap,
            "start_point": cap_A_pt if start_is_A else cap_B_pt,
            "end_point": cap_B_pt if start_is_A else cap_A_pt,
            "matte_vertex_order": [list(p) for p in matte_order],
            "note": ("Trim Paths reveals in matte_vertex_order; the production "
                     "matte polyline must use this order so the reveal starts at "
                     "start_cap."),
        },
    }
    with open(args.out, "w") as f:
        json.dump(out, f, indent=2)

    print(f"\nmethod: {method}")
    print(f"centerline vertices: {len(verts)}")
    print(f"recommended_matte_width: {out['recommended_matte_width']}")
    print(f"max_balance_imbalance: {max_imb:.2f}  "
          f"(ambiguous samples: {sum(1 for r in report if r['ambiguous'])})")
    print(f"d = {d_out}")
    print(f"wrote {args.out}")


if __name__ == "__main__":
    main()
