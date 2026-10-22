import PhasePlaceholder from "../../../app/layout/PhasePlaceholder"
import PageHeader from "../../../app/layout/PageHeader"
import Icon from "../../../components/ui/Icon"
import { useTranslation } from "../../../i18n/I18nProvider"

export default function CustomersPage() {
  const { t } = useTranslation()

  return (
    <>
      <PageHeader
        title={t("customers.title")}
        subtitle={t("customers.subtitle")}
      />
      <PhasePlaceholder
        title={t("customers.title")}
        description={t("customers.subtitle")}
        phase="Phase 3 — customers, products, import, settings and account"
        icon={<Icon name="customers" size={30} />}
      />
    </>
  )
}
