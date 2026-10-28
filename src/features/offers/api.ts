import { api } from "../../lib/api/client"
import type { Offer, OfferStatus, OfferListItem, OfferListPage, OfferListParams } from "./types"

/** Shape exactly as the backend sends it (status is "Draft", "Issued", ...). */
type RawOfferListItem = Omit<OfferListItem, "status"> & { status: string }
type RawOfferListPage = Omit<OfferListPage, "items"> & { items: RawOfferListItem[] }

function mapListItem(raw: RawOfferListItem): OfferListItem {
  return { ...raw, status: raw.status.toLowerCase() as OfferStatus }
}

export const offersApi = {
  async list(params: OfferListParams = {}): Promise<OfferListPage> {
    const raw = await api.get<RawOfferListPage>("/offers", {
      // "all" is a UI-only value: the backend enum has no "all", so omit it
      status:
        params.status && params.status !== "all" ? params.status : undefined,
      search: params.search?.trim() || undefined,
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 20,
    })

    return { ...raw, items: raw.items.map(mapListItem) }
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

  /** The offer and every version created from it, newest first. */
  versions(id: string): Promise<OfferListItem[]> {
    return api.get<RawOfferListItem[]>(`/offers/${id}/versions`).then((rows) =>
      rows.map(mapListItem),
    )
  },
}