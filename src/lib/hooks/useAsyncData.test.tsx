// @vitest-environment jsdom
import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, describe, expect, it } from "vitest"

import { useAsyncData, type AsyncData } from "./useAsyncData"

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let root: Root | undefined
let container: HTMLElement | undefined

afterEach(() => {
  act(() => root?.unmount())
  container?.remove()
  root = undefined
})

async function mount(loader: () => Promise<number[]>) {
  const ref: { current: AsyncData<number[]> | undefined } = { current: undefined }
  function Probe() {
    ref.current = useAsyncData(loader, [])
    return null
  }
  container = document.createElement("div")
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () => root!.render(<Probe />))
  return ref as { current: AsyncData<number[]> }
}

describe("useAsyncData", () => {
  it("mutate replaces the data and the returned function restores it", async () => {
    const hook = await mount(async () => [1, 2])
    expect(hook.current.data).toEqual([1, 2])

    let rollback = () => {}
    act(() => {
      rollback = hook.current.mutate((current) => [...current, 3])
    })
    expect(hook.current.data).toEqual([1, 2, 3])

    act(() => rollback())
    expect(hook.current.data).toEqual([1, 2])
  })

  it("refresh re-fetches without raising the loading flag", async () => {
    let calls = 0
    const hook = await mount(async () => [++calls])
    expect(hook.current.data).toEqual([1])

    let sawLoading = false
    await act(async () => {
      hook.current.refresh()
      sawLoading ||= hook.current.loading
    })
    expect(hook.current.data).toEqual([2])
    expect(hook.current.loading).toBe(false)
    expect(sawLoading).toBe(false)
  })

  it("keeps the data on screen when a background refresh fails", async () => {
    let calls = 0
    const hook = await mount(async () => {
      if (++calls > 1) throw new Error("boom")
      return [1]
    })
    await act(async () => hook.current.refresh())
    expect(hook.current.data).toEqual([1])
    expect(hook.current.error).toBeUndefined()
  })
})
