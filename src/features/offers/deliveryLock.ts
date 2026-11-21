import type { DeliveryMode, OfferDraft } from "./types"

/**
 * The delivery is described either by a schedule or by free text, never both. Once the chosen
 * method has content, the other one is locked until that content is removed. With nothing
 * entered yet both stay open, and a draft that already holds both (an older offer) stays
 * unlocked so the user can clean it up.
 */
export function lockedDeliveryMode(
  draft: Pick<OfferDraft, "deliveryMode" | "delivery" | "deliveryText">,
): DeliveryMode | undefined {
  const hasBatches = draft.delivery.length > 0
  const hasText = draft.deliveryText.trim() !== ""

  if (hasBatches && hasText) return undefined
  if (draft.deliveryMode === "batches" && hasBatches) return "text"
  if (draft.deliveryMode === "text" && hasText) return "batches"
  return undefined
}
