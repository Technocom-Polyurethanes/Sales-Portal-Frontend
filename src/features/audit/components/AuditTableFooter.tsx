import Button from "../../../components/ui/Button"
import Select from "../../../components/ui/Select"
import { useTranslation } from "../../../i18n/I18nProvider"
import { localeForLanguage } from "../../../lib/formatters/locale"
import { formatNumber } from "../../../lib/formatters/relative"
import { PAGE_SIZES } from "./auditQueryState"

export type AuditTableFooterProps = {
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}

export default function AuditTableFooter({
  page,
  pageSize,
  totalCount,
  totalPages,
  onPageChange,
  onPageSizeChange,
}: AuditTableFooterProps) {
  const { t, language } = useTranslation()
  const locale = localeForLanguage(language)
  const from = totalCount === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, totalCount)

  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
      <div className="flex flex-wrap items-center gap-3">
        <span>
          {t("audit.footer.showing", {
            from: formatNumber(from, locale),
            to: formatNumber(to, locale),
            total: formatNumber(totalCount, locale),
          })}
        </span>
        <label className="flex items-center gap-2">
          {t("audit.footer.pageSize")}
          <Select
            aria-label={t("audit.footer.pageSize")}
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            className="h-9 w-20 px-2"
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </Select>
        </label>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          {t("common.previous")}
        </Button>
        {totalPages <= 7 &&
          Array.from({ length: totalPages }, (_, index) => index + 1).map(
            (number) => (
              <button
                key={number}
                type="button"
                aria-current={number === page ? "page" : undefined}
                onClick={() => onPageChange(number)}
                className={`activity-press size-11 rounded-lg text-sm font-medium ${
                  number === page
                    ? "bg-primary text-on-primary"
                    : "text-muted hover:bg-page"
                }`}
              >
                {number}
              </button>
            ),
          )}
        <Button
          variant="ghost"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          {t("common.next")}
        </Button>
      </div>
      <p className="w-full text-muted">{t("audit.footer.retention")}</p>
    </div>
  )
}
