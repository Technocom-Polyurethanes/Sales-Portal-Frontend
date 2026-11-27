// @vitest-environment jsdom
import { act } from "react"
import { createRoot } from "react-dom/client"
import { afterEach, describe, expect, it, vi } from "vitest"

import DataTable from "./DataTable"

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let container: HTMLDivElement | null = null
afterEach(() => {
  container?.remove()
  document.body.innerHTML = ""
  container = null
})

describe("DataTable", () => {
  it("opens a clickable row with the keyboard", async () => {
    const rows = [{ id: "1", name: "Loc/1-2026" }]
    const onRowClick = vi.fn()
    container = document.createElement("div")
    document.body.append(container)
    const root = createRoot(container)

    await act(async () => {
      root.render(
        <DataTable
          columns={[{ key: "name", header: "Document", render: (row) => row.name }]}
          rows={rows}
          rowKey={(row) => row.id}
          onRowClick={onRowClick}
          rowActionLabel={(row) => `Open ${row.name}`}
        />,
      )
    })

    const row = container.querySelector("tbody tr") as HTMLElement
    expect(row.getAttribute("role")).toBeNull()

    const action = container.querySelector("tbody button") as HTMLButtonElement
    expect(action.getAttribute("aria-label")).toBe("Open Loc/1-2026")
    action.click()
    expect(onRowClick).toHaveBeenCalledTimes(1)
    expect(onRowClick).toHaveBeenCalledWith(rows[0])
    root.unmount()
  })
})
