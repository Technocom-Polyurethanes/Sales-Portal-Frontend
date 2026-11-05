import { describe, expect, it } from "vitest"

import type { BankAccount } from "../settings/types"
import {
  activeBankIds,
  banksForOffer,
  hasBankSelection,
  setAllBanks,
  toggleBank,
} from "./bankSelection"
import { createEmptyDraft, draftToPayload, offerToDraft } from "./draft"
import type { Offer } from "./types"

const banks: BankAccount[] = [
  {
    id: "bank-b",
    bank: "Bank B",
    branch: "Giza",
    accountNumber: "2",
    swift: "",
    iban: "",
    currency: "EGP",
    isActive: true,
    sortOrder: 2,
  },
  {
    id: "bank-a",
    bank: "Bank A",
    branch: "Cairo",
    accountNumber: "1",
    swift: "",
    iban: "",
    currency: "USD",
    isActive: true,
    sortOrder: 1,
  },
  {
    id: "bank-off",
    bank: "Inactive",
    branch: "Cairo",
    accountNumber: "3",
    swift: "",
    iban: "",
    currency: "EGP",
    isActive: false,
    sortOrder: 0,
  },
]

describe("bank account selection", () => {
  it("defaults a new draft to the active accounts in sort order", () => {
    const draft = createEmptyDraft({}, banks)

    expect(draft.bankAccountIds).toEqual(["bank-a", "bank-b"])
    expect(activeBankIds(banks)).toEqual(["bank-a", "bank-b"])
  })

  it("toggles one account and selects all or none", () => {
    expect(toggleBank(["bank-a"], "bank-b")).toEqual(["bank-a", "bank-b"])
    expect(toggleBank(["bank-a", "bank-b"], "bank-a")).toEqual(["bank-b"])
    expect(setAllBanks(true, banks)).toEqual(["bank-a", "bank-b"])
    expect(setAllBanks(false, banks)).toEqual([])
  })

  it("treats an empty selection as invalid", () => {
    expect(hasBankSelection([])).toBe(false)
    expect(hasBankSelection(["bank-a"])).toBe(true)
  })

  it("sends the selected ids in the offer payload", () => {
    const draft = createEmptyDraft({ bankAccountIds: ["bank-b"] }, banks)
    const payload = draftToPayload(draft, { version: 1 })

    expect(payload.bankAccountIds).toEqual(["bank-b"])
  })

  it("maps a null selection to every active account when editing", () => {
    const offer = {
      reference: "1/OCT./YL/AA",
      customerId: "cust-1",
      attention: "",
      issueDate: "2026-10-21",
      currency: "EGP",
      paymentTermId: "term-1",
      lines: [],
      delivery: [],
      taxPercent: 14,
      otherTaxEnabled: false,
      otherTaxPercent: 0,
      orderDiscountPercent: 0,
      notes: "",
      documentLanguage: "en",
      bankAccountIds: null,
    } as unknown as Offer

    expect(offerToDraft(offer, banks).bankAccountIds).toEqual([
      "bank-a",
      "bank-b",
    ])
    expect(
      offerToDraft({ ...offer, bankAccountIds: ["bank-b"] }, banks)
        .bankAccountIds,
    ).toEqual(["bank-b"])
  })
})

describe("banksForOffer", () => {
  it("returns every account for a legacy null selection", () => {
    expect(banksForOffer(banks, null)).toEqual(banks)
    expect(banksForOffer(banks, undefined)).toEqual(banks)
  })

  it("filters the settings accounts to the offer selection", () => {
    expect(banksForOffer(banks, ["bank-b"]).map((bank) => bank.id)).toEqual([
      "bank-b",
    ])
  })
})
