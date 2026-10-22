import PhasePlaceholder from "../../../app/layout/PhasePlaceholder"
import PageHeader from "../../../app/layout/PageHeader"
import Icon from "../../../components/ui/Icon"
import { useTranslation } from "../../../i18n/I18nProvider"

export default function ImportPage() {
  const { t } = useTranslation()

  return (
    <>
      <PageHeader title={t("import.title")} subtitle={t("import.subtitle")} />
      <PhasePlaceholder
        title={t("import.chooseSource")}
        description={t("import.subtitle")}
        phase="Phase 3 — customers, products, import, settings and account"
        icon={<Icon name="import" size={30} />}
      />
    </>
  )
}
