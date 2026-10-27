import { NavLink } from "react-router-dom"

import { NAV_ITEMS } from "../navigation"
import { useTranslation } from "../../i18n/I18nProvider"
import Icon from "../../components/ui/Icon"
import Wordmark from "../../components/ui/Wordmark"
import Button from "../../components/ui/Button"
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
  const { user, signOut } = useSession()

  return (
    <aside className="flex h-full w-60 flex-col border-e border-line bg-surface">
      <div className="flex items-center justify-center gap-2 border-b border-line-soft px-5 py-4">
        <Wordmark size="md" />
      </div>

      <p className="px-5 pt-5 pb-2 text-[11px] font-semibold tracking-widest text-muted uppercase">
        {t("nav.workspace")}
      </p>

      <nav className="flex flex-col gap-0.5 px-3">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors ${
                isActive
                  ? "bg-primary-soft font-medium text-primary"
                  : "text-muted hover:bg-page hover:text-ink"
              }`
            }
          >
            <Icon name={item.icon} size={19} />
            <span className="flex-1">{t(item.labelKey)}</span>
            {item.to === "/offers" && offersCount !== undefined && (
              <span className="rounded-full bg-page px-2 py-0.5 text-[11px] font-medium text-muted">
                {offersCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-3 px-4 pb-4">
        <NavLink
          to="/account"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-page"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
            {user?.initials ?? ""}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-ink">
              {user?.name ?? ""}
            </span>
            <span className="block truncate text-xs text-muted">
              {t("shell.salesTeam")}
            </span>
          </span>
          <Icon name="chevron" size={16} className="text-muted" />
        </NavLink>
      </div>
    </aside>
  )
}
