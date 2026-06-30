import type { AnimationSlot } from "@/types";

type TextDocument = { t?: string; s?: number };
type TextKeyframe = { s?: TextDocument };

export type LottieDoc = {
  nm?: unknown;
  slots?: Record<string, { p?: { k?: unknown; p?: { t?: string } } }>;
  layers?: Array<{
    ty?: number;
    nm?: string;
    t?: { d?: { sid?: string; k?: unknown } };
  }>;
};

function textDocument(k: unknown): TextDocument | undefined {
  if (!Array.isArray(k)) return undefined;
  const first = k[0] as TextKeyframe | undefined;
  return first?.s;
}

function boundTextLayers(doc: LottieDoc, slotId: string): NonNullable<LottieDoc["layers"]> {
  return (doc.layers ?? []).filter((layer) => layer.ty === 5 && layer.t?.d?.sid === slotId);
}

export function readTextSlotValue(doc: LottieDoc | null | undefined, slotId: string): string | undefined {
  const slot = doc?.slots?.[slotId]?.p;
  const slotText = textDocument(slot?.k)?.t;
  if (typeof slotText === "string") return slotText;
  if (typeof slot?.p?.t === "string") return slot.p.t;

  for (const layer of boundTextLayers(doc ?? {}, slotId)) {
    const layerText = textDocument(layer.t?.d?.k)?.t;
    if (typeof layerText === "string") return layerText;
  }
  return undefined;
}

export function writeTextSlotValue(doc: LottieDoc, slotId: string, text: string): void {
  const slot = doc.slots?.[slotId]?.p;
  const slotDoc = textDocument(slot?.k);
  if (slotDoc) slotDoc.t = text;
  if (slot?.p) slot.p.t = text;

  for (const layer of boundTextLayers(doc, slotId)) {
    const layerDoc = textDocument(layer.t?.d?.k);
    if (layerDoc) layerDoc.t = text;
  }
}

/**
 * Patch a Lottie document's slot definitions with the given slot values.
 * Mutates `doc` in place. Scalar/color/vec2 values live on `slots[id].p.k`;
 * text is written to the slot document and its bound layer fallback.
 */
export function applySlotValues(doc: LottieDoc, slots: AnimationSlot[]): void {
  for (const slot of slots) {
    const def = doc.slots?.[slot.id]?.p;
    if (slot.type === "text") {
      writeTextSlotValue(doc, slot.id, slot.value);
    } else {
      if (!def) continue;
      def.k = slot.value;
    }
  }
}
