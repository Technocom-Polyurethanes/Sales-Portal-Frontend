import type { AppLanguage } from "../../i18n/direction"

/** The two fixed delivery wordings; every other text is kept as the user typed it. */
export const DELIVERY_PRESETS = [
  {
    id: "available",
    ar: "بضاعة حاضرة حال تأكيد امر التوريد و سداد القيمة",
    en: "Goods available upon confirmation of the purchase order and payment of the value",
  },
  {
    id: "twoDays",
    ar: "خلال يومان عمل من تاريخ استلام امر التوريد",
    en: "Within two working days from the date of receiving the purchase order",
  },
] as const

export type DeliveryPresetId = (typeof DELIVERY_PRESETS)[number]["id"]

export function presetFor(text: string | undefined): (typeof DELIVERY_PRESETS)[number] | undefined {
  const trimmed = text?.trim()
  return DELIVERY_PRESETS.find((preset) => preset.ar === trimmed || preset.en === trimmed)
}

/** A preset prints in the requested language; custom text prints unchanged in both. */
export function deliveryTextIn(text: string | undefined, language: AppLanguage): string {
  const trimmed = text?.trim() ?? ""
  const preset = presetFor(trimmed)
  return preset ? preset[language] : trimmed
}
