import type { ApiRequestOptions, Query, Transport } from "../lib/api/types"
import { ApiError } from "../lib/api/types"
import { queryCustomers, queryMaterials } from "../lib/api/lookup"
import type {
  Offer,
  OfferListItem,
  OfferStatus,
} from "../features/offers/types"
import type { Customer } from "../features/customers/types"
import type { Product } from "../features/products/types"
import type { BankAccount } from "../features/settings/types"
import {
  db,
  findCustomer,
  findOffer,
  isFirstOffer,
  nextOfferSequence,
  offerVersions,
  sessionAccount,
  updateOfferStatus,
} from "./db"
import { commit, history, preview, template } from "./import"
import { userRoutes } from "./users"
import type { ImportSource } from "../features/import/types"

/** Offer to the list-row shape the real API returns. */
function toListItem(offer: Offer): OfferListItem {
  return {
    id: offer.id,
    reference: offer.reference,
    serialNumber: Number.parseInt(offer.reference, 10) || 0,
    version: offer.version,
    customerId: offer.customerId,
    customerName: offer.customerName,
    customerNameAr: null,
    issueDate: offer.issueDate,
    dueDate: offer.dueDate,
    currency: offer.currency,
    status: offer.status,
    total: offer.totals.total,
    createdByName: offer.createdByName ?? null,
    createdAt: offer.createdAt,
    updatedAt: offer.updatedAt ?? offer.createdAt,
    lastModifiedByName: offer.updatedByName ?? offer.createdByName ?? null,
    lastModifiedAt: offer.updatedAt ?? offer.createdAt,
  }
}

const LATENCY_MS = 120

const pageOf = (query: Query) =>
  query.page || query.pageSize
    ? {
        page: Math.max(1, Number(query.page ?? 1)),
        pageSize: Math.max(1, Number(query.pageSize ?? 20)),
      }
    : null

export type RouteContext = {
  params: string[]
  query: Query
  body: unknown
}

export type Route = {
  method: string
  segments: string[]
  handle: (context: RouteContext) => unknown
}

