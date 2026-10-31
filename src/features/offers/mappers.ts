import type { Offer, OfferListItem, OfferStatus } from "./types"

export type RawOfferListItem = Omit<OfferListItem, "status"> & { status: string }
export type RawOfferListPage = { items: RawOfferListItem[]; page: number; pageSize: number; totalCount: number; totalPages: number }

export function mapOfferStatus(status: string): OfferStatus {
  if (!status) return "draft"
  const s = status.toString().toLowerCase()
  if (s === "issued") return "issued"
  if (s === "accepted") return "accepted"
  if (s === "rejected") return "rejected"
  return "draft"
}

export function mapListItem(raw: RawOfferListItem): OfferListItem {
  return {
    ...raw,
    status: mapOfferStatus(raw.status),
  } as OfferListItem
}

export function mapListPage(raw: RawOfferListPage) {
  return {
    ...raw,
    items: raw.items.map(mapListItem),
  }
}

export function mapOfferDetail(raw: any): Offer {
  if (!raw) return raw
  const mapped: any = { ...raw }
  if (mapped.status) {
    mapped.status = mapOfferStatus(mapped.status)
  }
  if (mapped.documentLanguage && typeof mapped.documentLanguage === "string") {
    mapped.documentLanguage = mapped.documentLanguage.toLowerCase()
  }
  // Handle backend field names if different
  if (mapped.netAfterDiscount !== undefined && mapped.netBeforeTax === undefined) {
    mapped.netBeforeTax = mapped.netAfterDiscount
  }
  if (mapped.deliveryBatches && !mapped.delivery) {
    mapped.delivery = mapped.deliveryBatches.map((b: any) => ({
      id: b.id,
      batchNumber: b.batchNumber,
      date: b.deliveryDate || b.date,
      allocations: b.allocations || b.items || [],
    }))
  }
  // Normalize line ids
  if (Array.isArray(mapped.lines)) {
    mapped.lines = mapped.lines.map((l: any) => ({
      ...l,
      productId: l.productId || l.materialId,
      materialId: l.materialId || l.productId,
    }))
  }
  return mapped as Offer
}
