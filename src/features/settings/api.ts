import { api } from "../../lib/api/client"
import type { WorkspaceSettings, BankAccount } from "./types"

export const settingsApi = {
  load(): Promise<WorkspaceSettings> {
    return api
      .get<WorkspaceSettings>("/settings")
      .catch(() => api.get<WorkspaceSettings>("/catalog/settings"))
  },
  banks: {
    list(): Promise<BankAccount[]> {
      return api.get<BankAccount[]>("/settings/banks").catch(() => [])
    },
    create(bank: Partial<BankAccount>): Promise<BankAccount> {
      return api.post<BankAccount>("/settings/banks", bank)
    },
    update(id: string, bank: Partial<BankAccount>): Promise<BankAccount> {
      return api.put<BankAccount>(`/settings/banks/${id}`, bank)
    },
    delete(id: string): Promise<void> {
      return api.delete<void>(`/settings/banks/${id}`)
    },
  },
}

