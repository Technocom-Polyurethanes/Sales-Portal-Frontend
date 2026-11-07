import Badge from "../../../components/ui/Badge"
import Button from "../../../components/ui/Button"
import { useTranslation } from "../../../i18n/I18nProvider"
import { formatTimestampDay } from "../../../lib/formatters"
import type { UserRecord } from "../types"
import RoleBadge from "./RoleBadge"

export type UserCardProps = {
  user: UserRecord
  /** The signed in admin: their own role and status cannot be changed from here. */
  isSelf: boolean
  busy: boolean
  onEdit: (user: UserRecord) => void
  onResetPassword: (user: UserRecord) => void
  onToggleActive: (user: UserRecord) => void
}

/** One user with the actions an admin needs: edit, reset the password, activate or deactivate. */
export default function UserCard({
  user,
  isSelf,
  busy,
  onEdit,
  onResetPassword,
  onToggleActive,
}: UserCardProps) {
  const { t, language } = useTranslation()
  const title =
    language === "ar" ? user.roleTitleAr || user.roleTitle : user.roleTitle
  const team = language === "ar" ? user.teamAr || user.team : user.team
  const subtitle = [title, team].filter(Boolean).join(" · ")

  return (
    <article
      className={`flex w-full flex-col gap-3 rounded-lg border border-line bg-surface p-4 ${
        user.isActive ? "" : "opacity-80"
      }`}
    >
      <header className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary">
          {user.initials}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="flex flex-wrap items-center gap-2 text-sm font-semibold text-ink">
            <span className="truncate">{user.fullName}</span>
            {isSelf && (
              <span className="rounded bg-page px-1.5 py-0.5 text-[11px] font-medium text-muted">
                {t("users.you")}
              </span>
            )}
          </h3>
          <p dir="ltr" className="truncate text-start text-xs text-muted">
            @{user.username}
          </p>
        </div>
        <RoleBadge role={user.role} />
      </header>

      <dl className="flex flex-col gap-1 text-sm">
        {subtitle && <dd className="truncate text-ink">{subtitle}</dd>}
        <dd dir="ltr" className="truncate text-start text-muted">
          {user.email || "—"}
        </dd>
      </dl>

      <footer className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-line-soft pt-3">
        <div className="flex flex-col gap-1">
          <Badge variant={user.isActive ? "accepted" : "neutral"}>
            {t(user.isActive ? "users.active" : "users.inactive")}
          </Badge>
          <span className="text-[11px] text-muted">
            {t("users.createdOn")} {formatTimestampDay(user.createdAt)}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => onEdit(user)}>
            {t("common.edit")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onResetPassword(user)}
          >
            {t("users.resetPassword")}
          </Button>
          {!isSelf && (
            <Button
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() => onToggleActive(user)}
            >
              {t(user.isActive ? "users.deactivate" : "users.activate")}
            </Button>
          )}
        </div>
      </footer>
    </article>
  )
}
