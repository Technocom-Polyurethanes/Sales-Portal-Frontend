import { describe, expect, it, vi } from "vitest"

import { registerTransport } from "../../lib/api/transport"

import { auditApi } from "./api"

const emptyPage = { items: [], page: 1, pageSize: 50, totalCount: 0 }

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

        entityType: undefined,

        page: 1,

        pageSize: 50,
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

  it("maps backend summary buckets into the tiles and chart", async () => {
    const transport = vi.fn(async () => ({
      totalCount: 9,
      byOutcome: [
        { key: "success", count: 7 },
        { key: "failure", count: 2 },
      ],
      byCategory: [{ key: "auth", count: 3 }],
      byActor: [{ key: "admin", count: 4 }],
      byDay: [
        { key: "2026-11-27", count: 3 },
        { key: "2026-11-28", count: 6 },
      ],
    }))
    registerTransport(transport)

    const summary = await auditApi.summary()

    expect(summary.actions).toBe(9)
    expect(summary.failures).toBe(2)
    expect(summary.signIns).toBe(3)
    expect(summary.activeUsers).toBe(1)
    expect(summary.byDay).toEqual([3, 6])
    expect(summary.byDayKeys).toEqual(["2026-11-27", "2026-11-28"])
  })

  it("keeps the mock summary shape as it is", async () => {
    registerTransport(
      vi.fn(async () => ({
        actions: 4,
        failures: 1,
        byHour: Array(24).fill(0),
        byDay: Array(30).fill(0),
      })),
    )

    const summary = await auditApi.summary()

    expect(summary.actions).toBe(4)
    expect(summary.failures).toBe(1)
    expect(summary.byDay).toHaveLength(30)
    expect(summary.byDayKeys).toEqual([])
  })

  it("asks the transport for a blob instead of fetching directly", async () => {
    const blob = new Blob(["id,occurredAt\n"], { type: "text/csv" })
    const transport = vi.fn(async () => ({
      blob,
      filename: "audit.csv",
    }))
    registerTransport(transport)

    const result = await auditApi.exportCsv({ action: "customer.created" })

    expect(transport).toHaveBeenCalledWith("/audit-logs/export", {
      method: "GET",
      query: {
        search: undefined,
        from: undefined,
        to: undefined,
        actorId: undefined,
        category: undefined,
        action: "customer.created",
        outcome: undefined,
        entityType: undefined,
        page: 1,
        pageSize: 50,
      },
      responseType: "blob",
    })
    expect(result).toEqual({ blob, filename: "audit.csv" })
  })
})
