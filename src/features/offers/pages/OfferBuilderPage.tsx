import { useMemo, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"

import PageHeader from "../../../app/layout/PageHeader"
import Spinner from "../../../components/ui/Spinner"
import { useTranslation } from "../../../i18n/I18nProvider"
import BuilderWorkspace from "../components/builder/BuilderWorkspace"
import { offerToDraft } from "../draft"
import { useBuilderCatalog } from "../hooks/useBuilderCatalog"
import { useOffer } from "../hooks/useOffer"

/** New offer: the five step builder with a live document preview. */
export default function OfferBuilderPage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const sourceId = searchParams.get("from")
  const duplicate = searchParams.get("duplicate") === "1"

  const { data: catalog, loading, error } = useBuilderCatalog()
  const { data: source, loading: sourceLoading } = useOffer(
    sourceId ?? undefined,
  )

  const initialDraft = useMemo(
    () => (source ? offerToDraft(source) : undefined),
    [source],
  )

  const version = source ? (duplicate ? 1 : source.version + 1) : 1
  const parentOfferId = source && !duplicate ? source.id : undefined

  if (loading || (sourceId && sourceLoading)) {
    return (
      <>
        <PageHeader
          title={t("offers.builder.title")}
          subtitle={t("offers.builder.subtitle")}
        />
        <div className="flex justify-center py-20">
          <Spinner size={26} />
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title={t("offers.builder.title")}
        subtitle={t("offers.builder.subtitle")}
      />

      {error && (
        <p className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {t("common.somethingWrong")}
        </p>
      )}

      {catalog && (
        <BuilderWorkspace
          catalog={catalog}
          initialDraft={initialDraft}
          version={version}
          parentOfferId={parentOfferId}
        />
      )}
    </>
  )
}
