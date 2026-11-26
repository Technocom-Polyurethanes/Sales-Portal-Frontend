import { invalidate } from "../cache/queryCache"
import { createSseParser, type SseMessage } from "./sse"
import { LIVE_TOPICS, cacheTagsFor, isLiveTopic, type LiveTopic } from "./topics"

/**
 * Keeps one connection to GET /api/events and turns what it hears into two things: stale
 * reference data is dropped from the cache at once, and the screens that show that kind of data
 * are told to load it again (shortly after, merged, and only while the tab is visible).
 */

export type LiveConnection = {
  status: number
  body: ReadableStream<Uint8Array> | null
}

export type LiveStatus = "idle" | "connecting" | "live" | "offline" | "unsupported"

export type LiveListener = (topics: LiveTopic[]) => void

/** The notification DTO sent in `event: notification` data. */
export type LiveNotification = {
  id: string
  type: string
  actorName: string
  entityType: string
  entityId: string | null
  entityLabel: string
  meta: Record<string, unknown>
  createdAt: string
  readAt: string | null
}

export type NotificationListener = (notification: LiveNotification) => void
export type ReadyListener = () => void

export type LiveClientOptions = {
  /** Opens the stream. Resolves once the response headers are in; rejects on a network failure. */
  connect: (signal: AbortSignal) => Promise<LiveConnection>
  /** Drops cached reference data. Defaults to the app's query cache. */
  invalidateCache?: (...tags: Parameters<typeof invalidate>) => void
  /** Merges announcements that arrive close together. */
  debounceMs?: number
  /** A stream that has been silent this long (the server pings every 20s) is treated as dead. */
  silenceMs?: number
  /** While the stream is down, screens reload this often so they do not go stale unnoticed. */
  pollMs?: number
  baseDelayMs?: number
  maxDelayMs?: number
  random?: () => number
}

export type LiveClient = {
  start: () => void
  stop: () => void
  /** Calls `listener` (with the topics that matched) when any of `topics` changed. */
  subscribe: (topics: readonly LiveTopic[], listener: LiveListener) => () => void
  /** Calls `listener` for every `event: notification`, even while the tab is hidden. */
  subscribeNotifications: (listener: NotificationListener) => () => void
  /** Calls `listener` on the first connect and on every reconnect. */
  onReady: (listener: ReadyListener) => () => void
  getStatus: () => LiveStatus
}

/** The server has no such endpoint (an older version): do not keep asking. */
const UNSUPPORTED_STATUSES = new Set([404, 405, 501])
/** The token is not accepted: the normal API calls handle signing out, so just stop. */
const REFUSED_STATUSES = new Set([401, 403])

