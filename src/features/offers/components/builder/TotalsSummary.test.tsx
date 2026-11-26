// @vitest-environment jsdom
import { act } from "react"
import { createRoot } from "react-dom/client"
import { afterEach, describe, expect, it } from "vitest"

import { I18nProvider } from "../../../../i18n/I18nProvider"
import type { DocumentLanguage } from "../../../../pdf/PdfLanguageProvider"
import TotalsSummary from "./TotalsSummary"

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let container: HTMLDivElement | null = null

afterEach(() => {
  container?.remove()
  document.body.innerHTML = ""
  container = null
})

function mount(total: number, documentLanguage: DocumentLanguage) {
  container = document.createElement("div")
  document.body.append(container)
  act(() => {
    createRoot(container!).render(
      <I18nProvider>
        <TotalsSummary
          totals={{ subtotal: 100, taxPercent: 14, taxAmount: 14, total }}
          otherTaxEnabled={false}
          currency="EGP"
          documentLanguage={documentLanguage}
        />
      </I18nProvider>,
    )
  })
}

const valueOf = (label: string) =>
  Array.from(container!.querySelectorAll("dt")).find(
    (item) => item.textContent === label,
  )?.nextElementSibling?.textContent

describe("TotalsSummary amount in words", () => {
  it("derives the English wording from the final total", () => {
    mount(114, "en")

    expect(valueOf("Amount in Words")).toBe("One Hundred Fourteen Egyptian Pounds Only")
  })

  it("uses the document language for the Arabic wording", () => {
    mount(114, "ar")

    expect(valueOf("Amount in Words")).toBe(
      "فقط مائة وأربعة عشر جنيهاً مصرياً لا غير",
    )
  })

  it("hides the row when the total is zero", () => {
    mount(0, "en")

    expect(container!.textContent).not.toContain("Amount in Words")
  })
})
