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
  collapsed?: boolean
  onToggleCollapsed?: () => void
}

export default function Sidebar({
  onNavigate,
  onOpenHelp,
  offersCount,
  collapsed = false,
  onToggleCollapsed,
}: SidebarProps) {
  const { t } = useTranslation()
  const { user } = useSession()
  const { role, can } = usePermissions()
  const accountLabel = user?.name ?? t("nav.account")

  return (
    <aside className="flex h-full w-full flex-col border-e border-line-soft bg-surface">
      <div
        className={`flex items-center border-b border-line-soft ${
          collapsed ? "justify-center px-2 py-4" : "justify-between gap-2 px-4 py-4 sm:px-5"
        }`}
      >
        {!collapsed && <Wordmark size="md" />}
        {onToggleCollapsed && (
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label={
              collapsed ? t("shell.expandNavigation") : t("shell.collapseNavigation")
            }
            title={collapsed ? t("shell.expandNavigation") : t("shell.collapseNavigation")}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-page hover:text-ink"
          >
            <Icon
              name="chevron"
              size={18}
              className={collapsed ? "rtl:rotate-180" : "rotate-180 rtl:rotate-0"}
            />
          </button>
        )}
      </div>

      {!collapsed && (
        <p className="px-5 pt-5 pb-2 text-xs font-semibold text-muted">
          {t("nav.workspace")}
        </p>
      )}

      <nav
        aria-label={t("nav.workspace")}
        className={`flex flex-col gap-1 ${collapsed ? "px-2" : "px-3"}`}
      >
        {visibleNavItems(NAV_ITEMS, can).map((item) => {
          const label = t(item.labelKey)
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              aria-label={collapsed ? label : undefined}
              title={collapsed ? label : undefined}
              className={({ isActive }) =>
                `flex min-h-11 items-center rounded-lg border-s-2 text-sm font-medium transition-colors ${
                  collapsed ? "justify-center px-0" : "gap-3 px-3"
                } ${
                  isActive
                    ? "border-primary bg-primary-soft text-primary"
                    : "border-transparent text-muted hover:bg-page hover:text-ink"
                }`
              }
            >
              <Icon name={item.icon} size={19} />
              {!collapsed && (
                <>
                  <span className="min-w-0 flex-1 truncate">{label}</span>
                  {item.to === "/offers" && offersCount !== undefined && (
                    <span className="rounded-full bg-surface-soft px-2 py-0.5 text-xs font-semibold text-muted">
                      {offersCount}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          )
        })}
      </nav>

      <div className={`mt-auto flex flex-col gap-3 ${collapsed ? "p-2" : "p-4"}`}>
        {onOpenHelp && (
          <button
            type="button"
            onClick={onOpenHelp}
            aria-label={collapsed ? t("shell.helpTitle") : undefined}
            title={collapsed ? t("shell.helpTitle") : undefined}
            className={`flex min-h-11 items-center rounded-lg text-sm font-medium text-muted transition-colors hover:bg-page hover:text-ink ${
              collapsed ? "justify-center px-0" : "gap-3 px-3"
            }`}
          >
            <Icon name="help" size={19} />
            {!collapsed && t("shell.helpTitle")}
          </button>
        )}
        <NavLink
          to="/account"
          onClick={onNavigate}
          aria-label={accountLabel}
          title={accountLabel}
          className={`flex min-h-12 items-center rounded-lg border border-line-soft transition-colors hover:bg-page ${
            collapsed ? "justify-center px-0" : "gap-3 px-2 py-2"
          }`}
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
            {user?.initials ?? ""}
          </span>
          {!collapsed && (
            <>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-ink">
                  {user?.name ?? ""}
                </span>
                <span className="block truncate text-xs text-muted">
                  {role ? t(`users.role.${role}`) : t("shell.salesTeam")}
                </span>
              </span>
              <Icon name="chevron" size={16} className="shrink-0 text-muted" />
            </>
          )}
        </NavLink>
      </div>
    </aside>
  )
}
