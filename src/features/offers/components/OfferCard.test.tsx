// @vitest-environment jsdom
import { act } from "react"
import { createRoot } from "react-dom/client"
import { afterEach, describe, expect, it, vi } from "vitest"

import { I18nProvider } from "../../../i18n/I18nProvider"
import type { OfferListItem } from "../types"
import OfferCard from "./OfferCard"

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let container: HTMLDivElement | null = null
afterEach(() => {
  container?.remove()
  document.body.innerHTML = ""
  container = null
})

function render(
  offer: OfferListItem,
  handlers: { onOpen?: () => void; onDelete?: () => void } = {},
) {
  container = document.createElement("div")
  document.body.append(container)
  act(() => {
    createRoot(container!).render(
      <I18nProvider>
        <OfferCard
          offer={offer}
          onOpen={handlers.onOpen ?? vi.fn()}
          onDelete={handlers.onDelete}
        />
      </I18nProvider>,
    )
  })
}

const currentVersionDate = new Date(2026, 10, 18, 12, 21).toISOString()
const firstVersionDate = new Date(2026, 10, 17, 12, 5).toISOString()

const base = {
  id: "v2",
  reference: "Loc/0002-2026/YL/AA",
  version: 2,
  customerName: "Customer",
  currency: "EGP",
  total: 100,
  status: "draft",
  createdAt: currentVersionDate,
  updatedAt: currentVersionDate,
} as OfferListItem

describe("OfferCard", () => {
  it("shows the first version's creation date, not the current version's", () => {
    render({ ...base, rootCreatedAt: firstVersionDate })

    const values = Array.from(container!.querySelectorAll("dd")).map(
      (dd) => dd.textContent,
    )
    expect(values[2]).toBe("17/11/2026 12:05")
  })

  it("falls back to the offer's own creation date", () => {
    render(base)

    const values = Array.from(container!.querySelectorAll("dd")).map(
      (dd) => dd.textContent,
    )
    expect(values[2]).toBe("18/11/2026 12:21")
  })

  it("puts the delete button in the footer without opening the offer", () => {
    const onOpen = vi.fn()
    const onDelete = vi.fn()
    render(base, { onOpen, onDelete })

    const button = container!.querySelector<HTMLButtonElement>(
      'footer button[data-testid="delete-button"]',
    )
    expect(button).not.toBeNull()

    act(() => button!.click())

    expect(onDelete).toHaveBeenCalledOnce()
    expect(onOpen).not.toHaveBeenCalled()
    expect(container!.textContent).not.toContain("Open")
  })
})
