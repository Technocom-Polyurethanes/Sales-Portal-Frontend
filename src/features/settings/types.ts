export type BankAccount = {
  id: string
  bank: string
  bankAr?: string
  branch: string
  branchAr?: string
  accountNumber: string
  swift: string
  iban: string
  currency: string
  accountHolderName?: string
  accountHolderNameAr?: string
}

export type PackageType = {
  id: string
  name: string
  nameAr: string
  defaultWeightKg: number
  sizesKg: number[]
}

export type CompanySettings = {
  name: string
  nameAr: string
  tagline: string
  taglineAr: string
  formCode: string
  referencePrefix: string
  address: string
  phone: string
  email: string
  logoWidthMm: number
  logoHeightMm: number
}

export type ReminderSettings = {
  remindBeforeExpiry: boolean
  daysBeforeExpiry: number
}

export type PaymentTerm = {
  id: string
  code: string
  label: string
  labelAr: string
  days: number
}

export type WorkspaceSettings = {
  company: CompanySettings
  banks: BankAccount[]
  packageTypes: PackageType[]
  paymentTerms?: PaymentTerm[]
  reminders: ReminderSettings
  defaultCurrency: string
  defaultTaxPercent: number
  defaultPaymentTermId: string
}

