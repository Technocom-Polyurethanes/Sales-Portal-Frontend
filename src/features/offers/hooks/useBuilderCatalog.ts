import { useAsyncData } from "../../../lib/hooks/useAsyncData"
import { api } from "../../../lib/api/client"
import { customersApi } from "../../customers/api"
import type { Customer } from "../../customers/types"
import { productsApi } from "../../products/api"
import type { Product } from "../../products/types"
import { settingsApi } from "../../settings/api"
import type {
  BankAccount,
  CompanySettings,
  PackageType,
  PaymentTerm,
} from "../../settings/types"
import { offersApi } from "../api"

export type BuilderCatalog = {
  customers: Customer[]
  products: Product[]
  packageTypes: PackageType[]
  paymentTerms: PaymentTerm[]
  company: CompanySettings
  banks: BankAccount[]
  sequence: number
  workspaceSettings?: Record<string, unknown>
}

export function useBuilderCatalog() {
  return useAsyncData<BuilderCatalog>(async () => {
    try {
      const bootstrap: any = await api
        .get<any>("/catalog/bootstrap")
        .catch(() => api.get<any>("/settings/bootstrap"))
      const [customers, products, sequence] = await Promise.all([
        customersApi.list().catch(() => []),
        productsApi.list().catch(() => []),
        offersApi.nextSequence().catch(() => 1),
      ])

      return {
        customers: Array.isArray(customers) ? customers : [],
        products: Array.isArray(products) ? products : [],
        packageTypes:
          bootstrap.packageTypes ??
          bootstrap.packageTypesList ??
          bootstrap.packagingTypes ??
          [],
        paymentTerms: bootstrap.paymentTerms ?? [],
        company: bootstrap.companySettings ?? bootstrap.company ?? {},
        banks: bootstrap.bankAccounts ?? bootstrap.banks ?? [],
        sequence: typeof sequence === "number" ? sequence : Number(sequence) || 1,
        workspaceSettings: bootstrap.workspaceSettings ?? bootstrap,
      }
    } catch {
      const [customers, products, settings, sequence] = await Promise.all([
        customersApi.list().catch(() => []),
        productsApi.list().catch(() => []),
        settingsApi.load().catch(() => ({} as any)),
        offersApi.nextSequence().catch(() => 1),
      ])

      return {
        customers: Array.isArray(customers) ? customers : [],
        products: Array.isArray(products) ? products : [],
        packageTypes: settings?.packageTypes ?? [],
        paymentTerms: settings?.paymentTerms ?? [],
        company: settings?.company ?? {},
        banks: settings?.banks ?? [],
        sequence: typeof sequence === "number" ? sequence : Number(sequence) || 1,
      }

    }
  }, [])
}

