import type { Offer, OfferListItem } from "./types"

/**
 * The creation date of an offer is the one of its first version (v1), whichever version is open.
 * Each version keeps its own `createdAt`; the version history shows those.
 *
 * Prefers the date the API reports for the chain, then v1 from the version history, and only then
 * the open version's own date (an offer with a single version, or versions that failed to load).
 */
export function offerCreatedAt(
  offer: Pick<Offer, "createdAt" | "rootCreatedAt">,
  versions?: Pick<OfferListItem, "version" | "createdAt">[],
): string {
  if (offer.rootCreatedAt) return offer.rootCreatedAt

  const first = versions?.reduce<Pick<OfferListItem, "version" | "createdAt"> | undefined>(
    (lowest, item) => (!lowest || item.version < lowest.version ? item : lowest),
    undefined,
  )
  return first?.createdAt || offer.createdAt
}
