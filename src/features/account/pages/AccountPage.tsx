import PhasePlaceholder from "../../../app/layout/PhasePlaceholder"
import PageHeader from "../../../app/layout/PageHeader"
import Icon from "../../../components/ui/Icon"
import { useTranslation } from "../../../i18n/I18nProvider"

export default function AccountPage() {
  const { t } = useTranslation()

  return (
    <>
      <PageHeader title={t("account.title")} subtitle={t("account.subtitle")} />
      <PhasePlaceholder
        title={t("account.title")}
        description={t("account.subtitle")}
        phase="Phase 3 — customers, products, import, settings and account"
        icon={<Icon name="user" size={30} />}
      />
    </>
  )
}
