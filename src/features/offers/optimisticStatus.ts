import type { OfferDetailsData } from "./hooks/useOfferDetails"
import type { OfferStatus } from "./types"

/** Returns the details with the offer (and its row in the version list) set to `status`. */
export function withOfferStatus(
  data: OfferDetailsData,
  status: OfferStatus,
): OfferDetailsData {
  return {
    ...data,
    offer: { ...data.offer, status },
    versions: data.versions.map((version) =>
      version.id === data.offer.id ? { ...version, status } : version,
    ),
  }
}
