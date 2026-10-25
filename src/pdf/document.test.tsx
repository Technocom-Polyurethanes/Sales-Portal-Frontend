// @vitest-environment jsdom
import { act } from "react"
import { createRoot } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { buildDocumentData } from "../features/offers/document"
import { customers } from "../mock/data/customers"
import { banks, company } from "../mock/data/company"
import { packageTypes } from "../mock/data/packageTypes"
import OfferDocument from "./OfferDocument"

const source = {
  reference: "3089/OCT./YL/AA",
  issueDate: "2026-10-21",
  dueDate: "2026-11-20",
  currency: "EGP",
  paymentTermId: "cheque-30",
  customerId: "cust-1",
  lines: [
    {
      productId: "prod-1",
      materialName: "DALTORIM EG 26200 - D",
      materialCode: "POL-001",
      category: "Polyol",
      packaging: [
        {
          id: "pack-1",
          packageTypeId: "drum",
          packageTypeName: "Drum",
          weightPerPackageKg: 210,
          packages: 19,
        },
      ],
      quantityKg: 3990,
      ratePerKg: 10,
      amount: 39900,
    },
  ],
  subtotal: 39900,
  orderDiscount: 0,
  orderDiscountPercent: 0,
  taxPercent: 14,
  taxAmount: 5586,
  otherTaxEnabled: false,
  otherTaxPercent: 0,
  otherTaxAmount: 0,
  total: 45486,
  delivery: [
    {
      id: "batch-1",
      batchNumber: 1,
      date: "2026-10-25",
      allocations: [{ productId: "prod-1", packages: 19 }],
    },
  ],
  notes: "Prices are valid for 7 days.",
  attention: "",
}

const customer = customers[0]

const build = (language: "en" | "ar") =>
  buildDocumentData(source, {
    customer,
    company,
    banks,
    packageTypes,
    language,
    paymentTermLabel: language === "ar" ? "شيك — ٣٠ يوم" : "Cheque — 30 days",
  })

describe("offer document", () => {
  let container: HTMLDivElement

  beforeEach(() => {
    container = document.createElement("div")
    document.body.appendChild(container)
  })

  afterEach(() => {
    container.remove()
  })

  const render = (language: "en" | "ar") => {
    const root = createRoot(container)
    act(() => {
      root.render(<OfferDocument data={build(language)} language={language} />)
    })
  }

  it("keeps the English document left to right", () => {
    render("en")

    const article = container.querySelector(".offer-document")
    expect(article?.getAttribute("dir")).toBe("ltr")
    expect(container.textContent).toContain("Drum")
    expect(container.textContent).toContain("19 Drum × 210 kg")
  })

  it("mirrors the Arabic document and translates the packaging", () => {
    render("ar")

    const article = container.querySelector(".offer-document")
    expect(article?.getAttribute("dir")).toBe("rtl")
    expect(container.textContent).toContain("عرض سعر")
    expect(container.textContent).toContain("19 برميل × 210 كجم")
  })

  it("keeps the reference number left to right in both languages", () => {
    render("ar")

    const reference = container.querySelector(".doc-reference .doc-ltr")
    expect(reference?.textContent).toBe("3089/OCT./YL/AA")
  })

  it("writes the currency in the language of the document", () => {
    render("ar")
    expect(container.textContent).toContain("ج.م")
    expect(container.textContent).not.toContain("EGP")

    render("en")
    expect(container.textContent).toContain("EGP")
    expect(container.textContent).not.toContain("ج.م")
  })

  it("always prints the bank accounts", () => {
    render("en")

    const text = container.textContent ?? ""
    expect(text).toContain("QNB")
    expect(text).toContain("SAIB")
    expect(text).toContain("002145890012")
  })

  it("prints the packaging on a sub-row under the material", () => {
    render("en")

    const subrow = container.querySelector(".doc-subrow")
    expect(container.textContent).toContain("19 Drum × 210 kg")
  })

  it("numbers the materials and the banks", () => {
    render("en")

    expect(container.querySelector(".doc-items .doc-index")?.textContent).toBe(
      "#",
    )
    expect(container.querySelectorAll(".doc-banks tbody tr")).toHaveLength(2)
  })

  it("ends the totals with the grand total", () => {
    render("en")

    const rows = container.querySelectorAll(".doc-totals tr")
    const last = rows[rows.length - 1]
    expect(last.className).toContain("doc-grand")
    expect(last.textContent).toContain("Total")
    expect(container.textContent).not.toContain("Balance")
  })

  it("hides the attention line when it is empty", () => {
    render("en")
    expect(container.textContent).not.toContain("Attention:")
  })

  it("prints the attention line from the offer", () => {
    const sourceWithAttention = { ...source, attention: "Mostafa Fouad" }
    const root = createRoot(container)
    const data = buildDocumentData(sourceWithAttention, {
      customer,
      company,
      banks,
      packageTypes,
      language: "en",
      paymentTermLabel: "Cheque — 30 days",
    })
    act(() => {
      root.render(<OfferDocument data={data} language="en" />)
    })
    expect(container.textContent).toContain("Attention: Mostafa Fouad")
  })
})
