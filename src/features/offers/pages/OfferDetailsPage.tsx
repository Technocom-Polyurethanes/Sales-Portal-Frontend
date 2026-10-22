import { useParams } from "react-router-dom"

import PhasePlaceholder from "../../../app/layout/PhasePlaceholder"
import PageHeader from "../../../app/layout/PageHeader"
import Icon from "../../../components/ui/Icon"
import { useTranslation } from "../../../i18n/I18nProvider"

export default function OfferDetailsPage() {
  const { t } = useTranslation()
  const { id } = useParams()

  return (
    <>
      <PageHeader title={t("offers.details.title")} subtitle={id} />
      <PhasePlaceholder
        title={t("offers.details.title")}
        description={t("offers.builder.subtitle")}
        phase="Phase 2 — offer builder, list and details"
        icon={<Icon name="offers" size={30} />}
      />
    </>
  )
}
