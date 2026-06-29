# Redraw builder (bundled)

Additive helper for `references/single-line-redraw.md` — the **redraw / handwriting /
draw-on** mode, where the **stroke is the visible artwork**. It is the inverse of the
mask-reveal solver in `scripts/centerline/` (which keeps a filled mark visible behind a
hidden track matte). The two share no machinery on purpose.

This script only **reuses** geometry that already is a stroke. It does **not** do
centerline extraction, rail pairing, or skeletonization.

## Use it

```
python3 build_redraw.py in.svg                               # redraw-ready input (open stroked paths)
python3 build_redraw.py in.svg --cap butt --stagger 0.9 --fr 30 --dur 24 --out redraw.json
python3 build_redraw.py --d "M10 50 C 30 10 60 10 80 50" --width 6   # inline smoke test, no file needed
```

Input must be **open stroked** path(s) (`fill="none"` + `stroke=…`, no `Z`). If the
source is filled, the script prints a warning telling you to request stroke data —
do not invert a fill here (see the reference's stroke-data-required branch).

## What it does

- Parses every `<path d=…>` and splits it into pen strokes (one per `M` / pen-down).
- **Preserves Béziers**: SVG cubic/quadratic control points become Lottie `{v, i, o}`
  vertices with in/out tangents. Curves are never flattened to dense polylines (that
  would roughen the settled stroke and balloon the point count). `derive_rails.py`'s
  `flatten_subpath` is the wrong tool here and is not used.
- Orders strokes baseline **left-to-right** (min-x; SVG order as tiebreak).
- Emits a minimal **Lottie** scene: one layer per stroke = visible `st` stroke +
  `tm` Trim Paths (`e` 0→100, `m:1`), `c:false`, **no `td`/`tt`, no fill layer**.
  Round cap/join by default (`--cap butt` for a non-handwriting look). Strokes are
  staggered (`--stagger`) so the word writes continuously.
- Emits a flat **`redraw-preview.svg`** next to the JSON: each stroke at its width,
  numbered in draw order, with a start-point dot. Opens in any SVG preview, no dev
  server. This is the human-verification proof that the draw order reads correctly.
- Prints a JSON summary (stroke count, per-stroke start/point-count, op, length).

## CLI

| flag | default | meaning |
|---|---|---|
| `svg` / `--d` | — | input SVG file, or inline path data |
| `--width` | from SVG | visible stroke width (fixed; never animated) |
| `--color` | from SVG | stroke hex; wired to a `textColor` slot |
| `--cap` | `round` | `round` (handwriting) or `butt` |
| `--stagger` | `0.85` | next stroke starts at this fraction of the previous duration |
| `--fr` / `--dur` | `30` / `24` | scene frame rate / frames per stroke |
| `--out` | `redraw.json` | output Lottie path (preview written alongside) |

## When NOT to use it

- The source is a **filled** mark and the user wants a true redraw → request stroke
  data first (single-line font, un-outlined stroke export, authored strokes). The
  filled→skeleton fallback is **deferred Phase 2** (`--from-fill`, not implemented) and
  is constant-width / low-overlap only, always flagged `draw_order: review`.
- The user wants the **fill to stay visible** and only needs a reveal → that is
  mask-reveal: use `scripts/centerline/derive_rails.py` and
  `references/single-line-vectorization.md`, not this.

Standard library only; no dependencies.
