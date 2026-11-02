import { useTranslation } from "../../../i18n/I18nProvider"
import { formatIsoDay } from "../../../lib/formatters/date"
import { formatNumber } from "../../../lib/formatters/number"
import type { Offer } from "../types"

function formatPackagingSummary(packaging: any[] = []) {
  if (!packaging || packaging.length === 0) return ""
  return packaging
    .map((pkg) => {
      const name =
        (pkg as any).packageTypeName ||
        (pkg as any).packageType ||
        (pkg as any).name ||
        ""
      const weight = (pkg as any).weightPerPackageKg ?? (pkg as any).weightPerPackage ?? 0
      const packages = (pkg as any).packages ?? 0
      if (name && weight) {
        return `${packages} × ${weight} kg ${name}`
      }
      if (name) {
        return `${packages} × ${weight || ""} kg ${name}`.replace("×  kg", "× kg").trim()
      }
      if (weight) {
        return `${packages} × ${weight} kg`
      }
      return `${packages}`
    })
    .join(", ")
}

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
              {(offer.lines || []).map((line: any) => {
                const doc = (offer as any).document || (offer as any).documentDto
                const docLine =
                  (doc?.lines || doc?.items || []).find(
                    (di: any) =>
                      di.offerLineId === line.id ||
                      di.id === line.id ||
                      di.productId === (line.materialId || line.productId) ||
                      di.materialId === (line.materialId || line.productId),
                  ) || {}
                const materialName =
                  line.materialName ||
                  line.productName ||
                  docLine.materialName ||
                  docLine.name ||
                  "Material"
                const category = line.category || docLine.category || ""
                const packaging = line.packaging || docLine.packaging || []
                const packagingSummary =
                  line.packagingSummary ||
                  docLine.packagingSummary ||
                  formatPackagingSummary(packaging)
                const calculatedQtyKg = Array.isArray(packaging)
                  ? packaging.reduce(
                      (sum: number, pkg: any) =>
                        sum + (pkg.packages ?? 0) * (pkg.weightPerPackageKg ?? 0),
                      0,
                    )
                  : 0
                const quantityKg =
                  line.quantityKg ?? docLine.quantityKg ?? calculatedQtyKg ?? 0
                const ratePerKg = line.ratePerKg ?? docLine.ratePerKg ?? 0
                const amount =
                  line.amount ??
                  docLine.amount ??
                  (quantityKg && ratePerKg ? quantityKg * ratePerKg : 0)
                return (
                  <tr
                    key={line.id || line.productId || materialName}
                    className="border-b border-line-soft last:border-0"
                  >
                    <td className="px-3 py-2">
                      <span className="block font-medium text-ink">
                        {materialName}
                      </span>
                      {category && (
                        <span className="text-[11px] text-muted">{category}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-muted">
                      {packagingSummary}
                    </td>
                    <td className="px-3 py-2 text-end tabular-nums">
                      {formatNumber(quantityKg)} kg
                    </td>
                    <td className="px-3 py-2 text-end tabular-nums">
                      {formatNumber(ratePerKg)}
                    </td>
                    <td className="px-3 py-2 text-end font-medium tabular-nums">
                      {formatNumber(amount)}
                    </td>
                  </tr>
                )
              })}
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
            {(offer.delivery ?? (offer as any).deliveryBatches ?? []).map(
              (batch: any) => (
                <li
                  key={batch.id || batch.batchNumber}
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
                        const allocPid = allocation.productId || allocation.materialId
                        const matchedLine = (offer.lines ?? []).find(
                          (line: any) =>
                            line.productId === allocPid ||
                            line.materialId === allocPid ||
                            line.id === allocation.offerLineId,
                        )
                        const doc = (offer as any).document || (offer as any).documentDto
                        const docLine = (doc?.lines || doc?.items || []).find(
                          (di: any) =>
                            di.offerLineId === matchedLine?.id ||
                            di.productId === allocPid ||
                            di.materialId === allocPid,
                        )
                        const name =
                          matchedLine?.materialName ||
                          docLine?.materialName ||
                          allocation.materialName ||
                          allocation.label ||
                          ((offer.lines || []).findIndex(
                            (l: any) => (l.productId || l.materialId) === allocPid,
                          ) >= 0
                            ? (offer.lines || [])[
                                (offer.lines || []).findIndex(
                                  (l: any) =>
                                    (l.productId || l.materialId) === allocPid,
                                )
                              ]?.materialName ||
                              `Material ${
                                (offer.lines || []).findIndex(
                                  (l: any) =>
                                    (l.productId || l.materialId) === allocPid,
                                ) + 1
                              }`
                            : "Material")
                        return `${name}: ${allocation.packages}`
                      })
                      .join(" · ")}
                  </span>
                </li>
              ),
            )}
          </ul>
        </section>
      )}

      {(offer.notes || "").trim() && (
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
