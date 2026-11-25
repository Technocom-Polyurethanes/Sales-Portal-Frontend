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
  formatMoney: (value: number) => string
  /** Hides quantities, amounts and packaging: only material and price per kg remain. */
  priceOnly?: boolean
}

/** Priced materials with their packaging breakdown. */
export default function ItemsTable({
  headings,
  lines,
  currency,
  weightUnit,
  formatNumber,
  formatMoney,
  priceOnly = false,
}: ItemsTableProps) {
  return (
    <table className="doc-table doc-items">
      <thead>
        <tr>
          <th scope="col" className="doc-index">
            #
          </th>
          <th scope="col">{headings.item}</th>
          {!priceOnly && (
            <th scope="col" className="doc-num">
              {headings.quantity}
            </th>
          )}
          <th scope="col" className="doc-num">
            {headings.rate} ({currency}/{weightUnit})
          </th>
          {!priceOnly && (
            <th scope="col" className="doc-num">
              {headings.amount} ({currency})
            </th>
          )}
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
                <span className="doc-item-name" data-latin>
                  {line.name}
                </span>
              </td>
              {!priceOnly && (
                <td className="doc-num">
                  <span className="doc-ltr">{formatNumber(line.quantityKg)}</span>
                </td>
              )}
              <td className="doc-num">
                <span className="doc-ltr">{formatMoney(line.ratePerKg)}</span>
              </td>
              {!priceOnly && (
                <td className="doc-num">
                  <span className="doc-ltr">{formatMoney(line.amount)}</span>
                </td>
              )}
            </tr>
            {!priceOnly && line.packagingSummary && (
              <tr className="doc-subrow">
                <td colSpan={5}>
                  <span className="doc-subrow-label">
                    {headings.packaging}:
                  </span>{" "}
                  {line.packagingSummary}
                </td>
              </tr>
            )}
          </Fragment>
        ))}
      </tbody>
    </table>
  )
}
