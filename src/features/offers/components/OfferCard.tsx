import Badge from "../../../components/ui/Badge"

import Button from "../../../components/ui/Button"

import Icon from "../../../components/ui/Icon"

import { useTranslation } from "../../../i18n/I18nProvider"

import { formatCurrency } from "../../../lib/formatters"

import { formatDateTime } from "../../../lib/formatters/date"

import { localeForLanguage } from "../../../lib/formatters/locale"

import type { OfferListItem } from "../types"

export type OfferCardProps = {
  offer: OfferListItem

  onOpen: (offer: OfferListItem) => void

  onDelete?: (offer: OfferListItem) => void
}

/** One offer with who created it and when: the list as cards instead of a table that scrolls sideways. */

export default function OfferCard({ offer, onOpen, onDelete }: OfferCardProps) {
  const { t, language } = useTranslation()

  const locale = localeForLanguage(language)

  const creator = offer.createdByName || t("offers.list.unknownUser")

  const modifiedBy = offer.lastModifiedByName

  const modifiedAt = offer.lastModifiedAt ?? offer.updatedAt

  return (
    <article className="flex w-full flex-col gap-3 rounded-lg border border-line bg-surface p-4 transition-colors hover:border-primary/40">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <button
              type="button"
              dir="ltr"
              onClick={(event) => {
                event.stopPropagation()

                onOpen(offer)
              }}
              className="truncate text-primary transition-colors hover:text-primary-hover"
            >
              {offer.reference}
            </button>
            {offer.version > 1 && (
              <span className="rounded bg-page px-1.5 py-0.5 text-xs font-normal text-muted">
                v{offer.version}
              </span>
            )}
          </h3>
          <p className="mt-0.5 truncate text-sm text-ink">
            {offer.customerName}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Badge variant={offer.status}>
            {t(`offers.status.${offer.status}`)}
          </Badge>
        </div>
      </header>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div className="min-w-0">
          <dt className="text-xs text-muted">{t("offers.list.createdBy")}</dt>
          <dd className="truncate text-ink">{creator}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">{t("offers.list.total")}</dt>
          <dd className="font-medium text-ink tabular-nums">
            {formatCurrency(offer.total, offer.currency, locale)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted">{t("offers.list.createdAt")}</dt>
          <dd dir="ltr" className="text-start text-ink tabular-nums">
            {formatDateTime(offer.rootCreatedAt ?? offer.createdAt, locale)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted">{t("offers.list.updatedAt")}</dt>
          <dd dir="ltr" className="text-start text-ink tabular-nums">
            {modifiedAt ? formatDateTime(modifiedAt, locale) : "—"}
          </dd>
        </div>
      </dl>

      <footer className="mt-auto flex items-center justify-between gap-3 border-t border-line-soft pt-3 text-xs text-muted">
        <span className="min-w-0 truncate">
          {modifiedBy
            ? `${t("offers.details.lastModifiedBy")}: ${modifiedBy}`
            : ""}
        </span>
        {onDelete && (
          <Button
            variant="danger"
            size="sm"
            data-testid="delete-button"
            aria-label={t("common.deleteTitle", { name: offer.reference })}
            className=""
            onClick={(event) => {
              event.stopPropagation()

              onDelete(offer)
            }}
          >
            <Icon name="trash" size={18} />
            {t("common.delete")}
          </Button>
        )}
      </footer>
    </article>
  )
}
