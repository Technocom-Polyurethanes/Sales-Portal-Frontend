import { describe, expect, it } from "vitest"

import { DELIVERY_PRESETS, deliveryTextIn, presetFor } from "./deliveryPresets"

describe("delivery text presets", () => {
  it("prints each preset in the requested document language", () => {
    for (const preset of DELIVERY_PRESETS) {
      expect(presetFor(preset.ar)?.id).toBe(preset.id)
      expect(deliveryTextIn(preset.ar, "ar")).toBe(preset.ar)
      expect(deliveryTextIn(preset.ar, "en")).toBe(preset.en)
      expect(deliveryTextIn(preset.en, "ar")).toBe(preset.ar)
      expect(deliveryTextIn(preset.en, "en")).toBe(preset.en)
    }
  })

  it("keeps an edited text identical in both languages", () => {
    const custom = "Custom wording for this offer"
    expect(deliveryTextIn(custom, "ar")).toBe(custom)
    expect(deliveryTextIn(custom, "en")).toBe(custom)
  })
})
