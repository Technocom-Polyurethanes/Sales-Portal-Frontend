import { useAsyncData } from "../../../lib/hooks/useAsyncData"
import { offersApi } from "../api"
import type { OfferListPage, OfferListParams } from "../types"

export function useOffers(params: OfferListParams = {}) {
  const { status, search, page, pageSize } = params
  return useAsyncData<OfferListPage>(
    () => offersApi.list({ status, search, page, pageSize }),
    [status, search, page, pageSize],
  )
}