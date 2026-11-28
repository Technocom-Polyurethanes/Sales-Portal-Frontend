// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { createAuditHarness, isoDay } from "./auditTestSetup"

describe("Activity log insights and interactions", () => {
  const h = createAuditHarness()

  beforeEach(() => h.reset())
  afterEach(async () => h.dispose())

  it("shows summary tiles that filter failures and sign-ins", async () => {
    await h.mount()
    await h.waitUntil(
      () =>
        document
          .querySelector('button[aria-label^="Failed:"]')
          ?.textContent?.includes("1") === true,
    )

    await h.click(
      document.querySelector(
        'button[aria-label^="Failed:"]',
      ) as HTMLButtonElement,
    )
    await h.waitUntil(() => h.query().get("outcome") === "failure")
    await h.waitUntil(() => !h.tableText().includes("Amgad Anwar"))
    expect(h.tableText()).toContain("Sign-in failed")

    await h.click(
      document.querySelector(
        'button[aria-label^="Sign-ins:"]',
      ) as HTMLButtonElement,
    )
    await h.waitUntil(() => h.query().get("category") === "auth")
    expect(document.body.textContent).toContain("Sign-ins")
  })

  it("resolves date presets into concrete from/to dates", async () => {
    await h.mount()
    await h.click(h.findButton(h.byText("7 days")))
    await h.waitUntil(() => h.query().get("preset") === "seven")

    const from = new Date()
    from.setDate(from.getDate() - 6)
    expect(h.query().get("from")).toBe(isoDay(from))
    expect(h.query().get("to")).toBe(isoDay(new Date()))

    await h.click(h.findButton(h.byText("Custom")))
    await h.waitUntil(() => h.query().get("preset") === "custom")
    expect(
      document.querySelector('input[aria-label="From date"]'),
    ).not.toBeNull()
    expect(document.querySelector('input[aria-label="To date"]')).not.toBeNull()
  })

  it("groups rows under sticky day headers without leaking the request path", async () => {
    await h.mount("/audit-logs?preset=seven")
    await h.waitUntil(() => h.tableText().includes("Changed offer status"))
    expect(
      document.querySelectorAll('th[scope="colgroup"]').length,
    ).toBeGreaterThan(1)
    expect(h.tableText()).toContain("Today")

    const cellText = [...document.querySelectorAll("tbody td")]
      .filter((cell) => cell.querySelector('[role="region"]') === null)
      .map((cell) => cell.textContent)
      .join("")
    expect(cellText).not.toContain("/api/offers/offer-42/status")
    expect(
      document.getElementById("audit-details-log-6")?.textContent,
    ).toContain("/api/offers/offer-42/status")
  })

  it("expands from a real button with details and copy actions", async () => {
    await h.mount()
    await h.waitUntil(() => h.tableText().includes("Changed offer status"))
    const toggle = h.findButton(
      (button) =>
        button
          .getAttribute("aria-label")
          ?.startsWith("Changed offer status to issued") === true,
    )
    expect(toggle.tagName).toBe("BUTTON")
    expect(toggle.getAttribute("aria-expanded")).toBe("false")
    expect(toggle.getAttribute("aria-controls")).toBe("audit-details-log-6")

    await h.click(toggle)
    await h.waitUntil(
      () =>
        document
          .getElementById("audit-details-log-6")
          ?.className.includes("activity-expand-open") === true,
    )
    expect(toggle.getAttribute("aria-expanded")).toBe("true")
    const details = document.getElementById("audit-details-log-6")
    expect(details?.textContent).toContain("Chrome on Windows")
    expect(details?.textContent).toContain("42 ms")
    expect(details?.textContent).toContain("draft")

    await h.click(
      h.findButton(
        (button) => button.getAttribute("aria-label") === "Copy IP address",
      ),
    )
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("127.0.0.1")

    await h.click(
      h.findButton(
        (button) => button.getAttribute("aria-label") === "Copy Request",
      ),
    )
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      "/api/offers/offer-42/status",
    )

    const chevron = h.findButton(
      (button) =>
        button.getAttribute("aria-label") ===
        "Details: Changed offer status to issued",
    )
    await h.click(chevron)
    await h.waitUntil(() => chevron.getAttribute("aria-expanded") === "false")
  })

  it("renders anonymous sign-in failures with an attempted username", async () => {
    await h.mount()
    await h.waitUntil(() => h.tableText().includes("Sign-in failed"))
    expect(h.tableText()).toContain("Unknown user")
    expect(h.tableText()).toContain("Anonymous")
    expect(h.tableText()).toContain("unknown@technocom.example")
  })

  it("exports CSV with the current filters and starts a download", async () => {
    await h.mount()
    await h.waitUntil(() => h.tableText().includes("Changed offer status"))
    await h.change(() => h.setSelect("Action", "customer.created"))
    await h.waitUntil(() => h.query().get("action") === "customer.created")

    const createObjectUrl = vi.fn((_blob: Blob) => "blob:audit")
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: createObjectUrl,
    })
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(),
    })
    const anchorClick = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {})

    await h.click(h.findButton(h.byText("Export CSV")))
    await h.waitUntil(() => createObjectUrl.mock.calls.length > 0)

    const blob = createObjectUrl.mock.calls[0][0] as Blob
    expect(blob.type).toContain("text/csv")
    expect(await blob.text()).toContain("customer.created")
    expect(anchorClick).toHaveBeenCalled()
    expect(document.querySelector("a[download]")).toBeNull()
  })

  it("disables export with a tooltip when nothing matches", async () => {
    await h.mount("/audit-logs?search=no-such-event")
    await h.waitUntil(
      () =>
        document.body.textContent?.includes(
          "No activity matches these filters",
        ) === true,
    )
    const exportButton = h.findButton(h.byText("Export CSV"))
    expect(exportButton.disabled).toBe(true)
    expect(exportButton.title).toBe("Nothing to export for these filters")
  })
})
