import { useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"

import Icon from "../../components/ui/Icon"
import { labelForPath } from "../navigation"
import { useTranslation } from "../../i18n/I18nProvider"
import { useSession } from "../../features/account/hooks/useSession"
import NotificationBell from "../../features/notifications/NotificationBell"

export type TopbarProps = {
  onOpenMenu?: () => void
  onOpenHelp?: () => void
}

export default function Topbar({ onOpenMenu, onOpenHelp }: TopbarProps) {
  const { t, language, toggleLanguage } = useTranslation()
  const { user } = useSession()
  const navigate = useNavigate()
  const location = useLocation()
  const [search, setSearch] = useState("")
  const section = labelForPath(location.pathname)
  const title = section ? t(section) : t("app.name")

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault()
    navigate(`/offers?search=${encodeURIComponent(search.trim())}`)
  }

  return (
    <header className="no-print sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-line-soft bg-surface px-4 sm:gap-3 sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label={t("shell.toggleNavigation")}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-page hover:text-ink lg:hidden"
      >
        <Icon name="menu" size={20} />
      </button>

      <div className="min-w-0 sm:hidden">
        <span className="block truncate text-sm font-semibold text-ink">
          {title}
        </span>
      </div>

      <div className="hidden min-w-0 items-center gap-2 text-sm text-muted sm:flex">
        <span className="shrink-0">{t("nav.workspace")}</span>
        <span aria-hidden="true">/</span>
        <strong className="truncate font-semibold text-ink">{title}</strong>
      </div>

      <form onSubmit={submitSearch} className="ms-auto flex min-w-0 items-center gap-2">
        <div className="relative hidden md:block">
          <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-muted">
            <Icon name="search" size={17} />
          </span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("shell.searchPlaceholder")}
            aria-label={t("shell.searchPlaceholder")}
            className="h-10 w-64 rounded-lg border border-line bg-surface ps-9 pe-3 text-sm text-ink placeholder:text-muted focus:border-primary lg:w-72"
          />
        </div>

        <NotificationBell />

        <button
          type="button"
          onClick={toggleLanguage}
          aria-label={t("shell.languageSwitch")}
          className="flex h-10 shrink-0 items-center rounded-lg border border-line px-3 text-sm font-semibold text-ink transition-colors hover:bg-page"
        >
          {language === "ar" ? "EN" : "العربية"}
        </button>

        <span aria-hidden="true" className="hidden h-6 w-px bg-line-soft sm:block" />

        <button
          type="button"
          onClick={() => navigate("/account")}
          aria-label={t("nav.account")}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-white"
        >
          {user?.initials ?? "AA"}
        </button>
      </form>
    </header>
  )
}
