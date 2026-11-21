// @vitest-environment jsdom
import { act } from "react"
import { createRoot } from "react-dom/client"
import { afterEach, describe, expect, it, vi } from "vitest"

import { I18nProvider } from "../../../../i18n/I18nProvider"
import { LANGUAGE_STORAGE_KEY } from "../../../../i18n/direction"
import type { PackageType } from "../../../settings/types"
import PackagingRowEditor from "./PackagingRowEditor"

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const types: PackageType[] = [
  { id: "drum", name: "Drum", nameAr: "برميل", defaultWeightKg: 210, sizesKg: [210] },
  { id: "pail", name: "Pail", nameAr: "علبة", defaultWeightKg: 25, sizesKg: [25] },
]

let container: HTMLDivElement | null = null
afterEach(() => {
  container?.remove()
  document.body.innerHTML = ""
  localStorage.removeItem(LANGUAGE_STORAGE_KEY)
  container = null
})

function options(language: "en" | "ar") {
  localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
  container = document.createElement("div")
  document.body.append(container)
  act(() => {
    createRoot(container!).render(
      <I18nProvider>
        <PackagingRowEditor
          row={{ id: "r1", packageTypeId: "drum", packageTypeName: "Drum", weightPerPackageKg: 210, packages: 1 }}
          packageTypes={types}
          onChange={vi.fn()}
          onRemove={vi.fn()}
        />
      </I18nProvider>,
    )
  })
  return Array.from(document.querySelectorAll("option")).map((option) => option.textContent)
}

describe("PackagingRowEditor", () => {
  it("lists the package types in Arabic in the Arabic interface", () => {
    expect(options("ar")).toEqual(["برميل", "علبة"])
  })

  it("lists them in English in the English interface", () => {
    expect(options("en")).toEqual(["Drum", "Pail"])
  })
})
