// @vitest-environment jsdom
import { act } from "react"
import { createRoot } from "react-dom/client"
import { afterEach, describe, expect, it, vi } from "vitest"

import { I18nProvider } from "../../../../i18n/I18nProvider"
import type { Customer } from "../../../customers/types"
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

function mount(
  patch: Partial<OfferDraft>,
  onChange = vi.fn(),
  customer?: Customer,
) {
  container = document.createElement("div")
  document.body.append(container)
  const draft = createEmptyDraft(patch)
  act(() => {
    createRoot(container!).render(
      <I18nProvider>
        <StepDelivery
          customer={customer}
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

  it("always offers the delivery place dropdown and text box, whatever the mode", () => {
    mount({ deliveryMode: "text" })
    expect(document.getElementById("offer-delivery-place-preset")).not.toBeNull()
    expect(document.getElementById("offer-delivery-place")).not.toBeNull()
  })

  it("offers our factories and the selected customer's city factories", () => {
    mount({ deliveryMode: "batches" }, vi.fn(), {
      city: "6th of October",
      cityAr: "٦ أكتوبر",
    } as Customer)

    const options = Array.from(
      (document.getElementById("offer-delivery-place-preset") as HTMLSelectElement).options,
    ).map((option) => option.value)
    expect(options).toEqual([
      "",
      "مصانعنا بمدينة بدر",
      "مصانعكم بمدينة ٦ أكتوبر",
    ])
  })

  it("keeps a legacy delivery place in the editable text box", () => {
    mount({ deliveryMode: "text", deliveryPlace: "Badr City" })
    const textarea = document.getElementById("offer-delivery-place") as HTMLTextAreaElement
    expect(textarea.value).toBe("Badr City")
    const select = document.getElementById("offer-delivery-place-preset") as HTMLSelectElement
    expect(select.value).toBe("")
  })

  it("reports the chosen delivery place", () => {
    const onChange = mount({ deliveryMode: "batches" }, vi.fn(), {
      city: "Cairo",
      cityAr: "القاهرة",
    } as Customer)
    const select = document.getElementById("offer-delivery-place-preset") as HTMLSelectElement

    act(() => {
      select.value = "مصانعكم بمدينة القاهرة"
      select.dispatchEvent(new Event("change", { bubbles: true }))
    })

    expect(onChange).toHaveBeenCalledWith({
      deliveryPlace: "مصانعكم بمدينة القاهرة",
    })
  })

  it("reports edits to the delivery place text box", () => {
    const onChange = mount({ deliveryMode: "batches" })
    const textarea = document.getElementById("offer-delivery-place") as HTMLTextAreaElement

    act(() => {
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!.call(
        textarea,
        "Edited place",
      )
      textarea.dispatchEvent(new Event("input", { bubbles: true }))
    })

    expect(onChange).toHaveBeenCalledWith({ deliveryPlace: "Edited place" })
  })

  it("limits the free text to what the API accepts", () => {
    mount({ deliveryMode: "text" })

    expect(document.getElementById("offer-delivery-text")?.getAttribute("maxlength")).toBe("1000")
    expect(document.getElementById("offer-delivery-place")?.getAttribute("maxlength")).toBe("300")
  })

  it("locks the text option once batches exist, and the schedule option once text exists", () => {
    mount({
      deliveryMode: "batches",
      delivery: [{ id: "b1", date: "2026-12-01", allocations: [] }] as never,
    })
    expect((radios()[1] as HTMLButtonElement).disabled).toBe(true)
    expect((radios()[0] as HTMLButtonElement).disabled).toBe(false)
  })

  it("locks the schedule option while custom text is written", () => {
    mount({ deliveryMode: "text", deliveryText: "Ready stock." })
    expect((radios()[0] as HTMLButtonElement).disabled).toBe(true)
    expect((radios()[1] as HTMLButtonElement).disabled).toBe(false)
  })

  it("keeps both options open while nothing is entered", () => {
    mount({ deliveryMode: "batches" })
    expect(radios().every((radio) => !(radio as HTMLButtonElement).disabled)).toBe(true)
  })
})
