import "@/mock"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { banksApi } from "../features/banks/api"
import { customersApi } from "../features/customers/api"
import { offersApi } from "../features/offers/api"
import { productsApi } from "../features/products/api"
import { usersApi } from "../features/users/api"
import { db } from "./db"

const TARGETS = ["customers", "materials", "banks", "offers", "users"] as const
type Target = typeof TARGETS[number]

const initial = {
  customers: structuredClone(db.customers),
  products: structuredClone(db.products),
  banks: structuredClone(db.banks),
  offers: structuredClone(db.offers),
  accounts: structuredClone(db.accounts),
}

const remove = (target: Target) => {
  if (target === "users") {
    const other =
      db.session.userId === "acct-admin" ? "acct-sales" : "acct-admin"
    return usersApi.delete(other)
  }
  if (target === "customers") return customersApi.delete(db.customers[0].id)
  if (target === "materials") return productsApi.delete(db.products[0].id)
  if (target === "banks") return banksApi.delete(db.banks[0].id)
  return offersApi.delete(db.offers[0].id)
}

const ALLOWED: Record<string, readonly Target[]> = {
  "acct-admin": TARGETS,
  "acct-sales": ["customers", "materials", "banks", "offers"],
  "acct-accountant": ["customers", "materials", "banks"],
}

function reset() {
  db.customers = structuredClone(initial.customers)
  db.products = structuredClone(initial.products)
  db.banks = structuredClone(initial.banks)
  db.offers = structuredClone(initial.offers)
  db.accounts = structuredClone(initial.accounts)
}

describe("mock delete endpoints", () => {
  beforeEach(reset)

  afterEach(() => {
    db.session.userId = "acct-admin"
  })

  it.each(Object.entries(ALLOWED))(
    "%s can delete only their allowed records",
    async (userId, allowed) => {
      db.session.userId = userId

      for (const target of TARGETS) {
        reset()
        db.session.userId = userId
        if (allowed.includes(target)) {
          await expect(remove(target)).resolves.toBeUndefined()
        } else {
          await expect(remove(target)).rejects.toMatchObject({ status: 403 })
        }
      }
    },
  )

  it("deletes every version of an offer chain", async () => {
    db.session.userId = "acct-admin"
    const parent = db.offers[0]
    const child = {
      ...structuredClone(parent),
      id: "offer-child",
      parentOfferId: parent.id,
      rootOfferId: parent.id,
      version: 2,
    }
    db.offers.push(child)

    await expect(offersApi.delete(child.id)).resolves.toBeUndefined()

    expect(
      db.offers.some(
        (offer) => offer.id === parent.id || offer.id === child.id,
      ),
    ).toBe(false)
  })

  it("deleting a customer removes their offers", async () => {
    db.session.userId = "acct-admin"
    const customerId = db.offers[0].customerId

    await expect(customersApi.delete(customerId)).resolves.toBeUndefined()

    expect(db.customers.some((customer) => customer.id === customerId)).toBe(
      false,
    )
    expect(db.offers.some((offer) => offer.customerId === customerId)).toBe(
      false,
    )
  })

  it("deleting a material removes offers that used it", async () => {
    db.session.userId = "acct-admin"
    const productId = db.offers[0].lines[0].productId!

    await expect(productsApi.delete(productId)).resolves.toBeUndefined()

    expect(
      db.offers.some((offer) =>
        offer.lines.some((line) => line.productId === productId),
      ),
    ).toBe(false)
  })
})
