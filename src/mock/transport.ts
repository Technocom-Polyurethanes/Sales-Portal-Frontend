import type { ApiRequestOptions, Query, Transport } from "../lib/api/types"
import { ApiError } from "../lib/api/types"
import type { Offer, OfferStatus } from "../features/offers/types"
import {
  db,
  findCustomer,
  findOffer,
  nextOfferSequence,
  offerVersions,
  updateOfferStatus,
} from "./db"

const LATENCY_MS = 120

type RouteContext = {
  params: string[]
  query: Query
  body: unknown
}

type Route = {
  method: string
  segments: string[]
  handle: (context: RouteContext) => unknown
}

const routes: Route[] = [
  {
    method: "GET",
    segments: ["customers"],
    handle: ({ query }) => {
      const search = String(query.search ?? "").toLowerCase()
      return db.customers.filter((customer) =>
        `${customer.name} ${customer.code} ${customer.contactPerson}`
          .toLowerCase()
          .includes(search),
      )
    },
  },
  {
    method: "GET",
    segments: ["customers", ":id"],
    handle: ({ params }) => {
      const customer = findCustomer(params[0])
      if (!customer) throw new ApiError("Customer not found")
      return customer
    },
  },
  {
    method: "GET",
    segments: ["customers", ":id", "offers"],
    handle: ({ params }) =>
      db.offers.filter((offer) => offer.customerId === params[0]),
  },
  {
    method: "GET",
    segments: ["products"],
    handle: ({ query }) => {
      const search = String(query.search ?? "").toLowerCase()
      return db.products.filter((product) =>
        `${product.name} ${product.code} ${product.category}`
          .toLowerCase()
          .includes(search),
      )
    },
  },
  {
    method: "GET",
    segments: ["offers"],
    handle: ({ query }) => {
      const status = query.status ? String(query.status) : undefined
      const search = String(query.search ?? "").toLowerCase()

      return db.offers.filter((offer) => {
        const matchesStatus =
          !status || status === "all" || offer.status === status
        const matchesSearch =
          !search ||
          `${offer.reference} ${offer.customerName}`
            .toLowerCase()
            .includes(search)
        return matchesStatus && matchesSearch
      })
    },
  },
  {
    method: "GET",
    segments: ["offers", "next-sequence"],
    handle: () => nextOfferSequence(),
  },
  {
    method: "GET",
    segments: ["offers", ":id", "versions"],
    handle: ({ params }) => {
      const offer = findOffer(params[0])
      if (!offer) throw new ApiError("Offer not found")
      return offerVersions(offer.id)
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
]

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
