import { useState } from "react"
import { Outlet, useNavigate } from "react-router-dom"

import Button from "../../components/ui/Button"
import Dialog from "../../components/ui/Dialog"
import Icon from "../../components/ui/Icon"
import { useTranslation } from "../../i18n/I18nProvider"
import type { TranslationKey } from "../../i18n/types"
import AppFooter from "./AppFooter"
import BottomNav from "./BottomNav"
import Sidebar from "./Sidebar"
import Topbar from "./Topbar"

const MORE_LINKS = [
  { to: "/import", labelKey: "nav.import" as const },
  { to: "/settings", labelKey: "nav.settings" as const },
  { to: "/account", labelKey: "nav.account" as const },
]

const HELP_TIPS: TranslationKey[] = [
  "dashboard.createNewOffer",
  "offers.builder.packagingHint",
  "settings.pdfLanguageHint",
  "offers.builder.saveIssue",
]

export default function AppShell() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)

  return (
    <div className="min-h-screen bg-page">
      <div className="fixed inset-y-0 start-0 z-40 hidden lg:block">
        <Sidebar onOpenHelp={() => setHelpOpen(true)} />
      </div>

      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-ink/40"
            role="presentation"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute inset-y-0 start-0 w-64">
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

      <div className="flex min-h-screen flex-col lg:ms-60">
        <Topbar
          onOpenMenu={() => setMenuOpen(true)}
          onOpenHelp={() => setHelpOpen(true)}
        />
        <main className="flex-1 px-4 py-6 pb-24 lg:px-8 lg:py-8 lg:pb-10">
          <Outlet />
        </main>
        <AppFooter />
      </div>

      <BottomNav onOpenMore={() => setMoreOpen(true)} />

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

      <Dialog
        open={moreOpen}
        title={t("common.more")}
        onClose={() => setMoreOpen(false)}
      >
        <div className="flex flex-col gap-1">
          {MORE_LINKS.map((link) => (
            <button
              key={link.to}
              type="button"
              onClick={() => {
                setMoreOpen(false)
                navigate(link.to)
              }}
              className="flex items-center justify-between rounded-md px-3 py-2.5 text-sm text-ink transition-colors hover:bg-page"
            >
              {t(link.labelKey)}
              <Icon name="chevron" size={16} className="text-muted" />
            </button>
          ))}
        </div>
      </Dialog>
    </div>
  )
}
