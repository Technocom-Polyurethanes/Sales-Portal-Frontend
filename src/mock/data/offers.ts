import type { Offer } from "../../features/offers/types"
import { buildOffer, packaging, type OfferSpec } from "./offerFactory"

const specs: OfferSpec[] = [
  {
    sequence: 3089,
    customerIndex: 0,
    issueDate: "2026-10-21",
    status: "issued",
    version: 1,
    taxPercent: 14,
    otherTaxEnabled: true,
    otherTaxPercent: 1,
    notes:
      "Prices are valid for 7 days.\nDelivery is subject to stock availability.",
    lines: [
      {
        productId: "prod-1",
        ratePerKg: 10,
        packaging: [packaging("drum", "Drum", 210, 19)],
      },
      {
        productId: "prod-2",
        ratePerKg: 23.115384615,
        packaging: [
          packaging("drum", "Drum", 250, 10),
          packaging("pail", "Pail", 25, 4),
        ],
      },
    ],
    delivery: [
      {
        date: "2026-10-25",
        allocations: [
          { productId: "prod-1", packages: 10 },
          { productId: "prod-2", packages: 8 },
        ],
      },
      {
        date: "2026-11-05",
        allocations: [
          { productId: "prod-1", packages: 9 },
          { productId: "prod-2", packages: 6 },
        ],
      },
    ],
  },
  {
    sequence: 3088,
    customerIndex: 1,
    issueDate: "2026-10-20",
    status: "draft",
    version: 1,
    lines: [
      {
        productId: "prod-3",
        ratePerKg: 19.5,
        packaging: [packaging("drum", "Drum", 220, 40)],
      },
    ],
  },
  {
    sequence: 3087,
    customerIndex: 2,
    issueDate: "2026-10-18",
    status: "accepted",
    version: 2,
    lines: [
      {
        productId: "prod-1",
        ratePerKg: 10.25,
        packaging: [packaging("drum", "Drum", 210, 30)],
      },
    ],
  },
  {
    sequence: 3086,
    customerIndex: 3,
    issueDate: "2026-10-15",
    status: "issued",
    version: 1,
    lines: [
      {
        productId: "prod-5",
        ratePerKg: 46.5,
        packaging: [packaging("pail", "Pail", 25, 60)],
      },
    ],
  },
  {
    sequence: 3085,
    customerIndex: 4,
    issueDate: "2026-10-12",
    status: "rejected",
    version: 1,
    lines: [
      {
        productId: "prod-4",
        ratePerKg: 9.75,
        packaging: [packaging("drum", "Drum", 200, 45)],
      },
    ],
  },
  {
    sequence: 3084,
    customerIndex: 5,
    issueDate: "2026-10-10",
    status: "accepted",
    version: 2,
    lines: [
      {
        productId: "prod-2",
        ratePerKg: 23.115384615,
        packaging: [packaging("drum", "Drum", 250, 24)],
      },
    ],
  },
  {
    sequence: 3083,
    customerIndex: 6,
    issueDate: "2026-10-08",
    status: "draft",
    version: 1,
    lines: [
      {
        productId: "prod-3",
        ratePerKg: 19.75,
        packaging: [packaging("drum", "Drum", 220, 20)],
      },
    ],
  },
  {
    sequence: 3082,
    customerIndex: 7,
    issueDate: "2026-10-05",
    status: "issued",
    version: 1,
    lines: [
      {
        productId: "prod-1",
        ratePerKg: 10.5,
        packaging: [packaging("drum", "Drum", 210, 26)],
      },
    ],
  },
  {
    sequence: 3081,
    customerIndex: 8,
    issueDate: "2026-10-02",
    status: "accepted",
    version: 1,
    lines: [
      {
        productId: "prod-5",
        ratePerKg: 45,
        packaging: [packaging("pail", "Pail", 30, 40)],
      },
    ],
  },
  {
    sequence: 3080,
    customerIndex: 9,
    issueDate: "2026-09-28",
    status: "issued",
    version: 1,
    lines: [
      {
        productId: "prod-4",
        ratePerKg: 10,
        packaging: [packaging("drum", "Drum", 220, 18)],
      },
    ],
  },
]

export const offers: Offer[] = specs.map(buildOffer)
