// @vitest-environment jsdom
import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { I18nProvider } from "../../../i18n/I18nProvider"
import DashboardPage from "./DashboardPage"
import type { OfferListItem } from "../types"

const month = new Date().toISOString().slice(0, 7)
const state = vi.hoisted(() => ({
  items: [] as unknown[],
  loading: false,
  error: undefined as Error | undefined,
  reload: vi.fn(),
  navigate: vi.fn(),
  admin: true,
}))

vi.mock("../hooks/useOffers", () => ({
  useOffers: () => ({
    data: state.items.length ? { items: state.items } : undefined,
    loading: state.loading,
    error: state.error,
    reload: state.reload,
  }),
}))

vi.mock("../../account/hooks/usePermissions", () => ({
  usePermissions: () => ({ can: () => state.admin }),
}))

vi.mock("../../account/SessionProvider", () => ({
  useSession: () => ({ user: { name: "Ada" } }),
}))

vi.mock("react-router-dom", () => ({
  useNavigate: () => state.navigate,
}))
;(globalThis as {
  IS_REACT_ACT_ENVIRONMENT?: boolean
}).IS_REACT_ACT_ENVIRONMENT = true

function offer(
  id: string,
  status: OfferListItem["status"],
  when: string,
): OfferListItem {
  return {
    id,
    reference: `Loc/${id}-2026/AA`,
    serialNumber: Number(id),
    version: 1,
    customerId: "c1",
    customerName: `Customer ${id}`,
    customerNameAr: null,
    issueDate: when,
    dueDate: when,
    currency: "USD",
    status,
    total: 1000,
    createdByName: null,
    createdAt: when,
    updatedAt: when,
  }
}

let container: HTMLDivElement
let root: Root | undefined

async function renderPage() {
  container = document.createElement("div")
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () =>
    root!.render(
      <I18nProvider>
        <DashboardPage />
      </I18nProvider>,
    ),
  )
}

async function click(element: Element) {
  await act(async () => {
    element.dispatchEvent(new MouseEvent("click", { bubbles: true }))
  })
}

function stat(label: string) {
  const term = Array.from(container.querySelectorAll("dt")).find(
    (item) => item.textContent === label,
  )!
  return term.nextElementSibling?.textContent
}

describe("dashboard", () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.items = []
    state.loading = false
    state.error = undefined
    state.admin = true
  })

  afterEach(async () => {
    await act(async () => root?.unmount())
    container.remove()
  })

  it("summarises the month without adding up different currencies", async () => {
    state.items = [
      offer("1", "issued", `${month}-05`),
      offer("2", "issued", `${month}-06`),
      offer("3", "accepted", `${month}-07`),
      offer("4", "rejected", "2026-01-07"),
    ]
    await renderPage()

    expect(stat("Documents this month")).toBe("3")
    expect(stat("Accepted this month")).toBe("1")
    expect(stat("Acceptance rate")).toBe("50%")
    expect(container.querySelectorAll("dt")).toHaveLength(3)
    expect(container.textContent).not.toContain("Total value")
  })

  it("does not surface an awaiting-reply action", async () => {
    state.items = [offer("1", "issued", `${month}-05`)]
    await renderPage()

    expect(container.textContent).not.toContain("Awaiting reply")
    expect(container.textContent).not.toContain("waiting for a reply")
    expect(container.textContent).not.toContain("Review")
  })

  it("opens a document from the recent list", async () => {
    state.items = [offer("7", "accepted", `${month}-05`)]
    await renderPage()

    expect(container.textContent).toContain("Document")
    expect(container.textContent).toContain("Type")
    expect(container.textContent).toContain("Status")
    expect(container.textContent).toContain("Total")
    expect(container.textContent).toContain("Date")

    const rows = container.querySelectorAll("li button")
    expect(rows).toHaveLength(1)
    expect(rows[0].textContent).toContain("Loc/7-2026/AA")
    expect(rows[0].textContent).toContain("Customer 7")
    expect(rows[0].textContent).toContain("Offer")
    expect(rows[0].getAttribute("aria-label")).toContain("Offer")
    expect(rows[0].getAttribute("aria-label")).toContain("Accepted")
    expect(rows[0].getAttribute("aria-label")).toContain("1,000.00 USD")
    expect(rows[0].getAttribute("aria-label")).toContain(
      `05/${month.slice(5)}/2026`,
    )

    const dateLabel = Array.from(rows[0].querySelectorAll("span")).find(
      (item) => item.textContent === "Date",
    )
    expect(dateLabel?.parentElement?.parentElement?.className).toContain(
      "col-span-2",
    )

    await click(rows[0])
    expect(state.navigate).toHaveBeenCalledWith("/offers/7")
  })

  it("mirrors the card layout while loading", async () => {
    state.loading = true
    await renderPage()

    const row = container.querySelector('[aria-busy="true"] li')
    const classes = Array.from(row?.querySelectorAll("span") ?? []).map(
      (item) => item.className,
    )
    expect(
      classes.some(
        (value) => value.includes("lg:hidden") && value.includes("rounded-full"),
      ),
    ).toBe(true)
    expect(classes.some((value) => value.includes("col-span-2"))).toBe(true)
  })

  it("shows an empty state and an error state with a way out", async () => {
    await renderPage()
    expect(container.textContent).toContain("No documents yet")
    expect(container.textContent).toContain("Create new offer")

    await act(async () => root!.unmount())
    state.error = new Error("offline")
    await renderPage()
    expect(container.querySelector('[role="alert"]')).not.toBeNull()
    expect(container.textContent).toContain("Could not load your documents.")

    await click(container.querySelector('[role="alert"] button')!)
    expect(state.reload).toHaveBeenCalledTimes(1)
  })

  it("hides the create action from users without offer permission", async () => {
    state.admin = false
    await renderPage()

    expect(container.textContent).not.toContain("Create new offer")
    expect(container.querySelectorAll("li button")).toHaveLength(0)
  })
})
