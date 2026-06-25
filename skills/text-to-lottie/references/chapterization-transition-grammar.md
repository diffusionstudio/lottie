# Chapterization And Transition Grammar

Use this when a prompt is dense or naturally multi-part. It decides whether to
split into chapters, what each chapter does, and how to move between them.
Easing anchors (see `motion-taste.md` → "Easing Anchors") are supporting tools
here, not the transition itself.

## When To Chapter

Split into chapters when the prompt carries more than one idea: long text,
multiple claims, feature list, multiple stats, timeline, before/after,
problem/solution, quote+proof, setup/payoff, product walkthrough, recap/social
story, or multi-language / repeating content variations. One readable idea per
chapter.

## When Not To Chapter

Keep one beat for a single logo lockup, one CTA, one icon animation, one simple
stat card, one UI microinteraction, a legal/read-critical block, or a calm hero
moment whose final settle is the payoff. Let it land and settle.

## Chapter Roles

Give each chapter one readable job: hook, setup, claim, proof, contrast, detail,
payoff, CTA / final lockup, or loop bridge.

## Split By Meaning, Not Length

Rewrite long text into short authored beats or reveal it progressively. Never
place a paragraph at once, and do not just chop it into smaller paragraph blocks.
Each chapter carries one idea.

## Structure Modes

- Repeated armature: same layout and motion path, content changes. Best for
  lists, stats, languages, recaps, supercuts.
- Evolving story layout: objects/text carry into new positions and the
  composition changes across chapters. Best for product walkthroughs, explainers,
  process, setup/payoff, and narrative motion.

## Readable Window

Each chapter's main message gets a coast, hold, or stable moment before the seam.
Fast transitions are fine, but never at the cost of the read.

## Transition Grammar (pick one per seam)

- hard cut on action: cut while the focal motion is still moving.
- jump cut: hard cut with matched direction/velocity across the seam.
- motion-masked swap: outgoing motion becomes the next beat's reveal/mask.
- continuous carry: an object/text travels into its next location across chapters.
- occlusion wipe: a large shape covers frame, then reveals the next chapter.
- hold/settle cut: only when the beat must land clearly first.
- loop reset: when the cadence intentionally repeats.

## Choosing Transitions (message + tone)

- Energetic list/supercut/recap → repeated armature + hard cut / jump cut on motion.
- Narrative / product walkthrough → continuous carry or motion-masked swap.
- Contrast or palette/world change → occlusion wipe or hard cut.
- Premium / stat / proof → restrained mask or hold/settle cut.
- Read-critical → hold longer; never cut before it is understood.
- Every seam needs a reason — preserve continuity, create contrast, reset rhythm,
  or land a point. Do not vary transition types randomly.

## Seam Mechanics

A transition is chapter role + timing + direction + cut point + masking +
easing — not easing alone; anchors only support it. Carry across seams: cut
during motion for cut-on-action (never after a settle); match direction and
perceived velocity across jump cuts; a readable coast/hold must precede any fast
exit; and interrupted motion only reads as intentional under repeated rhythm (an
armature of ~3–4+ beats), not as a one-off.

Author cut-on-motion exits so the natural endpoint lives beyond the visible cut:
the visible chapter is a window into a longer arc (e.g. it ends at frame 100 but
the move would resolve toward ~120–140), and the seam interrupts the move while
velocity is still active, often rising, before the motion settles. The core rule
is active continuation, not necessarily acceleration: velocity may be rising
(kinetic exit), steady (a constant pan), or already high and steady (a fast
object pass) — what matters is it is not settled and would continue if the
chapter were extended.

