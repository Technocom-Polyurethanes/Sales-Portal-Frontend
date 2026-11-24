import { describe, expect, it } from "vitest"

import { uploadProgressView } from "./uploadProgress"

describe("uploadProgressView", () => {
  it("estimates the seconds left from the bytes already sent", () => {
    expect(uploadProgressView({ loaded: 500, total: 1000 }, 1000)).toEqual({
      loaded: 500,
      total: 1000,
      percent: 50,
      etaSeconds: 1,
    })
  })

  it("clears the estimate once the upload is complete", () => {
    const done = uploadProgressView({ loaded: 1000, total: 1000 }, 1000)
    expect(done.percent).toBe(100)
    expect(done.etaSeconds).toBeNull()
  })
})
