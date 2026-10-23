import type {
  BankAccount,
  CompanySettings,
} from "../../features/settings/types"

export const banks: BankAccount[] = [
  {
    id: "bank-1",
    bank: "QNB",
    branch: "Badr City",
    accountNumber: "002145890012",
    swift: "QNBAEGCX",
    iban: "EG12 QNBA 0021 4589 0012",
    currency: "EGP",
  },
  {
    id: "bank-2",
    bank: "SAIB",
    branch: "Shubra",
    accountNumber: "009871234567",
    swift: "SBNKEGCX",
    iban: "EG45 SAIB 0098 7123 4567",
    currency: "EGP",
  },
]

export const company: CompanySettings = {
  name: "TECHNOCOM",
  nameAr: "شركة تكنوكوم",
  tagline: "For Commercial Agencies",
  taglineAr: "للتوكيلات تجارية",
  formCode: "TF-06-01",
  referencePrefix: "YL",
  address: "Cairo, Egypt",
  phone: "+20 2 2456 7890",
  email: "sales@technocom.org",
  logoWidthMm: 55,
  logoHeightMm: 25,
}
