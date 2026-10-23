import { useAsyncData } from "../../../lib/hooks/useAsyncData"
import { offersApi } from "../api"
import type { Offer } from "../types"

export function useOffer(id: string | undefined) {
  return useAsyncData<Offer | undefined>(
    () => (id ? offersApi.get(id) : Promise.resolve(undefined)),
    [id],
  )
}
