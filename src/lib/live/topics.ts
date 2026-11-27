import type { CacheTag } from "../cache/queryCache"

/** Kinds of data the server announces changes for (see GET /api/events). */
export const LIVE_TOPICS = [
  "users",
  "customers",
  "materials",
  "banks",
  "catalog",
  "offers",
  "imports",

  "audit",
] as const

export type LiveTopic = (typeof LIVE_TOPICS)[number]

export function isLiveTopic(value: unknown): value is LiveTopic {
  return typeof value === "string" && (LIVE_TOPICS as readonly string[]).includes(value)
}

/**
 * The cached reference data that a change makes stale. Offers are here too: the customer list
 * carries offer counts and totals, so a new offer changes what a cached customer shows.
 */
const TAGS_BY_TOPIC: Record<LiveTopic, readonly CacheTag[]> = {
  users: [],
  customers: ["customers"],
  materials: ["materials"],
  banks: ["banks", "catalog"],
  catalog: ["catalog"],
  offers: ["customers"],
  imports: [],

  audit: [],
}

export function cacheTagsFor(topics: Iterable<LiveTopic>): CacheTag[] {
  const tags = new Set<CacheTag>()
  for (const topic of topics) {
    for (const tag of TAGS_BY_TOPIC[topic]) tags.add(tag)
  }
  return [...tags]
}
