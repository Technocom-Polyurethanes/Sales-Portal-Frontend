import type { ImportRow, ImportSource } from "../../features/import/types"
import type { ParsedRow } from "./csv"

/** Template columns, in template order. Shared with the mock and the preview table. */
export const IMPORT_COLUMNS: Record<ImportSource, string[]> = {
  customers: [
    "customerCode",
    "erpNextId",
    "name",
    "nameAr",
    "taxId",
    "contactPerson",
    "contactPersonAr",
    "email",
    "phone",
    "city",
    "cityAr",
    "address",
    "addressAr",
    "defaultPaymentTerm",
    "defaultCurrency",
  ],
  materials: [
    "itemCode",
    "erpNextItemCode",
    "name",
    "category",
    "referencePricePerKg",
    "uom",
    "isActive",
    "defaultWeightKg",
  ],
  prices: ["itemCode", "referencePricePerKg"],
  "bank-accounts": [
    "bank",
    "bankAr",
    "branch",
    "branchAr",
    "accountHolderName",
    "accountHolderNameAr",
    "accountNumber",
    "swift",
    "iban",
    "currency",
    "isActive",
    "sortOrder",
  ],
}

/** The fields shown in the preview table for each source. */
export const IDENTIFIER_FIELD: Record<ImportSource, string> = {
  customers: "customerCode",
  materials: "itemCode",
  prices: "itemCode",
  "bank-accounts": "accountNumber",
}

export const NAME_FIELD: Record<ImportSource, string> = {
  customers: "name",
  materials: "name",
  prices: "referencePricePerKg",
  "bank-accounts": "bank",
}

export type CustomerRecord = {
  id: string
  customerCode: string
  erpNextId?: string | null
  name: string
  nameAr?: string | null
  taxId?: string | null
  contactPerson?: string | null
  contactPersonAr?: string | null
  email?: string | null
  phone?: string | null
  city?: string | null
  cityAr?: string | null
  address: string
  addressAr?: string | null
  defaultPaymentTermId?: string | null
  defaultCurrency: string
}

export type MaterialRecord = {
  id: string
  itemCode: string
  erpNextItemCode?: string | null
  name: string
  category: string
  referencePricePerKg?: number | null
  uom?: string | null
  isActive?: boolean
  defaultWeightKg?: number
}

export type BankAccountRecord = {
  id: string
  bank: string
  bankAr?: string | null
  branch: string
  branchAr?: string | null
  accountHolderName?: string | null
  accountHolderNameAr?: string | null
  accountNumber: string
  swift?: string | null
  iban?: string | null
  currency: string
  isActive?: boolean
  sortOrder?: number
}

export type PaymentTermRecord = {
  id: string
  code: string
  label: string
  labelAr?: string | null
}

export type PreviewInput = {
  rows: ParsedRow[]
  customers: CustomerRecord[]
  materials: MaterialRecord[]
  bankAccounts: BankAccountRecord[]
  paymentTerms: PaymentTermRecord[]
}

export type PreviewOutput = {
  rows: ImportRow[]
  /** Row number -> id of the record the commit must update. */
  targets: Record<number, string>
}
