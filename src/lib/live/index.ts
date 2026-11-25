import { buildApiUrl, readAuthToken } from "../api/transport"
import { createLiveClient } from "./liveClient"

export { createLiveClient } from "./liveClient"
export type { LiveClient, LiveStatus } from "./liveClient"
export { LIVE_TOPICS, type LiveTopic } from "./topics"

/**
 * The app's one live connection. The stream needs the Authorization header, which the browser's
 * EventSource cannot send, so it is read with fetch.
 */
export const live = createLiveClient({
  connect: async (signal) => {
    const headers = new Headers({ Accept: "text/event-stream" })
    const token = readAuthToken()
    if (token) headers.set("Authorization", `Bearer ${token}`)

    const response = await fetch(buildApiUrl("events"), {
      headers,
      signal,
      cache: "no-store",
    })
    return { status: response.status, body: response.body }
  },
})