const routes: Route[] = [
  {
    method: "GET",
    segments: ["import", "templates", ":type"],
    handle: ({ params }) => template(params[0] as ImportSource),
  },
  {
    method: "POST",
    segments: ["import", ":type", "preview"],
    handle: ({ params, body }) => preview(params[0] as ImportSource, body),
  },
  {
    method: "POST",
    segments: ["import", ":id", "commit"],
    handle: ({ params }) => commit(params[0]),
  },
  {
    method: "GET",
    segments: ["import", "history"],
    handle: ({ query }) =>
      history(Number(query.page ?? 1), Number(query.pageSize ?? 10)),
  },
  {
    method: "GET",
    segments: ["customers"],
    handle: ({ query }) => {
      const search = String(query.search ?? "")
      const page = pageOf(query)
      if (!page) {
        return queryCustomers(db.customers, {
          search,
          page: 1,
          pageSize: Math.max(1, db.customers.length),
        }).items
      }
      return queryCustomers(db.customers, { search, ...page })
    },
  },
  {
    method: "POST",
    segments: ["customers"],
    handle: ({ body }) => {
      const input = body as any
      const customer: Customer = {
        id: `cust-${Date.now()}`,
        code: input.customerCode ?? input.code ?? "",
        customerCode: input.customerCode ?? input.code ?? "",
        erpNextId: input.erpNextId,
        name: input.name ?? "",
        nameAr: input.nameAr,
        contactPerson: input.contactPerson ?? "",
        contactPersonAr: input.contactPersonAr,
        email: input.email ?? "",
        phone: input.phone ?? "",
        city: input.city ?? "",
        cityAr: input.cityAr,
        address: input.address ?? "",
        addressAr: input.addressAr,
        taxId: input.taxId,
        paymentTermId: input.defaultPaymentTermId ?? input.paymentTermId ?? "",
        offersCount: 0,
        totalValue: 0,
      }
      db.customers.unshift(customer)
      return customer
    },
  },
  {
    method: "PUT",
    segments: ["customers", ":id"],
    handle: ({ params, body }) => {
      const customer = findCustomer(params[0])
      if (!customer) throw new ApiError("Customer not found", 404)
      const input = body as any
      const code = input.customerCode ?? input.code
      if (code) {
        customer.code = code
        customer.customerCode = code
      }
      customer.name = input.name ?? customer.name
      customer.nameAr = input.nameAr ?? customer.nameAr
      customer.erpNextId = input.erpNextId ?? customer.erpNextId
      customer.contactPerson = input.contactPerson ?? customer.contactPerson
      customer.contactPersonAr =
        input.contactPersonAr ?? customer.contactPersonAr
      customer.email = input.email ?? customer.email
      customer.phone = input.phone ?? customer.phone
      customer.city = input.city ?? customer.city
      customer.cityAr = input.cityAr ?? customer.cityAr
      customer.address = input.address ?? customer.address
      customer.addressAr = input.addressAr ?? customer.addressAr
      customer.taxId = input.taxId ?? customer.taxId
      customer.paymentTermId =
        input.defaultPaymentTermId ??
        input.paymentTermId ??
        customer.paymentTermId
      return customer
    },
  },
  {
    method: "GET",
    segments: ["customers", ":id"],
    handle: ({ params }) => {
      const customer = findCustomer(params[0])
      if (!customer) throw new ApiError("Customer not found", 404)
      return customer
    },
  },
  {
    method: "GET",
    segments: ["customers", ":id", "offers"],
    handle: ({ params, query }) => {
      const page = pageOf(query) ?? { page: 1, pageSize: 20 }
      const offers = db.offers
        .filter((offer) => offer.customerId === params[0])
        .map(toListItem)
      return {
        items: offers.slice(
          (page.page - 1) * page.pageSize,
          page.page * page.pageSize,
        ),
        page: page.page,
        pageSize: page.pageSize,
        totalCount: offers.length,
        totalPages: Math.max(1, Math.ceil(offers.length / page.pageSize)),
      }
    },
  },
  {
    method: "GET",
    segments: ["materials"],
    handle: ({ query }) => listProducts(query),
  },
  {
    method: "GET",
    segments: ["products"],
    handle: ({ query }) => listProducts(query),
  },
  {
    method: "POST",
    segments: ["materials"],
    handle: ({ body }) => createProduct(body),
  },
  {
    method: "PUT",
    segments: ["materials", ":id"],
    handle: ({ params, body }) => updateProduct(params[0], body),
  },
  {
    method: "GET",
    segments: ["offers"],
    handle: ({ query }) => {
      const status = query.status ? String(query.status) : undefined
      const search = String(query.search ?? "").toLowerCase()
      const page = Math.max(1, Number(query.page ?? 1))
      const pageSize = Math.max(1, Number(query.pageSize ?? 20))

      const matches = db.offers.filter((offer) => {
        const matchesStatus =
          !status || status === "all" || offer.status === status
        const matchesSearch =
          !search ||
          `${offer.reference} ${offer.customerName}`
            .toLowerCase()
            .includes(search)
        return matchesStatus && matchesSearch
      })

      // Same envelope the real API sends.
      return {
        items: matches
          .slice((page - 1) * pageSize, page * pageSize)
          .map(toListItem),
        page,
        pageSize,
        totalCount: matches.length,
        totalPages: Math.max(1, Math.ceil(matches.length / pageSize)),
      }
    },
  },
  {
    method: "GET",
    segments: ["offers", "next-sequence"],
    handle: () => ({
      suggestedSequence: nextOfferSequence(),
      isFirstOffer: isFirstOffer(),
    }),
  },
  {
    method: "GET",
    segments: ["offers", ":id", "versions"],
    handle: ({ params }) => {
      const offer = findOffer(params[0])
      if (!offer) throw new ApiError("Offer not found")
      return offerVersions(offer.id).map(toListItem)
    },
  },
  {
    method: "GET",
    segments: ["offers", ":id"],
    handle: ({ params }) => {
      const offer = findOffer(params[0])
      if (!offer) throw new ApiError("Offer not found")
      return offer
    },
  },
  {
    method: "POST",
    segments: ["offers"],
    handle: ({ body }) => {
      const offer = structuredClone(body) as Offer
      if (offer.reference) {
        const exists = db.offers.some((o) => o.reference === offer.reference)
        if (exists) {
          throw new ApiError("Reference already exists", 409)
        }
      }
      offer.id = `offer-${Date.now()}`
      offer.createdAt = new Date().toISOString()
      offer.createdByName = sessionAccount().fullName
      db.offers.unshift(offer)
      return offer
    },
  },
  {
    method: "PATCH",
    segments: ["offers", ":id", "status"],
    handle: ({ params, body }) => {
      const status = (body as { status: OfferStatus }).status
      const offer = updateOfferStatus(params[0], status)
      if (!offer) throw new ApiError("Offer not found")
      return offer
    },
  },
  {
    method: "GET",
    segments: ["banks"],
    handle: ({ query }) => {
      const search = String(query.search ?? "").toLowerCase()
      const page = pageOf(query) ?? { page: 1, pageSize: 20 }
      const matches = db.banks
        .filter((bank) =>
          `${bank.bank} ${bank.branch} ${bank.accountNumber}`
            .toLowerCase()
            .includes(search),
        )
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      return {
        items: matches.slice(
          (page.page - 1) * page.pageSize,
          page.page * page.pageSize,
        ),
        page: page.page,
        pageSize: page.pageSize,
        totalCount: matches.length,
        totalPages: Math.max(1, Math.ceil(matches.length / page.pageSize)),
      }
    },
  },
  {
    method: "POST",
    segments: ["banks"],
    handle: ({ body }) => {
      const input = body as Partial<BankAccount>
      const bank: BankAccount = {
        ...input,
        id: `bank-${Date.now()}`,
        bank: input.bank ?? "",
        branch: input.branch ?? "",
        accountNumber: input.accountNumber ?? "",
        swift: input.swift ?? "",
        iban: input.iban ?? "",
        currency: input.currency || "EGP",
        sortOrder:
          input.sortOrder && input.sortOrder > 0
            ? input.sortOrder
            : db.banks.reduce(
                (max, item) => Math.max(max, item.sortOrder ?? 0),
                0,
              ) + 1,
        isActive: input.isActive ?? true,
      }
      db.banks.push(bank)
      return bank
    },
  },
  {
    method: "PUT",
    segments: ["banks", ":id"],
    handle: ({ params, body }) => {
      const bank = db.banks.find((item) => item.id === params[0])
      if (!bank) throw new ApiError("Bank account not found", 404)
      Object.assign(bank, body, { id: bank.id })
      return bank
    },
  },
  {
    method: "GET",
    segments: ["settings", "banks"],
    handle: () => db.banks,
  },
  {
    method: "GET",
    segments: ["package-types"],
    handle: () => db.packageTypes,
  },
  {
    method: "GET",
    segments: ["company"],
    handle: () => db.company,
  },
  {
    method: "GET",
    segments: ["catalog", "bootstrap"],
    handle: () => ({
      paymentTerms: [],
      packageTypes: db.packageTypes,
      bankAccounts: db.banks,
      companySettings: db.company,
      workspaceSettings: {
        defaultCurrency: "EGP",
        defaultTaxPercent: 14,
      },
    }),
  },
  {
    method: "GET",
    segments: ["settings"],
    handle: () => ({
      company: db.company,
      banks: db.banks,
      packageTypes: db.packageTypes,
      reminders: { remindBeforeExpiry: true, daysBeforeExpiry: 3 },
      defaultCurrency: "EGP",
      defaultTaxPercent: 14,
      defaultPaymentTermId: "bank-transfer-purchase-order",
    }),
  },
  {
    method: "GET",
    segments: ["users", "me"],
    handle: () => db.currentUser,
  },
  {
    method: "POST",
    segments: ["auth", "login"],
    handle: () => ({ token: "mock-token", user: sessionAccount() }),
  },
  {
    method: "GET",
    segments: ["auth", "me"],
    handle: () => sessionAccount(),
  },
  ...userRoutes,
]

