import { ReactNode } from "react"
import Button from "./ui/Button"
import Icon from "./ui/Icon"
import Spinner from "./ui/Spinner"
import { useTranslation } from "../i18n/I18nProvider"

export type TableStateType = "loading" | "error" | "empty-data" | "empty-results" | "data"

export type TableStateProps = {
  state: TableStateType
  query?: string
  errorMessage?: string
  onRetry?: () => void
  onClearSearch?: () => void
  onClearFilters?: () => void
  createLabel?: string
  onCreate?: () => void
  emptyTitle?: string
  emptyDescription?: string
  resultsTitle?: string
  resultsHint?: string
  children?: ReactNode
  colSpan?: number
}

export default function TableState({
  state,
  query,
  errorMessage,
  onRetry,
  onClearSearch,
  onClearFilters,
  createLabel,
  onCreate,
  emptyTitle,
  emptyDescription,
  resultsTitle,
  resultsHint,
  children,
  colSpan = 1,
}: TableStateProps) {
  const { language, t } = useTranslation()

  if (state === "loading") {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size={24} />
      </div>
    )
  }

  if (state === "error") {
    return (
      <div
        role="alert"
        className="flex flex-col items-center justify-center gap-3 px-6 py-10 text-center"
      >
        <Icon name="help" size={28} className="text-red-500" />
        <p className="text-sm text-ink">
          {errorMessage || t("shell.helpText")}
        </p>
        {onRetry && (
          <Button variant="secondary" size="sm" onClick={onRetry}>
            {language === "ar" ? "إعادة المحاولة" : "Retry"}
          </Button>
        )}
      </div>
    )
  }

  if (state === "empty-results") {
    const title =
      resultsTitle ||
      (language === "ar"
        ? `لا توجد نتائج لـ "${query ?? ""}"`
        : `No results for "${query ?? ""}"`)
    const hint =
      resultsHint ||
      (language === "ar"
        ? "تحقق من التهجئة أو وسّع نطاق البحث"
        : "Try adjusting your search or filters")
    return (
      <div
        role="status"
        className="flex flex-col items-center justify-center gap-3 px-6 py-10 text-center"
      >
        <Icon name="search" size={28} className="text-muted" />
        <div>
          <p className="text-sm font-medium text-ink">{title}</p>
          <p className="mt-1 text-xs text-muted">{hint}</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {onClearSearch && (
            <Button variant="secondary" size="sm" onClick={onClearSearch}>
              {language === "ar" ? "مسح البحث" : "Clear search"}
            </Button>
          )}
          {onClearFilters && (
            <Button variant="ghost" size="sm" onClick={onClearFilters}>
              {language === "ar" ? "مسح الفلاتر" : "Clear filters"}
            </Button>
          )}
        </div>
      </div>
    )
  }

  if (state === "empty-data") {
    const title =
      emptyTitle ||
      t("offers.list.empty") ||
      (language === "ar" ? "لا توجد عناصر بعد" : "No items yet")
    const description =
      emptyDescription ||
      (language === "ar" ? "ابدأ بإضافة عنصر جديد" : "Get started by creating your first item")
    return (
      <div
        role="status"
        className="flex flex-col items-center justify-center gap-3 px-6 py-10 text-center"
      >
        <Icon name="offers" size={28} className="text-muted" />
        <div>
          <p className="text-sm font-medium text-ink">{title}</p>
          <p className="mt-1 text-xs text-muted">{description}</p>
        </div>
        {onCreate && createLabel && (
          <Button variant="primary" size="sm" onClick={onCreate}>
            {createLabel}
          </Button>
        )}
      </div>
    )
  }

  return <>{children}</>
}
