import { Fragment } from "react"

import type { OfferDocumentLine } from "../templates/types"

export type ItemsTableProps = {
  headings: {
    item: string
    quantity: string
    rate: string
    amount: string
    packaging: string
  }
  lines: OfferDocumentLine[]
  currency: string
  weightUnit: string
  formatNumber: (value: number) => string
}

/** Priced materials with their packaging breakdown. */
export default function ItemsTable({
  headings,
  lines,
  currency,
  weightUnit,
  formatNumber,
}: ItemsTableProps) {
  return (
    <table className="doc-table doc-items">
      <thead>
        <tr>
          <th scope="col" className="doc-index">
            #
          </th>
          <th scope="col">{headings.item}</th>
          <th scope="col" className="doc-num">
            {headings.quantity}
          </th>
          <th scope="col" className="doc-num">
            {headings.rate}
          </th>
          <th scope="col" className="doc-num">
            {headings.amount}
          </th>
        </tr>
      </thead>
      <tbody>
        {lines.map((line, index) => (
          <Fragment key={`${line.code}-${index}`}>
            <tr>
              <td className="doc-num doc-index">
                <span className="doc-ltr">{index + 1}</span>
              </td>
              <td>
                <span className="doc-item-name">{line.name}</span>
                <div className="doc-item-meta">
                  <span className="doc-ltr">{line.code}</span>
                </div>
              </td>
              <td className="doc-num">
                <span className="doc-ltr">{formatNumber(line.quantityKg)}</span>
              </td>
              <td className="doc-num">
                <span className="doc-ltr">{formatNumber(line.ratePerKg)}</span>
              </td>
              <td className="doc-num">
                <span className="doc-ltr">{formatNumber(line.amount)}</span>{" "}
                {currency}
              </td>
            </tr>
            {line.packagingSummary && (
              <tr className="doc-subrow">
                <td colSpan={5}>
                  <span className="doc-subrow-label">
                    {headings.packaging}:
                  </span>{" "}
                  {line.packagingSummary} ={" "}
                  <span className="doc-ltr">
                    {formatNumber(line.quantityKg)}
                  </span>{" "}
                  {weightUnit}
                </td>
              </tr>
            )}
          </Fragment>
        ))}
      </tbody>
    </table>
  )
}
