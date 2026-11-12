// @vitest-environment jsdom
import { act } from "react"
import { createRoot } from "react-dom/client"
import { afterEach, describe, expect, it, vi } from "vitest"

import { I18nProvider } from "../../../../i18n/I18nProvider"
import { calculateDraft } from "../../calculations"
import { createEmptyDraft } from "../../draft"
import type { OfferDraft } from "../../types"
import StepDelivery from "./StepDelivery"

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let container: HTMLDivElement | null = null
afterEach(() => {
  container?.remove()
  document.body.innerHTML = ""
  container = null
})

function mount(patch: Partial<OfferDraft>, onChange = vi.fn()) {
  container = document.createElement("div")
  document.body.append(container)
  const draft = createEmptyDraft(patch)
  act(() => {
    createRoot(container!).render(
      <I18nProvider>
        <StepDelivery
          draft={draft}
          calculations={calculateDraft(draft)}
          packageTypes={[]}
          onAddBatch={vi.fn()}
          onRemoveBatch={vi.fn()}
          onUpdateBatch={vi.fn()}
          onSetAllocation={vi.fn()}
          onChange={onChange}
        />
      </I18nProvider>,
    )
  })
  return onChange
}

const radios = () => Array.from(document.querySelectorAll('[role="radio"]'))

describe("StepDelivery", () => {
  it("shows the batch schedule and no text field in batches mode", () => {
    mount({ deliveryMode: "batches" })

    expect(radios().map((radio) => radio.getAttribute("aria-checked"))).toEqual(["true", "false"])
    expect(document.getElementById("offer-delivery-text")).toBeNull()
    expect(document.body.textContent).toContain("Add delivery batch")
  })

  it("shows the text field and no batch schedule in text mode", () => {
    mount({ deliveryMode: "text", deliveryText: "Ready stock." })

    expect(radios().map((radio) => radio.getAttribute("aria-checked"))).toEqual(["false", "true"])
    expect((document.getElementById("offer-delivery-text") as HTMLTextAreaElement).value).toBe(
      "Ready stock.",
    )
    expect(document.body.textContent).not.toContain("Add delivery batch")
  })

  it("asks the builder to switch mode when the other option is chosen", () => {
    const onChange = mount({ deliveryMode: "batches" })

    act(() => {
      ;(radios()[1] as HTMLButtonElement).click()
    })

    expect(onChange).toHaveBeenCalledWith({ deliveryMode: "text" })
  })

  it("always offers the delivery place, whatever the mode", () => {
    mount({ deliveryMode: "text", deliveryPlace: "Badr City" })
    expect((document.getElementById("offer-delivery-place") as HTMLTextAreaElement).value).toBe(
      "Badr City",
    )
  })

  it("limits the text blocks to what the API accepts", () => {
    mount({ deliveryMode: "text" })

    expect(document.getElementById("offer-delivery-text")?.getAttribute("maxlength")).toBe("1000")
    expect(document.getElementById("offer-delivery-place")?.getAttribute("maxlength")).toBe("300")
  })
})
