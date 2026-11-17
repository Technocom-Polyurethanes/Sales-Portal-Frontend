import { describe, expect, it } from "vitest"

import { banksForOffer } from "../offers/bankSelection"
import { normalizeSettings } from "./normalize"

const bank = { id: "b1", bank: "QNB", branch: "Badr" }

describe("normalizeSettings", () => {
  it("reads the banks nested under `workspace` in the /settings answer", () => {
    const result = normalizeSettings({
      company: { name: "TECHNOCOM" },
      workspace: { bankAccounts: [bank], defaultCurrency: "USD" },
    })

    expect(result.banks).toEqual([bank])
    expect(result.defaultCurrency).toBe("USD")
  })

  it("fills banks and package types from the catalog bootstrap", () => {
    const result = normalizeSettings(
      { company: {}, workspace: {} },
      { bankAccounts: [bank], packageTypes: [{ id: "p1" }] },
    )

    expect(result.banks).toEqual([bank])
    expect(result.packageTypes).toEqual([{ id: "p1" }])
  })

  it("always returns arrays, even when the server sends nothing", () => {
    const result = normalizeSettings(undefined, undefined)

    expect(result.banks).toEqual([])
    expect(result.packageTypes).toEqual([])
    expect(result.paymentTerms).toEqual([])
  })
})

describe("banksForOffer", () => {
  it("does not throw when the catalog has no banks", () => {
    expect(banksForOffer(undefined, ["b1"])).toEqual([])
    expect(banksForOffer(null, null)).toEqual([])
  })
})
