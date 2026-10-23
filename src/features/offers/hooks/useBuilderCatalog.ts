import { useAsyncData } from "../../../lib/hooks/useAsyncData"
import { customersApi } from "../../customers/api"
import type { Customer } from "../../customers/types"
import { productsApi } from "../../products/api"
import type { Product } from "../../products/types"
import { settingsApi } from "../../settings/api"
import type {
  BankAccount,
  CompanySettings,
  PackageType,
} from "../../settings/types"
import { offersApi } from "../api"

/** Everything the builder needs to know about the workspace. */
export type BuilderCatalog = {
  customers: Customer[]
  products: Product[]
  packageTypes: PackageType[]
  company: CompanySettings
  banks: BankAccount[]
  sequence: number
}

/** Loads the catalogue used by the offer builder in one round trip. */
export function useBuilderCatalog() {
  return useAsyncData<BuilderCatalog>(async () => {
    const [customers, products, settings, sequence] = await Promise.all([
      customersApi.list(),
      productsApi.list(),
      settingsApi.load(),
      offersApi.nextSequence(),
    ])

    return {
      customers,
      products,
      packageTypes: settings.packageTypes,
      company: settings.company,
      banks: settings.banks,
      sequence,
    }
  }, [])
}
