// @vitest-environment jsdom
import { act } from "react"
import { createRoot } from "react-dom/client"
import { describe, expect, it } from "vitest"

import { I18nProvider } from "../../../i18n/I18nProvider"

import JobsCard from "./JobsCard"
;(globalThis as {
  IS_REACT_ACT_ENVIRONMENT?: boolean
}).IS_REACT_ACT_ENVIRONMENT = true

describe("JobsCard", () => {
  it("uses the blue badge for a running job", () => {
    const container = document.createElement("div")
    document.body.appendChild(container)
    const root = createRoot(container)

    act(() => {
      root.render(
        <I18nProvider>
          <JobsCard
            jobs={[{ name: "notification-publisher", result: "running" }]}
            now={Date.parse("2026-11-28T10:00:00.000Z")}
            locale="en-US"
          />
        </I18nProvider>,
      )
    })

    const badge = Array.from(container.querySelectorAll("span")).find(
      (span) => span.textContent === "running",
    )
    expect(badge?.className).toContain("bg-primary-soft")

    act(() => root.unmount())
    container.remove()
  })
})
