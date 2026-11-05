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
