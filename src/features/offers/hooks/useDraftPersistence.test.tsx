// @vitest-environment jsdom
import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { createEmptyDraft } from "../draft"
import { loadBuilderDraft } from "../draftStorage"
import type { OfferDraft } from "../types"
import { useDraftPersistence, type DraftPersistence } from "./useDraftPersistence"

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const KEY = "test-slot"
const PRISTINE = createEmptyDraft()
const isPristine = (draft: OfferDraft) => JSON.stringify(draft) === JSON.stringify(PRISTINE)

function Harness({
  draft,
  step,
  handle,
}: {
  draft: OfferDraft
  step: number
  handle: { current?: DraftPersistence }
}) {
  handle.current = useDraftPersistence({ storageKey: KEY, draft, step, isPristine })
  return null
}

describe("useDraftPersistence", () => {
  let root: Root
  let container: HTMLDivElement
  let handle: { current?: DraftPersistence }

  const render = (draft: OfferDraft, step = 0) =>
    act(async () => {
      root.render(<Harness draft={draft} step={step} handle={handle} />)
    })
  const wait = (ms: number) =>
    act(async () => {
      vi.advanceTimersByTime(ms)
    })
  const stored = () => loadBuilderDraft(KEY)
  const edited = (notes: string) => ({ ...PRISTINE, notes })

  beforeEach(() => {
    vi.useFakeTimers()
    localStorage.clear()
    handle = {}
    container = document.createElement("div")
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
    localStorage.clear()
    vi.useRealTimers()
  })

  it("keeps nothing for a form nobody touched", async () => {
    await render(PRISTINE)
    await wait(2000)

    expect(localStorage.length).toBe(0)
  })

  it("writes a change after a short pause, not on every keystroke", async () => {
    await render(PRISTINE)
    await render(edited("a"))
    await wait(200)
    expect(stored()).toBeUndefined()

    await render(edited("ab"))
    await wait(200)
    expect(stored()).toBeUndefined()

    await wait(300)
    expect(stored()?.draft.notes).toBe("ab")
  })

  it("remembers the step together with the form", async () => {
    await render(edited("x"), 3)
    await wait(500)

    expect(stored()?.step).toBe(3)
  })

  it("writes at once when the page is being left", async () => {
    await render(edited("typed just before the refresh"))
    expect(stored()).toBeUndefined()

    await act(async () => {
      window.dispatchEvent(new Event("pagehide"))
    })

    expect(stored()?.draft.notes).toBe("typed just before the refresh")
  })

  it("writes at once when the tab goes to the background", async () => {
    await render(edited("backgrounded"))
    const original = Object.getOwnPropertyDescriptor(Document.prototype, "visibilityState")
    Object.defineProperty(document, "visibilityState", { value: "hidden", configurable: true })

    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"))
    })

    expect(stored()?.draft.notes).toBe("backgrounded")
    if (original) Object.defineProperty(Document.prototype, "visibilityState", original)
    delete (document as { visibilityState?: unknown }).visibilityState
  })

  it("writes when the builder is closed before the pause is over", async () => {
    await render(edited("left too quickly"))
    await act(async () => root.unmount())

    expect(stored()?.draft.notes).toBe("left too quickly")
    root = createRoot(container)
  })

  it("removes the copy when every change was undone", async () => {
    await render(edited("something"))
    await wait(500)
    expect(stored()).toBeDefined()

    await render(PRISTINE)
    await wait(500)

    expect(stored()).toBeUndefined()
  })

  it("stops writing and clears the copy once the offer is saved", async () => {
    await render(edited("about to be saved"))
    await wait(500)
    expect(stored()).toBeDefined()

    await act(async () => handle.current!.discard())
    expect(stored()).toBeUndefined()

    await render(edited("edited after the save"))
    await wait(500)
    await act(async () => root.unmount())

    expect(stored()).toBeUndefined()
    root = createRoot(container)
  })

  it("writes again after a reset", async () => {
    await render(edited("first"))
    await act(async () => handle.current!.discard())

    await act(async () => handle.current!.reset())
    await render(edited("second"))
    await wait(500)

    expect(stored()?.draft.notes).toBe("second")
  })
})
