import { useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"

import Icon from "../../components/ui/Icon"
import { labelForPath } from "../navigation"
import { useTranslation } from "../../i18n/I18nProvider"
import { useSession } from "../../features/account/hooks/useSession"

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

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault()
    navigate(`/offers?search=${encodeURIComponent(search.trim())}`)
  }

  return (
    <header className="no-print sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-surface/95 px-4 backdrop-blur lg:px-8">
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label={t("shell.toggleNavigation")}
        className="rounded-md p-2 text-muted transition-colors hover:bg-page hover:text-ink lg:hidden"
      >
        <Icon name="menu" size={20} />
      </button>

      <div className="hidden items-center gap-2 text-sm text-muted sm:flex">
        <span>{t("nav.workspace")}</span>
        <span>/</span>
        <strong className="font-medium text-ink">
          {labelForPath(location.pathname)
            ? t(labelForPath(location.pathname)!)
            : ""}
        </strong>
      </div>

      <form onSubmit={submitSearch} className="ms-auto flex items-center gap-2">
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
            className="h-9 w-72 rounded-md border border-line bg-page ps-9 pe-3 text-sm text-ink placeholder:text-muted/70 focus:border-primary focus:bg-surface"
          />
        </div>

        <button
          type="button"
          onClick={toggleLanguage}
          aria-label={t("shell.languageSwitch")}
          className="flex h-9 items-center gap-1 rounded-md border border-line px-3 text-xs font-medium text-ink transition-colors hover:bg-page"
        >
          {language === "ar" ? "EN" : "العربية"}
          <span className="text-muted">⌄</span>
        </button>

        <span className="hidden h-6 w-px bg-line sm:block" />

        <button
          type="button"
          onClick={onOpenHelp}
          aria-label={t("shell.needHelp")}
          className="hidden rounded-md p-2 text-muted transition-colors hover:bg-page hover:text-ink sm:block"
        >
          <Icon name="help" size={19} />
        </button>

        <button
          type="button"
          onClick={() => navigate("/account")}
          aria-label={t("nav.account")}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-white"
        >
          {user?.initials ?? "AA"}
        </button>
      </form>
    </header>
  )
}
