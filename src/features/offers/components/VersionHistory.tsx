import { useNavigate } from "react-router-dom"

import Badge from "../../../components/ui/Badge"
import { useTranslation } from "../../../i18n/I18nProvider"
import { formatIsoDay } from "../../../lib/formatters/date"
import { localeForLanguage } from "../../../lib/formatters/locale"
import { formatCurrency } from "../../../lib/formatters/number"
import type { OfferListItem } from "../types"

export type VersionHistoryProps = {
  versions: OfferListItem[]
  currentId: string
}

/** Every version created from the same offer, oldest first. */
export default function VersionHistory({
  versions,
  currentId,
}: VersionHistoryProps) {
  const { t, language } = useTranslation()
  const locale = localeForLanguage(language)
  const navigate = useNavigate()

  if (versions.length <= 1) {
    return (
      <p className="text-sm text-muted">{t("offers.details.noVersions")}</p>
    )
  }

  return (
    <ol className="space-y-2">
      {versions.map((version) => {
        const current = version.id === currentId

        return (
          <li key={version.id}>
            <button
              type="button"
              onClick={() => navigate(`/offers/${version.id}`)}
              className={`flex w-full flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-start text-sm transition-colors ${
                current
                  ? "border-primary/40 bg-primary-soft"
                  : "border-line-soft bg-page/40 hover:bg-page"
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="font-semibold text-primary">
                  v{version.version}
                </span>
                <span dir="ltr" className="text-ink">
                  {version.reference}
                </span>
              </span>

              <span className="flex items-center gap-3">
                <span className="text-xs text-muted">
                  {formatIsoDay(version.issueDate)} ·{" "}
                  {formatCurrency(
                    version.total,
                    version.currency,
                    locale,
                  )}
                </span>
                <Badge variant={version.status}>
                  {t(`offers.status.${version.status}`)}
                </Badge>
              </span>
            </button>
          </li>
        )
      })}
    </ol>
  )
}
