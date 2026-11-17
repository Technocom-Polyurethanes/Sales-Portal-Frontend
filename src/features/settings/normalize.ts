import type {
  BankAccount,
  CompanySettings,
  PackageType,
  PaymentTerm,
  WorkspaceSettings,
} from "./types"

/** First candidate that is an array, so a missing list never reaches `.filter`. */
function firstArray<T>(...candidates: unknown[]): T[] {
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate as T[]
  }
  return []
}

/**
 * Builds the workspace settings the screens expect from what the server sends.
 *
 * `GET /settings` answers `{ company, workspace: { bankAccounts, ... } }` and
 * `GET /catalog/bootstrap` answers `{ bankAccounts, packageTypes, companySettings, ... }`.
 * Both are merged here so `banks`, `packageTypes` and `paymentTerms` are always arrays.
 */
export function normalizeSettings(
  settings: any,
  bootstrap?: any,
): WorkspaceSettings {
  const workspace =
    settings?.workspace ??
    settings?.workspaceSettings ??
    bootstrap?.workspaceSettings ??
    {}

  return {
    company: (settings?.company ??
      bootstrap?.companySettings ??
      bootstrap?.company ??
      {}) as CompanySettings,
    banks: firstArray<BankAccount>(
      settings?.banks,
      workspace.bankAccounts,
      bootstrap?.bankAccounts,
      bootstrap?.banks,
    ),
    packageTypes: firstArray<PackageType>(
      settings?.packageTypes,
      bootstrap?.packageTypes,
    ),
    paymentTerms: firstArray<PaymentTerm>(
      settings?.paymentTerms,
      bootstrap?.paymentTerms,
    ),
    reminders: settings?.reminders ?? {
      remindBeforeExpiry: workspace.remindBeforeExpiry ?? false,
      daysBeforeExpiry: workspace.daysBeforeExpiry ?? 0,
    },
    defaultCurrency:
      settings?.defaultCurrency ?? workspace.defaultCurrency ?? "EGP",
    defaultTaxPercent:
      settings?.defaultTaxPercent ?? workspace.defaultTaxPercent ?? 0,
    defaultPaymentTermId:
      settings?.defaultPaymentTermId ?? workspace.defaultPaymentTermId ?? "",
  }
}
