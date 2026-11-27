import { roleCan } from "../features/account/permissions"
import { ApiError } from "../lib/api/types"

import { sessionAccount } from "./db"
import type { Route } from "./transport"

export const systemRoutes: Route[] = [
  {
    method: "GET",
    segments: ["system", "status"],
    handle: () => {
      if (!roleCan(sessionAccount().role, "system.view")) {
        throw new ApiError("You do not have permission to do that.", 403)
      }

      return {
        status: "Healthy",
        checkedAt: new Date().toISOString(),
        version: "1.9.0",
        environment: "Production",
        uptimeSeconds: 86400,
        database: { status: "Up", latencyMs: 4 },
        live: {
          state: "connected",
          disabled: false,
          pollingFallback: false,
          changes: "connected",
          notifications: "connected",
        },
      }
    },
  },
]
