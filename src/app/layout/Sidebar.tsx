import { NavLink } from "react-router-dom"

import { NAV_ITEMS, visibleNavItems } from "../navigation"
import { useTranslation } from "../../i18n/I18nProvider"
import Icon from "../../components/ui/Icon"
import Wordmark from "../../components/ui/Wordmark"
import { usePermissions } from "../../features/account/hooks/usePermissions"
import { useSession } from "../../features/account/hooks/useSession"

export type SidebarProps = {
  onNavigate?: () => void
  onOpenHelp?: () => void
  offersCount?: number
}

export default function Sidebar({
  onNavigate,
  onOpenHelp,
  offersCount,
}: SidebarProps) {
  const { t } = useTranslation()
  const { user } = useSession()
  const { role, can } = usePermissions()

  return (
    <aside className="flex h-full w-full flex-col border-e border-line-soft bg-surface">
      <div className="flex items-center border-b border-line-soft px-5 py-5">
        <Wordmark size="md" />
      </div>

      <p className="px-5 pt-5 pb-2 text-xs font-semibold text-muted">
        {t("nav.workspace")}
      </p>

      <nav aria-label={t("nav.workspace")} className="flex flex-col gap-1 px-3">
        {visibleNavItems(NAV_ITEMS, can).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex min-h-11 items-center gap-3 rounded-lg border-s-2 px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "border-primary bg-primary-soft text-primary"
                  : "border-transparent text-muted hover:bg-page hover:text-ink"
              }`
            }
          >
            <Icon name={item.icon} size={19} />
            <span className="min-w-0 flex-1 truncate">{t(item.labelKey)}</span>
            {item.to === "/offers" && offersCount !== undefined && (
              <span className="rounded-full bg-surface-soft px-2 py-0.5 text-xs font-semibold text-muted">
                {offersCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-3 p-4">
        {onOpenHelp && (
          <button
            type="button"
            onClick={onOpenHelp}
            className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted transition-colors hover:bg-page hover:text-ink"
          >
            <Icon name="help" size={19} />
            {t("shell.helpTitle")}
          </button>
        )}
        <NavLink
          to="/account"
          onClick={onNavigate}
          className="flex min-h-12 items-center gap-3 rounded-lg border border-line-soft px-2 py-2 transition-colors hover:bg-page"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
            {user?.initials ?? ""}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-ink">
              {user?.name ?? ""}
            </span>
            <span className="block truncate text-xs text-muted">
              {role ? t(`users.role.${role}`) : t("shell.salesTeam")}
            </span>
          </span>
          <Icon name="chevron" size={16} className="shrink-0 text-muted" />
        </NavLink>
      </div>
    </aside>
  )
}
