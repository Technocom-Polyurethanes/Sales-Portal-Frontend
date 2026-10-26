import { api } from "../../lib/api/client"
import type { WorkspaceSettings } from "./types"

export const settingsApi = {
  load(): Promise<WorkspaceSettings> {
    return api
      .get<WorkspaceSettings>("/settings")
      .catch(() => api.get<WorkspaceSettings>("/catalog/settings"))
  },
}

