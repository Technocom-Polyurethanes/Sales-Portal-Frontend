import { useEffect } from "react"

import { useSession } from "../../features/account/SessionProvider"
import { isMockApi } from "../../lib/api/mode"
import { live } from "../../lib/live"

/**
 * Keeps the live connection open while someone is signed in, so screens refresh themselves when
 * data changes. It renders nothing; the screens subscribe through `useAsyncData`'s `live` option.
 * The in-browser mock has no server to listen to.
 */
export function LiveUpdates() {
  const { authenticated } = useSession()

  useEffect(() => {
    if (!authenticated || isMockApi()) return
    live.start()
    return () => live.stop()
  }, [authenticated])

  return null
}
