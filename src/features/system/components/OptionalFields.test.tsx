// @vitest-environment jsdom
import { act } from "react"
import { createRoot } from "react-dom/client"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it } from "vitest"

import { ToastProvider } from "../../../components/ui/ToastProvider"
import { I18nProvider } from "../../../i18n/I18nProvider"
import type { SystemStatus } from "../types"

import ApplicationCard from "./ApplicationCard"
import AuditCard from "./AuditCard"
import DatabaseCard from "./DatabaseCard"
import DataCard from "./DataCard"
import JobsCard from "./JobsCard"
import LiveCard from "./LiveCard"
import RealtimeCard from "./RealtimeCard"
import SecurityCard from "./SecurityCard"
;(globalThis as {
  IS_REACT_ACT_ENVIRONMENT?: boolean
}).IS_REACT_ACT_ENVIRONMENT = true

if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList
}

const minimal: SystemStatus = {
  status: "Healthy",
  checkedAt: "2026-11-28T10:00:00.000Z",
  version: "1.11.0",
  environment: "Staging",
  uptimeSeconds: 0,
  database: { status: "Up", latencyMs: 0 },
  live: {
    state: "disabled",
    disabled: true,
    pollingFallback: false,
    changes: "disabled",
    notifications: "disabled",
  },
}

describe("optional status fields", () => {
  it("renders neutral dashes instead of crashing", () => {
    const container = document.createElement("div")
    document.body.appendChild(container)
    const root = createRoot(container)

    act(() => {
      root.render(
        <I18nProvider>
          <ToastProvider>
            <MemoryRouter>
              <DatabaseCard
                database={minimal.database}
                samples={[]}
                locale="en-US"
              />
              <LiveCard
                live={minimal.live}
                now={Date.parse(minimal.checkedAt)}
                locale="en-US"
              />
              <RealtimeCard locale="en-US" />
              <AuditCard now={Date.parse(minimal.checkedAt)} locale="en-US" />
              <JobsCard now={Date.parse(minimal.checkedAt)} locale="en-US" />
              <SecurityCard
                now={Date.parse(minimal.checkedAt)}
                locale="en-US"
              />
              <ApplicationCard status={minimal} locale="en-US" />
              <DataCard locale="en-US" />
            </MemoryRouter>
          </ToastProvider>
        </I18nProvider>,
      )
    })

    expect(container.textContent).toContain("—")
    expect(container.textContent).toContain("Not needed")
    expect(container.textContent).not.toContain("NaN")
    expect(container.textContent).not.toContain("undefined")

    act(() => root.unmount())
    container.remove()
  })
})
