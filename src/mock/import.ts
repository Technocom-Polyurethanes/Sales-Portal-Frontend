import type {
  ImportHistoryItem,
  ImportHistoryPage,
  ImportPreview,
  ImportResult,
  ImportRow,
  ImportSource,
  ImportSummary,
} from "../features/import/types"
import { ApiError } from "../lib/api/types"
import { PAYMENT_TERMS } from "../lib/calculations/dueDate"
import { IMPORT_COLUMNS } from "../lib/import/columns"
import { parseCsv } from "../lib/import/csv"
import { buildPreview } from "../lib/import/preview"
import { db } from "./db"
import { applyImport } from "./importApply"

const MAX_FILE_BYTES = 5 * 1024 * 1024
const MAX_ROWS = 5000

type Batch = {
  id: string
  source: ImportSource
  fileName: string
  createdAt: string
  committedAt?: string
  rows: ImportRow[]
  targets: Record<number, string>
  result?: ImportResult
}

const batches: Batch[] = []

const paymentTerms = PAYMENT_TERMS.map((term) => ({
  id: term.id,
  code: term.id,
  label: term.label,
  labelAr: term.labelAr,
}))

function customers() {
  return db.customers.map((customer) => ({
    id: customer.id,
    customerCode: customer.customerCode ?? customer.code,
    erpNextId: customer.erpNextId ?? null,
    name: customer.name,
    nameAr: customer.nameAr ?? null,
    taxId: customer.taxId ?? null,
    contactPerson: customer.contactPerson,
    contactPersonAr: customer.contactPersonAr ?? null,
    email: customer.email,
    phone: customer.phone,
    city: customer.city,
    cityAr: customer.cityAr ?? null,
    address: customer.address,
    addressAr: customer.addressAr ?? null,
    defaultPaymentTermId: customer.paymentTermId,
    defaultCurrency: "EGP",
  }))
}

function materials() {
  return db.products.map((product) => ({
    id: product.id,
    itemCode: product.itemCode ?? product.code,
    erpNextItemCode: product.erpNextItemCode ?? null,
    name: product.name,
    category: product.category,
    referencePricePerKg: product.referencePrice ?? null,
    uom: "kg",
    isActive: true,
    defaultWeightKg: product.defaultWeightKg,
  }))
}

function bankAccounts() {
  return db.banks.map((account) => ({
    id: account.id,
    bank: account.bank,
    bankAr: account.bankAr ?? null,
    branch: account.branch,
    branchAr: account.branchAr ?? null,
    accountHolderName: account.accountHolderName ?? null,
    accountHolderNameAr: account.accountHolderNameAr ?? null,
    accountNumber: account.accountNumber,
    swift: account.swift ?? null,
    iban: account.iban ?? null,
    currency: account.currency,
    isActive: account.isActive !== false,
    sortOrder: account.sortOrder ?? 0,
  }))
}

function summarize(rows: ImportRow[]): ImportSummary {
  const count = (status: ImportRow["status"]) =>
    rows.filter((row) => row.status === status).length
  return {
    total: rows.length,
    new: count("new"),
    update: count("update"),
    unchanged: count("unchanged"),
    error: count("error"),
  }
}

export function template(source: ImportSource): string {
  return `${IMPORT_COLUMNS[source].join(",")}\r\n`
}

export async function preview(
  source: ImportSource,
  body: unknown,
): Promise<ImportPreview> {
  const file = body instanceof FormData ? body.get("file") : null
  if (!(file instanceof File) || file.size === 0) {
    throw new ApiError("Choose a file to import.", 400)
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new ApiError("The file is larger than 5 MB.", 400)
  }
  if (!file.name.toLowerCase().endsWith(".csv")) {
    // shortcut: the mock reads CSV only, xlsx goes through the real API.
    throw new ApiError("The mock accepts .csv files only.", 400)
  }

  const parsed = parseCsv(await file.text())
  if (parsed.length === 0) {
    throw new ApiError("The file has no data rows.", 400)
  }
  if (parsed.length > MAX_ROWS) {
    throw new ApiError(
      `The file has more than ${MAX_ROWS.toLocaleString()} rows. Split it and import again.`,
      400,
    )
  }

  const built = buildPreview(source, {
    rows: parsed,
    customers: customers(),
    materials: materials(),
    bankAccounts: bankAccounts(),
    paymentTerms,
  })

  const batch: Batch = {
    id: `import-${Date.now()}`,
    source,
    fileName: file.name,
    createdAt: new Date().toISOString(),
    rows: built.rows,
    targets: built.targets,
  }
  batches.unshift(batch)

  return {
    importId: batch.id,
    summary: summarize(built.rows),
    rows: built.rows,
  }
}

export function commit(importId: string): ImportResult {
  const batch = batches.find((candidate) => candidate.id === importId)
  if (!batch) throw new ApiError("Import not found.", 404)
  if (batch.result) return batch.result

  let created = 0
  let updated = 0
  let skipped = 0
  let failed = 0

  for (const row of batch.rows) {
    if (row.status === "error") {
      failed += 1
      continue
    }
    if (row.status === "unchanged") {
      skipped += 1
      continue
    }

    const targetId = batch.targets[row.rowNumber]
    const applied = applyImport(batch.source, row, targetId, batch.id)
    if (!applied) failed += 1
    else if (row.status === "new") created += 1
    else updated += 1
  }

  batch.committedAt = new Date().toISOString()
  batch.result = { importId, created, updated, skipped, failed }
  return batch.result
}

export function history(page = 1, pageSize = 10): ImportHistoryPage {
  const items: ImportHistoryItem[] = batches
    .filter((batch) => batch.committedAt)
    .sort((left, right) => right.committedAt!.localeCompare(left.committedAt!))
    .map((batch) => ({
      id: batch.id,
      type: batch.source,
      fileName: batch.fileName,
      createdByName: db.currentUser.name,
      createdAt: batch.createdAt,
      committedAt: batch.committedAt,
      created: batch.result?.created ?? 0,
      updated: batch.result?.updated ?? 0,
      skipped: batch.result?.skipped ?? 0,
      failed: batch.result?.failed ?? 0,
    }))

  return {
    items: items.slice((page - 1) * pageSize, page * pageSize),
    page,
    pageSize,
    totalCount: items.length,
    totalPages: Math.max(1, Math.ceil(items.length / pageSize)),
  }
}