function listProducts(query: Query) {
  const search = String(query.search ?? "")
  const category = String(query.category ?? "")
  const isActive =
    query.isActive === undefined ? undefined : String(query.isActive) === "true"
  const page = pageOf(query)

  const matches = db.products.filter(
    (product) =>
      (!category || product.category === category) &&
      (isActive === undefined || (product.isActive ?? true) === isActive),
  )
  const result = queryMaterials(matches, {
    search,
    page: page?.page ?? 1,
    pageSize: page?.pageSize ?? Math.max(1, matches.length),
  })
  return page ? result : result.items
}

function createProduct(body: unknown): Product {
  const input = body as any
  const product: Product = {
    id: `prod-${Date.now()}`,
    code: input.itemCode ?? input.code ?? "",
    itemCode: input.itemCode ?? input.code ?? "",
    erpNextItemCode: input.erpNextItemCode,
    name: input.name ?? "",
    category: input.category ?? "",
    defaultPackageTypeId: input.defaultPackageTypeId ?? "",
    defaultWeightKg: input.defaultWeightKg ?? 0,
    referencePrice: input.referencePricePerKg ?? input.referencePrice ?? 0,
    uom: input.uom ?? "kg",
    isActive: input.isActive ?? true,
    specifications: input.specifications,
  }
  db.products.unshift(product)
  return product
}

