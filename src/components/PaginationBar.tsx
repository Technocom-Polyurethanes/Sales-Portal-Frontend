import { useTranslation } from "../i18n/I18nProvider"
import Button from "./ui/Button"

export type PaginationBarProps = {
  page: number
  totalPages: number
  /** Rows on this page and in the whole result, for the "Showing x of y" line. */
  shown: number
  totalCount: number
  loading?: boolean
  onPageChange: (page: number) => void
}

/** "Showing 12 of 87" with previous and next buttons, for lists that are not a table. */
export default function PaginationBar({
  page,
  totalPages,
  shown,
  totalCount,
  loading = false,
  onPageChange,
}: PaginationBarProps) {
  const { t } = useTranslation()

  return (
    <nav
      aria-label={t("common.page", { page, pages: totalPages })}
      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-surface px-4 py-3 text-xs text-muted"
    >
      <span>{t("common.showing", { count: shown, total: totalCount })}</span>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          disabled={loading || page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          {t("common.previous")}
        </Button>
        <span>{t("common.page", { page, pages: totalPages })}</span>
        <Button
          variant="ghost"
          size="sm"
          disabled={loading || page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          {t("common.next")}
        </Button>
      </div>
    </nav>
  )
}
