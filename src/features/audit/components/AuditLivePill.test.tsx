// @vitest-environment jsdom
import { act } from "react"
import { createRoot } from "react-dom/client"
import { describe, expect, it, vi } from "vitest"

import { I18nProvider } from "../../../i18n/I18nProvider"
import AuditLivePill from "./AuditLivePill"
import { newAuditRows } from "./auditQueryState"

const row = (id: string) => ({ id }) as never

describe("audit live updates", () => {
  it("queues new rows only when the reader is away from the top", () => {
    const previous = new Set(["a", "b"])
    expect(newAuditRows(previous, [row("c"), row("a")], true, 1)).toMatchObject(
      {
        fresh: ["c"],
        pending: 0,
      },
    )
    expect(
      newAuditRows(previous, [row("c"), row("a")], false, 1),
    ).toMatchObject({
      fresh: ["c"],
      pending: 1,
    })
    expect(newAuditRows(previous, [row("c")], true, 2)).toMatchObject({
      pending: 1,
    })
    expect(newAuditRows(null, [row("c")], false, 1)).toMatchObject({
      fresh: [],
      pending: 0,
    })
  })

  it("shows a counted pill that calls onShow", async () => {
    const container = document.createElement("div")
    document.body.appendChild(container)
    const root = createRoot(container)
    const onShow = vi.fn()
    await act(async () =>
      root.render(
        <I18nProvider>
          <AuditLivePill count={2} onShow={onShow} />
        </I18nProvider>,
      ),
    )

    const pill = container.querySelector("button") as HTMLButtonElement
    expect(pill.textContent).toContain("2 new events")
    expect(pill.textContent).toContain("Show")
    await act(async () => pill.click())
    expect(onShow).toHaveBeenCalledOnce()

    await act(async () =>
      root.render(
        <I18nProvider>
          <AuditLivePill count={0} onShow={onShow} />
        </I18nProvider>,
      ),
    )
    expect(container.querySelector("button")).toBeNull()
    await act(async () => root.unmount())
    container.remove()
  })
})
