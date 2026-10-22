import { api } from "../../lib/api/client"
import type { Offer, OfferStatus } from "./types"

export type OfferListParams = {
  status?: OfferStatus | "all"
  search?: string
}

export const offersApi = {
  list(params: OfferListParams = {}): Promise<Offer[]> {
    return api.get<Offer[]>("/offers", {
      status: params.status,
      search: params.search,
    })
  },
  get(id: string): Promise<Offer> {
    return api.get<Offer>(`/offers/${id}`)
  },
  create(offer: Offer): Promise<Offer> {
    return api.post<Offer>("/offers", offer)
  },
  setStatus(id: string, status: OfferStatus): Promise<Offer> {
    return api.patch<Offer>(`/offers/${id}/status`, { status })
  },
}
