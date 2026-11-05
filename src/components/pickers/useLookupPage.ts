import { useEffect, useState } from "react"

import { api } from "../../lib/api/client"
import { cached, peek, type CacheTag } from "../../lib/cache/queryCache"

export type LookupPage<T> = {
  items: T[]
  totalCount: number
  totalPages: number
}

export type UseLookupPageOptions = {
  path: string
  tag: CacheTag
  search: string
  page: number
  /** 0 means "not measured yet": nothing is fetched until the modal knows how many rows fit. */
  pageSize: number
  enabled: boolean
}

export type UseLookupPage<T> = {
  /** The requested page, once it is available (cached pages are available on the first render). */
  data: LookupPage<T> | null
  /** Results of the previous search, kept on screen while a new search is typed. */
  previous: LookupPage<T> | null
  /** The last page that loaded, so the footer does not jump while the next one loads. */
  totals: LookupPage<T> | null
  loading: boolean
  /** The lookup endpoint failed: the caller falls back to the lists it already holds. */
  failed: boolean
}

function normalizeSearch(search: string): string {
  return search.trim().toLowerCase()
}

function keyOf(path: string, search: string, page: number, pageSize: number): string {
  return `lookup:${path}:${pageSize}:${page}:${normalizeSearch(search)}`
}

function toPage<T>(response: any, pageSize: number): LookupPage<T> {
  const items: T[] = Array.isArray(response)
    ? response
    : (response?.items ?? response?.data ?? [])
  const totalCount = response?.totalCount ?? response?.total ?? items.length
  const totalPages =
    response?.totalPages ??
    (Array.isArray(response) ? 1 : Math.max(1, Math.ceil(totalCount / pageSize)))
  return { items, totalCount, totalPages }
}

function fetchPage<T>(
  path: string,
  tag: CacheTag,
  search: string,
  page: number,
  pageSize: number,
): Promise<LookupPage<T>> {
  return cached(keyOf(path, search, page, pageSize), [tag], async () =>
    toPage<T>(
      await api.get<unknown>(path, { search: search.trim() || undefined, page, pageSize }),
      pageSize,
    ),
  )
}

type Loaded<T> = {
  key: string
  search: string
  pageSize: number
  data: LookupPage<T>
}

/**
 * One page of a server side lookup. Pages are cached, the next page is fetched ahead so paging
 * feels instant, and nothing waits on a timer: a request leaves as soon as the inputs change.
 */
export function useLookupPage<T>({
  path,
  tag,
  search,
  page,
  pageSize,
  enabled,
}: UseLookupPageOptions): UseLookupPage<T> {
  const ready = enabled && pageSize > 0
  const key = keyOf(path, search, page, pageSize)
  const [loaded, setLoaded] = useState<Loaded<T> | null>(null)
  const [failed, setFailed] = useState(false)

  // A reopened modal tries the server again instead of staying on the local fallback.
  useEffect(() => {
    if (!enabled) setFailed(false)
  }, [enabled])

  useEffect(() => {
    if (!ready || failed) return
    let active = true

    const prefetchNext = (current: LookupPage<T>) => {
      if (page < current.totalPages) {
        void fetchPage<T>(path, tag, search, page + 1, pageSize).catch(() => undefined)
      }
    }

    const hit = peek<LookupPage<T>>(key)
    if (hit) {
      prefetchNext(hit)
      return
    }

    fetchPage<T>(path, tag, search, page, pageSize)
      .then((data) => {
        if (!active) return
        setLoaded({ key, search: normalizeSearch(search), pageSize, data })
        prefetchNext(data)
      })
      .catch(() => {
        if (active) setFailed(true)
      })

    return () => {
      active = false
    }
  }, [ready, failed, key, path, tag, search, page, pageSize])

  const hit = ready && !failed ? peek<LookupPage<T>>(key) : undefined
  const data = hit ?? (loaded && loaded.key === key ? loaded.data : null)
  const keepPrevious =
    !data && loaded !== null && loaded.pageSize === pageSize && loaded.search !== normalizeSearch(search)

  return {
    data,
    previous: keepPrevious ? loaded.data : null,
    totals: data ?? loaded?.data ?? null,
    loading: ready && !failed && !data,
    failed,
  }
}
