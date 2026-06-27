#!/usr/bin/env python3
"""
Derive a single-line CENTERLINE for a filled ribbon/tube/folded-flag mark by
CONTOUR RAIL PAIRING (no raster skeleton). Standard library only.

This is the bundled reference solver for `single-line-vectorization.md`. Copy it
into a per-project sandbox (`scripts/<slug>-centerline/`), point it at the mark's
filled subpath, run it, open the auto-emitted `centerline.svg` to verify (no dev
server), read the balance + containment reports, then carry `centerline_d` +
`route_decision` + the width decision (single `recommended_matte_width`, or the
per-section `matte_width_profile`) into the production matte (see
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
           --margin-frac 0.04  --spread-gate 1.6  --adjacency-frac 0.15

Every run also writes `centerline.svg` next to the JSON: a flat coverage overlay
(filled contour, rails+caps, the matte footprint stroked at its actual width,
the centerline, red bleed stretches, yellow ambiguous rings) that opens in any
editor's SVG preview with no dev server — the required human-verification artifact.
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


def median(xs):
    s = sorted(xs)
    n = len(s)
    if n == 0:
        return 0.0
    m = n // 2
    return s[m] if n % 2 else (s[m - 1] + s[m]) / 2.0


def point_in_poly(pt, poly):
    """Ray-cast point-in-polygon test against a closed contour `poly`."""
    x, y = pt
    inside = False
    n = len(poly)
    j = n - 1
    for i in range(n):
        xi, yi = poly[i]; xj, yj = poly[j]
        if (yi > y) != (yj > y):
            xc = (xj - xi) * (y - yi) / ((yj - yi) or 1e-12) + xi
            if x < xc:
                inside = not inside
        j = i
    return inside


def polyline_cumlen(poly):
    """Cumulative arc length at each vertex, plus total (>=1 to avoid /0)."""
    cum = [0.0]
    for k in range(len(poly) - 1):
        cum.append(cum[-1] + length(sub(poly[k + 1], poly[k])))
    total = cum[-1] if cum[-1] > 1e-9 else 1.0
    return cum, total


def nearest_param(p, poly, cum, total):
    """Nearest point on polyline `poly` to `p`: (dist, foot, normalized_arclen)."""
    best = (1e18, poly[0], 0.0)
    for k in range(len(poly) - 1):
        a, b = poly[k], poly[k + 1]
        ab = sub(b, a); L2 = dot(ab, ab)
        t = 0.0 if L2 == 0 else max(0.0, min(1.0, dot(sub(p, a), ab) / L2))
        foot = add(a, mul(ab, t))
        dd = length(sub(p, foot))
        if dd < best[0]:
            s = cum[k] + t * length(ab)
            best = (dd, foot, s / total)
    return best


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
            samples.append((k, add(a, mul(sub(b, a), s / steps))))
    samples.append((max(0, len(verts) - 2), verts[-1]))
    report = []; max_imb = 0.0
    for seg, s in samples:
        dl, fl = point_polyline_nearest(s, railA)
        dr, fr = point_polyline_nearest(s, railB)
        imb = abs(dl - dr); max_imb = max(max_imb, imb)
        report.append({"seg": seg,
                       "p": [round(s[0], 2), round(s[1], 2)],
                       "left": round(dl, 2), "right": round(dr, 2),
                       "imbalance": round(imb, 2), "width": round(dl + dr, 2),
                       "left_foot": [round(fl[0], 2), round(fl[1], 2)],
                       "right_foot": [round(fr[0], 2), round(fr[1], 2)],
                       "ambiguous": imb > ambig_thresh})
    return report, max_imb


# ---------- per-section width profile ----------
def segment_widths(report, nseg):
    """Local fill width per centerline segment, robust to convex corners.

    Segment-aligned and post-simplification, so correct for both the polygonal
    and the normal-foot route (unlike the raw method `section_widths`, whose
    length is method-dependent). Two corrections vs. a naive mean of
    `left+right`, both there to stop convex corners from inflating the matte:

      - **Measure width as `2*min(left,right)`, not `left+right`.** At a
        well-centered sample the two rails are equidistant and the measures
        agree. At a skewed convex-corner sample the centerline sits far from one
        rail, so `left+right` overstates the true ribbon width and would size the
        matte to a phantom width. `2*min` keys off the near rail and never
        overstates.
      - **Drop `ambiguous` (high-imbalance == corner) samples from the mean.** A
        segment's width should come from its straight run, not its corner. Fall
        back to all of a segment's samples only if every one is ambiguous, and to
        the global mean only if a segment has no samples at all.
    """
    def w(r):
        return 2.0 * min(r["left"], r["right"])
    sums = [0.0] * nseg; cnts = [0] * nseg          # non-ambiguous only
    sums_all = [0.0] * nseg; cnts_all = [0] * nseg  # all samples (fallback)
    for r in report:
        k = r["seg"]
        if not (0 <= k < nseg):
            continue
        sums_all[k] += w(r); cnts_all[k] += 1
        if not r.get("ambiguous"):
            sums[k] += w(r); cnts[k] += 1
    allw = [w(r) for r in report]
    fallback = (sum(allw) / len(allw)) if allw else 0.0
    out = []
    for k in range(nseg):
        if cnts[k]:
            out.append(sums[k] / cnts[k])
        elif cnts_all[k]:
            out.append(sums_all[k] / cnts_all[k])
        else:
            out.append(fallback)
    return out


# ---------- containment pass (does the matte spill past / into another limb?) ----------
def containment_pass(report, verts, poly, matte_profile, single_width,
                     single_mode, margin, adjacency_frac):
    """For each balance sample, with the matte half-width that section will
    actually use, test whether the stroke stays inside the fill (inside),
    pokes out over background (overhang, cosmetic), or reaches a non-adjacent
    centerline parameter's fill — a different limb (bleed, a real defect)."""
    cum, total = polyline_cumlen(verts)
    bleed = []
    overhang = 0
    worst = {"over_reach": 0.0, "kind": "inside", "param": 0.0}
    for r in report:
        p = (r["p"][0], r["p"][1])
        seg = r["seg"]
        if single_mode:
            half = single_width / 2.0
        else:
            half = matte_profile[min(seg, len(matte_profile) - 1)] / 2.0
        _, _, s_p = nearest_param(p, verts, cum, total)
        for dist_key, foot_key in (("left", "left_foot"), ("right", "right_foot")):
            side_dist = r[dist_key]
            over = half - side_dist
            if over <= margin:                     # stroke stays inside the fill
                continue
            foot = (r[foot_key][0], r[foot_key][1])
            outward = norm(sub(foot, p))           # toward the rail, then past it
            q = add(p, mul(outward, half))
            if not point_in_poly(q, poly):
                kind = "overhang"                  # over-reach lands on background
                overhang += 1
            else:
                _, _, s_q = nearest_param(q, verts, cum, total)
                if abs(s_q - s_p) > adjacency_frac:
                    kind = "bleed"                 # reached a different limb's fill
                    bleed.append({
                        "param": round(s_p, 3),
                        "offending_param": round(s_q, 3),
                        "overlap": round(over, 2),
                        "at": [round(p[0], 2), round(p[1], 2)],
                        "point": [round(q[0], 2), round(q[1], 2)],
                    })
                else:
                    kind = "overhang"              # same limb, fill simply wider here
                    overhang += 1
            if over > worst["over_reach"]:
                worst = {"over_reach": round(over, 2), "kind": kind,
                         "param": round(s_p, 3)}
    return {"worst_case": worst, "bleed_samples": bleed,
            "overhang_samples_count": overhang}