export function createLiveClient(options: LiveClientOptions): LiveClient {
  const debounceMs = options.debounceMs ?? 250
  const silenceMs = options.silenceMs ?? 60_000
  const pollMs = options.pollMs ?? 30_000
  const baseDelayMs = options.baseDelayMs ?? 1_000
  const maxDelayMs = options.maxDelayMs ?? 30_000
  const random = options.random ?? Math.random
  const dropCache = options.invalidateCache ?? invalidate

  type Subscriber = { topics: ReadonlySet<LiveTopic>; listener: LiveListener }
  const subscribers = new Set<Subscriber>()
  const notificationListeners = new Set<NotificationListener>()
  const readyListeners = new Set<ReadyListener>()
  const pending = new Set<LiveTopic>()

  let running = false
  let status: LiveStatus = "idle"
  /** True from opening a connection until it is gone, so a reconnect is never started twice. */
  let attempting = false
  let current: AbortController | undefined
  let currentReader: ReadableStreamDefaultReader<Uint8Array> | undefined
  let attempt = 0
  /** Something may have been missed (the stream was down), so the next connection reloads everything. */
  let needsSync = false

  let reconnectTimer: ReturnType<typeof setTimeout> | undefined
  let flushTimer: ReturnType<typeof setTimeout> | undefined
  let silenceTimer: ReturnType<typeof setTimeout> | undefined
  let pollTimer: ReturnType<typeof setInterval> | undefined

  const hidden = () =>
    typeof document !== "undefined" && document.visibilityState === "hidden"

  // ------------------------------------------------------------------ announcements

  function flush() {
    flushTimer = undefined
    if (pending.size === 0) return
    // A background tab would load data nobody is looking at; it catches up when it is shown.
    if (hidden()) return

    const batch = [...pending]
    pending.clear()
    for (const subscriber of [...subscribers]) {
      const matching = batch.filter((topic) => subscriber.topics.has(topic))
      if (matching.length === 0) continue
      try {
        subscriber.listener(matching)
      } catch {
        // One screen failing to refresh must not stop the others.
      }
    }
  }

  function announce(topics: Iterable<LiveTopic>) {
    const list = [...topics]
    if (list.length === 0) return

    // Dropped immediately, not after the delay: any load that starts now (a click, a navigation)
    // must not be served the copy that was just announced as stale.
    const tags = cacheTagsFor(list)
    if (tags.length > 0) dropCache(...tags)

    for (const topic of list) pending.add(topic)
    flushTimer ??= setTimeout(flush, debounceMs)
  }

  function parseNotification(data: string): LiveNotification | undefined {
    try {
      const parsed: unknown = JSON.parse(data)
      if (!parsed || typeof parsed !== "object") return undefined
      const value = parsed as Record<string, unknown>
      if (typeof value.id !== "string" || typeof value.type !== "string") return undefined

      const meta =
        value.meta && typeof value.meta === "object" && !Array.isArray(value.meta)
          ? (value.meta as Record<string, unknown>)
          : {}

      return {
        id: value.id,
        type: value.type,
        actorName: typeof value.actorName === "string" ? value.actorName : "",
        entityType: typeof value.entityType === "string" ? value.entityType : "",
        entityId: typeof value.entityId === "string" ? value.entityId : null,
        entityLabel: typeof value.entityLabel === "string" ? value.entityLabel : "",
        meta,
        createdAt: typeof value.createdAt === "string" ? value.createdAt : "",
        readAt: typeof value.readAt === "string" ? value.readAt : null,
      }
    } catch {
      return undefined
    }
  }

  function handleMessage(message: SseMessage) {
    if (message.event === "ready") {
      attempt = 0
      stopPolling()
      setStatus("live")
      for (const listener of [...readyListeners]) {
        try {
          listener()
        } catch {
          // One screen failing to resync must not stop the others.
        }
      }
      if (needsSync) {
        needsSync = false
        announce(LIVE_TOPICS)
      }
      return
    }

    if (message.event === "notification") {
      const notification = parseNotification(message.data)
      if (!notification) return
      for (const listener of [...notificationListeners]) {
        try {
          listener(notification)
        } catch {
          // One screen failing to show a toast must not stop the others.
        }
      }
      return
    }

    if (message.event !== "change") return
    try {
      const parsed: unknown = JSON.parse(message.data)
      const topics = (parsed as { topics?: unknown } | null)?.topics
      if (!Array.isArray(topics)) return
      announce(topics.filter(isLiveTopic))
    } catch {
      // Not something this client understands; ignore it.
    }
  }

  // ------------------------------------------------------------------ connection

  function setStatus(next: LiveStatus) {
    status = next
  }

  function armSilenceWatchdog() {
    clearTimeout(silenceTimer)
    silenceTimer = setTimeout(abortCurrent, silenceMs)
  }

  function abortCurrent() {
    clearTimeout(silenceTimer)
    silenceTimer = undefined
    current?.abort()
    currentReader?.cancel().catch(() => {})
  }

  async function read(body: ReadableStream<Uint8Array>) {
    const reader = body.getReader()
    currentReader = reader
    const decoder = new TextDecoder()
    const parser = createSseParser()

    armSilenceWatchdog()
    for (;;) {
      const { done, value } = await reader.read()
      if (done) return
      armSilenceWatchdog()
      for (const message of parser.push(decoder.decode(value, { stream: true }))) {
        handleMessage(message)
      }
    }
  }

  async function open() {
    if (!running) return
    clearTimeout(reconnectTimer)
    reconnectTimer = undefined

    const controller = new AbortController()
    current = controller
    attempting = true
    if (status !== "offline") setStatus("connecting")

    try {
      const connection = await options.connect(controller.signal)
      if (current !== controller) return

      if (REFUSED_STATUSES.has(connection.status)) {
        shutDown("idle")
        return
      }
      if (UNSUPPORTED_STATUSES.has(connection.status)) {
        shutDown("unsupported")
        return
      }
      if (connection.status < 200 || connection.status >= 300 || !connection.body) {
        throw new Error(`Live updates: unexpected response ${connection.status}`)
      }

      await read(connection.body)
    } catch {
      // A network failure, or the stream was cut: handled below like a normal end.
    } finally {
      clearTimeout(silenceTimer)
      silenceTimer = undefined
      currentReader = undefined
    }

    // Stopped (or replaced) while this connection was open: nothing to do.
    if (current !== controller || !running) return
    attempting = false
    scheduleReconnect()
  }

  function scheduleReconnect() {
    needsSync = true
    setStatus("offline")
    startPolling()

    const exponential = Math.min(maxDelayMs, baseDelayMs * 2 ** attempt)
    attempt += 1
    // Spread out clients that lost the connection together (a server restart, say).
    const delay = Math.round(exponential * (0.8 + random() * 0.4))
    reconnectTimer = setTimeout(() => void open(), delay)
  }

  /** The tab came back or the network returned: do not wait out the backoff. */
  function reconnectNow() {
    if (!running || attempting) return
    clearTimeout(reconnectTimer)
    reconnectTimer = undefined
    void open()
  }

  function startPolling() {
    pollTimer ??= setInterval(() => {
      if (!hidden()) announce(LIVE_TOPICS)
    }, pollMs)
  }

  function stopPolling() {
    clearInterval(pollTimer)
    pollTimer = undefined
  }

  function onVisibilityChange() {
    if (hidden()) return
    flush()
    reconnectNow()
  }

  function shutDown(finalStatus: LiveStatus) {
    running = false
    attempting = false
    clearTimeout(reconnectTimer)
    clearTimeout(flushTimer)
    clearTimeout(silenceTimer)
    reconnectTimer = flushTimer = silenceTimer = undefined
    stopPolling()
    pending.clear()

    const controller = current
    // Cleared first, so the connection that is being closed knows it was meant to end.
    current = undefined
    controller?.abort()
    currentReader?.cancel().catch(() => {})
    currentReader = undefined

    if (typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", onVisibilityChange)
    }
    if (typeof window !== "undefined") {
      window.removeEventListener("online", reconnectNow)
    }
    setStatus(finalStatus)
  }

  return {
    start() {
      if (running) return
      running = true
      attempt = 0
      needsSync = false
      if (typeof document !== "undefined") {
        document.addEventListener("visibilitychange", onVisibilityChange)
      }
      if (typeof window !== "undefined") {
        window.addEventListener("online", reconnectNow)
      }
      void open()
    },

    stop() {
      shutDown("idle")
    },

    subscribe(topics, listener) {
      const subscriber: Subscriber = { topics: new Set(topics), listener }
      subscribers.add(subscriber)
      return () => {
        subscribers.delete(subscriber)
      }
    },

    subscribeNotifications(listener) {
      notificationListeners.add(listener)
      return () => {
        notificationListeners.delete(listener)
      }
    },

    onReady(listener) {
      readyListeners.add(listener)
      return () => {
        readyListeners.delete(listener)
      }
    },

    getStatus: () => status,
  }
}
