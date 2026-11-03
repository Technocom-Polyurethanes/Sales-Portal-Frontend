import type { TranslationKey } from "../../i18n/types"
import type { BadgeVariant } from "../../components/ui/Badge"
import type { ImportRowStatus, ImportSource } from "./types"

export const SOURCE_KEYS: Record<ImportSource, TranslationKey> = {
  customers: "import.customers",
  materials: "import.products",
  prices: "import.prices",
}

export const STATUS_KEYS: Record<ImportRowStatus, TranslationKey> = {
  new: "import.status.new",
  update: "import.status.update",
  unchanged: "import.status.unchanged",
  error: "import.status.error",
}

export const STATUS_VARIANTS: Record<ImportRowStatus, BadgeVariant> = {
  new: "accepted",
  update: "issued",
  unchanged: "neutral",
  error: "rejected",
}

/** Template column name -> translated field label. */
export function fieldKey(field: string): TranslationKey {
  return `import.fields.${field}` as TranslationKey
}
