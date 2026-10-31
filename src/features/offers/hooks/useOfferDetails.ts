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
    const offer = await offersApi.get(id ?? "")

    const [versions, customer, settings] = await Promise.all([
      offersApi.versions(offer.id),
      offer.customerId
        ? customersApi.get(offer.customerId)
        : Promise.resolve(undefined),
      settingsApi.load(),
    ])

    return {
      offer,
      versions,
      customer,
      company: settings.company,
      banks: settings.banks,
      packageTypes: settings.packageTypes,
    }
  }, [id])
}
