import { describe, expect, it } from "vitest"

import { toastPosition } from "./ToastProvider"

describe("toastPosition", () => {
  it("puts English toasts on the right and Arabic toasts on the left", () => {
    expect(toastPosition("en")).toBe("bottom-right")
    expect(toastPosition("ar")).toBe("bottom-left")
  })
})
