export type ReferenceRow = {
  label: string
  value: string
  /** Keeps the value left to right, used by the reference number. */
  ltr?: boolean
}

export type ReferenceTableProps = {
  rows: ReferenceRow[]
}

/** Structured reference table (reference, dates, terms and currency). */
export default function ReferenceTable({ rows }: ReferenceTableProps) {
  return (
    <table className="doc-reference">
      <tbody>
        {rows.map((row, index) => (
          <tr key={row.label}>
            <th scope="row">
              {index === 0 ? (
                <div className="flex w-full items-center justify-between gap-2">
                  <span>{row.label}</span>
                  <span className="doc-ltr font-mono text-[10px] font-normal text-slate-500">
                    TF-06-01
                  </span>
                </div>
              ) : (
                row.label
              )}
            </th>
            <td>
              {row.ltr ? (
                <span className="doc-ltr">{row.value}</span>
              ) : (
                row.value
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
