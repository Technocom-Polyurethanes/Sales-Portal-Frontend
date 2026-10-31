import { useTranslation } from "../../../i18n/I18nProvider"
import { formatPackagingSummary } from "../../../lib/calculations/packaging"
import { formatIsoDay } from "../../../lib/formatters/date"
import { formatNumber } from "../../../lib/formatters/number"
import type { Offer } from "../types"

/** Materials, delivery schedule and notes of a stored offer. */
export default function OfferSummary({ offer }: { offer: Offer }) {
  const { t } = useTranslation()

  return (
    <div className="space-y-5">
      <section>
        <h3 className="mb-2 text-sm font-semibold text-ink">
          {t("offers.details.materials")}
        </h3>

        <div className="overflow-x-auto rounded-md border border-line">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-line bg-page/60 text-xs tracking-wide text-muted uppercase">
                <th scope="col" className="px-3 py-2 text-start">
                  {t("offers.details.materials")}
                </th>
                <th scope="col" className="px-3 py-2 text-start">
                  {t("offers.builder.packaging.packaging")}
                </th>
                <th scope="col" className="px-3 py-2 text-end">
                  {t("offers.builder.packaging.quantity")}
                </th>
                <th scope="col" className="px-3 py-2 text-end">
                  {t("offers.builder.packaging.rate")}
                </th>
                <th scope="col" className="px-3 py-2 text-end">
                  {t("offers.builder.packaging.amount")}
                </th>
              </tr>
            </thead>
            <tbody>
              {offer.lines.map((line) => (
                <tr
                  key={line.id}
                  className="border-b border-line-soft last:border-0"
                >
                  <td className="px-3 py-2">
                    <span className="block font-medium text-ink">
                      {
                        // Look up material name safely across available properties/document payload
                        line.materialName ?? 
                        ((offer as any).document?.items ?? (offer as any).documentDto?.items ?? []).find((di: any) => di.offerLineId === line.id || di.materialId === (line as any).materialId || di.materialId === (line as any).productId)?.materialName ?? 
                        "Material"
                      }
                    </span>
                    <span className="text-[11px] text-muted">
                      {(line as any).category ?? ((offer as any).document?.items ?? (offer as any).documentDto?.items ?? []).find((di: any) => di.offerLineId === line.id || di.materialId === (line as any).materialId || di.materialId === (line as any).productId)?.category ?? "Category"}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-muted">
                    {formatPackagingSummary(line.packaging)}
                  </td>
                  <td className="px-3 py-2 text-end tabular-nums">
                    {formatNumber(line.quantityKg)} kg
                  </td>
                  <td className="px-3 py-2 text-end tabular-nums">
                    {formatNumber(line.ratePerKg)}
                  </td>
                  <td className="px-3 py-2 text-end font-medium tabular-nums">
                    {formatNumber(line.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {(offer.delivery ?? (offer as any).deliveryBatches ?? []).length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-semibold text-ink">
            {t("offers.builder.steps.delivery")}
          </h3>

          <ul className="space-y-2">
            {(offer.delivery ?? (offer as any).deliveryBatches ?? []).map((batch: any) => (
              <li
                key={batch.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-line-soft bg-page/50 px-3 py-2 text-sm"
              >
                <span className="font-medium text-ink">
                  {t("offers.builder.delivery.batch", {
                    number: batch.batchNumber,
                  })}
                  <span className="ms-2 font-normal text-muted">
                    {formatIsoDay(batch.date ?? batch.deliveryDate)}
                  </span>
                </span>

                <span className="text-muted">
                  {(batch.allocations ?? [])
                    .filter((allocation: any) => allocation.packages > 0)
                    .map((allocation: any) => {
                      const matchedLine = (offer.lines ?? []).find(
                        (line: any) => line.productId === allocation.productId || line.materialId === allocation.materialId
                      )
                      const name = matchedLine?.materialName ?? allocation.materialName ?? "Material"
                      return `${name}: ${allocation.packages}`
                    })
                  .join(" · ")}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {offer.notes.trim() && (
        <section>
          <h3 className="mb-2 text-sm font-semibold text-ink">
            {t("common.notes")}
          </h3>
          <p className="rounded-md border border-line-soft bg-page/50 px-3 py-2.5 text-sm leading-relaxed whitespace-pre-line text-ink">
            {offer.notes}
          </p>
        </section>
      )}
    </div>
  )
}
