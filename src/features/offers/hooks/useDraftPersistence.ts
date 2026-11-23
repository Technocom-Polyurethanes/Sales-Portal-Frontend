import { useCallback, useEffect, useMemo, useRef } from "react"

import { clearBuilderDraft, saveBuilderDraft } from "../draftStorage"
import type { OfferDraft } from "../types"

/** Typing is written after a short pause; leaving the page writes immediately. */
const WRITE_DELAY_MS = 400

export type DraftPersistence = {
  /** Stops writing and removes the copy: the offer was saved, there is nothing left to keep. */
  discard: () => void
  /** Removes the copy and writes again from the next change on (start over). */
  reset: () => void
}

type Options = {
  /** Storage slot, or undefined to keep nothing (tests, previews). */
  storageKey: string | undefined
  draft: OfferDraft
  step: number
  /** True while the draft is what a fresh builder starts with, so there is nothing to keep. */
  isPristine: (draft: OfferDraft) => boolean
}

/**
 * Keeps a temporary copy of the draft in the browser until the offer is saved. An untouched form
 * is never stored, so opening the builder and leaving does not leave a "restore" prompt behind.
 */
export function useDraftPersistence({
  storageKey,
  draft,
  step,
  isPristine,
}: Options): DraftPersistence {
  const latest = useRef({ draft, step })
  latest.current = { draft, step }
  const pristineRef = useRef(isPristine)
  pristineRef.current = isPristine
  const stopped = useRef(false)

  const flush = useCallback(() => {
    if (!storageKey || stopped.current) return
    const { draft: current, step: currentStep } = latest.current
    if (pristineRef.current(current)) clearBuilderDraft(storageKey)
    else saveBuilderDraft(storageKey, current, currentStep)
  }, [storageKey])

  // Debounced write on every change of the form or the step.
  useEffect(() => {
    const timer = setTimeout(flush, WRITE_DELAY_MS)
    return () => clearTimeout(timer)
  }, [draft, step, flush])

  // A refresh, a closed tab, a backgrounded phone browser or leaving the builder must not lose
  // what was typed in the last moments, so these write without waiting for the delay.
  useEffect(() => {
    const onHidden = () => {
      if (document.visibilityState === "hidden") flush()
    }
    window.addEventListener("pagehide", flush)
    document.addEventListener("visibilitychange", onHidden)
    return () => {
      window.removeEventListener("pagehide", flush)
      document.removeEventListener("visibilitychange", onHidden)
      flush()
    }
  }, [flush])

  const discard = useCallback(() => {
    stopped.current = true
    if (storageKey) clearBuilderDraft(storageKey)
  }, [storageKey])

  const reset = useCallback(() => {
    stopped.current = false
    if (storageKey) clearBuilderDraft(storageKey)
  }, [storageKey])

  return useMemo(() => ({ discard, reset }), [discard, reset])
}
