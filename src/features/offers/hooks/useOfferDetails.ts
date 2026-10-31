import { useAsyncData } from "../../../lib/hooks/useAsyncData"
import { customersApi } from "../../customers/api"
import type { Customer } from "../../customers/types"
import { settingsApi } from "../../settings/api"
import type {
  BankAccount,
  CompanySettings,
  PackageType,
} from "../../settings/types"
import { offersApi } from "../api"
import type { Offer, OfferListItem } from "../types"

export type OfferDetailsData = {
  offer: Offer
  versions: OfferListItem[]
  customer: Customer | undefined
  company: CompanySettings
  banks: BankAccount[]
  packageTypes: PackageType[]
}

/** Loads an offer with its versions, customer and document settings. */
export function useOfferDetails(id: string | undefined) {
  return useAsyncData<OfferDetailsData>(async () => {
    if (!id) {
      throw new Error("Missing offer id")
    }
    const offer = await offersApi.get(id)

    const [versions, customer, settings] = await Promise.all([
      offersApi.versions(offer.id).catch(() => [] as OfferListItem[]),
      offer.customerId
        ? customersApi.get(offer.customerId).catch(() => undefined)
        : Promise.resolve(undefined),
      settingsApi.load().catch(() => ({
        company: {} as CompanySettings,
        banks: [] as BankAccount[],
        packageTypes: [] as PackageType[],
      })),
    ])

    // Ensure versions are sorted newest first if not already
    const sortedVersions = [...versions].sort((a, b) => {
      const av = (a as any).version ?? 0
      const bv = (b as any).version ?? 0
      if (bv !== av) return bv - av
      const ad = (a as any).issueDate || (a as any).createdAt || ""
      const bd = (b as any).issueDate || (b as any).createdAt || ""
      return bd.localeCompare(ad)
    })

    return {
      offer,
      versions: sortedVersions,
      customer,
      company: settings.company,
      banks: settings.banks,
      packageTypes: settings.packageTypes,
    }
  }, [id])
}
