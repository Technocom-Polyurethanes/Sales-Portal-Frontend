import { api } from "../../lib/api/client"
import type { PaginatedResult } from "../../lib/api/lookup"
import { cached, invalidate } from "../../lib/cache/queryCache"
import type { BankAccount } from "../settings/types"

export const banksApi = {
  listPage(
    search: string,
    page: number,
    pageSize = 20,
  ): Promise<PaginatedResult<BankAccount>> {
    return cached(
      `banks:page:${search.trim().toLowerCase()}:${page}:${pageSize}`,
      ["banks", "catalog"],
      () =>
        api.get<PaginatedResult<BankAccount>>("/banks", {
          search: search.trim() || undefined,
          page,
          pageSize,
        }),
    )
  },
  async create(bank: Partial<BankAccount>): Promise<BankAccount> {
    const created = await api.post<BankAccount>("/banks", bank)
    invalidate("banks", "catalog")
    return created
  },
  async update(id: string, bank: Partial<BankAccount>): Promise<BankAccount> {
    const updated = await api.put<BankAccount>(`/banks/${id}`, bank)
    invalidate("banks", "catalog")
    return updated
  },
}
