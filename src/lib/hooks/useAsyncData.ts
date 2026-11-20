import { useCallback, useEffect, useRef, useState } from "react"

export type AsyncData<T,> = {
  data: T | undefined
  error: Error | undefined
  loading: boolean
  /** Reloads with the skeleton state (use when the inputs changed). */
  reload: () => void
  /** Re-fetches in the background: keeps the current data on screen, no skeleton flash. */
  refresh: () => void
  /** Replaces the current data right away (optimistic update). Returns a function that restores the previous data. */
  mutate: (update: (current: T) => T) => () => void
}

/**
 * Small data loading helper used by the feature hooks. It keeps loading and
 * error state in one place and supports optimistic updates through `mutate`
 * and silent background re-fetches through `refresh`.
 */
export function useAsyncData<T>(
  loader: () => Promise<T>,
  deps: unknown[] = [],
): AsyncData<T> {
  const [data, setData] = useState<T | undefined>(undefined)
  const [error, setError] = useState<Error | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [nonce, setNonce] = useState(0)
  const [refreshNonce, setRefreshNonce] = useState(0)
  const dataRef = useRef<T | undefined>(undefined)
  const loaderRef = useRef(loader)
  loaderRef.current = loader

  const commit = useCallback((next: T | undefined) => {
    dataRef.current = next
    setData(next)
  }, [])

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(undefined)

    loader()
      .then((result) => {
        if (!active) return
        commit(result)
        setLoading(false)
      })
      .catch((cause: unknown) => {
        if (!active) return
        setError(cause instanceof Error ? cause : new Error(String(cause)))
        setLoading(false)
      })

    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce])

  useEffect(() => {
    if (refreshNonce === 0) return
    let active = true

    loaderRef
      .current()
      .then((result) => {
        if (active) commit(result)
      })
      .catch(() => {
        // Keep what is on screen; a failed background refresh is not worth an error state.
      })

    return () => {
      active = false
    }
  }, [refreshNonce, commit])

  const reload = useCallback(() => setNonce((value) => value + 1), [])
  const refresh = useCallback(() => setRefreshNonce((value) => value + 1), [])

  const mutate = useCallback(
    (update: (current: T) => T) => {
      const previous = dataRef.current
      if (previous === undefined) return () => {}
      const next = update(previous)
      commit(next)
      return () => {
        // Only roll back if nothing newer replaced our optimistic value.
        if (dataRef.current === next) commit(previous)
      }
    },
    [commit],
  )

  return { data, error, loading, reload, refresh, mutate }
}
