// @vitest-environment jsdom
import { act } from "react"
import { createRoot } from "react-dom/client"
import { afterEach, describe, expect, it, vi } from "vitest"

import { I18nProvider } from "../../../i18n/I18nProvider"
import type { Product } from "../types"
import MaterialDialog from "./MaterialDialog"

vi.mock("../../../components/ui/ToastProvider", () => ({
  useToast: () => ({ notify: () => {} }),
}))

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let container: HTMLDivElement | null = null
afterEach(() => {
  container?.remove()
  document.body.innerHTML = ""
  container = null
})

function mount(product?: Product) {
  container = document.createElement("div")
  document.body.append(container)
  act(() => {
    createRoot(container!).render(
      <I18nProvider>
        <MaterialDialog
          open
          product={product}
          packageTypes={[]}
          onClose={vi.fn()}
          onSaved={vi.fn()}
        />
      </I18nProvider>,
    )
  })
  return document.getElementById("material-category") as HTMLSelectElement
}

const product = { id: "p1", code: "M1", name: "Material", category: "Polyol" } as Product

describe("MaterialDialog category", () => {
  it("offers only Polyol and Iso for a new material", () => {
    const select = mount()

    expect(Array.from(select.options).map((option) => option.value)).toEqual([
      "",
      "Polyol",
      "Iso",
    ])
  })

  it("selects the category of the material being edited", () => {
    const select = mount({ ...product, category: "Iso" })

    expect(select.value).toBe("Iso")
  })

  it("keeps a legacy category selected so editing does not erase it", () => {
    const select = mount({ ...product, category: "Additive" })

    expect(select.value).toBe("Additive")
    expect(Array.from(select.options).map((option) => option.value)).toContain(
      "Additive",
    )
  })
})
