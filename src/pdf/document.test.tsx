// @vitest-environment jsdom
import { act } from "react"
import { createRoot } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { buildDocumentData, type DocumentSource } from "../features/offers/document"
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

const priceOnlySource: DocumentSource = {
  ...(source as DocumentSource),
  lines: [{ ...source.lines[0], packaging: [], quantityKg: 0, amount: 0 }],
  subtotal: 0,
  taxAmount: 0,
  total: 0,
}

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

  it("writes the Arabic numbers in Arabic digits but keeps reference, product and bank details Latin", () => {
    render("ar")
    const text = container.textContent ?? ""

    expect(text).toContain("3089/OCT./YL/AA")
    expect(text).toContain("TF-06-01")
    expect(text).toContain("DALTORIM EG 26200 - D")
    expect(text).toContain("EG12 QNBA 0021 4589 0012")
    expect(text).toContain("٢٠٢٦/١٠/٢١")
    expect(text).toContain("٣٩٩٠٠")
    expect(text).not.toContain("٬")
  })

  it("mirrors the Arabic document and translates the packaging", () => {
    render("ar")

    const article = container.querySelector(".offer-document")
    expect(article?.getAttribute("dir")).toBe("rtl")
    expect(container.textContent).toContain("عرض سعر")
    expect(container.textContent).toContain("١٩ برميل × ٢١٠ كجم")
  })

  it("keeps the reference number left to right in both languages", () => {
    render("ar")

    const reference = container.querySelector(".doc-reference td .doc-ltr")
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
    const grand = rows[rows.length - 2]
    expect(grand.className).toContain("doc-grand")
    expect(grand.textContent).toContain("Total")
    expect(container.textContent).not.toContain("Balance")
  })

  it("derives the amount in words from the final total and document language", () => {
    expect(build("en").totalInWords).toBe(
      "Forty-Five Thousand Four Hundred Eighty-Six Egyptian Pounds Only",
    )
    expect(build("ar").totalInWords).toBe(
      "فقط خمسة وأربعون ألف وأربعمائة وستة وثمانون جنيهاً مصرياً لا غير",
    )

    const zero = buildDocumentData({ ...(source as DocumentSource), total: 0 }, {
      customer,
      company,
      banks,
      packageTypes,
      language: "en",
      paymentTermLabel: "Cheque — 30 days",
    })
    expect(zero.totalInWords).toBe("")
  })

  it("prints the amount in words directly under the grand total in English", () => {
    render("en")

    const rows = Array.from(container.querySelectorAll(".doc-totals tr"))
    const words = rows[rows.length - 1]
    expect(words?.className).toContain("doc-in-words")
    expect(words?.querySelector(".doc-in-words__label")?.textContent).toBe(
      "Amount in Words",
    )
    expect(words?.textContent).toContain(
      "Forty-Five Thousand Four Hundred Eighty-Six Egyptian Pounds Only",
    )
  })

  it("mirrors the amount in words in the Arabic document", () => {
    render("ar")

    const words = container.querySelector(".doc-totals .doc-in-words")
    expect(words?.querySelector(".doc-in-words__label")?.textContent).toBe(
      "المبلغ بالحروف",
    )
    expect(words?.textContent).toContain(
      "فقط خمسة وأربعون ألف وأربعمائة وستة وثمانون جنيهاً مصرياً لا غير",
    )
  })

  it("prints no amount in words when the total is zero", () => {
    const zero = buildDocumentData({ ...(source as DocumentSource), total: 0 }, {
      customer,
      company,
      banks,
      packageTypes,
      language: "en",
      paymentTermLabel: "Cheque — 30 days",
    })
    const root = createRoot(container)
    act(() => {
      root.render(<OfferDocument data={zero} language="en" />)
    })

    expect(container.querySelector(".doc-in-words")).toBeNull()
  })

  it("prints prices and totals with two decimals but keeps the quantity compact", () => {
    render("en")

    const cells = Array.from(
      container.querySelectorAll(".doc-items tbody tr:first-child td"),
    ).map((cell) => cell.textContent)
    expect(cells[2]).toBe("3,990")
    expect(cells[3]).toBe("10.00")
    expect(cells[4]).toBe("39,900.00")

    const values = Array.from(container.querySelectorAll(".doc-totals td .doc-ltr")).map(
      (cell) => cell.textContent,
    )
    expect(values).toContain("39,900.00")
    expect(values).toContain("5,586.00")
    expect(values).toContain("45,486.00")
  })

  it("prints Arabic prices and totals with a dot decimal and no separator", () => {
    render("ar")

    const cells = Array.from(
      container.querySelectorAll(".doc-items tbody tr:first-child td"),
    ).map((cell) => cell.textContent)
    expect(cells[2]).toBe("٣٩٩٠")
    expect(cells[3]).toBe("١٠٫٠٠")
    expect(cells[4]).toBe("٣٩٩٠٠٫٠٠")
    expect(container.textContent).not.toContain("٬")
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

  it("prints the tax as the VAT in the language of the document", () => {
    const expected = { en: "(VAT) 14%", ar: "ضريبة القيمه المضافة ١٤٪" }

    for (const language of ["en", "ar"] as const) {
      render(language)
      const labels = Array.from(container.querySelectorAll(".doc-totals th")).map(
        (cell) => cell.textContent,
      )
      expect(labels).toContain(expected[language])
    }
  })

  it("puts the letterhead and the footer on every page", () => {
    render("en")

    const pages = container.querySelectorAll(".doc-page")
    expect(pages.length).toBeGreaterThan(0)
    for (const page of Array.from(pages)) {
      expect(page.querySelector(".doc-header")).not.toBeNull()
      expect(page.querySelector(".doc-footer")).not.toBeNull()
    }
    expect(container.querySelectorAll(".doc-title")).toHaveLength(1)
  })

  describe("price-only offer", () => {
    const buildPriceOnly = (language: "en" | "ar") =>
      buildDocumentData(priceOnlySource, {
        customer,
        company,
        banks,
        packageTypes,
        language,
        paymentTermLabel: language === "ar" ? "شيك — ٣٠ يوم" : "Cheque — 30 days",
      })

    const renderPriceOnly = (language: "en" | "ar") => {
      const root = createRoot(container)
      act(() => {
        root.render(<OfferDocument data={buildPriceOnly(language)} language={language} />)
      })
    }

    it("prints only customer, material, price per kg, terms and the tax note in English", () => {
      renderPriceOnly("en")
      const text = container.textContent ?? ""

      expect(text).toContain("Customer Information")
      expect(text).toContain("DALTORIM EG 26200 - D")
      expect(text).toContain("Unit Price")
      expect(text).toContain("10.00")
      expect(text).toContain("Terms and Conditions")
      expect(text).toContain("Force majeure")
      expect(text).toContain("These prices are tax excluded.")

      expect(container.querySelector(".doc-totals")).toBeNull()
      expect(container.querySelector(".doc-payment-terms")).toBeNull()
      expect(container.querySelector(".doc-banks")).toBeNull()
      expect(container.querySelector(".doc-schedule")).toBeNull()
      expect(container.querySelector(".doc-subrow")).toBeNull()
      expect(text).not.toContain("Payment Terms")
      expect(text).not.toContain("Bank Details")
      expect(text).not.toContain("Delivery Place")
      expect(text).not.toContain("Prices are valid for 7 days.")
      expect(text).not.toContain("Qty (kg)")
      expect(text).not.toContain("Amount")
    })

    it("mirrors the reduced document in Arabic", () => {
      renderPriceOnly("ar")
      const text = container.textContent ?? ""

      expect(text).toContain("السادة")
      expect(text).toContain("DALTORIM EG 26200 - D")
      expect(text).toContain("سعر الوحدة")
      expect(text).toContain("١٠٫٠٠")
      expect(text).toContain("الشروط والأحكام")
      expect(text).toContain("هذه الأسعار غير شاملة الضريبة.")

      expect(container.querySelector(".doc-totals")).toBeNull()
      expect(container.querySelector(".doc-payment-terms")).toBeNull()
      expect(container.querySelector(".doc-banks")).toBeNull()
      expect(container.querySelector(".doc-schedule")).toBeNull()
      expect(text).not.toContain("شروط الدفع")
      expect(text).not.toContain("بيانات البنك")
      expect(text).not.toContain("التوريد")
    })

    it("leaves the full document untouched", () => {
      render("en")

      expect(container.querySelector(".doc-totals")).not.toBeNull()
      expect(container.querySelector(".doc-payment-terms")).not.toBeNull()
      expect(container.querySelector(".doc-banks")).not.toBeNull()
      expect(container.querySelector(".doc-schedule")).not.toBeNull()
      expect(container.textContent).not.toContain("These prices are tax excluded.")
    })
  })

  describe("Arabic customer address", () => {
    const renderArabicWith = (addressAr?: string) => {
      const data = buildDocumentData(source as DocumentSource, {
        customer: { ...customer, addressAr },
        company,
        banks,
        packageTypes,
        language: "ar",
        paymentTermLabel: "شيك — ٣٠ يوم",
      })
      const root = createRoot(container)
      act(() => {
        root.render(<OfferDocument data={data} language="ar" />)
      })
    }

    it("falls back to the English address when no Arabic one was entered", () => {
      renderArabicWith()

      // Arabic rendering localises the digits but keeps the Latin address.
      expect(container.textContent).toContain("th of Ramadan City, Egypt")
    })

    it("prints the Arabic address when the customer has one", () => {
      renderArabicWith("مدينة العاشر من رمضان، مصر")

      expect(container.textContent).toContain("مدينة العاشر من رمضان، مصر")
      expect(container.textContent).not.toContain(customer.address)
    })
  })

  describe("delivery total, offer validity and attention", () => {
    const renderWith = (
      language: "en" | "ar",
      patch: Partial<DocumentSource>,
      contact: Partial<typeof customer> = {},
    ) => {
      const data = buildDocumentData(
        { ...(source as DocumentSource), ...patch },
        {
          customer: { ...customer, ...contact },
          company,
          banks,
          packageTypes,
          language,
          paymentTermLabel: language === "ar" ? "شيك — ٣٠ يوم" : "Cheque — 30 days",
        },
      )
      const root = createRoot(container)
      act(() => {
        root.render(<OfferDocument data={data} language={language} />)
      })
    }

    // The first label shares its cell with the form code badge.
    const labelOf = (cell: Element) =>
      cell.querySelector("div > span")?.textContent ?? cell.textContent
    const referenceLabels = () =>
      Array.from(container.querySelectorAll(".doc-reference th")).map(labelOf)
    const referenceValue = (label: string) =>
      Array.from(container.querySelectorAll(".doc-reference tr"))
        .find((row) => {
          const cell = row.querySelector("th")
          return cell ? labelOf(cell) === label : false
        })
        ?.querySelector("td")?.textContent

    it("labels the total of the delivery schedule in Arabic", () => {
      renderWith("ar", {})

      const total = container.querySelector(".doc-schedule .doc-total-row th")
      expect(total?.textContent).toBe("صافي الكمية")

      // The grand total keeps its own label.
      const grand = container.querySelector(".doc-totals .doc-grand th")
      expect(grand?.textContent).toBe("صافي القيمة")
    })

    it("keeps the total of the delivery schedule in English", () => {
      renderWith("en", {})
      const total = container.querySelector(".doc-schedule .doc-total-row th")
      expect(total?.textContent).toBe("Total")
    })

    it("prints the offer validity right under the date", () => {
      renderWith("en", { validityDays: 7 })

      expect(referenceLabels()).toEqual(["Reference", "Date", "Offer Validity"])
      expect(referenceValue("Offer Validity")).toBe("7 days — until 28/10/2026")
    })

    it("prints the offer validity in Arabic", () => {
      renderWith("ar", { validityDays: 7 })

      expect(referenceLabels()).toContain("صلاحية العرض")
      expect(referenceValue("صلاحية العرض")).toBe("٧ أيام — حتى ٢٠٢٦/١٠/٢٨")
    })

    it("writes a single day in the singular", () => {
      renderWith("en", { validityDays: 1 })
      expect(referenceValue("Offer Validity")).toBe("1 day — until 22/10/2026")
    })

    it("prints no validity row when the validity is empty", () => {
      renderWith("en", { validityDays: 0 })
      expect(referenceLabels()).not.toContain("Offer Validity")

      renderWith("en", {})
      expect(referenceLabels()).not.toContain("Offer Validity")
    })

    describe("payment terms, delivery and terms and conditions blocks", () => {
      const block = (selector: string) => container.querySelector(selector)

      it("prints the payment terms in a block of their own, not in the reference table", () => {
        renderWith("en", { paymentTermsText: "Bank transfer on receipt.\nSend us the receipt." })

        expect(referenceLabels()).not.toContain("Payment Terms")
        const terms = block(".doc-payment-terms")
        expect(terms?.querySelector("h3")?.textContent).toBe("Payment Terms")
        expect(terms?.textContent).toContain("Cheque — 30 days")
        expect(terms?.textContent).toContain("Bank transfer on receipt.")
        expect(terms?.textContent).toContain("Send us the receipt.")
      })

      it("prints the selected payment term alone when no conditions were typed", () => {
        renderWith("ar", {})

        const terms = block(".doc-payment-terms")
        expect(terms?.querySelector("h3")?.textContent).toBe("شروط الدفع")
        expect(terms?.querySelectorAll("p")).toHaveLength(1)
        expect(terms?.textContent).toContain("شيك — ٣٠ يوم")
      })

      it("prints the delivery schedule in batches mode and never the leftover text", () => {
        renderWith("en", { deliveryMode: "batches", deliveryText: "Should not print." })

        expect(block(".doc-schedule")).not.toBeNull()
        expect(container.textContent).not.toContain("Should not print.")
      })

      it("prints the delivery text instead of the schedule in text mode", () => {
        renderWith("en", { deliveryMode: "text", deliveryText: "Ready stock, on payment." })

        expect(block(".doc-schedule")).toBeNull()
        const delivery = Array.from(container.querySelectorAll(".doc-text")).find(
          (section) => section.querySelector("h3")?.textContent === "Delivery",
        )
        expect(delivery?.textContent).toContain("Ready stock, on payment.")
      })

      it("prints the delivery place in its own block and hides it when empty", () => {
        renderWith("en", { deliveryPlace: "Our factories in Badr City." })
        const place = Array.from(container.querySelectorAll(".doc-text")).find(
          (section) => section.querySelector("h3")?.textContent === "Delivery Place",
        )
        expect(place?.textContent).toContain("Our factories in Badr City.")

        renderWith("en", { deliveryPlace: "  " })
        expect(container.textContent).not.toContain("Delivery Place")
      })

      it("prints the fixed terms and conditions on every offer, in its language", () => {
        renderWith("en", {})
        const english = Array.from(container.querySelectorAll(".doc-terms li")).map(
          (item) => item.textContent,
        )
        expect(container.querySelector(".doc-terms h3")?.textContent).toBe("Terms and Conditions")
        expect(english).toHaveLength(1)
        expect(english[0]).toContain("Force majeure")

        renderWith("ar", {})
        const arabic = Array.from(container.querySelectorAll(".doc-terms li")).map(
          (item) => item.textContent,
        )
        expect(container.querySelector(".doc-terms h3")?.textContent).toBe("الشروط والأحكام")
        expect(arabic).toHaveLength(1)
        expect(arabic[0]).toContain("القوى القهرية")
      })
    })

    it("prints the attention name of the document language", () => {
      const patch = { attention: "Nader William", attentionAr: "نادر وليام" }

      renderWith("en", patch, { contactPersonAr: "اسم من قاعدة البيانات" })
      expect(container.textContent).toContain("Attention: Nader William")
      expect(container.textContent).not.toContain("نادر وليام")

      renderWith("ar", patch, { contactPersonAr: "اسم من قاعدة البيانات" })
      expect(container.textContent).toContain("عناية: نادر وليام")
    })

    it("lets a typed Arabic name replace the one of the customer record", () => {
      renderWith(
        "ar",
        { attentionAr: "اسم مكتوب يدويًا" },
        { contactPersonAr: "اسم من قاعدة البيانات" },
      )
      expect(container.textContent).toContain("اسم مكتوب يدويًا")
      expect(container.textContent).not.toContain("اسم من قاعدة البيانات")
    })

    it("falls back to the customer record when no Arabic name was typed", () => {
      renderWith(
        "ar",
        { attention: undefined as never, attentionAr: undefined },
        { contactPersonAr: "اسم من قاعدة البيانات" },
      )
      expect(container.textContent).toContain("اسم من قاعدة البيانات")
    })

    it("hides the Arabic attention line when it was cleared", () => {
      renderWith(
        "ar",
        { attentionAr: "" },
        { contactPersonAr: "اسم من قاعدة البيانات" },
      )
      expect(container.textContent).not.toContain("عناية")
    })
  })
})
