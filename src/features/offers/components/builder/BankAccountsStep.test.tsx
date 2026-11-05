// @vitest-environment jsdom
import { act } from "react"
import { createRoot } from "react-dom/client"
import { afterEach, describe, expect, it, vi } from "vitest"

import { I18nProvider } from "../../../../i18n/I18nProvider"
import type { BankAccount } from "../../../settings/types"
import BankAccountsStep from "./BankAccountsStep"

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const banks: BankAccount[] = Array.from({ length: 30 }, (_, index) => ({
  id: `b${index}`,
  bank: index < 15 ? "Alpha Bank" : "Beta Bank",
  branch: `Branch ${index}`,
  accountNumber: `ACC-${index}`,
  swift: "",
  iban: "",
  currency: index % 2 ? "USD" : "EGP",
  isActive: true,
  sortOrder: index,
}))

let container: HTMLDivElement | null = null
afterEach(() => {
  container?.remove()
  container = null
})

function mount(selected: string[], onChange: (ids: string[]) => void) {
  container = document.createElement("div")
  document.body.append(container)
  act(() => {
    createRoot(container!).render(
      <I18nProvider>
        <BankAccountsStep banks={banks} selected={selected} onChange={onChange} />
      </I18nProvider>,
    )
  })
  return container
}

function type(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!
  act(() => {
    setter.call(input, value)
    input.dispatchEvent(new Event("input", { bubbles: true }))
  })
}

describe("BankAccountsStep", () => {
  it("searches a long list and selects only the matches", () => {
    const onChange = vi.fn()
    const root = mount(["b29"], onChange)
    expect(root.querySelectorAll("input[type=checkbox]")).toHaveLength(30)

    type(root.querySelector("input[type=search]")!, "alpha")
    expect(root.querySelectorAll("input[type=checkbox]")).toHaveLength(15)

    const select = [...root.querySelectorAll("button")].find((button) =>
      button.textContent?.includes("15"),
    )!
    act(() => select.click())
    const ids = onChange.mock.calls[0][0] as string[]
    expect(ids).toHaveLength(16)
    expect(ids).toContain("b29")
  })

  it("shows the empty-selection warning and a no-match message", () => {
    const root = mount([], vi.fn())
    expect(root.querySelector("[role=alert]")).not.toBeNull()
    type(root.querySelector("input[type=search]")!, "zzz")
    expect(root.querySelectorAll("input[type=checkbox]")).toHaveLength(0)
  })
})
