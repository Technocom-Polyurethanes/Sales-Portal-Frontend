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
  document.body.innerHTML = ""
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

function buttonWith(root: ParentNode, text: string) {
  return [...root.querySelectorAll("button")].find((button) =>
    button.textContent?.includes(text),
  ) as HTMLButtonElement
}

describe("BankAccountsStep", () => {
  it("lists only the selected accounts and removes one", () => {
    const onChange = vi.fn()
    const root = mount(["b1", "b2"], onChange)
    expect(root.querySelectorAll("li")).toHaveLength(2)
    expect(root.querySelector("input[type=checkbox]")).toBeNull()

    act(() => (root.querySelector("li button") as HTMLButtonElement).click())
    expect(onChange).toHaveBeenCalledWith(["b2"])
  })

  it("searches the picker and adds only the matches", () => {
    const onChange = vi.fn()
    const root = mount(["b29"], onChange)
    act(() => buttonWith(root, "Add account").click())

    const dialog = document.body.querySelector("[role=dialog]")!
    expect(dialog.querySelectorAll("ul button")).toHaveLength(30)
    type(dialog.querySelector("input")!, "alpha")
    expect(dialog.querySelectorAll("ul button")).toHaveLength(15)

    act(() => buttonWith(dialog, "Select shown (15)").click())
    const ids = onChange.mock.calls[0][0] as string[]
    expect(ids).toHaveLength(16)
    expect(ids).toContain("b29")
  })

  it("warns when nothing is selected", () => {
    const root = mount([], vi.fn())
    expect(root.querySelector("[role=alert]")).not.toBeNull()
  })
})
