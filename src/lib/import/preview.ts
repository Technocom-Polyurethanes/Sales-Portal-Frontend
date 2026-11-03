import type {
  ImportChange,
  ImportRow,
  ImportRowStatus,
  ImportSource,
} from "../../features/import/types"
import {
  IMPORT_COLUMNS,
  IDENTIFIER_FIELD,
  type CustomerRecord,
  type MaterialRecord,
  type PreviewInput,
  type PreviewOutput,
} from "./columns"
import {
  customerSnapshot,
  findCustomer,
  findMaterial,
  formatNumber,
  materialSnapshot,
} from "./snapshots"

const CATEGORIES = ["Polyol", "Iso", "System", "Additive"]
const CURRENCIES = ["EGP", "USD", "EUR", "GBP", "SAR", "AED", "KWD", "QAR"]

/** Mirrors the server preview: validation, matching and diff, all pure. */
export function buildPreview(
  source: ImportSource,
  input: PreviewInput,
): PreviewOutput {
  const rows: ImportRow[] = []
  const targets: Record<number, string> = {}
  const seen = new Set<string>()

  for (const parsed of input.rows) {
    const values = Object.fromEntries(
      IMPORT_COLUMNS[source].map((column) => [
        column,
        parsed.values[column] ?? null,
      ]),
    )
    const errors: string[] = []
    const changes: ImportChange[] = []
    let existing: Record<string, string | null> | null = null
    let targetId: string | undefined

    if (source === "customers") {
      const customer = findCustomer(
        input,
        values.customerCode,
        values.erpNextId,
      )
      targetId = customer?.id
      checkCustomer(customer, values, input, errors)
      if (customer) existing = customerSnapshot(customer, input)
    } else if (source === "materials") {
      const material = findMaterial(
        input,
        values.itemCode,
        values.erpNextItemCode,
      )
      targetId = material?.id
      checkMaterial(material, values, errors)
      if (material) existing = materialSnapshot(material)
    } else {
      const material = findMaterial(input, values.itemCode, null)
      targetId = material?.id
      if (values.itemCode && !material) {
        errors.push(`No material matches item code '${values.itemCode}'.`)
      }
      if (!values.referencePricePerKg) {
        errors.push("Reference price per kg is required.")
      }
      normalizeAmount(
        values,
        "referencePricePerKg",
        "Reference price per kg",
        errors,
      )
      if (material) {
        existing = {
          itemCode: material.itemCode,
          referencePricePerKg: formatNumber(material.referencePricePerKg),
        }
      }
    }

    const code = values[IDENTIFIER_FIELD[source]]
    if (code) {
      if (seen.has(code.toLowerCase())) {
        const label = source === "customers" ? "customer" : "item"
        errors.push(`Duplicate ${label} code '${code}' in this file.`)
      }
      seen.add(code.toLowerCase())
    } else {
      errors.push(
        source === "customers"
          ? "Customer code is required."
          : "Item code is required.",
      )
    }

    if (existing) diff(values, existing, changes)
    if (targetId) targets[parsed.rowNumber] = targetId

    const status: ImportRowStatus =
      errors.length > 0
        ? "error"
        : !existing
          ? "new"
          : changes.length === 0
            ? "unchanged"
            : "update"

    rows.push({
      rowNumber: parsed.rowNumber,
      status,
      errors,
      values,
      existing,
      changes,
    })
  }

  return { rows, targets }
}

function checkCustomer(
  customer: CustomerRecord | undefined,
  values: Record<string, string | null>,
  input: PreviewInput,
  errors: string[],
) {
  if (!customer) {
    if (!values.name) errors.push("Customer name is required.")
    if (!values.address) errors.push("Customer address is required.")
  }

  if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.push(`Email address '${values.email}' is not valid.`)
  }

  if (values.defaultCurrency) {
    const currency = values.defaultCurrency.toUpperCase()
    if (CURRENCIES.includes(currency)) values.defaultCurrency = currency
    else errors.push(`Unknown currency '${currency}'.`)
  } else if (!customer) {
    values.defaultCurrency = "EGP"
  }

  if (values.defaultPaymentTerm) {
    const wanted = values.defaultPaymentTerm.toLowerCase()
    const term = input.paymentTerms.find(
      (candidate) =>
        candidate.code.toLowerCase() === wanted ||
        candidate.label.toLowerCase() === wanted ||
        candidate.labelAr?.toLowerCase() === wanted,
    )
    if (!term) {
      errors.push(`Unknown payment term '${values.defaultPaymentTerm}'.`)
    } else {
      values.defaultPaymentTerm = term.label
    }
  }
}

function checkMaterial(
  material: MaterialRecord | undefined,
  values: Record<string, string | null>,
  errors: string[],
) {
  if (!material) {
    if (!values.name) errors.push("Material name is required.")
    if (!values.category) errors.push("Material category is required.")
  }

  if (values.category) {
    const canonical = CATEGORIES.find(
      (category) => category.toLowerCase() === values.category!.toLowerCase(),
    )
    if (canonical) values.category = canonical
    else {
      errors.push(
        `Category '${values.category}' is not valid. Use Polyol, Iso, System or Additive.`,
      )
    }
  }

  normalizeAmount(
    values,
    "referencePricePerKg",
    "Reference price per kg",
    errors,
  )
  normalizeAmount(values, "defaultWeightKg", "Default weight", errors)

  if (values.isActive) {
    const active = values.isActive.toLowerCase()
    if (["true", "yes", "1"].includes(active)) values.isActive = "true"
    else if (["false", "no", "0"].includes(active)) values.isActive = "false"
    else errors.push("Is active must be true or false.")
  } else if (!material) {
    values.isActive = "true"
  }

  if (!values.uom && !material) values.uom = "kg"
}

function normalizeAmount(
  values: Record<string, string | null>,
  field: string,
  label: string,
  errors: string[],
) {
  const text = values[field]
  if (!text) return

  const amount = Number(text)
  if (!Number.isFinite(amount)) {
    errors.push(`${label} must be a number.`)
  } else if (amount < 0) {
    errors.push(`${label} cannot be negative.`)
  } else {
    values[field] = formatNumber(amount)
  }
}

function diff(
  values: Record<string, string | null>,
  existing: Record<string, string | null>,
  changes: ImportChange[],
) {
  for (const [field, value] of Object.entries(values)) {
    if (value == null) continue
    const oldValue = existing[field] ?? null
    if (value !== oldValue) {
      changes.push({ field, oldValue, newValue: value })
    }
  }
}
