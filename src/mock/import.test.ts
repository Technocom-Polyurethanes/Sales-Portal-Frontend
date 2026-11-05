import { describe, expect, it } from "vitest"

import { db } from "./db"
import { commit, history, preview, template } from "./import"

function form(csv: string, fileName = "prices.csv") {
  const data = new FormData()
  data.append("file", new File([csv], fileName, { type: "text/csv" }))
  return data
}

describe("mock import", () => {
  it("supports the whole template, preview, commit and history flow", async () => {
    expect(template("prices")).toBe("itemCode,referencePricePerKg\r\n")

    const result = await preview(
      "prices",
      form("itemCode,referencePricePerKg\r\nPOL-001,12.5\r\n"),
    )

    expect(result.summary.update).toBe(1)
    expect(result.rows[0].changes[0]).toEqual({
      field: "referencePricePerKg",
      oldValue: "10",
      newValue: "12.5",
    })

    const committed = commit(result.importId)
    expect(committed.updated).toBe(1)
    expect(
      db.products.find((product) => product.code === "POL-001")?.referencePrice,
    ).toBe(12.5)

    expect(commit(result.importId)).toEqual(committed)

    const page = history()
    expect(page.items[0].id).toBe(result.importId)
    expect(page.items[0].updated).toBe(1)
  })

  it("previews and commits bank accounts", async () => {
    const csv =
      template("bank-accounts") +
      "New Bank,بنك جديد,Cairo,القاهرة,TECHNOCOM,شركة تكنوكوم,555,SWIFT,EG,usd,yes,9\r\n"

    const result = await preview("bank-accounts", form(csv, "banks.csv"))
    expect(result.summary.new).toBe(1)

    const committed = commit(result.importId)
    expect(committed.created).toBe(1)

    const account = db.banks.find((bank) => bank.accountNumber === "555")
    expect(account?.bank).toBe("New Bank")
    expect(account?.currency).toBe("USD")
    expect(account?.isActive).toBe(true)
    expect(account?.sortOrder).toBe(9)
  })

  it("rejects a file that is not CSV", async () => {
    await expect(
      preview("prices", form("a,b\r\n1,2\r\n", "prices.xlsx")),
    ).rejects.toThrow("The mock accepts .csv files only.")
  })
})
