import PhasePlaceholder from "../../../app/layout/PhasePlaceholder"
import PageHeader from "../../../app/layout/PageHeader"
import Icon from "../../../components/ui/Icon"
import { useTranslation } from "../../../i18n/I18nProvider"

export default function OfferBuilderPage() {
  const { t } = useTranslation()

  return (
    <>
      <PageHeader
        title={t("offers.builder.title")}
        subtitle={t("offers.builder.subtitle")}
        action={
          <span className="inline-flex items-center gap-2 rounded-md border border-line px-3 py-2 text-xs text-muted">
            <Icon name="offers" size={16} />
            {t("offers.builder.pdfLanguage")} {t("common.english")}
          </span>
        }
      />
      <PhasePlaceholder
        title={t("offers.builder.title")}
        description={t("offers.builder.packagingHint")}
        phase="Phase 2 — offer builder, list and details"
        icon={<Icon name="offers" size={30} />}
      />
    </>
  )
}
