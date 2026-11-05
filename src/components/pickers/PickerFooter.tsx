import Button from "../ui/Button"
import Skeleton from "../ui/Skeleton"

export type PickerFooterProps = {
  language: string
  page: number
  totalPages: number
  start: number
  end: number
  totalCount: number
  /** No page has loaded yet, so there are no counts to show. */
  pending: boolean
  onPage: (page: number) => void
}

/** "Showing 1–8 of 120" with previous and next buttons, shared by the picker modals. */
export default function PickerFooter({
  language,
  page,
  totalPages,
  start,
  end,
  totalCount,
  pending,
  onPage,
}: PickerFooterProps) {
  const ar = language === "ar"

  return (
    <div className="flex h-12 items-center justify-between border-t border-slate-200 px-4 text-sm text-slate-600">
      <div>
        {pending ? (
          <Skeleton className="h-3.5 w-32" />
        ) : ar ? (
          `عرض ${start}–${end} من أصل ${totalCount}`
        ) : (
          `Showing ${start}–${end} of ${totalCount}`
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          {ar ? "السابق" : "Previous"}
        </Button>
        <span>{ar ? `صفحة ${page} من ${totalPages}` : `Page ${page} of ${totalPages}`}</span>
        <Button
          variant="ghost"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPage(page + 1)}
        >
          {ar ? "التالي" : "Next"}
        </Button>
      </div>
    </div>
  )
}
