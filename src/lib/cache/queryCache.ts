/**
 * Small in-memory cache for reference data (customers, materials, settings) that every offer
 * reads and that rarely changes. Entries carry tags so a write can drop everything that depends
 * on it, and concurrent callers of the same key share one request.
 */

/** The server also caches and invalidates on every write, so this only bounds cross-user staleness. */
export const DEFAULT_TTL_MS = 2 * 60 * 1000

export type CacheTag = "customers" | "materials" | "banks" | "catalog"

type Entry = {
  tags: readonly CacheTag[]
  expiresAt: number
  value?: unknown
  hasValue: boolean
  promise?: Promise<unknown>
}

const entries = new Map<string, Entry>()

function isFresh(entry: Entry): boolean {
  return entry.hasValue && entry.expiresAt > Date.now()
}

/** The cached value when it is still fresh, so a component can render it on its first paint. */
export function peek<T>(key: string): T | undefined {
  const entry = entries.get(key)
  return entry && isFresh(entry) ? (entry.value as T) : undefined
}

/** Returns the cached value, or runs `load` once and caches the result. Failures are not cached. */
export function cached<T>(
  key: string,
  tags: readonly CacheTag[],
  load: () => Promise<T>,
  ttlMs: number = DEFAULT_TTL_MS,
): Promise<T> {
  const existing = entries.get(key)
  if (existing) {
    if (isFresh(existing)) return Promise.resolve(existing.value as T)
    if (existing.promise) return existing.promise as Promise<T>
  }

  const entry: Entry = { tags, expiresAt: 0, hasValue: false }
  const promise = load().then(
    (value) => {
      // An invalidation while the request was in flight replaced or removed this entry:
      // the answer may predate the write, so hand it to the caller but do not keep it.
      if (entries.get(key) === entry) {
        entry.value = value
        entry.hasValue = true
        entry.expiresAt = Date.now() + ttlMs
        entry.promise = undefined
      }
      return value
    },
    (error: unknown) => {
      if (entries.get(key) === entry) entries.delete(key)
      throw error
    },
  )

  entry.promise = promise
  entries.set(key, entry)
  return promise
}

/** Drops every entry that depends on one of the tags (call after a write). */
export function invalidate(...tags: CacheTag[]): void {
  for (const [key, entry] of entries) {
    if (entry.tags.some((tag) => tags.includes(tag))) entries.delete(key)
  }
}

export function clearCache(): void {
  entries.clear()
}
