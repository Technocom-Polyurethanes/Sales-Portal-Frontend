import PhasePlaceholder from "../../../app/layout/PhasePlaceholder"
import Icon from "../../../components/ui/Icon"
import { useTranslation } from "../../../i18n/I18nProvider"

export default function SettingsPage() {
  const { t } = useTranslation()

  return (
    <PhasePlaceholder
      title={t("settings.title")}
      description={t("settings.subtitle")}
      phase="Phase 3 — customers, products, import, settings and account"
      icon={<Icon name="settings" size={30} />}
    />
  )
}
