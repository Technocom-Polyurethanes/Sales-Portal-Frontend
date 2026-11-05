import Skeleton from "./Skeleton"

export type TableSkeletonProps = {
  rows?: number
  columns?: number
  /** Row height class, so the placeholder matches the real rows and nothing jumps. */
  rowClassName?: string
  /** Render as table rows (inside a <tbody>) instead of a standalone block. */
  asRows?: boolean
}

// Varied widths read as text; identical bars read as a loading widget.
const WIDTHS = ["w-24", "w-40", "w-32", "w-20", "w-36", "w-28"]

function cellWidth(row: number, column: number): string {
  return WIDTHS[(row * 3 + column * 2) % WIDTHS.length]
}

/** Placeholder rows shown while a table loads its data. */
export default function TableSkeleton({
  rows = 6,
  columns = 4,
  rowClassName = "h-12",
  asRows = false,
}: TableSkeletonProps) {
  const rowIds = Array.from({ length: rows }, (_, row) => row)
  const columnIds = Array.from({ length: columns }, (_, column) => column)

  if (asRows) {
    return (
      <>
        {rowIds.map((row) => (
          <tr key={row} className={`border-b border-slate-100 ${rowClassName}`}>
            {columnIds.map((column) => (
              <td key={column} className="px-4">
                <Skeleton className={`h-3.5 ${cellWidth(row, column)} max-w-full`} />
              </td>
            ))}
          </tr>
        ))}
      </>
    )
  }

  return (
    <div role="status" aria-busy="true" aria-label="Loading">
      {rowIds.map((row) => (
        <div
          key={row}
          className={`flex items-center gap-6 border-b border-line-soft px-4 last:border-0 ${rowClassName}`}
        >
          {columnIds.map((column) => (
            <Skeleton
              key={column}
              className={`h-3.5 ${cellWidth(row, column)} max-w-full ${column === 0 ? "" : "flex-1"}`}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