function updateProduct(id: string, body: unknown): Product {
  const product = db.products.find((item) => item.id === id)
  if (!product) throw new ApiError("Material not found", 404)
  const input = body as any
  const code = input.itemCode ?? input.code
  if (code) {
    product.code = code
    product.itemCode = code
  }
  product.erpNextItemCode = input.erpNextItemCode ?? product.erpNextItemCode
  product.name = input.name ?? product.name
  product.category = input.category ?? product.category
  product.defaultPackageTypeId =
    input.defaultPackageTypeId ?? product.defaultPackageTypeId
  product.defaultWeightKg = input.defaultWeightKg ?? product.defaultWeightKg
  product.referencePrice =
    input.referencePricePerKg ?? input.referencePrice ?? product.referencePrice
  product.uom = input.uom ?? product.uom
  product.isActive = input.isActive ?? product.isActive
  product.specifications = input.specifications ?? product.specifications
  return product
}

type RouteMatch = {
  route: Route
  params: string[]
}

function matchRoute(method: string, segments: string[]): RouteMatch | null {
  for (const route of routes) {
    if (route.method !== method) continue
    if (route.segments.length !== segments.length) continue

    const params: string[] = []
    let matched = true

    for (let index = 0; index < route.segments.length; index += 1) {
      const pattern = route.segments[index]
      const value = segments[index]
      if (pattern.startsWith(":")) {
        params.push(value)
        continue
      }
      if (pattern !== value) {
        matched = false
        break
      }
    }

    if (matched) return { route, params }
  }

  return null
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** Mock transport: resolves requests from the in-memory database. */
export const createMockTransport = (): Transport => {
  return async (path: string, options: ApiRequestOptions = {}) => {
    await delay(LATENCY_MS)

    const method = options.method ?? "GET"
    const segments = path.split("/").filter(Boolean)
    const matched = matchRoute(method, segments)

    if (!matched) {
      throw new ApiError(`No mock route for ${method} ${path}`, 404)
    }

    return matched.route.handle({
      params: matched.params,
      query: options.query ?? {},
      body: options.body,
    })
  }
}
