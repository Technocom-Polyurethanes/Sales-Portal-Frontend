import { api } from "../../lib/api/client"

import type { SystemStatus } from "./types"

export const systemApi = {
  status(): Promise<SystemStatus> {
    return api.get<SystemStatus>("/system/status")
  },
}
