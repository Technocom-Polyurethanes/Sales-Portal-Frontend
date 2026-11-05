import { describe, expect, it } from "vitest"

import { SOURCE_KEYS } from "../../features/import/labels"
import { IMPORT_COLUMNS, IDENTIFIER_FIELD, NAME_FIELD } from "./columns"
import type { BankAccountRecord } from "./columns"
import type { ParsedRow } from "./csv"
import { buildPreview } from "./preview"

const existing: BankAccountRecord = {
  id: "bank-1",
  bank: "QNB",
  branch: "Badr City",
  accountNumber: "002145890012",
  currency: "EGP",
  isActive: true,
  sortOrder: 1,
}

function preview(rows: ParsedRow[], bankAccounts: BankAccountRecord[] = []) {
  return buildPreview("bank-accounts", {
    rows,
    customers: [],
    materials: [],
    bankAccounts,
    paymentTerms: [],
  })
}

describe("bank account import", () => {
  it("uses the agreed columns and labels", () => {
    expect(IMPORT_COLUMNS["bank-accounts"]).toEqual([
      "bank",
      "bankAr",
      "branch",
      "branchAr",
      "accountHolderName",
      "accountHolderNameAr",
      "accountNumber",
      "swift",
      "iban",
      "currency",
      "isActive",
      "sortOrder",
    ])
    expect(IDENTIFIER_FIELD["bank-accounts"]).toBe("accountNumber")
    expect(NAME_FIELD["bank-accounts"]).toBe("bank")
    expect(SOURCE_KEYS["bank-accounts"]).toBe("import.bankAccounts")
  })

  it("fills the defaults of a new account", () => {
    const result = preview(
      [
        {
          rowNumber: 2,
          values: {
            bank: "New Bank",
            branch: "Cairo",
            accountNumber: " 123 ",
          },
        },
      ],
      [existing],
    )

    expect(result.rows[0].status).toBe("new")
    expect(result.rows[0].values.accountNumber).toBe("123")
    expect(result.rows[0].values.currency).toBe("EGP")
    expect(result.rows[0].values.isActive).toBe("true")
    expect(result.rows[0].values.sortOrder).toBe("3")
  })

  it("rejects a second account number regardless of case", () => {
    const result = preview([
      {
        rowNumber: 2,
        values: { bank: "One", branch: "Cairo", accountNumber: "ABC-1" },
      },
      {
        rowNumber: 3,
        values: { bank: "Two", branch: "Giza", accountNumber: "abc-1" },
      },
    ])

    expect(result.rows[0].status).toBe("new")
    expect(result.rows[1].status).toBe("error")
    expect(result.rows[1].errors[0]).toContain("Duplicate account number")
  })

  it("diffs an existing account and maps its target id", () => {
    const result = preview(
      [
        {
          rowNumber: 2,
          values: {
            bank: "QNB",
            branch: "Alexandria",
            accountNumber: "002145890012",
            currency: "usd",
          },
        },
      ],
      [existing],
    )

    expect(result.rows[0].status).toBe("update")
    expect(result.rows[0].changes).toEqual(
      expect.arrayContaining([
        { field: "branch", oldValue: "Badr City", newValue: "Alexandria" },
        { field: "currency", oldValue: "EGP", newValue: "USD" },
      ]),
    )
    expect(result.targets[2]).toBe("bank-1")
  })
})
