import Badge from "../../../components/ui/Badge"
import Icon, { type IconName } from "../../../components/ui/Icon"
import { useTranslation } from "../../../i18n/I18nProvider"
import { actionLabel, categoryLabel } from "../labels"
import type { AuditLog } from "../types"

export type AuditActionProps = { row: AuditLog }

const ICONS: Record<string, IconName> = {
  auth: "user",
  offers: "offers",
  customers: "customers",
  materials: "products",
  banks: "bank",
  catalog: "products",
  settings: "settings",
  users: "user",
  imports: "import",
}

export default function AuditAction({ row }: AuditActionProps) {
  const { t } = useTranslation()
  return (
    <span className="flex min-w-0 items-center gap-2">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-page text-muted">
        <Icon name={ICONS[row.category] ?? "pulse"} size={16} />
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-medium text-ink">
          {actionLabel(row.action, t)}
        </span>
        <Badge className="w-fit">{categoryLabel(row.category, t)}</Badge>
      </span>
    </span>
  )
}
