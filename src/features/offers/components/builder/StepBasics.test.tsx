// @vitest-environment jsdom
import { act } from "react"
import { createRoot } from "react-dom/client"
import { afterEach, describe, expect, it, vi } from "vitest"

import { I18nProvider } from "../../../../i18n/I18nProvider"
import { createEmptyDraft } from "../../draft"
import StepBasics from "./StepBasics"

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let container: HTMLDivElement | null = null
afterEach(() => {
  container?.remove()
  document.body.innerHTML = ""
  container = null
})

function mount(showSequence: boolean) {
  container = document.createElement("div")
  document.body.append(container)
  const draft = {
    ...createEmptyDraft(),
    sequence: 3090,
    reference: "Loc/3090/YL/JD",
  }
  act(() => {
    createRoot(container!).render(
      <I18nProvider>
        <StepBasics
          draft={draft}
          customers={[]}
          dueDate=""
          onChange={vi.fn()}
          nextSequence={3090}
          showSequence={showSequence}
        />
      </I18nProvider>,
    )
  })
}

describe("StepBasics reference", () => {
  it("shows the sequence input for the first offer", () => {
    mount(true)
    expect(document.getElementById("offer-sequence")).not.toBeNull()
  })

  it("hides the sequence input once an offer exists", () => {
    mount(false)
    expect(document.getElementById("offer-sequence")).toBeNull()
  })

  it("has no reference field at all, the reference is automatic", () => {
    mount(false)
    expect(document.getElementById("offer-reference")).toBeNull()
    expect(document.querySelector('[data-testid="offer-reference"]')).toBeNull()
    expect(document.body.textContent).not.toContain("Loc/3090/YL/JD")
  })

  it("puts the customer and the offer type side by side in one two-column row", () => {
    mount(false)
    const customer = document.getElementById("offer-customer")!
    const offerType = document.getElementById("offer-type")!
    const row = customer.closest(".grid")!
    expect(row.className).toContain("sm:grid-cols-2")
    expect(row.contains(offerType)).toBe(true)
    // Neither one spans the full width any more.
    expect(customer.closest(".sm\\:col-span-2")).toBeNull()
    expect(offerType.closest(".sm\\:col-span-2")).toBeNull()
  })

  it("shows the message of an invalid field and links it to the control", () => {
    container = document.createElement("div")
    document.body.append(container)
    act(() => {
      createRoot(container!).render(
        <I18nProvider>
          <StepBasics
            draft={createEmptyDraft()}
            customers={[]}
            dueDate=""
            onChange={vi.fn()}
            errors={{ "offer-customer": "Choose a customer to continue." }}
          />
        </I18nProvider>,
      )
    })
    const message = document.getElementById("offer-customer-error")
    expect(message?.textContent).toBe("Choose a customer to continue.")
    expect(
      document.getElementById("offer-customer")?.getAttribute("aria-describedby"),
    ).toBe("offer-customer-error")
    expect(
      document.getElementById("offer-customer")?.getAttribute("data-invalid"),
    ).toBe("true")
  })
})
