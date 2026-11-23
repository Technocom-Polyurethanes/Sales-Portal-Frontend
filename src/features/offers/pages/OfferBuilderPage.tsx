import { useMemo, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"

import PageHeader from "../../../app/layout/PageHeader"
import { useTranslation } from "../../../i18n/I18nProvider"
import { useSession } from "../../../features/account/SessionProvider"
import BuilderSkeleton from "../components/BuilderSkeleton"
import BuilderWorkspace from "../components/builder/BuilderWorkspace"
import { offerToDraft } from "../draft"
import { useBuilderCatalog } from "../hooks/useBuilderCatalog"
import { useOffer } from "../hooks/useOffer"

/** New offer: the five step builder with a live document preview. */
export default function OfferBuilderPage() {
  const { t } = useTranslation()
  const { user } = useSession()
  const [searchParams] = useSearchParams()
  const sourceId = searchParams.get("from")

  const { data: catalog, loading, error } = useBuilderCatalog()
  const { data: source, loading: sourceLoading } = useOffer(
    sourceId ?? undefined,
  )

  const initialDraft = useMemo(
    () => {
      if (!source) return undefined
      return offerToDraft(source, catalog?.banks, {
        products: catalog?.products,
        packageTypes: catalog?.packageTypes,
        customers: catalog?.customers,
      })
    },
    [source, catalog],
  )

  // The backend numbers a new version itself (highest version of the offer + 1) and keeps it in
  // the chain of parentOfferId even when the reference is changed, this value is only a hint.
  const version = source ? source.version + 1 : 1
  const parentOfferId = source?.id

  if (loading || (sourceId && sourceLoading)) {
    return (
      <>
        <PageHeader
          title={t("offers.builder.title")}
          subtitle={t("offers.builder.subtitle")}
        />
        <BuilderSkeleton />
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
          user={user}
        />
      )}
    </>
  )
}