| method | why the seam works | outgoing last frame | incoming first frame | anchors | switch when |
|---|---|---|---|---|---|
| hard cut on action | eye is mid-move, so motion continuity hides the content jump | focal element still moving (velocity active, often rising) toward a beyond-window/offscreen endpoint; not arriving at its final authored target on the cut frame | new content already in motion, compatible direction; no static hold | out `exit-accelerate`/`travel-cut`; in `entrance-sharp` | beat must be read at rest → hold/settle cut |
| jump cut | as hard cut, but the match across the seam sells continuity | moving toward a beyond-window endpoint (velocity active, often rising); note direction + perceived speed; not arriving at the final target on the cut frame | enters same direction at similar speed; position may reset | out `exit-accelerate`/`travel-cut`; in `travel-balanced`/`entrance-sharp` | single beat / no rhythm → looks broken; use hold/settle or carry |
| motion-masked swap | outgoing motion (or the shape it leaves) becomes the matte that reveals the next beat — no visible cut; the content change happens entirely while the mask hides it | the moving element fully covers the swap region / mask filled | next content already composed under the mask, revealed as it clears | `entrance-sharp` for the reveal; out `travel-balanced` | nothing shared to mask with → hard cut or occlusion wipe |
| continuous carry | one persistent element travels between chapters; identity continuity, often no cut | carried element mid-travel toward its next position | same element, or clearly related element, continues from matching position/velocity or preserved motion logic (not a fresh unrelated entrance); surroundings may change | `travel-balanced`; `settle-soft` if it lands | chapters share no element / need a clean reset → hard cut or occlusion wipe |
| occlusion wipe | a large shape covers the frame, hiding the swap, then uncovers the new chapter | covering shape fully occludes the frame (or swap region) | new chapter already fully composed behind the cover before it exits; revealed as the shape leaves | `entrance-sharp` for cover-on + reveal; `travel-balanced` for the sweep | want energy/continuity, not a full cover → hard cut or carry |
| hold/settle cut | the beat fully lands and is read, then changes — clarity over pace (opposite of cut-on-motion: the move completes and holds before the seam) | motion settled; message readable and at rest (a hold of N frames) | clean start of the next beat (an entrance, not mid-motion) | `settle-soft` to land; `entrance-sharp` to start next | pace/energy matters more than the settle → hard cut on action |
| loop reset | last frame matches first (position, color, velocity) so the wrap is invisible; or a deliberate visible reset beat | state equals the first frame's state (seamless), or a deliberate exit for a visible reset | identical to the loop start; perceived velocity continuous | match in/out velocity (often `travel-balanced`/linear); `exit-accelerate`+cut for a visible reset | one-shot, not a loop → normal ending (settle) |

## Seam Plan (before authoring)

Decide, per seam, before keyframing:

- chapter role — what this beat does
- readable window — where the message coasts/holds
- outgoing motion — what's moving at the end (direction + speed)
- transition type — from the grammar
- incoming motion — what's moving at the start
- easing anchor — the supporting curve
- cut/hold frame — the exact seam frame; in-motion vs at-rest
- reason for the seam — continuity / contrast / rhythm reset / land a point

## Seam Verification

Inspect the two boundary frames per seam:

- Render the outgoing last frame and the incoming first frame; confirm each meets
  its row's two frame conditions above.
- Cut-on-action / jump cut: outgoing last frame is still moving (not settled);
  direction + perceived velocity match on the incoming first frame. Check the
  outgoing motion would continue if the chapter were extended — if the object
  reaches its final target on the seam, it is a settle cut, not cut-on-motion.
- Masked swap / occlusion wipe: no gap frame where neither chapter is composed;
  the mask/cover fully occludes at the swap.
- Continuous carry: the carried element's position + velocity match across the
  seam, or the motion logic is visibly continuous enough that the eye can follow
  it (related element / transform is fine).
- Hold/settle cut: the message is readable and at rest before the cut.
- Loop reset: first and last frames match (position, color, velocity) unless the
  reset is intentional.

## Guardrails

- Jump/hard cuts need repeated rhythm or a clear editorial reason; one isolated
  interrupted move can look broken.
- Cut-on-motion should usually match direction/velocity across the cut.
- Avoid high-energy chapter cuts for calm luxury/institutional tone, final logo
  lockups, legal text, or anything that must settle to be understood.
