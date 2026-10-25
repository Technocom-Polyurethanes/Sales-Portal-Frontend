import Button from "../../../../components/ui/Button"
import Icon from "../../../../components/ui/Icon"
import Input from "../../../../components/ui/Input"
import Stepper from "../../../../components/ui/Stepper"
import { useTranslation } from "../../../../i18n/I18nProvider"
import { formatNumber } from "../../../../lib/formatters/number"
import type { DraftCalculations } from "../../calculations"
import type { PackageType } from "../../../settings/types"
import type { DeliveryBatch, OfferDraft, OfferDraftLine } from "../../types"

export type DeliveryScheduleEditorProps = {
  draft: OfferDraft
  calculations: DraftCalculations
  packageTypes: PackageType[]
  onAddBatch: () => void
  onRemoveBatch: (batchId: string) => void
  onUpdateBatch: (batchId: string, patch: Partial<DeliveryBatch>) => void
  onSetAllocation: (
    batchId: string,
    productId: string,
    packages: number,
    packagingRowId?: string,
  ) => void
}

/** Step 4: delivery batches and the packages allocated per material. */
export default function DeliveryScheduleEditor({
  draft,
  calculations,
  packageTypes,
  onAddBatch,
  onRemoveBatch,
  onUpdateBatch,
  onSetAllocation,
}: DeliveryScheduleEditorProps) {
  const { t, language } = useTranslation()

  const materials = uniqueMaterials(draft.lines)

  const unitLabel = (line: OfferDraftLine): string => {
    if (line.packaging.length !== 1) {
      return t("offers.builder.delivery.unit")
    }

    const type = packageTypes.find(
      (item) => item.id === line.packaging[0].packageTypeId,
    )
    if (!type) return t("offers.builder.delivery.unit")

    return language === "ar" ? type.nameAr : type.name
  }

  return (
    <div className="space-y-4">
      {draft.delivery.length === 0 ? (
        <p className="rounded-md border border-line-soft bg-page/50 px-4 py-6 text-center text-sm text-muted">
          {t("offers.builder.delivery.empty")}
        </p>
      ) : (
        <div className="space-y-3">
          {draft.delivery.map((batch) => {
            const batchPackages = batch.allocations.reduce(
              (sum, allocation) => sum + allocation.packages,
              0,
            )
            const batchWeight = batch.allocations.reduce(
              (sum, allocation) => {
                const line = draft.lines.find(
                  (item) => item.productId === allocation.productId,
                )
                const row = allocation.packagingRowId
                  ? line?.packaging.find((item) => item.id === allocation.packagingRowId)
                  : line?.packaging[0]
                const weight = allocation.weightPerPackageKg ?? row?.weightPerPackageKg ?? calculations.weightPerPackage[allocation.productId] ?? 0
                return sum + allocation.packages * weight
              },
              0,
            )

            return (
              <article
                key={batch.id}
                className="rounded-md border border-line bg-surface p-4"
              >
                <header className="flex flex-wrap items-end justify-between gap-3 border-b border-line-soft pb-3">
                  <label className="flex flex-col gap-1 text-[13px] font-medium text-ink">
                    {t("offers.builder.delivery.batch", {
                      number: batch.batchNumber,
                    })}
                    <Input
                      type="date"
                      value={batch.date}
                      onChange={(event) =>
                        onUpdateBatch(batch.id, { date: event.target.value })
                      }
                    />
                  </label>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted">
                      {(() => {
                        const map = new Map<string, number>()
                        for (const a of batch.allocations) {
                          if (a.packages > 0) {
                            const type = packageTypes.find((pt) => pt.id === a.packageTypeId)
                            const label = language === "ar" ? type?.nameAr ?? a.packageTypeName ?? "" : type?.name ?? a.packageTypeName ?? ""
                            map.set(label, (map.get(label) ?? 0) + a.packages)
                          }
                        }
                        return Array.from(map.entries())
                          .map(([label, count]) => `${count} ${label}`)
                          .join(", ")
                      })()}
                      {batch.allocations.some((a) => a.packages > 0) ? " • " : ""}
                      {formatNumber(batchWeight)} kg
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-danger hover:bg-danger/10"
                      onClick={() => onRemoveBatch(batch.id)}
                    >
                      <Icon name="trash" size={16} />
                    </Button>
                  </div>
                </header>

                <div className="grid gap-3 pt-3 sm:grid-cols-2">
                  {materials.map((line) => {
                    const productId = line.productId
                    const ordered = calculations.ordered[productId] ?? 0
                    const scheduled = calculations.scheduled[productId] ?? 0
                    const remaining = calculations.remaining[productId] ?? 0
                    const complete = remaining === 0 && ordered > 0

                    return (
                      <div
                        key={productId}
                        className="flex flex-col gap-2 rounded-md border border-line-soft bg-page/50 px-3 py-2.5"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-ink">
                            {line.materialName}
                          </p>
                          <p
                            className={`text-[11px] ${
                              complete ? "text-success" : "text-muted"
                            }`}
                          >
                            {complete
                              ? t("offers.builder.delivery.fullyScheduled")
                              : t("offers.builder.delivery.remaining", {
                                  remaining: formatNumber(remaining),
                                  total: formatNumber(ordered),
                                  scheduled: formatNumber(scheduled),
                                })}
                          </p>
                        </div>

                        <div className="flex flex-col gap-2">
                          {line.packaging.map((row) => {
                            const allocation = batch.allocations.find(
                              (item) =>
                                item.productId === productId &&
                                (item.packagingRowId === row.id ||
                                  (!item.packagingRowId && line.packaging[0]?.id === row.id)),
                            )
                            const current = allocation?.packages ?? 0
                            const rowOrdered = row.packages
                            const rowScheduledElsewhere = draft.delivery.reduce(
                              (sum, b) =>
                                b.id === batch.id
                                  ? sum
                                  : sum +
                                    (b.allocations.find(
                                      (item) =>
                                        item.productId === productId &&
                                        (item.packagingRowId === row.id ||
                                          (!item.packagingRowId && line.packaging[0]?.id === row.id)),
                                    )?.packages ?? 0),
                              0,
                            )
                            const maxForBatch = Math.max(0, rowOrdered - rowScheduledElsewhere)
                            const rowRemaining = Math.max(0, rowOrdered - rowScheduledElsewhere - current)
                            const weight = current * row.weightPerPackageKg
                            const type = packageTypes.find((item) => item.id === row.packageTypeId)
                            const label = language === "ar" ? type?.nameAr ?? row.packageTypeName : type?.name ?? row.packageTypeName

                            return (
                              <div
                                key={row.id}
                                className="flex items-center justify-between gap-3 rounded-md border border-line bg-surface px-2.5 py-2"
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-semibold text-slate-900">
                                    {label} ({row.weightPerPackageKg} kg)
                                  </p>
                                  <p className="truncate text-xs text-slate-500">
                                    {rowRemaining === 0
                                      ? `Fully scheduled (${formatNumber(weight)} kg)`
                                      : `${current} / ${rowOrdered} scheduled (${formatNumber(weight)} kg) • ${rowRemaining} open`}
                                  </p>
                                </div>

                                <div className="inline-flex shrink-0 items-center overflow-hidden rounded-lg border border-slate-300 bg-white">
                                  <button
                                    type="button"
                                    className="flex h-9 w-9 items-center justify-center hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                                    disabled={current <= 0}
                                    onClick={() => onSetAllocation(batch.id, productId, Math.max(0, current - 1), row.id)}
                                  >
                                    -
                                  </button>
                                  <input
                                    className="h-9 w-16 border-x border-slate-300 text-center text-sm font-semibold focus:outline-none"
                                    value={current}
                                    readOnly
                                  />
                                  <button
                                    type="button"
                                    className="flex h-9 w-9 items-center justify-center hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                                    disabled={current >= maxForBatch}
                                    onClick={() => onSetAllocation(batch.id, productId, Math.min(maxForBatch, current + 1), row.id)}
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </article>
            )
          })}
        </div>
      )}

      <Button
        variant="secondary"
        icon={<Icon name="plus" size={16} />}
        onClick={onAddBatch}
      >
        {t("offers.builder.delivery.addBatch")}
      </Button>
    </div>
  )
}

/** One entry per material, even when it was added to the offer twice. */
function uniqueMaterials(lines: OfferDraftLine[]): OfferDraftLine[] {
  const seen = new Set<string>()

  return lines.filter((line) => {
    if (seen.has(line.productId)) return false
    seen.add(line.productId)
    return true
  })
}
