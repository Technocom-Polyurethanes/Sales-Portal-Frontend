// @vitest-environment jsdom
import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import AccountPage from "./AccountPage"

const state = vi.hoisted(() => ({
  role: "Admin" as "Admin" | "Sales",
  status: "live" as string,
  listener: undefined as ((status: string) => void) | undefined,
  labels: {
    "account.liveStatus.connected": "connected",
    "account.liveStatus.reconnecting": "reconnecting",
    "account.liveStatus.unavailable": "unavailable",
  } as Record<string, string>,
}))

vi.mock("../hooks/useSession", () => ({
  useSession: () => ({
    user: { role: state.role },
    authenticated: true,
    loading: false,
    signIn: vi.fn(),
    signOut: vi.fn(),
  }),
}))

vi.mock("../../../lib/live", () => ({
  live: {
    getStatus: () => state.status,
    onStatus: (listener: (status: string) => void) => {
      state.listener = listener
      return () => {
        state.listener = undefined
      }
    },
  },
}))

vi.mock("../../../i18n/I18nProvider", () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string | number>) =>
      key === "account.liveUpdates"
        ? `Live updates: ${params?.status ?? ""}`
        : (state.labels[key] ?? key),
  }),
}))
;(globalThis as {
  IS_REACT_ACT_ENVIRONMENT?: boolean
}).IS_REACT_ACT_ENVIRONMENT = true

let container: HTMLDivElement
let root: Root | undefined

async function renderPage() {
  container = document.createElement("div")
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () => {
    root!.render(<AccountPage />)
  })
}

describe("AccountPage live status", () => {
  beforeEach(() => {
    state.role = "Admin"
    state.status = "live"
    state.listener = undefined
  })

  afterEach(async () => {
    await act(async () => root?.unmount())
    container.remove()
  })

  it("admin_sees_live_status_and_updates", async () => {
    await renderPage()
    expect(container.textContent).toContain("Live updates: connected")

    await act(async () => state.listener!("offline"))
    expect(container.textContent).toContain("Live updates: reconnecting")

    await act(async () => state.listener!("unsupported"))
    expect(container.textContent).toContain("Live updates: unavailable")
  })

  it("non_admin_does_not_see_live_status", async () => {
    state.role = "Sales"
    await renderPage()

    expect(container.textContent).not.toContain("Live updates")
    expect(state.listener).toBeUndefined()
  })
})
