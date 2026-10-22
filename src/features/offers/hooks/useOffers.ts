import { useAsyncData } from "../../../lib/hooks/useAsyncData"
import { offersApi, type OfferListParams } from "../api"
import type { Offer } from "../types"

export function useOffers(params: OfferListParams = {}) {
  const { status, search } = params
  return useAsyncData<Offer[]>(
    () => offersApi.list({ status, search }),
    [status, search],
  )
}
