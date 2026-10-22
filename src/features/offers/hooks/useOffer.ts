import { useAsyncData } from "../../../lib/hooks/useAsyncData"
import { offersApi } from "../api"
import type { Offer } from "../types"

export function useOffer(id: string | undefined) {
  return useAsyncData<Offer>(() => offersApi.get(id ?? ""), [id])
}
