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
  empty,
  className = "",
}: DataTableProps<T>) {
  if (rows.length === 0 && empty) {
    return (
      <div className="px-5 py-10 text-center text-sm text-muted">{empty}</div>
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
                className={`px-4 py-3 text-xs font-semibold tracking-wide text-muted uppercase ${
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
              className={`border-b border-line-soft last:border-0 max-md:block max-md:border-b max-md:border-line max-md:py-2 ${
                onRowClick ? "cursor-pointer hover:bg-page" : ""
              }`}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  data-label={column.header}
                  className={`px-4 py-3 align-middle max-md:flex max-md:items-center max-md:justify-between max-md:gap-3 max-md:px-3 max-md:py-1.5 ${
                    column.align === "end" ? "md:text-end" : "md:text-start"
                  } ${column.className ?? ""}`}
                >
                  <span className="md:hidden text-xs text-muted">{column.header}</span>
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