# ---------- flat coverage overlay ----------
def _pl(pts):
    return " ".join(f"{x:.2f},{y:.2f}" for x, y in pts)


def _poly_d(pts):
    return "M" + " L".join(f"{x:.2f},{y:.2f}" for x, y in pts) + " Z"


def write_coverage_svg(path, poly, railA, railB_rev, capA, capB, centerline_verts,
                       matte_order, widths_ordered, single_width, single_mode,
                       report, containment):
    """Flat, dev-server-free, HONEST proof of the matte footprint.

    The footprint is drawn exactly as production strokes it — the cap-extended
    reveal order, round caps (lc:2), miter joins clamped to the production limit
    (ml:8) — then the fill is painted opaque white ON TOP so the only footprint
    that survives is what pokes OUTSIDE the fill. So the eye sees just the spill,
    coloured by what it means:
      - amber  = matte over background (cosmetic; a track matte reveals nothing
                 there),
      - red    = matte reaching another limb's fill (a real defect),
                 from containment_report.bleed_samples,
      - yellow = convex-corner (ambiguous) balance samples.
    A one-line legend prints the worst over-reach so the picture and the JSON
    agree at a glance. This is what makes 'is it contained?' answerable by eye
    instead of looking 2x the shape because of harmless overhang + miter spikes."""
    pts_all = (list(poly) + list(centerline_verts) + list(matte_order)
               + list(railA) + list(railB_rev))
    xs = [p[0] for p in pts_all]; ys = [p[1] for p in pts_all]
    minx, maxx = min(xs), max(xs); miny, maxy = min(ys), max(ys)
    w = (maxx - minx) or 1.0; h = (maxy - miny) or 1.0
    diag = math.hypot(w, h)
    maxhw = max([single_width] + list(widths_ordered)) / 2.0
    pad = maxhw + diag * 0.06            # extra headroom for the legend + spikes
    vw = w + 2 * pad; vh = h + 2 * pad
    vb = f"{minx - pad:.2f} {miny - pad:.2f} {vw:.2f} {vh:.2f}"
    thin = max(diag * 0.0025, 0.4)
    bright = max(diag * 0.004, 0.5)
    ring = max(diag * 0.012, 1.0)
    fs = max(diag * 0.030, 3.0)

    def footprint(stroke, opacity, lc):
        out = []
        cap = {1: "butt", 2: "round", 3: "square"}[lc]
        common = (f'fill="none" stroke="{stroke}" stroke-opacity="{opacity}" '
                  f'stroke-linecap="{cap}" stroke-linejoin="miter" '
                  f'stroke-miterlimit="8"')
        if single_mode:
            out.append(f'<polyline points="{_pl(matte_order)}" {common} '
                       f'stroke-width="{single_width:.2f}"/>')
        else:
            for k in range(len(matte_order) - 1):
                wseg = widths_ordered[min(k, len(widths_ordered) - 1)]
                out.append(f'<polyline points="{_pl([matte_order[k], matte_order[k + 1]])}" '
                           f'{common} stroke-width="{wseg:.2f}"/>')
        return out

    p = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}">']
    p.append(f'<rect x="{minx - pad:.2f}" y="{miny - pad:.2f}" '
             f'width="{vw:.2f}" height="{vh:.2f}" fill="#ffffff"/>')
    # 1. matte footprint, production-accurate (round caps lc:2, ml:8), in amber
    p += footprint("#f5a623", "0.95", 2)
    # 2. paint the fill opaque white ON TOP -> only the OUTSIDE-fill spill remains
    p.append(f'<path d="{_poly_d(poly)}" fill="#ffffff"/>')
    # 3. faint fill tint for context (over the white)
    p.append(f'<path d="{_poly_d(poly)}" fill="#000000" fill-opacity="0.10"/>')
    # 4. rails + caps
    p.append(f'<polyline points="{_pl(railA)}" fill="none" '
             f'stroke="#e8820c" stroke-width="{thin:.2f}"/>')
    p.append(f'<polyline points="{_pl(railB_rev)}" fill="none" '
             f'stroke="#7a3cc0" stroke-width="{thin:.2f}"/>')
    for cap in (capA, capB):
        p.append(f'<line x1="{cap[0][0]:.2f}" y1="{cap[0][1]:.2f}" '
                 f'x2="{cap[1][0]:.2f}" y2="{cap[1][1]:.2f}" '
                 f'stroke="#11a911" stroke-width="{thin * 1.6:.2f}"/>')
    # 5. centerline (raw) on top
    p.append(f'<polyline points="{_pl(centerline_verts)}" fill="none" '
             f'stroke="#00d0ff" stroke-width="{bright:.2f}"/>')
    # 6. cross-limb bleed in red (the only real defect)
    for b in containment["bleed_samples"]:
        ax, ay = b["at"]; qx, qy = b["point"]
        p.append(f'<line x1="{ax:.2f}" y1="{ay:.2f}" x2="{qx:.2f}" y2="{qy:.2f}" '
                 f'stroke="#ff1a1a" stroke-width="{thin * 1.4:.2f}"/>')
        p.append(f'<circle cx="{qx:.2f}" cy="{qy:.2f}" r="{ring * 0.7:.2f}" '
                 f'fill="#ff1a1a" fill-opacity="0.75"/>')
        p.append(f'<circle cx="{ax:.2f}" cy="{ay:.2f}" r="{ring * 0.5:.2f}" '
                 f'fill="#ff1a1a"/>')
    # 7. ambiguous (convex-corner) balance samples as yellow rings
    for r in report:
        if r.get("ambiguous"):
            cx, cy = r["p"]
            p.append(f'<circle cx="{cx:.2f}" cy="{cy:.2f}" r="{ring:.2f}" '
                     f'fill="none" stroke="#f2c400" stroke-width="{thin:.2f}"/>')
    # 8. legend so the picture and the JSON reconcile
    wc = containment["worst_case"]
    nbleed = len(containment["bleed_samples"])
    lx = minx - pad + diag * 0.01
    ly = miny - pad + fs * 1.2
    p.append(f'<text x="{lx:.2f}" y="{ly:.2f}" font-family="sans-serif" '
             f'font-size="{fs:.2f}" fill="#222">'
             f'worst over-reach {wc["over_reach"]} ({wc["kind"]}) | '
             f'bleed {nbleed}</text>')
    p.append(f'<text x="{lx:.2f}" y="{ly + fs * 1.25:.2f}" font-family="sans-serif" '
             f'font-size="{fs * 0.85:.2f}" fill="#666">'
             f'amber = over background (cosmetic) | red = cross-limb bleed (defect)'
             f'</text>')
    p.append('</svg>')
    with open(path, "w") as f:
        f.write("\n".join(p))


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
    ap.add_argument("--margin-frac", type=float, default=0.04, dest="margin_frac",
                    help="ε / matte margin as a fraction of the median section width")
    ap.add_argument("--spread-gate", type=float, default=1.6, dest="spread_gate",
                    help="width_spread at/above this recommends a per-section matte")
    ap.add_argument("--adjacency-frac", type=float, default=0.15,
                    dest="adjacency_frac",
                    help="centerline param gap (0..1) beyond which over-reach into "
                         "fill counts as cross-limb bleed, not same-limb overhang")
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
    # wrap the cap-edge endpoint like arc() does, so a cap on the closing edge
    # (c == n-1) doesn't index past the contour.
    capA = (poly[c0], poly[(c0 + 1) % n])
    capB = (poly[c1], poly[(c1 + 1) % n])
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

    # ---- per-section width profile + spread (the spread fix) ----
    nseg = max(1, len(verts) - 1)
    seg_w = segment_widths(report, nseg)
    margin = args.margin_frac * (median(seg_w) or 1.0)
    matte_width_profile = [round(wv + 2 * margin, 2) for wv in seg_w]
    recommended_matte_width = round(max(matte_width_profile), 1) if matte_width_profile else 0.0
    minw = max(min(seg_w), 1e-6) if seg_w else 1.0
    width_spread = round((max(seg_w) if seg_w else 0.0) / minw, 2)
    single_mode = width_spread < args.spread_gate
    width_decision = "single-width" if single_mode else "per-section"
    print(f"width_spread: {width_spread}  -> recommend {width_decision} matte "
          f"(gate {args.spread_gate}); margin(ε)={round(margin, 2)}")

    # ---- containment pass (turn "exceeds" into a computed signal) ----
    containment = containment_pass(report, verts, poly, matte_width_profile,
                                   recommended_matte_width, single_mode, margin,
                                   args.adjacency_frac)
    if containment["bleed_samples"]:
        params = [b["param"] for b in containment["bleed_samples"]]
        print(f"WARNING: {len(containment['bleed_samples'])} cross-limb bleed "
              f"sample(s) over param range [{min(params):.2f}, {max(params):.2f}] "
              "— reconsider the route or drop to a per-section matte instead of "
              "widening blindly.")

    # route_decision: which cap starts the reveal, and the vertex order to use
    start_is_A = (args.start_cap == "A")
    cap_A_pt = [round(v, 3) for v in mid(*capA)]
    cap_B_pt = [round(v, 3) for v in mid(*capB)]
    # verts run capA -> capB; reverse if reveal should start from cap B
    matte_order = verts if start_is_A else verts[::-1]
    # per-section matte widths in REVEAL order (matte_width_profile is centerline
    # order V0..Vn; reverse it when the reveal starts from cap B)
    widths_ordered = matte_width_profile if start_is_A else matte_width_profile[::-1]

    # --- cap extension (pairs with a ROUND cap, lc:2, in production) ---
    # A square cap (lc:3) projects half the stroke width past the start vertex the
    # instant Trim leaves 0, so the reveal "pops" a full-width blob at frame 1
    # instead of growing from a point. Pushing the two terminal vertices outward
    # along their own segment by half the local matte width puts the true cap edge
    # at the extended endpoint, so the round cap's start/end disc blooms OVER
    # background (clipped away by the track matte) — clean point-start, full finish,
    # and no half-width of fill left unrevealed. (Round, not butt: the round cap is
    # what keeps interior corner/fold crossings notch-free; see the route note.)
    # This is geometry, NOT a trim change (the trim still runs 0->100).
    def _extend_caps(order, w_ord):
        v = [list(p) for p in order]
        if len(v) >= 2:
            for end, nb, wi in ((0, 1, w_ord[0]), (-1, -2, w_ord[-1])):
                dx = v[end][0] - v[nb][0]; dy = v[end][1] - v[nb][1]
                L = math.hypot(dx, dy) or 1.0
                h = wi / 2.0
                v[end] = [round(v[end][0] + dx / L * h, 3),
                          round(v[end][1] + dy / L * h, 3)]
        return v
    matte_order_capext = _extend_caps(matte_order, widths_ordered)

    d_out = "M" + " L".join(f"{x},{y}" for (x, y) in verts)
    out = {
        "method": method,
        "centerline_vertices": verts,
        "centerline_d": d_out,
        "section_widths": [round(w, 2) for w in widths],
        "matte_width_profile": matte_width_profile,
        "width_spread": width_spread,
        "width_decision": width_decision,
        "margin": round(margin, 3),
        "recommended_matte_width": recommended_matte_width,
        "containment_report": containment,
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
            "matte_vertex_order": [list(p) for p in matte_order_capext],
            "matte_vertex_order_raw": [list(p) for p in matte_order],
            "matte_linecap": 2,
            "cap_extension": {
                "start_halfwidth": round(widths_ordered[0] / 2.0, 3),
                "end_halfwidth": round(widths_ordered[-1] / 2.0, 3),
                "note": ("matte_vertex_order is already cap-extended; build the "
                         "production stroke from it with lc:2 (round) — the round "
                         "cap sweeps interior corner/fold crossings without a notch "
                         "and rounds only the moving frontier, never the settled "
                         "mark. The raw (un-extended) route is matte_vertex_order_raw."),
            },
            "reveal_span": [0, 100],
            "note": ("Trim Paths reveals in matte_vertex_order; the production "
                     "matte polyline must use this order so the reveal starts at "
                     "start_cap. Stroke it with lc:2 (round), lj:1 (miter) — the "
                     "round cap sweeps interior corner/fold crossings cleanly "
                     "(a butt cap notches there), while the miter join keeps the "
                     "settled mark sharp. The order is already extended half a width "
                     "past each cap so the round start/end disc blooms over "
                     "background (clipped) and the reveal still covers each cap."),
            "trim_note": ("The production Trim Paths `e` keyframe value MUST run "
                          "0->100 and the first matte vertex MUST be the true "
                          "start cap. Never trim in from 10/20 to hide a bad first "
                          "frame. NOTE: a 0->100 trim is necessary but NOT "
                          "sufficient — a square cap (lc:3) blooms a full-width "
                          "blob at the first nonzero frame even when the trim "
                          "starts at 0, which reads as 'reveal starts at ~5-10%'. "
                          "Use lc:2 (round) with the cap-extended order above so "
                          "the reveal grows from a point and corner crossings stay "
                          "notch-free."),
        },
    }
    with open(args.out, "w") as f:
        json.dump(out, f, indent=2)

    svg_path = os.path.join(os.path.dirname(os.path.abspath(args.out)),
                            "centerline.svg")
    write_coverage_svg(svg_path, poly, railA, railB_rev, capA, capB, verts,
                       matte_order_capext, widths_ordered, recommended_matte_width,
                       single_mode, report, containment)

    print(f"\nmethod: {method}")
    print(f"centerline vertices: {len(verts)}")
    print(f"width_decision: {width_decision}  (width_spread={width_spread})")
    print(f"recommended_matte_width: {out['recommended_matte_width']}  "
          f"(single-width fallback)")
    print(f"matte_width_profile: {matte_width_profile}")
    print(f"containment: {len(containment['bleed_samples'])} bleed, "
          f"{containment['overhang_samples_count']} overhang, "
          f"worst over-reach {containment['worst_case']['over_reach']} "
          f"({containment['worst_case']['kind']})")
    print(f"max_balance_imbalance: {max_imb:.2f}  "
          f"(ambiguous samples: {sum(1 for r in report if r['ambiguous'])})")
    print(f"d = {d_out}")
    print(f"wrote {args.out}")
    print(f"wrote {svg_path}")


if __name__ == "__main__":
    main()
