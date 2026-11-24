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
  afterEach(() => vi.unstubAllGlobals())

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

    await expect(api.post("/import/customers/preview", {})).rejects.toMatchObject({
      message: "The file has no data rows.",
    })
  })
})
