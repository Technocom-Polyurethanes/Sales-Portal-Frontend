import { useEffect, useState } from "react"
import { Outlet, useLocation } from "react-router-dom"

import Button from "../../components/ui/Button"
import Dialog from "../../components/ui/Dialog"
import Icon from "../../components/ui/Icon"
import { useTranslation } from "../../i18n/I18nProvider"
import type { TranslationKey } from "../../i18n/types"
import AppFooter from "./AppFooter"
import Sidebar from "./Sidebar"
import Topbar from "./Topbar"

const HELP_TIPS: TranslationKey[] = [
  "dashboard.createNewOffer",
  "offers.builder.packagingHint",
  "settings.pdfLanguageHint",
  "offers.builder.saveIssue",
]

export default function AppShell() {
  const { t } = useTranslation()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)

  useEffect(() => {
    if (!menuOpen) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false)
    }
    const previousOverflow = document.body.style.overflow

    document.addEventListener("keydown", onKeyDown)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [menuOpen])

  return (
    <div className="min-h-dvh bg-page">
      <div className="fixed inset-y-0 start-0 z-40 hidden lg:block no-print">
        <Sidebar onOpenHelp={() => setHelpOpen(true)} />
      </div>

      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-ink/50 motion-safe:animate-fade-in"
            role="presentation"
            onClick={() => setMenuOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t("shell.toggleNavigation")}
            className="mobile-drawer absolute inset-y-0 start-0 w-[min(17rem,85vw)] motion-safe:animate-drawer-in"
          >
            <Sidebar
              onNavigate={() => setMenuOpen(false)}
              onOpenHelp={() => {
                setMenuOpen(false)
                setHelpOpen(true)
              }}
            />
          </div>
        </div>
      )}

      <div className="app-shell flex min-h-dvh flex-col lg:ms-60">
        <Topbar
          onOpenMenu={() => setMenuOpen(true)}
          onOpenHelp={() => setHelpOpen(true)}
        />
        <main className="w-full flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          <div key={location.pathname} className="mx-auto w-full max-w-[1500px] motion-safe:animate-fade-in">
            <Outlet />
          </div>
        </main>
        <AppFooter />
      </div>

      <Dialog
        open={helpOpen}
        title={t("shell.helpTitle")}
        onClose={() => setHelpOpen(false)}
        footer={
          <Button variant="primary" onClick={() => setHelpOpen(false)}>
            {t("common.close")}
          </Button>
        }
      >
        <p className="text-sm text-muted">{t("shell.helpBody")}</p>
        <ul className="mt-4 flex flex-col gap-2 text-sm text-ink">
          {HELP_TIPS.map((key) => (
            <li key={key} className="flex items-start gap-2">
              <span className="mt-0.5 text-primary">
                <Icon name="check" size={15} />
              </span>
              {t(key)}
            </li>
          ))}
        </ul>
      </Dialog>
    </div>
  )
}
