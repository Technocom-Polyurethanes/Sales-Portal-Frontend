// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { createAuditHarness } from "./auditTestSetup"

describe("Activity log screen", () => {
  const h = createAuditHarness()

  beforeEach(() => h.reset())
  afterEach(async () => h.dispose())

  it("lists the newest audit entries with localized action labels", async () => {
    await h.mount()
    await h.waitUntil(() => h.tableText().includes("Changed offer status"))
    expect(h.tableText()).toContain("Amgad Anwar")
    expect(h.tableText()).toContain("Success")
    expect(h.tableText()).toContain("Sign-in failed")
  })

  it("filters by action through the labelled select", async () => {
    await h.mount()
    await h.waitUntil(() => h.tableText().includes("Changed offer status"))
    await h.change(() => h.setSelect("Action", "customer.created"))
    await h.waitUntil(() => h.query().get("action") === "customer.created")
    await h.waitUntil(() => !h.tableText().includes("Changed offer status"))

    expect(h.tableText()).toContain("Created customer")
  })

  it("restores filters from the URL", async () => {
    await h.mount("/audit-logs?action=customer.created&outcome=success")
    await h.waitUntil(() => h.tableText().includes("Created customer"))
    expect(h.tableText()).not.toContain("Changed offer status")
    expect(
      (document.querySelector(
        'select[aria-label="Action"]',
      ) as HTMLSelectElement).value,
    ).toBe("customer.created")
  })

  it("removes chips and clears all filters", async () => {
    await h.mount()
    await h.waitUntil(() => h.tableText().includes("Changed offer status"))
    await h.change(() => h.setSelect("Action", "customer.created"))
    await h.waitUntil(() => h.query().get("action") === "customer.created")
    expect(document.body.textContent).toContain("Action: Created customer")

    await h.click(
      h.findButton(
        (button) =>
          button.textContent?.includes("Action: Created customer") === true,
      ),
    )
    await h.waitUntil(() => h.query().get("action") === null)
    await h.waitUntil(() => h.tableText().includes("Changed offer status"))

    await h.click(h.findButton(h.byText("Failures only")))
    await h.waitUntil(() => h.query().get("outcome") === "failure")
    await h.click(h.findButton(h.byText("Clear filters")))
    await h.waitUntil(() => h.query().get("outcome") === null)
  })

  it("renders the Arabic report mirrored with a left-to-right chart", async () => {
    localStorage.setItem("technocom.app-language", "ar")
    await h.mount("/audit-logs", "٧ أيام")
    await h.waitUntil(() => h.tableText().includes("تغيير حالة العرض"))
    expect(document.documentElement.dir).toBe("rtl")
    expect(document.querySelector('[dir="ltr"]')).not.toBeNull()
  })
})
