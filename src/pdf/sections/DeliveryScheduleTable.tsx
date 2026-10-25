import type { OfferDocumentBatch, OfferDocumentData } from "../templates/types"
import type { DocumentLanguage } from "../PdfLanguageProvider"

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
  language: DocumentLanguage
  source?: OfferDocumentData
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
  language,
  source,
}: DeliveryScheduleTableProps) {
  if (batches.length === 0) return null

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
            <th scope="col">{headings.deliveryDate}</th>
            {columns.map((column) => {
              const line = source?.lines.find((l) => (language === "ar" ? l.category === column : l.name.includes(column) || column.includes(l.category)))
              const header = source?.lines.find((l) => l.category === column) ?? source?.lines.find((l) => l.name === column)
              const label = header
                ? language === "ar"
                  ? `${header.category} — ${header.name}`
                  : `${header.category} — ${header.name}`
                : column
              return (
                <th scope="col" key={column} className="doc-num">
                  {label}
                </th>
              )
            })}
            <th scope="col" className="doc-num">
              {headings.packages}
            </th>
            <th scope="col" className="doc-num">
              {headings.totalWeight}
            </th>
          </tr>
        </thead>
        <tbody>
          {batches.map((batch) => {
            const batchTotalsByType = new Map<string, number>()
            for (const allocation of batch.allocations) {
              if (allocation.packages > 0) {
                const key = allocation.packageTypeName || ""
                batchTotalsByType.set(
                  key,
                  (batchTotalsByType.get(key) ?? 0) + allocation.packages,
                )
              }
            }
            return (
            <tr key={batch.batchNumber}>
              <td>
                <span className="doc-ltr">{formatDate(batch.date)}</span>
                {batch.weekday && (
                  <div className="doc-item-meta">{batch.weekday}</div>
                )}
              </td>
              {columns.map((column) => {
                const allocations = batch.allocations.filter(
                  (item) => item.label === column && item.packages > 0,
                )
                if (allocations.length === 0) {
                  return (
                    <td key={column} className="doc-num">
                      —
                    </td>
                  )
                }
                const totalKg = allocations.reduce((sum, item) => sum + item.weightKg, 0)
                return (
                  <td key={column} className="doc-num">
                    {allocations.map((allocation, idx) => (
                      <div key={idx}>
                        {allocation.packages} {allocation.packageTypeName || ""}
                      </div>
                    ))}
                    <div className="doc-item-meta doc-batch-weight">
                      <span className="doc-ltr">
                        {formatNumber(totalKg)}
                      </span>{" "}
                      {weightUnit}
                    </div>
                  </td>
                )
              })}
              <td className="doc-num">
                {Array.from(batchTotalsByType.entries()).map(([type, count]) => (
                  <div key={type}>
                    {count} {type}
                  </div>
                ))}
              </td>
              <td className="doc-num">
                <span className="doc-ltr">
                  {formatNumber(batch.totalWeightKg)}
                </span>
              </td>
            </tr>
            )
          })}
          <tr className="doc-total-row">
            <th scope="row">{headings.total}</th>
            {columns.map((column) => {
              const columnEntries = new Map<string, number>()
              let columnWeight = 0
              for (const batch of batches) {
                for (const allocation of batch.allocations) {
                  if (allocation.label === column && allocation.packages > 0) {
                    const key = allocation.packageTypeName || ""
                    columnEntries.set(key, (columnEntries.get(key) ?? 0) + allocation.packages)
                    columnWeight += allocation.weightKg
                  }
                }
              }
              return (
                <td key={column} className="doc-num">
                  {columnEntries.size > 0 ? (
                    <>
                      {Array.from(columnEntries.entries()).map(([type, count]) => (
                        <div key={type}>
                          {count} {type}
                        </div>
                      ))}
                      <div className="doc-item-meta doc-batch-weight">
                        <span className="doc-ltr">
                          {formatNumber(columnWeight)}
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
              {(() => {
                const grandTotals = new Map<string, number>()
                for (const batch of batches) {
                  for (const allocation of batch.allocations) {
                    if (allocation.packages > 0) {
                      const key = allocation.packageTypeName || ""
                      grandTotals.set(key, (grandTotals.get(key) ?? 0) + allocation.packages)
                    }
                  }
                }
                return Array.from(grandTotals.entries()).map(([type, count]) => (
                  <div key={type}>
                    {count} {type}
                  </div>
                ))
              })()}
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
