import type { AnimationSlot } from "@/types";

type LottieDoc = {
  slots?: Record<string, { p?: { k?: unknown; p?: { t?: string } } }>;
};

// Skottie stores a slotted text document at slots[id].p.k[0].s.t (the same
// keyframed text-document shape a text layer uses). Older scenes used a flat
// slots[id].p.p.t; we still honour that as a fallback.
function applyTextSlot(def: { k?: unknown; p?: { t?: string } }, text: string): void {
  const k = def.k;
  if (Array.isArray(k) && k[0] && typeof k[0] === "object") {
    const s = (k[0] as { s?: { t?: string } }).s;
    if (s) {
      s.t = text;
      return;
    }
  }
  if (def.p) def.p.t = text;
}

/**
 * Patch a Lottie document's slot definitions with the given slot values.
 * Mutates `doc` in place. Scalar/color/vec2 values live on `slots[id].p.k`;
 * text lives on the slotted text document at `slots[id].p.k[0].s.t`.
 */
export function applySlotValues(doc: LottieDoc, slots: AnimationSlot[]): void {
  for (const slot of slots) {
    const def = doc.slots?.[slot.id]?.p;
    if (!def) continue;
    if (slot.type === "text") {
      applyTextSlot(def, slot.value);
    } else {
      def.k = slot.value;
    }
  }
}
