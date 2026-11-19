import { useNavigate } from "react-router-dom"

import Badge from "../../../components/ui/Badge"
import { useTranslation } from "../../../i18n/I18nProvider"
import { formatDateTime } from "../../../lib/formatters/date"
import { localeForLanguage } from "../../../lib/formatters/locale"
import { formatCurrency } from "../../../lib/formatters/number"
import type { OfferListItem } from "../types"

export type VersionHistoryProps = {
  versions: OfferListItem[]
  currentId: string
}

/** Every version created from the same offer, newest first, each with its own dates. */
export default function VersionHistory({
  versions,
  currentId,
}: VersionHistoryProps) {
  const { t, language } = useTranslation()
  const locale = localeForLanguage(language)
  const navigate = useNavigate()

  if (!versions || versions.length <= 1) {
    return (
      <p className="text-sm text-muted">{t("offers.details.noVersions")}</p>
    )
  }

  return (
    <ol className="space-y-2">
      {versions.map((version) => {
        const current = version.id === currentId
        const creator = version.createdByName || t("offers.list.unknownUser")
        const modifiedAt = version.lastModifiedAt ?? version.updatedAt
        const modifiedBy =
          version.lastModifiedByName || t("offers.list.unknownUser")

        return (
          <li key={version.id}>
            <button
              type="button"
              onClick={() => navigate(`/offers/${version.id}`)}
              className={`flex w-full flex-col gap-1.5 rounded-md border px-3 py-2 text-start text-sm transition-colors ${
                current
                  ? "border-primary/40 bg-primary-soft"
                  : "border-line-soft bg-page/40 hover:bg-page"
              }`}
            >
              <span className="flex w-full flex-wrap items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <span className="font-semibold text-primary">
                    v{version.version}
                  </span>
                  <span dir="ltr" className="text-ink">
                    {version.reference}
                  </span>
                </span>

                <span className="flex items-center gap-3">
                  <span className="text-xs text-muted tabular-nums">
                    {formatCurrency(version.total, version.currency, locale)}
                  </span>
                  <Badge variant={version.status}>
                    {t(`offers.status.${version.status}`)}
                  </Badge>
                </span>
              </span>

              <span className="flex w-full flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted">
                <span>
                  {t("offers.list.createdAt")}: {creator} ·{" "}
                  <span dir="ltr" className="tabular-nums">
                    {formatDateTime(version.createdAt)}
                  </span>
                </span>
                <span>
                  {t("offers.list.updatedAt")}: {modifiedBy} ·{" "}
                  <span dir="ltr" className="tabular-nums">
                    {modifiedAt ? formatDateTime(modifiedAt) : "—"}
                  </span>
                </span>
              </span>
            </button>
          </li>
        )
      })}
    </ol>
  )
}
