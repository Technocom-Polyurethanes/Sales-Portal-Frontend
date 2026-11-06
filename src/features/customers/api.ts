import { api } from "../../lib/api/client"
import type { PaginatedResult } from "../../lib/api/lookup"
import { cached, invalidate } from "../../lib/cache/queryCache"
import { mapListPage, type RawOfferListPage } from "../offers/mappers"
import type { OfferListPage } from "../offers/types"
import type { Customer } from "./types"

type RawCustomer = Partial<Customer> & {
  customerCode?: string
  defaultPaymentTermId?: string | null
}

/** The API may expose the database names; both shapes become one Customer. */
function mapCustomer(raw: RawCustomer): Customer {
  return {
    id: raw.id ?? "",
    code: raw.code ?? raw.customerCode ?? "",
    customerCode: raw.customerCode ?? raw.code,
    erpNextId: raw.erpNextId,
    name: raw.name ?? "",
    nameAr: raw.nameAr,
    contactPerson: raw.contactPerson ?? "",
    contactPersonAr: raw.contactPersonAr,
    email: raw.email ?? "",
    phone: raw.phone ?? "",
    city: raw.city ?? "",
    cityAr: raw.cityAr,
    address: raw.address ?? "",
    addressAr: raw.addressAr,
    taxId: raw.taxId,
    paymentTermId: raw.paymentTermId ?? raw.defaultPaymentTermId ?? "",
    offersCount: raw.offersCount ?? 0,
    totalValue: raw.totalValue ?? 0,
    lastOfferDate: raw.lastOfferDate ?? undefined,
  }
}

/** The write DTO uses the database names, the UI keeps the short ones. */
function toBody(customer: Partial<Customer>) {
  return {
    customerCode: customer.customerCode ?? customer.code ?? "",
    erpNextId: customer.erpNextId,
    name: customer.name ?? "",
    nameAr: customer.nameAr,
    taxId: customer.taxId,
    contactPerson: customer.contactPerson,
    contactPersonAr: customer.contactPersonAr,
    email: customer.email,
    phone: customer.phone,
    city: customer.city,
    cityAr: customer.cityAr,
    address: customer.address ?? "",
    addressAr: customer.addressAr,
    defaultPaymentTermId: customer.paymentTermId || null,
  }
}

export const customersApi = {
  /** Cached: the builder reads the whole directory every time an offer is started. */
  list(search = ""): Promise<Customer[]> {
    return cached(
      `customers:list:${search.trim().toLowerCase()}`,
      ["customers"],
      () =>
        api
          .get<RawCustomer[]>("/customers", search ? { search } : {})
          .then((rows) => rows.map(mapCustomer)),
    )
  },
  listPage(
    search: string,
    page: number,
    pageSize = 20,
  ): Promise<PaginatedResult<Customer>> {
    return cached(
      `customers:page:${search.trim().toLowerCase()}:${page}:${pageSize}`,
      ["customers"],
      () =>
        api
          .get<PaginatedResult<RawCustomer>>("/customers", {
            search: search.trim() || undefined,
            page,
            pageSize,
          })
          .then((result) => ({
            ...result,
            items: result.items.map(mapCustomer),
          })),
    )
  },
  get(id: string): Promise<Customer> {
    return api.get<RawCustomer>(`/customers/${id}`).then(mapCustomer)
  },
  offersPage(
    customerId: string,
    page: number,
    pageSize = 10,
  ): Promise<OfferListPage> {
    return api
      .get<RawOfferListPage>(`/customers/${customerId}/offers`, {
        page,
        pageSize,
      })
      .then(mapListPage)
  },
  async create(customer: Partial<Customer>): Promise<Customer> {
    const created = await api.post<RawCustomer>("/customers", toBody(customer))
    invalidate("customers")
    return mapCustomer(created)
  },
  async update(id: string, customer: Partial<Customer>): Promise<Customer> {
    const updated = await api.put<RawCustomer>(
      `/customers/${id}`,
      toBody(customer),
    )
    invalidate("customers")
    return mapCustomer(updated)
  },
}
