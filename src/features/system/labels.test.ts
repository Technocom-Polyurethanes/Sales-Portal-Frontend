import { describe, expect, it } from "vitest"

import type { TranslateFunction } from "../../i18n/I18nProvider"
import en from "../../i18n/en.json"
import { translate } from "../../i18n/translate"

import { stateLabel } from "./labels"

const t: TranslateFunction = (key, params) => translate(en, en, key, params)

describe("system status labels", () => {
  it("localizes known states", () => {
    expect(stateLabel("overall", "Healthy", t)).toBe("Healthy")
    expect(stateLabel("database", "Down", t)).toBe("Down")
    expect(stateLabel("live", "disconnected", t)).toBe("Disconnected")
  })

  it("falls back to the server value", () => {
    expect(stateLabel("live", "unknown", t)).toBe("unknown")
  })
})
