import { describe, expect, it, vi } from "vitest"

import { registerTransport } from "../../lib/api/transport"

import { systemApi } from "./api"

describe("systemApi", () => {
  it("asks the server for the admin status snapshot", async () => {
    const transport = vi.fn(async () => ({ status: "Healthy" }))
    registerTransport(transport)

    await systemApi.status()

    expect(transport).toHaveBeenCalledWith("/system/status", { method: "GET" })
  })
})
