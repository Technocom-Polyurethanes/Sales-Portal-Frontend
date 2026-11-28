// @vitest-environment jsdom
import { act } from "react"
import { createRoot } from "react-dom/client"
import { describe, expect, it, vi } from "vitest"

const sileo = vi.hoisted(() => ({
  success: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
  error: vi.fn(),
}))
const toasterProps = vi.hoisted(() => ({
  value: {} as Record<string, unknown>,
}))

vi.mock("sileo", () => ({
  sileo,
  Toaster: (props: Record<string, unknown>) => {
    toasterProps.value = props
    return null
  },
}))

import { ToastProvider, useToast } from "./ToastProvider"

describe("ToastProvider", () => {
  it("uses dark toasts and puts expandable details in the body", () => {
    let notify: ReturnType<typeof useToast>["notify"] = () => {}
    const Probe = () => {
      notify = useToast().notify
      return null
    }
    const container = document.createElement("div")
    const root = createRoot(container)

    act(() =>
      root.render(
        <ToastProvider>
          <Probe />
        </ToastProvider>,
      ),
    )
    act(() =>
      notify(
        "Saved",
        "success",
        "Offer saved",
        undefined,
        "User: Amgad\nTime: 2 min ago",
      ),
    )

    expect(sileo.success).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Saved",
        description: "Offer saved\nUser: Amgad\nTime: 2 min ago",
        duration: 9000,
      }),
    )
    expect(toasterProps.value).toMatchObject({
      position: "bottom-right",
      theme: "light",
    })

    act(() => root.unmount())
  })
})
