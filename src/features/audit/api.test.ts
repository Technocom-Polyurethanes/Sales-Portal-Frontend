import { describe, expect, it, vi } from "vitest"

import { registerTransport } from "../../lib/api/transport"

import { auditApi } from "./api"

const emptyPage = { items: [], page: 1, pageSize: 20, totalCount: 0 }

describe("auditApi", () => {
  it("maps date filters to inclusive UTC day boundaries", async () => {
    const transport = vi.fn(async () => emptyPage)
    registerTransport(transport)

    await auditApi.list({
      from: "2026-11-20",
      to: "2026-11-27",
      search: " offer ",
    })

    expect(transport).toHaveBeenCalledWith("/audit-logs", {
      method: "GET",
      query: {
        search: "offer",
        from: "2026-11-20T00:00:00.000Z",
        to: "2026-11-27T23:59:59.999Z",
        actorId: undefined,
        category: undefined,
        action: undefined,
        outcome: undefined,
        page: 1,
        pageSize: 20,
      },
    })
  })

  it("asks the server for the filter options", async () => {
    const transport = vi.fn(async () => ({
      actors: [],
      categories: [],
      actions: [],
    }))
    registerTransport(transport)

    await auditApi.filters()

    expect(transport).toHaveBeenCalledWith("/audit-logs/filters", {
      method: "GET",
    })
  })
})
