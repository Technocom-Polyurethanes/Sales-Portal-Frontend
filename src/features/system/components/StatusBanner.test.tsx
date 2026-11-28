// @vitest-environment jsdom
import { act } from "react"
import { createRoot } from "react-dom/client"
import { describe, expect, it } from "vitest"

import { I18nProvider } from "../../../i18n/I18nProvider"
import type { SystemStatus } from "../types"

import { statusInsight } from "./insight"
import StatusBanner from "./StatusBanner"
;(globalThis as {
  IS_REACT_ACT_ENVIRONMENT?: boolean
}).IS_REACT_ACT_ENVIRONMENT = true

const base: SystemStatus = {
  status: "Healthy",
  checkedAt: "2026-11-28T10:00:00.000Z",
  version: "1.11.0",
  environment: "Production",
  uptimeSeconds: 1_416_000,
  database: { status: "Up", latencyMs: 24 },
  live: {
    state: "connected",
    disabled: false,
    pollingFallback: false,
    changes: "connected",
    notifications: "connected",
  },
}

function render(status: SystemStatus) {
  const container = document.createElement("div")
  document.body.appendChild(container)
  const root = createRoot(container)
  act(() => {
    root.render(
      <I18nProvider>
        <StatusBanner
          status={status}
          insight={statusInsight(status)}
          locale="en-US"
          staleSince={null}
        />
      </I18nProvider>,
    )
  })
  return { container, root }
}

describe("status banner messages", () => {
  const scenarios: Array<[string, SystemStatus, string, string]> = [
    ["healthy", base, "All systems operational. Checked", "Nothing to do."],
    [
      "listener disconnected",
      {
        ...base,
        status: "Degraded",
        live: { ...base.live, changes: "disconnected", pollingFallback: true },
      },
      "Live updates are using the slower fallback",
      "Check the database connection",
    ],
    [
      "database down",
      {
        ...base,
        status: "Unhealthy",
        database: { ...base.database, status: "Down", latencyMs: 0 },
      },
      "The database is not reachable",
      "Restore database access, then retry.",
    ],
    [
      "pending migrations",
      { ...base, database: { ...base.database, pendingMigrations: 2 } },
      "The database has 2 pending migrations.",
      "Apply the pending migrations, then refresh.",
    ],
    [
      "dropped notifications",
      { ...base, realtime: { dropped: 3 } },
      "Notifications were dropped because the server was overloaded.",
      "Check the notification queue, then refresh.",
    ],
  ]

  it.each(scenarios)(
    "explains %s in plain language",
    (_name, status, reason, next) => {
      const { container, root } = render(status)
      expect(container.textContent).toContain(reason)
      expect(container.textContent).toContain(next)
      act(() => root.unmount())
      container.remove()
    },
  )

  it("keeps refresh controls out of the banner", () => {
    const { container, root } = render(base)

    expect(container.querySelector("button")).toBeNull()
    expect(container.textContent).not.toContain("Auto-refresh")

    act(() => root.unmount())
    container.remove()
  })
})
