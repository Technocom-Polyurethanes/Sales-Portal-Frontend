import DataTable from "../../../components/ui/DataTable"
import { useTranslation } from "../../../i18n/I18nProvider"
import { formatIsoDay } from "../../../lib/formatters/date"
import { localeForLanguage } from "../../../lib/formatters/locale"
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

/** A titled block of free text, printed only when it has some. */
function TextSection({ title, text }: { title: string; text?: string }) {
  if (!(text ?? "").trim()) return null

  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold text-ink">{title}</h3>
      <p className="rounded-md border border-line-soft bg-page/50 px-3 py-2.5 text-sm leading-relaxed whitespace-pre-line text-ink">
        {text}
      </p>
    </section>
  )
}

/** Materials, delivery, payment conditions and notes of a stored offer. */
export default function OfferSummary({ offer }: { offer: Offer }) {
  const { t, language } = useTranslation()
  const locale = localeForLanguage(language)

  const materialRows = (offer.lines || []).map((line: any) => {
    const doc = (offer as any).document || (offer as any).documentDto
    const docLine =
      (doc?.lines || doc?.items || []).find(
        (di: any) =>
          di.offerLineId === line.id ||
          di.id === line.id ||
          di.productId === (line.materialId || line.productId) ||
          di.materialId === (line.materialId || line.productId),
      ) || {}
    const packaging = line.packaging || docLine.packaging || []
    const quantityKg =
      line.quantityKg ??
      docLine.quantityKg ??
      packaging.reduce(
        (sum: number, pkg: any) =>
          sum + (pkg.packages ?? 0) * (pkg.weightPerPackageKg ?? 0),
        0,
      )
    const ratePerKg = line.ratePerKg ?? docLine.ratePerKg ?? 0

    return {
      id: line.id || line.productId || line.materialName || "line",
      materialName:
        line.materialName ||
        line.productName ||
        docLine.materialName ||
        docLine.name ||
        "Material",
      category: line.category || docLine.category || "",
      packagingSummary:
        line.packagingSummary ||
        docLine.packagingSummary ||
        formatPackagingSummary(packaging),
      quantityKg,
      ratePerKg,
      amount:
        line.amount ??
        docLine.amount ??
        (quantityKg && ratePerKg ? quantityKg * ratePerKg : 0),
    }
  })

  const materialColumns = [
    {
      key: "material",
      header: t("offers.details.materials"),
      render: (row: (typeof materialRows)[number]) => (
        <span className="block min-w-0">
          <span className="block font-medium text-ink">{row.materialName}</span>
          {row.category && (
            <span className="block text-xs text-muted">{row.category}</span>
          )}
        </span>
      ),
    },
    {
      key: "packaging",
      header: t("offers.builder.packaging.packaging"),
      render: (row: (typeof materialRows)[number]) => (
        <span className="block break-words text-muted">
          {row.packagingSummary || "—"}
        </span>
      ),
    },
    {
      key: "quantity",
      header: t("offers.builder.packaging.quantity"),
      align: "end" as const,
      render: (row: (typeof materialRows)[number]) =>
        `${formatNumber(row.quantityKg)} kg`,
    },
    {
      key: "rate",
      header: t("offers.builder.packaging.rate"),
      align: "end" as const,
      render: (row: (typeof materialRows)[number]) =>
        formatNumber(row.ratePerKg),
    },
    {
      key: "amount",
      header: t("offers.builder.packaging.amount"),
      align: "end" as const,
      render: (row: (typeof materialRows)[number]) => (
        <span className="font-medium">{formatNumber(row.amount)}</span>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <section>
        <h3 className="mb-2 text-sm font-semibold text-ink">
          {t("offers.details.materials")}
        </h3>

        <div className="overflow-hidden rounded-lg border border-line-soft bg-surface">
          <DataTable
            columns={materialColumns}
            rows={materialRows}
            rowKey={(row) => row.id}
            empty={t("offers.builder.packaging.empty")}
          />
        </div>
      </section>

      {offer.deliveryMode === "text" ? (
        <TextSection
          title={t("offers.builder.steps.delivery")}
          text={offer.deliveryText}
        />
      ) : (offer.delivery ?? (offer as any).deliveryBatches ?? []).length > 0 && (
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
                      {formatIsoDay(batch.date ?? batch.deliveryDate, locale)}
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

      <TextSection
        title={t("offers.builder.delivery.placeLabel")}
        text={offer.deliveryPlace}
      />

      <TextSection
        title={t("offers.builder.basics.paymentTermsText")}
        text={offer.paymentTermsText}
      />

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
