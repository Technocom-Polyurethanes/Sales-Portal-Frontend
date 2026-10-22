import type { Customer } from "../features/customers/types"
import type { Offer, OfferStatus } from "../features/offers/types"
import type { Product } from "../features/products/types"
import type {
  BankAccount,
  CompanySettings,
  PackageType,
  WorkspaceSettings,
} from "../features/settings/types"
import { banks, company } from "./data/company"
import { customers } from "./data/customers"
import { offers } from "./data/offers"
import { packageTypes } from "./data/packageTypes"
import { products } from "./data/products"
import { currentUser, workspaceUsers } from "./data/users"

const clone = <T>(value: T): T => structuredClone(value)

export type Database = {
  customers: Customer[]
  products: Product[]
  offers: Offer[]
  banks: BankAccount[]
  packageTypes: PackageType[]
  company: CompanySettings
  users: typeof workspaceUsers
  currentUser: typeof currentUser
}

/** In-memory database seeded with the sample data of `src/mock/data`. */
export const db: Database = {
  customers: clone(customers),
  products: clone(products),
  offers: clone(offers),
  banks: clone(banks),
  packageTypes: clone(packageTypes),
  company: clone(company),
  users: clone(workspaceUsers),
  currentUser: clone(currentUser),
}

export function findCustomer(id: string): Customer | undefined {
  return db.customers.find((customer) => customer.id === id)
}

export function findOffer(id: string): Offer | undefined {
  return db.offers.find((offer) => offer.id === id)
}

export function updateOfferStatus(
  id: string,
  status: OfferStatus,
): Offer | undefined {
  const offer = findOffer(id)
  if (!offer) return undefined
  offer.status = status
  return offer
}
