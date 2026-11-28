// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest"

import { api } from "./client"

import { createHttpTransport, registerTransport } from "./transport"

const PROBLEM = {
  type: "https://httpstatuses.io/400",

  title: "One or more validation errors occurred.",

  status: 400,

  detail: "The file has no data rows.",

  message: "The file has no data rows.",
}

describe("http transport error messages", () => {
  afterEach(() => {
    vi.unstubAllGlobals()

    localStorage.clear()
  })

  it("uses the problem message instead of the raw JSON body", async () => {
    registerTransport(createHttpTransport())

    vi.stubGlobal(
      "fetch",

      vi.fn().mockResolvedValue(
        new Response(JSON.stringify(PROBLEM), {
          status: 400,

          headers: { "content-type": "application/problem+json" },
        }),
      ),
    )

    await expect(
      api.post("/import/customers/preview", {}),
    ).rejects.toMatchObject({
      message: "The file has no data rows.",
    })
  })

  it("returns blobs with the server file name", async () => {
    registerTransport(createHttpTransport())

    const fetchMock = vi.fn().mockResolvedValue(
      new Response("id,occurredAt\n", {
        status: 200,

        headers: {
          "content-type": "text/csv",

          "content-disposition": 'attachment; filename="audit.csv"',
        },
      }),
    )

    vi.stubGlobal("fetch", fetchMock)

    const result = await api.request<{
      blob: Blob
      filename: string
    }>("/audit-logs/export", { responseType: "blob" })

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/audit-logs/export"),

      expect.objectContaining({ method: "GET" }),
    )

    expect(result.filename).toBe("audit.csv")

    expect(await result.blob.text()).toBe("id,occurredAt\n")
  })

  it("clears the session when a blob download is unauthorized", async () => {
    registerTransport(createHttpTransport())

    localStorage.setItem("sales_portal_jwt", "token")

    localStorage.setItem("technocom.session", "active")

    vi.stubGlobal(
      "fetch",

      vi.fn().mockResolvedValue(new Response("", { status: 401 })),
    )

    await expect(
      api.request("/audit-logs/export", { responseType: "blob" }),
    ).rejects.toMatchObject({ status: 401 })

    expect(localStorage.getItem("sales_portal_jwt")).toBeNull()

    expect(localStorage.getItem("technocom.session")).toBeNull()
  })
})
