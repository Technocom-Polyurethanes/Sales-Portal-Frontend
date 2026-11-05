import type {
  BankAccountRecord,
  CustomerRecord,
  MaterialRecord,
  PreviewInput,
} from "./columns"

export function findCustomer(
  input: PreviewInput,
  code: string | null,
  erpNextId: string | null,
) {
  const byCode = code
    ? input.customers.find(
        (customer) =>
          customer.customerCode.toLowerCase() === code.toLowerCase(),
      )
    : undefined
  if (byCode) return byCode

  return erpNextId
    ? input.customers.find(
        (customer) =>
          customer.erpNextId?.toLowerCase() === erpNextId.toLowerCase(),
      )
    : undefined
}

export function findMaterial(
  input: PreviewInput,
  code: string | null,
  erpCode: string | null,
) {
  const byCode = code
    ? input.materials.find(
        (material) => material.itemCode.toLowerCase() === code.toLowerCase(),
      )
    : undefined
  if (byCode) return byCode

  return erpCode
    ? input.materials.find(
        (material) =>
          material.erpNextItemCode?.toLowerCase() === erpCode.toLowerCase(),
      )
    : undefined
}

export function findBankAccount(
  input: PreviewInput,
  accountNumber: string | null,
) {
  if (!accountNumber) return undefined
  const wanted = accountNumber.trim().toLowerCase()
  return input.bankAccounts.find(
    (account) => account.accountNumber.trim().toLowerCase() === wanted,
  )
}

export function customerSnapshot(
  customer: CustomerRecord,
  input: PreviewInput,
): Record<string, string | null> {
  const term = input.paymentTerms.find(
    (candidate) => candidate.id === customer.defaultPaymentTermId,
  )
  return {
    customerCode: customer.customerCode,
    erpNextId: customer.erpNextId ?? null,
    name: customer.name,
    nameAr: customer.nameAr ?? null,
    taxId: customer.taxId ?? null,
    contactPerson: customer.contactPerson ?? null,
    contactPersonAr: customer.contactPersonAr ?? null,
    email: customer.email ?? null,
    phone: customer.phone ?? null,
    city: customer.city ?? null,
    cityAr: customer.cityAr ?? null,
    address: customer.address,
    addressAr: customer.addressAr ?? null,
    defaultPaymentTerm: term?.label ?? null,
    defaultCurrency: customer.defaultCurrency,
  }
}

export function materialSnapshot(
  material: MaterialRecord,
): Record<string, string | null> {
  return {
    itemCode: material.itemCode,
    erpNextItemCode: material.erpNextItemCode ?? null,
    name: material.name,
    category: material.category,
    referencePricePerKg: formatNumber(material.referencePricePerKg),
    uom: material.uom ?? null,
    isActive: material.isActive === false ? "false" : "true",
    defaultWeightKg: formatNumber(material.defaultWeightKg),
  }
}

export function bankAccountSnapshot(
  account: BankAccountRecord,
): Record<string, string | null> {
  return {
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
    isActive: account.isActive === false ? "false" : "true",
    sortOrder: account.sortOrder == null ? null : String(account.sortOrder),
  }
}

export function formatNumber(value: number | null | undefined): string | null {
  return value == null ? null : String(value)
}
