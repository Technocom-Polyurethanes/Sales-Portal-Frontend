import { api } from "../../lib/api/client"
import { cached, invalidate } from "../../lib/cache/queryCache"
import { normalizeSettings } from "./normalize"
import type { PackageType, WorkspaceSettings, BankAccount } from "./types"

export const settingsApi = {
  /**
   * Cached: opening an offer reads the company, bank and packaging settings every time.
   * The server splits these across `/settings` and `/catalog/bootstrap`, so both are read
   * and merged into one answer where `banks` and `packageTypes` are always arrays.
   */
  load(): Promise<WorkspaceSettings> {
    return cached("settings:load", ["catalog"], async () => {
      const [settings, bootstrap] = await Promise.all([
        api
          .get<any>("/settings")
          .catch(() => api.get<any>("/catalog/settings").catch(() => undefined)),
        api.get<any>("/catalog/bootstrap").catch(() => undefined),
      ])
      return normalizeSettings(settings, bootstrap)
    })
  },
  /** Package types live in the catalog bootstrap; the old settings answer is the fallback. */
  async packageTypes(): Promise<PackageType[]> {
    return cached("settings:package-types", ["catalog"], async () => {
      const bootstrap = await api
        .get<{ packageTypes?: PackageType[] }>("/catalog/bootstrap")
        .catch(() => ({ packageTypes: undefined }))
      if (bootstrap.packageTypes) return bootstrap.packageTypes
      const settings = await api
        .get<{ packageTypes?: PackageType[] }>("/settings")
        .catch(() => ({ packageTypes: undefined }))
      return settings.packageTypes ?? []
    })
  },
  banks: {
    list(): Promise<BankAccount[]> {
      return api.get<BankAccount[]>("/settings/banks").catch(() => [])
    },
    async create(bank: Partial<BankAccount>): Promise<BankAccount> {
      const created = await api.post<BankAccount>("/settings/banks", bank)
      invalidate("banks", "catalog")
      return created
    },
    async update(id: string, bank: Partial<BankAccount>): Promise<BankAccount> {
      const updated = await api.put<BankAccount>(`/settings/banks/${id}`, bank)
      invalidate("banks", "catalog")
      return updated
    },
    async delete(id: string): Promise<void> {
      const result = await api.delete<void>(`/settings/banks/${id}`)
      invalidate("banks", "catalog")
      return result
    },
  },
}
