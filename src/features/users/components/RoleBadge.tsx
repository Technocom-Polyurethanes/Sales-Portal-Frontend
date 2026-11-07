import { useTranslation } from "../../../i18n/I18nProvider"
import type { Role } from "../../account/permissions"

const STYLES: Record<Role, string> = {
  Admin: "bg-primary-soft text-primary border-primary/20",
  Sales: "bg-success/10 text-success border-success/25",
  Accountant: "bg-warning/10 text-warning border-warning/25",
}

/** The role of a user as a small pill. The colour only helps scanning; the name carries the meaning. */
export default function RoleBadge({ role }: { role: Role }) {
  const { t } = useTranslation()

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${STYLES[role]}`}
    >
      {t(`users.role.${role}`)}
    </span>
  )
}
