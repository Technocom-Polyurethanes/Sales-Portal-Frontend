import { api } from "../../lib/api/client"
import type { Offer, OfferStatus, OfferListItem, OfferListPage, OfferListParams } from "./types"
import { mapListItem, mapListPage, mapOfferDetail, type RawOfferListItem, type RawOfferListPage } from "./mappers"

type RawNextSequenceResponse =
  | number
  | {
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

  async nextSequence(params?: { year?: number; month?: number }): Promise<number> {
    try {
      const res = await api.get<RawNextSequenceResponse>("/offers/next-sequence", params as any)
      if (typeof res === "number") {
        return res
      }
      if (res && typeof res === "object") {
        return (res as any).sequence ?? (res as any).nextSequence ?? (res as any).serialNumber ?? 1
      }
      return 1
    } catch {
      try {
        const res = await api.get<RawNextSequenceResponse>("/offers/next/sequence", params as any)
        if (typeof res === "number") return res
        if (res && typeof res === "object") {
          return (res as any).sequence ?? (res as any).nextSequence ?? (res as any).serialNumber ?? 1
        }
        return 1
      } catch {
        return 1
      }
    }
  },

  /** The sequence number the next issued offer will use. */
  async nextSequence(): Promise<number> {
    const raw = await api.get<number | { sequence: number }>("/offers/next-sequence")
    return typeof raw === "number" ? raw : Number(raw?.sequence) || 1
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