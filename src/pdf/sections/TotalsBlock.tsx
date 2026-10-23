export type TotalsRow = {
  label: string
  /** The amount, already formatted and signed. */
  value: string
  /** Currency printed after the amount, it follows the document direction. */
  currency?: string
  variant?: "grand" | "deduction"
}

export type TotalsBlockProps = {
  rows: TotalsRow[]
}

const VARIANTS: Record<string, string> = {
  grand: "doc-grand",
  deduction: "doc-deduction",
}

/** Subtotal, discount, taxes and the total of the offer. */
export default function TotalsBlock({ rows }: TotalsBlockProps) {
  return (
    <table className="doc-totals">
      <tbody>
        {rows.map((row) => (
          <tr
            key={row.label}
            className={VARIANTS[row.variant ?? ""] ?? undefined}
          >
            <th scope="row">{row.label}</th>
            <td>
              <span className="doc-ltr">{row.value}</span>
              {row.currency ? ` ${row.currency}` : null}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
