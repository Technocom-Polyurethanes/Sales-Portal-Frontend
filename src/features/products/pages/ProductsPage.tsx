import PhasePlaceholder from "../../../app/layout/PhasePlaceholder"
import PageHeader from "../../../app/layout/PageHeader"
import Icon from "../../../components/ui/Icon"
import { useTranslation } from "../../../i18n/I18nProvider"

export default function ProductsPage() {
  const { t } = useTranslation()

  return (
    <>
      <PageHeader
        title={t("products.title")}
        subtitle={t("products.subtitle")}
      />
      <PhasePlaceholder
        title={t("products.title")}
        description={t("products.subtitle")}
        phase="Phase 3 — customers, products, import, settings and account"
        icon={<Icon name="products" size={30} />}
      />
    </>
  )
}
