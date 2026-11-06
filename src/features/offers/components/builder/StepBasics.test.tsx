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

  it("never offers a reference input and always shows the generated reference", () => {
    mount(false)
    expect(document.getElementById("offer-reference")).toBeNull()
    expect(
      document.querySelector('[data-testid="offer-reference"]')?.textContent,
    ).toBe("Loc/3090/YL/JD")
  })
})
