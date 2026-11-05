import { describe, expect, it } from "vitest"

import type { ParsedRow } from "./csv"
import type {
  CustomerRecord,
  MaterialRecord,
  PaymentTermRecord,
} from "./columns"
import { buildPreview } from "./preview"

const paymentTerms: PaymentTermRecord[] = [
  {
    id: "term-1",
    code: "cheque-30",
    label: "Cheque Due 30 Days",
    labelAr: "شيك بعد 30 يوم",
  },
]

const customer: CustomerRecord = {
  id: "cust-1",
  customerCode: "CUST-1",
  name: "Before",
  address: "Old address",
  defaultCurrency: "EGP",
  defaultPaymentTermId: "term-1",
}

const material: MaterialRecord = {
  id: "mat-1",
  itemCode: "MAT-1",
  name: "Priced",
  category: "Polyol",
  referencePricePerKg: 10,
  uom: "kg",
  isActive: true,
  defaultWeightKg: 200,
}

function row(
  rowNumber: number,
  values: Record<string, string | null>,
): ParsedRow {
  return { rowNumber, values }
}

function preview(
  source: "customers" | "materials" | "prices",
  rows: ParsedRow[],
  existing: Partial<{
    customers: CustomerRecord[]
    materials: MaterialRecord[]
  }> = {},
) {
  return buildPreview(source, {
    rows,
    customers: existing.customers ?? [],
    materials: existing.materials ?? [],
    bankAccounts: [],
    paymentTerms,
  })
}

describe("customer preview", () => {
  it("accepts a new customer and fills the default currency", () => {
    const result = preview("customers", [
      row(2, { customerCode: "CUST-2", name: "New", address: "Cairo" }),
    ])

    expect(result.rows[0].status).toBe("new")
    expect(result.rows[0].values.defaultCurrency).toBe("EGP")
  })

  it("reports every invalid cell of a new row", () => {
    const result = preview("customers", [
      row(2, {
        customerCode: "CUST-3",
        email: "not-an-email",
        defaultCurrency: "XYZ",
        defaultPaymentTerm: "Net 99",
      }),
    ])

    const errors = result.rows[0].errors
    expect(result.rows[0].status).toBe("error")
    expect(errors).toContain("Customer name is required.")
    expect(errors).toContain("Customer address is required.")
    expect(errors).toContain("Email address 'not-an-email' is not valid.")
    expect(errors).toContain("Unknown currency 'XYZ'.")
    expect(errors).toContain("Unknown payment term 'Net 99'.")
  })

  it("resolves a payment term by Arabic label and upper-cases the currency", () => {
    const result = preview("customers", [
      row(2, {
        customerCode: "CUST-4",
        name: "Arabic",
        address: "القاهرة",
        defaultPaymentTerm: "شيك بعد 30 يوم",
        defaultCurrency: "usd",
      }),
    ])

    expect(result.rows[0].status).toBe("new")
    expect(result.rows[0].values.defaultPaymentTerm).toBe("Cheque Due 30 Days")
    expect(result.rows[0].values.defaultCurrency).toBe("USD")
  })

  it("errors on a code repeated inside the file", () => {
    const result = preview("customers", [
      row(2, { customerCode: "CUST-9", name: "One", address: "Cairo" }),
      row(3, { customerCode: "cust-9", name: "Two", address: "Cairo" }),
    ])

    expect(result.rows[0].status).toBe("new")
    expect(result.rows[1].status).toBe("error")
    expect(result.rows[1].errors[0]).toContain("Duplicate customer code")
  })

  it("diffs an existing customer and maps its target id", () => {
    const result = preview(
      "customers",
      [row(2, { customerCode: "CUST-1", name: "After", city: "Giza" })],
      { customers: [customer] },
    )

    const first = result.rows[0]
    expect(first.status).toBe("update")
    expect(first.existing?.defaultPaymentTerm).toBe("Cheque Due 30 Days")
    expect(first.changes).toEqual(
      expect.arrayContaining([
        { field: "name", oldValue: "Before", newValue: "After" },
        { field: "city", oldValue: null, newValue: "Giza" },
      ]),
    )
    expect(result.targets[2]).toBe("cust-1")
  })
})

describe("material preview", () => {
  it("accepts a new material and fills the defaults", () => {
    const result = preview("materials", [
      row(2, { itemCode: "MAT-2", name: "New", category: "polyol" }),
    ])

    expect(result.rows[0].status).toBe("new")
    expect(result.rows[0].values.category).toBe("Polyol")
    expect(result.rows[0].values.isActive).toBe("true")
    expect(result.rows[0].values.uom).toBe("kg")
  })

  it("reports an invalid category, negative amounts and a bad flag", () => {
    const result = preview("materials", [
      row(2, {
        itemCode: "MAT-3",
        name: "Bad",
        category: "Resin",
        referencePricePerKg: "-5",
        defaultWeightKg: "many",
        isActive: "maybe",
      }),
    ])

    const errors = result.rows[0].errors
    expect(result.rows[0].status).toBe("error")
    expect(errors).toContain(
      "Category 'Resin' is not valid. Use Polyol, Iso, System or Additive.",
    )
    expect(errors).toContain("Reference price per kg cannot be negative.")
    expect(errors).toContain("Default weight must be a number.")
    expect(errors).toContain("Is active must be true or false.")
  })

  it("marks an identical row unchanged and reports a repeated code", () => {
    const result = preview(
      "materials",
      [
        row(2, { itemCode: "MAT-1", referencePricePerKg: "10" }),
        row(3, { itemCode: "MAT-1", referencePricePerKg: "12.5" }),
      ],
      { materials: [material] },
    )

    expect(result.rows[0].status).toBe("unchanged")
    expect(result.rows[0].changes).toEqual([])
    expect(result.rows[1].status).toBe("error")
    expect(result.rows[1].errors[0]).toContain("Duplicate item code")
  })
})

describe("price preview", () => {
  it("diffs the new price against the stored one", () => {
    const result = preview(
      "prices",
      [row(2, { itemCode: "MAT-1", referencePricePerKg: "12.5" })],
      {
        materials: [material],
      },
    )

    const first = result.rows[0]
    expect(first.status).toBe("update")
    expect(first.changes).toEqual([
      { field: "referencePricePerKg", oldValue: "10", newValue: "12.5" },
    ])
    expect(result.targets[2]).toBe("mat-1")
  })

  it("errors when the material is missing or the price is empty", () => {
    const result = preview("prices", [
      row(2, { itemCode: "MAT-404", referencePricePerKg: "10" }),
      row(3, { itemCode: "MAT-1" }),
    ])

    expect(result.rows[0].status).toBe("error")
    expect(result.rows[0].errors).toContain(
      "No material matches item code 'MAT-404'.",
    )
    expect(result.rows[1].status).toBe("error")
    expect(result.rows[1].errors).toContain(
      "Reference price per kg is required.",
    )
  })
})
