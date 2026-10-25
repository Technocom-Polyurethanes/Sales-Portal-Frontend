// @vitest-environment jsdom
import { act } from "react"
import { createRoot } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { PrintProvider, usePrintOffer } from "./PrintProvider"
import type { OfferDocumentData } from "./templates/types"

const data: OfferDocumentData = {
  companyName: "TECHNOCOM",
  companyNameAr: "شركة تكنوكوم",
  tagline: "For Commercial Agencies",
  taglineAr: "للتوكيلات تجارية",
  formCode: "TF-06-01",
  customerName: "Cairo Foam Industries",
  customerAddress: "Cairo",
  attention: "Mr. Ahmed",
  reference: "3089/OCT./YL/AA",
  issueDate: "2026-10-21",
  dueDate: "2026-11-20",
  paymentTerm: "Cheque — 30 days",
  currency: "EGP",
  lines: [],
  subtotal: 0,
  orderDiscount: 0,
  orderDiscountPercent: 0,
  taxPercent: 14,
  taxAmount: 0,
  otherTaxEnabled: false,
  otherTaxPercent: 0,
  otherTaxAmount: 0,
  total: 0,
  delivery: [],
  banks: [],
  notes: "",

}

function PrintButton() {
  const { print } = usePrintOffer()
  return (
    <button type="button" onClick={() => print({ data, language: "en" })}>
      print
    </button>
  )
}

describe("print provider", () => {
  let container: HTMLDivElement

  beforeEach(() => {
    container = document.createElement("div")
    document.body.appendChild(container)
    vi.stubGlobal("print", vi.fn())
  })

  afterEach(() => {
    container.remove()
    document.getElementById("print-root")?.remove()
    vi.unstubAllGlobals()
  })

  it("renders the document outside of the application", async () => {
    const root = createRoot(container)
    await act(async () => {
      root.render(
        <PrintProvider>
          <PrintButton />
        </PrintProvider>,
      )
    })

    const printRoot = document.getElementById("print-root")
    expect(printRoot).not.toBeNull()
    expect(printRoot?.parentElement).toBe(document.body)
    expect(container.querySelector("#print-root")).toBeNull()

    const button = container.querySelector("button")
    await act(async () => {
      button?.click()
    })

    expect(printRoot?.querySelector(".offer-document")).not.toBeNull()
    expect(printRoot?.textContent).toContain("3089/OCT./YL/AA")
  })

  it("opens the print dialog once the document is ready", async () => {
    const root = createRoot(container)
    await act(async () => {
      root.render(
        <PrintProvider>
          <PrintButton />
        </PrintProvider>,
      )
    })

    const button = container.querySelector("button")
    await act(async () => {
      button?.click()
    })

    expect(window.print).toHaveBeenCalledTimes(1)
  })
})
