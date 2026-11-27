import type { ReactNode } from "react"

export type Column<T,> = {
  key: string
  header: string
  render: (row: T) => ReactNode
  className?: string
  align?: "start" | "end"
  /** Hidden on small screens when the value is duplicated elsewhere. */
  secondary?: boolean
}

export type DataTableProps<T,> = {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  onRowClick?: (row: T) => void
  /** Accessible name for the hidden action button in the first cell. */
  rowActionLabel?: (row: T) => string
  empty?: ReactNode
  className?: string
}

/**
 * Responsive table: on wide screens it behaves like a normal table, on small
 * screens every cell stacks and shows its column label.
 */
export default function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  rowActionLabel = (row) => `${columns[0].header}: ${rowKey(row)}`,
  empty,
  className = "",
}: DataTableProps<T>) {
  if (rows.length === 0 && empty) {
    return (
      <div className="rounded-xl border border-line-soft bg-surface px-5 py-10 text-center text-sm text-muted">
        {empty}
      </div>
    )
  }

  return (
    <div className={`scrollbar-slim overflow-x-auto ${className}`}>
      <table className="w-full border-collapse text-sm">
        <thead className="max-md:sr-only">
          <tr className="border-b border-line">
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={`px-4 py-3 text-xs font-semibold text-muted ${
                  column.align === "end" ? "text-end" : "text-start"
                }`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="max-md:block">
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={`border-b border-line-soft last:border-0 max-md:block max-md:border-b max-md:border-line-soft max-md:py-2 ${
                onRowClick ? "cursor-pointer hover:bg-page" : ""
              }`}
            >
              {columns.map((column, index) => (
                <td
                  key={column.key}
                  data-label={column.header}
                  className={`px-4 py-3 align-middle max-md:flex max-md:items-center max-md:justify-between max-md:gap-3 max-md:px-3 max-md:py-1.5 ${
                    column.align === "end" ? "md:text-end" : "md:text-start"
                  } ${column.className ?? ""}`}
                >
                  <span className="text-xs font-medium text-muted md:hidden">
                    {column.header}
                  </span>
                  {onRowClick && index === 0 && (
                    <button
                      type="button"
                      aria-label={rowActionLabel(row)}
                      className="sr-only focus:not-sr-only focus:me-2 focus:rounded focus:bg-primary-soft focus:px-2 focus:py-1 focus:text-ink"
                      onClick={(event) => {
                        event.stopPropagation()
                        onRowClick(row)
                      }}
                    >
                      {rowActionLabel(row)}
                    </button>
                  )}
                  <span className={column.align === "end" ? "text-end" : "text-start"}>
                    {column.render(row)}
                  </span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
