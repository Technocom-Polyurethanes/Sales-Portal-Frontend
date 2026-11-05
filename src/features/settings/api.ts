import { api } from "../../lib/api/client"
import { cached, invalidate } from "../../lib/cache/queryCache"
import type { WorkspaceSettings, BankAccount } from "./types"

export const settingsApi = {
  /** Cached: opening an offer reads the company, bank and packaging settings every time. */
  load(): Promise<WorkspaceSettings> {
    return cached("settings:load", ["catalog"], () =>
      api
        .get<WorkspaceSettings>("/settings")
        .catch(() => api.get<WorkspaceSettings>("/catalog/settings")),
    )
  },
  banks: {
    list(): Promise<BankAccount[]> {
      return api.get<BankAccount[]>("/settings/banks").catch(() => [])
    },
    async create(bank: Partial<BankAccount>): Promise<BankAccount> {
      const created = await api.post<BankAccount>("/settings/banks", bank)
      invalidate("catalog")
      return created
    },
    async update(id: string, bank: Partial<BankAccount>): Promise<BankAccount> {
      const updated = await api.put<BankAccount>(`/settings/banks/${id}`, bank)
      invalidate("catalog")
      return updated
    },
    async delete(id: string): Promise<void> {
      const result = await api.delete<void>(`/settings/banks/${id}`)
      invalidate("catalog")
      return result
    },
  },
}
