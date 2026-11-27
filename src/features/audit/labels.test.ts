import { describe, expect, it } from "vitest"

import type { TranslateFunction } from "../../i18n/I18nProvider"
import en from "../../i18n/en.json"
import { translate } from "../../i18n/translate"

import { actionLabel, categoryLabel, outcomeLabel } from "./labels"

const t: TranslateFunction = (key) =>
  key === "audit.actions.offer.created"
    ? "Created offer"
    : key === "audit.categories.offers"
      ? "Offers"
      : key === "audit.outcomes.failure"
        ? "Failure"
        : key

describe("audit labels", () => {
  it("resolves dotted action codes against the translation tree", () => {
    const realT: TranslateFunction = (key, params) =>
      translate(en, en, key, params)

    expect(actionLabel("offer.status_changed", realT)).toBe(
      "Changed offer status",
    )
  })

  it("uses the translation when one exists", () => {
    expect(actionLabel("offer.created", t)).toBe("Created offer")
    expect(categoryLabel("offers", t)).toBe("Offers")
    expect(outcomeLabel("failure", t)).toBe("Failure")
  })

  it("falls back to the server code for unknown values", () => {
    expect(actionLabel("future.action", t)).toBe("future.action")
    expect(categoryLabel("future", t)).toBe("future")
    expect(outcomeLabel("unknown", t)).toBe("unknown")
  })
})
