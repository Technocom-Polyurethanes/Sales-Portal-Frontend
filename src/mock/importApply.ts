import type { Customer } from "../features/customers/types"
import type { ImportRow, ImportSource } from "../features/import/types"
import type { Product } from "../features/products/types"
import { PAYMENT_TERMS } from "../lib/calculations/dueDate"
import { db } from "./db"

/** Writes one preview row into the in-memory database. */
export function applyImport(
  source: ImportSource,
  row: ImportRow,
  targetId: string | undefined,
  batchId: string,
): boolean {
  const value = (field: string) => row.values[field] ?? null
  const amount = (field: string) => {
    const text = value(field)
    if (text == null || text.trim() === "") return null
    const parsed = Number(text)
    return Number.isFinite(parsed) ? parsed : null
  }

  if (source === "customers") {
    let customer = db.customers.find((item) => item.id === targetId)
    if (!customer) {
      customer = emptyCustomer(batchId, row.rowNumber)
      db.customers.push(customer)
    }
    const code = value("customerCode") ?? customer.customerCode ?? customer.code
    customer.customerCode = code
    customer.code = code
    customer.erpNextId = value("erpNextId") ?? customer.erpNextId
    customer.name = value("name") ?? customer.name
    customer.nameAr = value("nameAr") ?? customer.nameAr
    customer.taxId = value("taxId") ?? customer.taxId
    customer.contactPerson = value("contactPerson") ?? customer.contactPerson
    customer.contactPersonAr =
      value("contactPersonAr") ?? customer.contactPersonAr
    customer.email = value("email") ?? customer.email
    customer.phone = value("phone") ?? customer.phone
    customer.city = value("city") ?? customer.city
    customer.cityAr = value("cityAr") ?? customer.cityAr
    customer.address = value("address") ?? customer.address
    customer.addressAr = value("addressAr") ?? customer.addressAr

    const term = PAYMENT_TERMS.find(
      (candidate) => candidate.label === value("defaultPaymentTerm"),
    )
    customer.paymentTermId = term?.id ?? customer.paymentTermId
    return true
  }

  let product = db.products.find((item) => item.id === targetId)
  if (!product) {
    if (source === "prices") return false
    product = emptyProduct(batchId, row.rowNumber)
    db.products.push(product)
  }

  const price = amount("referencePricePerKg")
  if (price != null) product.referencePrice = price
  if (source === "prices") return price != null

  product.code = value("itemCode") ?? product.code
  product.itemCode = product.code
  product.erpNextItemCode = value("erpNextItemCode") ?? product.erpNextItemCode
  product.name = value("name") ?? product.name
  product.category = value("category") ?? product.category
  const weight = amount("defaultWeightKg")
  if (weight != null) product.defaultWeightKg = weight
  return true
}

function emptyCustomer(batchId: string, rowNumber: number): Customer {
  return {
    id: `${batchId}-customer-${rowNumber}`,
    code: "",
    customerCode: "",
    name: "",
    contactPerson: "",
    email: "",
    phone: "",
    city: "",
    address: "",
    paymentTermId: PAYMENT_TERMS[0].id,
    offersCount: 0,
    totalValue: 0,
  }
}

function emptyProduct(batchId: string, rowNumber: number): Product {
  return {
    id: `${batchId}-product-${rowNumber}`,
    code: "",
    name: "",
    category: "Polyol",
    defaultPackageTypeId: db.packageTypes[0]?.id ?? "drum",
    defaultWeightKg: 0,
    referencePrice: 0,
  }
}
