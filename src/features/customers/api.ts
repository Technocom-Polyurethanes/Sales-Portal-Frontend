import { api } from "../../lib/api/client"
import type { Offer } from "../offers/types"
import type { Customer } from "./types"

export const customersApi = {
  list(search = ""): Promise<Customer[]> {
    return api.get<Customer[]>("/customers", { search })
  },
  get(id: string): Promise<Customer> {
    return api.get<Customer>(`/customers/${id}`)
  },
  offers(customerId: string): Promise<Offer[]> {
    return api.get<Offer[]>(`/customers/${customerId}/offers`)
  },
}
