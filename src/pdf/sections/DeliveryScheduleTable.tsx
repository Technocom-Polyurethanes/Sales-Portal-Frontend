import type { OfferDocumentBatch } from "../templates/types"

export type DeliveryScheduleTableProps = {
  heading: string
  headings: {
    batch: string
    deliveryDate: string
    packages: string
    totalWeight: string
    total: string
  }
  batches: OfferDocumentBatch[]
  columns: string[]
  weightUnit: string
  formatDate: (value: string) => string
  formatNumber: (value: number) => string
}

/** Delivery batches with the packages and the kilograms per material. */
export default function DeliveryScheduleTable({
  heading,
  headings,
  batches,
  columns,
  weightUnit,
  formatDate,
  formatNumber,
}: DeliveryScheduleTableProps) {
  if (batches.length === 0) return null

  const totalPackages = batches.reduce(
    (sum, batch) => sum + batch.totalPackages,
    0,
  )
  const totalWeightKg = batches.reduce(
    (sum, batch) => sum + batch.totalWeightKg,
    0,
  )

  return (
    <section className="doc-section">
      <h3>{heading}</h3>
      <table className="doc-table doc-schedule">
        <thead>
          <tr>
            <th scope="col">{headings.batch}</th>
            <th scope="col">{headings.deliveryDate}</th>
            {columns.map((column) => (
              <th scope="col" key={column} className="doc-num">
                {column}
              </th>
            ))}
            <th scope="col" className="doc-num">
              {headings.packages}
            </th>
            <th scope="col" className="doc-num">
              {headings.totalWeight}
            </th>
          </tr>
        </thead>
        <tbody>
          {batches.map((batch) => (
            <tr key={batch.batchNumber}>
              <td>
                <span className="doc-ltr">{batch.batchNumber}</span>
              </td>
              <td>
                <span className="doc-ltr">{formatDate(batch.date)}</span>
                {batch.weekday && (
                  <div className="doc-item-meta">{batch.weekday}</div>
                )}
              </td>
              {columns.map((column) => {
                const allocation = batch.allocations.find(
                  (item) => item.label === column,
                )
                return (
                  <td key={column} className="doc-num">
                    {allocation ? (
                      <>
                        <span className="doc-ltr">
                          {formatNumber(allocation.packages)}
                        </span>
                        <div className="doc-item-meta">
                          <span className="doc-ltr">
                            {formatNumber(allocation.weightKg)}
                          </span>{" "}
                          {weightUnit}
                        </div>
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                )
              })}
              <td className="doc-num">
                <span className="doc-ltr">
                  {formatNumber(batch.totalPackages)}
                </span>
              </td>
              <td className="doc-num">
                <span className="doc-ltr">
                  {formatNumber(batch.totalWeightKg)}
                </span>
              </td>
            </tr>
          ))}
          <tr className="doc-total-row">
            <th scope="row" colSpan={2}>
              {headings.total}
            </th>
            {columns.map((column) => (
              <td key={column} />
            ))}
            <td className="doc-num">
              <span className="doc-ltr">{formatNumber(totalPackages)}</span>
            </td>
            <td className="doc-num">
              <span className="doc-ltr">{formatNumber(totalWeightKg)}</span>{" "}
              {weightUnit}
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  )
}
