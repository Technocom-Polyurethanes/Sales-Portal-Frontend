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
              (sum, allocation) =>
                sum +
                allocation.packages *
                  (calculations.weightPerPackage[allocation.productId] ?? 0),
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
                      {t("offers.builder.delivery.batchTotal", {
                        count: formatNumber(batchPackages),
                        weight: formatNumber(batchWeight),
                      })}
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
                    const allocation = batch.allocations.find(
                      (item) => item.productId === productId,
                    )
                    const current = allocation?.packages ?? 0
                    const ordered = calculations.ordered[productId] ?? 0
                    const scheduled = calculations.scheduled[productId] ?? 0
                    const scheduledElsewhere = Math.max(0, scheduled - current)
                    const maxForBatch = Math.max(
                      0,
                      ordered - scheduledElsewhere,
                    )
                    const remaining = calculations.remaining[productId] ?? 0
                    const complete = remaining === 0 && ordered > 0
                    const weight =
                      current * (calculations.weightPerPackage[productId] ?? 0)

                    return (
                      <div
                        key={productId}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-line-soft bg-page/50 px-3 py-2.5"
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
                          <p className="text-[11px] text-muted">
                            {t("offers.builder.delivery.batchWeight", {
                              count: formatNumber(current),
                              unit: unitLabel(line),
                              weight: formatNumber(weight),
                            })}
                          </p>
                        </div>

                        <Stepper
                          value={current}
                          min={0}
                          max={maxForBatch}
                          onChange={(packages) =>
                            onSetAllocation(batch.id, productId, packages)
                          }
                          ariaLabel={line.materialName}
                        />
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
