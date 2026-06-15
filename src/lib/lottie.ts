import type { AnimationSlot } from "@/types";

type LottieDoc = {
  slots?: Record<string, { p?: { k?: unknown; p?: { t?: string } } }>;
};

/**
 * Patch a Lottie document's slot definitions with the given slot values.
 * Mutates `doc` in place. Scalar/color/vec2 values live on `slots[id].p.k`;
 * text lives on `slots[id].p.p.t`.
 */
export function applySlotValues(doc: LottieDoc, slots: AnimationSlot[]): void {
  for (const slot of slots) {
    const def = doc.slots?.[slot.id]?.p;
    if (!def) continue;
    if (slot.type === "text") {
      if (def.p) def.p.t = slot.value;
    } else {
      def.k = slot.value;
    }
  }
}
