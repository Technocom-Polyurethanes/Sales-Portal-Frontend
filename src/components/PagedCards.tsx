import type { ReactNode } from "react"

import type { PaginatedResult } from "../lib/api/lookup"
import PaginationBar from "./PaginationBar"
import TableState from "./TableState"
import CardGridSkeleton from "./ui/CardSkeleton"

export type PagedCardsProps<T,> = {
  data: PaginatedResult<T> | undefined
  loading: boolean
  error?: Error
  rowKey: (row: T) => string
  renderCard: (row: T) => ReactNode
  onPageChange: (page: number) => void
  onRetry?: () => void
  query?: string
  onClearSearch?: () => void
  onClearFilters?: () => void
  hasFilters?: boolean
  createLabel?: string
  onCreate?: () => void
  emptyTitle: string
  emptyDescription?: string
  /** How many placeholders to show on the first load; match the page size. */
  skeletonCount?: number
}

/**
 * A page of records as a grid of cards that flows with the page (1, 2 or 3 columns by width),
 * with the same loading, empty and error states and page controls as `PagedTable`. Use it when
 * a record has more fields than a table row can show without scrolling sideways.
 */
export default function PagedCards<T>({
  data,
  loading,
  error,
  rowKey,
  renderCard,
  onPageChange,
  onRetry,
  query,
  onClearSearch,
  onClearFilters,
  hasFilters = false,
  createLabel,
  onCreate,
  emptyTitle,
  emptyDescription,
  skeletonCount = 6,
}: PagedCardsProps<T>) {
  const rows = data?.items ?? []

  if (loading && !data) return <CardGridSkeleton count={skeletonCount} />

  const state = error
    ? "error"
    : rows.length === 0 && hasFilters
      ? "empty-results"
      : rows.length === 0
        ? "empty-data"
        : "data"

  if (state !== "data") {
    return (
      <div className="rounded-lg border border-line bg-surface">
        <TableState
          state={state}
          query={query}
          errorMessage={error?.message}
          onRetry={onRetry}
          onClearSearch={onClearSearch}
          onClearFilters={onClearFilters}
          createLabel={createLabel}
          onCreate={onCreate}
          emptyTitle={emptyTitle}
          emptyDescription={emptyDescription}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <ul
        aria-busy={loading}
        className={`grid gap-4 sm:grid-cols-2 xl:grid-cols-3 ${
          loading ? "opacity-60 transition-opacity" : ""
        }`}
      >
        {rows.map((row) => (
          <li key={rowKey(row)} className="flex">
            {renderCard(row)}
          </li>
        ))}
      </ul>

      {data && data.totalCount > 0 && (
        <PaginationBar
          page={data.page}
          totalPages={data.totalPages}
          shown={rows.length}
          totalCount={data.totalCount}
          loading={loading}
          onPageChange={onPageChange}
        />
      )}
    </div>
  )
}
