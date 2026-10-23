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
        {rows.map((row) => (
          <tr key={row.label}>
            <th scope="row">{row.label}</th>
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
