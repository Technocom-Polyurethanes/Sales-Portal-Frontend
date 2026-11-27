import { describe, expect, it } from "vitest"

import ar from "./ar.json"
import en from "./en.json"
import { interpolate, lookup, translate } from "./translate"

describe("translation helpers", () => {
  it("reads a nested key", () => {
    expect(lookup(en as Record<string, unknown>, "offers.builder.title")).toBe(
      "New Offer",
    )
  })

  it("returns undefined for an unknown key", () => {
    expect(
      lookup(en as Record<string, unknown>, "offers.builder.unknown"),
    ).toBeUndefined()
  })

  it("interpolates placeholders", () => {
    expect(
      interpolate("Showing {count} of {total}", { count: 3, total: 9 }),
    ).toBe("Showing 3 of 9")
  })

  it("keeps unknown placeholders untouched", () => {
    expect(interpolate("Page {page}", {})).toBe("Page {page}")
  })

  it("interpolates the versions count in both languages", () => {
    const params = { count: 4 }
    const key = "offers.details.versionCount"

    expect(
      translate(
        en as Record<string, unknown>,
        en as Record<string, unknown>,
        key,
        params,
      ),
    ).toBe("4 versions")
    expect(
      translate(
        ar as Record<string, unknown>,
        en as Record<string, unknown>,
        key,
        params,
      ),
    ).toBe("4 إصدارات")
  })

  it("translates using the active tree", () => {
    expect(
      translate(
        ar as Record<string, unknown>,
        en as Record<string, unknown>,
        "nav.home",
      ),
    ).toBe("الرئيسية")
  })

  it("falls back to English when a translation is missing", () => {
    const partial = { nav: {} }
    expect(
      translate(
        partial as Record<string, unknown>,
        en as Record<string, unknown>,
        "nav.home",
      ),
    ).toBe("Home")
  })

  it("returns the key when nothing matches", () => {
    expect(translate({}, {}, "missing.key")).toBe("missing.key")
  })
})
