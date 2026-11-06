import { api } from "../../lib/api/client"
import type { Offer, OfferStatus, OfferListItem, OfferListPage, OfferListParams } from "./types"
import { mapListItem, mapListPage, mapOfferDetail, type RawOfferListItem, type RawOfferListPage } from "./mappers"

type RawNextSequenceResponse =
  | number
  | {
      suggestedSequence?: number
      isFirstOffer?: boolean
      sequence?: number
      nextSequence?: number
      serialNumber?: number
    }

export const offersApi = {
  async list(
    params: OfferListParams & {
      latestOnly?: boolean
      sortBy?: string
      sortDir?: string
    } = {},
  ): Promise<OfferListPage> {
    const raw = await api.get<RawOfferListPage>("/offers", {
      // "all" is a UI-only value: the backend enum has no "all", so omit it
      status:
        params.status && params.status !== "all" ? (params.status as any) : undefined,
      search: params.search?.trim() || undefined,
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 20,
      latestOnly: (params as any).latestOnly,
      sortBy: (params as any).sortBy,
      sortDir: (params as any).sortDir,
    } as any)

    return mapListPage(raw as any)
  },

  async get(id: string): Promise<Offer> {
    const raw = await api.get<any>(`/offers/${id}`)
    return mapOfferDetail(raw)
  },
  create(offer: any): Promise<Offer> {
    return api.post<any>("/offers", offer).then((res) => mapOfferDetail(res))
  },
  update(id: string, offer: any): Promise<Offer> {
    return api.put<any>(`/offers/${id}`, offer).then((res) => mapOfferDetail(res))
  },
  revise(id: string, data?: any): Promise<Offer> {
    return api.post<any>(`/offers/${id}/revise`, data).then((res) => mapOfferDetail(res))
  },
  setStatus(id: string, status: OfferStatus): Promise<Offer> {
    return api
      .patch<any>(`/offers/${id}/status`, { status })
      .then((res) => mapOfferDetail(res))
  },

  /**
   * The next free sequence. The number is global; the offer type is only needed to build the
   * suggested reference. `isFirstOffer` is true while no offer exists, the only time the user
   * may choose the starting number.
   */
  async nextSequence(
    offerType: "Loc" | "Int" = "Loc",
  ): Promise<{ sequence: number; isFirstOffer: boolean }> {
    const res = await api.get<RawNextSequenceResponse>("/offers/next-sequence", { offerType })
    if (typeof res === "number") return { sequence: res, isFirstOffer: false }
    return {
      sequence:
        res?.suggestedSequence ?? res?.sequence ?? res?.nextSequence ?? res?.serialNumber ?? 1,
      isFirstOffer: res?.isFirstOffer === true,
    }
  },

  /** The offer and every version created from it, newest first. */
  async versions(id: string): Promise<OfferListItem[]> {
    const rows = await api.get<RawOfferListItem[]>(`/offers/${id}/versions`)
    return rows.map(mapListItem)
  },

  calculate(draft: any): Promise<any> {
    return api.post<any>("/offers/calculate", draft)
  },
}