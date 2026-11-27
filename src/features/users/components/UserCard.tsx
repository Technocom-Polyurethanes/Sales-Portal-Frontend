import Badge from "../../../components/ui/Badge"
import Button from "../../../components/ui/Button"
import Icon from "../../../components/ui/Icon"
import { useTranslation } from "../../../i18n/I18nProvider"
import { formatTimestampDay, localeForLanguage } from "../../../lib/formatters"
import type { UserRecord } from "../types"
import RoleBadge from "./RoleBadge"
export type UserCardProps = {
  user: UserRecord
  isSelf: boolean
  busy: boolean
  onEdit: (user: UserRecord) => void
  onResetPassword: (user: UserRecord) => void
  onToggleActive: (user: UserRecord) => void
  onDelete?: (user: UserRecord) => void
}

export default function UserCard({
  user,
  isSelf,
  busy,
  onEdit,
  onResetPassword,
  onToggleActive,
  onDelete,
}: UserCardProps) {
  const { t, language } = useTranslation()
  const locale = localeForLanguage(language)
  const title = language === "ar" ? user.roleTitleAr || user.roleTitle : user.roleTitle
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
              <span className="rounded bg-page px-1.5 py-0.5 text-xs font-medium text-muted">
                {t("users.you")}
              </span>
            )}
          </h3>
          <p className="truncate text-start text-xs text-muted">
            <bdi dir="ltr">@{user.username}</bdi>
          </p>
        </div>
        <RoleBadge role={user.role} />
      </header>

      <dl className="grid gap-2 text-sm sm:flex sm:flex-row sm:justify-between sm:gap-4">
        {subtitle && <dd className="min-w-0 truncate text-ink">{subtitle}</dd>}
        <dd className="min-w-0 truncate text-start text-muted">
          <bdi dir="ltr">{user.email || ""}</bdi>
        </dd>
        <dd className="min-w-0 text-xs text-muted sm:text-sm">
          {t("users.createdOn")}{" "}
          <bdi dir="ltr">{formatTimestampDay(user.createdAt, locale)}</bdi>
        </dd>
      </dl>

      <footer className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-line-soft pt-3">
        <Badge variant={user.isActive ? "accepted" : "rejected"}>
          {t(user.isActive ? "users.active" : "users.inactive")}
        </Badge>
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
          {!isSelf && onDelete && (
            <Button
              variant="danger"
              size="sm"
              disabled={busy}
              data-testid="delete-button"
              aria-label={t("common.deleteTitle", { name: user.fullName })}
              className="w-8 shrink-0 px-0!"
              onClick={() => onDelete(user)}
            >
              <Icon name="trash" size={18} />
            </Button>
          )}
        </div>
      </footer>
    </article>
  )
}
