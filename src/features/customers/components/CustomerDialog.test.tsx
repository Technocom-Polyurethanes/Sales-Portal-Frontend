// @vitest-environment jsdom
import { act } from "react"
import { createRoot } from "react-dom/client"
import { afterEach, describe, expect, it, vi } from "vitest"

import { I18nProvider } from "../../../i18n/I18nProvider"
import type { Customer } from "../types"
import CustomerDialog from "./CustomerDialog"

vi.mock("../../../components/ui/ToastProvider", () => ({
  useToast: () => ({ notify: () => {} }),
}))

const api = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn() }))
vi.mock("../api", () => ({ customersApi: api }))

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let container: HTMLDivElement | null = null
afterEach(() => {
  container?.remove()
  document.body.innerHTML = ""
  container = null
  vi.clearAllMocks()
})

const customer = {
  id: "c1",
  code: "C-1",
  customerCode: "C-1",
  name: "Acme",
  contactPerson: "",
  email: "",
  phone: "",
  city: "",
  address: "Cairo, Egypt",
  addressAr: "القاهرة، مصر",
} as Customer

function mount(record?: Customer) {
  container = document.createElement("div")
  document.body.append(container)
  act(() => {
    createRoot(container!).render(
      <I18nProvider>
        <CustomerDialog
          open
          customer={record}
          onClose={vi.fn()}
          onSaved={vi.fn()}
        />
      </I18nProvider>,
    )
  })
}

async function save() {
  const button = Array.from(document.querySelectorAll("button")).find(
    (element) => element.textContent === "Save",
  )
  await act(async () => {
    button!.click()
  })
}

describe("CustomerDialog addresses", () => {
  it("marks the address required and offers an Arabic one", () => {
    mount()

    expect(document.getElementById("customer-address")?.getAttribute("aria-required")).toBe("true")
    expect(document.getElementById("customer-address-ar")).not.toBeNull()
  })

  it("loads and sends both addresses when editing", async () => {
    api.update.mockResolvedValue(customer)
    mount(customer)

    expect((document.getElementById("customer-address-ar") as HTMLInputElement).value).toBe(
      "القاهرة، مصر",
    )

    await save()

    expect(api.update).toHaveBeenCalledWith(
      "c1",
      expect.objectContaining({
        address: "Cairo, Egypt",
        addressAr: "القاهرة، مصر",
      }),
    )
  })

  it("stops an empty address before the API call", async () => {
    mount({ ...customer, address: "" })

    await save()

    expect(api.update).not.toHaveBeenCalled()
    expect(document.body.textContent).toContain(
      "Customer code, name and address are required.",
    )
  })
})
