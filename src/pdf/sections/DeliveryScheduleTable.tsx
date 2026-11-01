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
  columns: Array<string | { key: string; label: string }>
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
}: DeliveryScheduleTableProps) {
  if (batches.length === 0) return null
  const categoryOnly = (label: string) => label.split(" ")[0].trim()

  return (
    <section className="doc-section">
      <h3>{heading}</h3>
      <table className="doc-table doc-schedule">
        <thead>
          <tr>
            <th scope="col">{headings.deliveryDate}</th>
            {columns.map((column) => {
              const label = typeof column === "string" ? column : column.label
              const key = typeof column === "string" ? column : column.key
              return (
                <th scope="col" key={key} className="doc-num">
                  {categoryOnly(label)}
                </th>
              )
            })}
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
                const label = typeof column === "string" ? column : column.label
                const key = typeof column === "string" ? column : column.key
                const allocations = batch.allocations.filter(
                  (item) => (item.productId === key) || (item.label === label && !item.productId),
                )
                const filtered = allocations.filter((item) => item.packages > 0)
                if (filtered.length === 0) {
                  return (
                    <td key={key} className="doc-num">
                      —
                    </td>
                  )
                }
                const totalKg = filtered.reduce((sum, item) => sum + item.weightKg, 0)
                return (
                  <td key={key} className="doc-num">
                    {filtered.map((allocation, idx) => (
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
            </tr>
            )
          })}
          <tr className="doc-total-row">
            <th scope="row">{headings.total}</th>
            {columns.map((column) => {
              const label = typeof column === "string" ? column : column.label
              const key = typeof column === "string" ? column : column.key
              const columnEntries = new Map<string, number>()
              let columnWeight = 0
              for (const batch of batches) {
                for (const allocation of batch.allocations) {
                  if (((allocation.productId && allocation.productId === key) || (allocation.label === label && !allocation.productId)) && allocation.packages > 0) {
                    const typeKey = allocation.packageTypeName || ""
                    columnEntries.set(typeKey, (columnEntries.get(typeKey) ?? 0) + allocation.packages)
                    columnWeight += allocation.weightKg
                  }
                }
              }
              return (
                <td key={key} className="doc-num">
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
          </tr>
        </tbody>
      </table>
    </section>
  )
}
