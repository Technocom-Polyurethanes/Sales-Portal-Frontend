import type { BankAccount } from "../settings/types"

/** Active accounts in their configured order. */
export function activeBanks(banks: BankAccount[]): BankAccount[] {
  return banks
    .filter((bank) => bank.isActive !== false)
    .sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0))
}

/** Default selection of a new offer. */
export function activeBankIds(banks: BankAccount[]): string[] {
  return activeBanks(banks).map((bank) => bank.id)
}

/** The accounts printed on an offer; null means every account in the catalog. */
export function banksForOffer(
  banks: BankAccount[],
  ids: string[] | null | undefined,
): BankAccount[] {
  if (ids == null) return banks
  const selected = new Set(ids)
  return banks.filter((bank) => selected.has(bank.id))
}

export function toggleBank(ids: string[], id: string): string[] {
  return ids.includes(id)
    ? ids.filter((item) => item !== id)
    : [...ids, id]
}

export function setAllBanks(selected: boolean, banks: BankAccount[]): string[] {
  return selected ? activeBankIds(banks) : []
}

export function hasBankSelection(ids: string[]): boolean {
  return ids.length > 0
}

export type BankLabels = { name: string; branch: string }

export function bankLabels(bank: BankAccount, language: string): BankLabels {
  const arabic = language === "ar"
  return {
    name: (arabic ? bank.bankAr || bank.bank : bank.bank) ?? "",
    branch: (arabic ? bank.branchAr || bank.branch : bank.branch) ?? "",
  }
}

/** Banks matching a search text (bank, branch, account, IBAN) and an optional currency. */
export function filterBanks(
  banks: BankAccount[],
  query: string,
  currency: string | null,
): BankAccount[] {
  const needle = query.trim().toLowerCase()
  return banks.filter((bank) => {
    if (currency && bank.currency !== currency) return false
    if (!needle) return true
    return [
      bank.bank,
      bank.bankAr,
      bank.branch,
      bank.branchAr,
      bank.accountNumber,
      bank.iban,
      bank.accountHolderName,
    ].some((value) => value?.toLowerCase().includes(needle))
  })
}

/** Adds or removes only the given banks, leaving the rest of the selection alone. */
export function setBanks(
  ids: string[],
  targets: BankAccount[],
  selected: boolean,
): string[] {
  const targetIds = new Set(targets.map((bank) => bank.id))
  if (!selected) return ids.filter((id) => !targetIds.has(id))
  const have = new Set(ids)
  return [...ids, ...targets.map((bank) => bank.id).filter((id) => !have.has(id))]
}
