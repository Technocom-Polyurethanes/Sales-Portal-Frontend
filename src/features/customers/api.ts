import { api } from "../../lib/api/client"
import { cached, invalidate } from "../../lib/cache/queryCache"
import type { Offer } from "../offers/types"
import type { Customer } from "./types"

export const customersApi = {
  /** Cached: the builder reads the whole directory every time an offer is started. */
  list(search = ""): Promise<Customer[]> {
    return cached(`customers:list:${search.trim().toLowerCase()}`, ["customers"], () =>
      api.get<Customer[]>("/customers", search ? { search } : {}),
    )
  },
  get(id: string): Promise<Customer> {
    return api.get<Customer>(`/customers/${id}`)
  },
  offers(customerId: string): Promise<Offer[]> {
    return api.get<Offer[]>(`/customers/${customerId}/offers`)
  },
  async create(customer: Partial<Customer>): Promise<Customer> {
    const created = await api.post<Customer>("/customers", customer)
    invalidate("customers")
    return created
  },
  async update(id: string, customer: Partial<Customer>): Promise<Customer> {
    const updated = await api.put<Customer>(`/customers/${id}`, customer)
    invalidate("customers")
    return updated
  },
  async delete(id: string): Promise<void> {
    const result = await api.delete<void>(`/customers/${id}`)
    invalidate("customers")
    return result
  },
}
