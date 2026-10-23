import { useTranslation } from "../../i18n/I18nProvider"

export default function AppFooter() {
  const { t } = useTranslation()

  return (
    <footer className="no-print hidden items-center justify-between border-t border-line px-8 py-5 text-xs text-muted lg:flex">
      <span>© 2026 TECHNOCOM. {t("common.rightsReserved")}</span>
      <span>{t("common.madeForWork")}</span>
    </footer>
  )
}
