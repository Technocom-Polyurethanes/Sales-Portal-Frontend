import Button from "../../../../components/ui/Button"
import Icon from "../../../../components/ui/Icon"
import Input from "../../../../components/ui/Input"
import { useTranslation } from "../../../../i18n/I18nProvider"
import type { PackagingLine } from "../../../../lib/calculations/packaging"
import { formatNumber } from "../../../../lib/formatters/number"
import type { DraftLineCalculation } from "../../calculations"
import type { PackageType } from "../../../settings/types"
import type { OfferDraftLine } from "../../types"
import PackagingRowEditor from "./PackagingRowEditor"

export type MaterialLineEditorProps = {
  line: OfferDraftLine
  calculation: DraftLineCalculation
  packageTypes: PackageType[]
  onChange: (patch: Partial<OfferDraftLine>) => void
  onRemove: () => void
  onPackaging: {
    change: (rowId: string, patch: Partial<PackagingLine>) => void
    add: () => void
    remove: (rowId: string) => void
  }
}

/** One material with its packaging rows, price and live quantity. */
export default function MaterialLineEditor({
  line,
  calculation,
  packageTypes,
  onChange,
  onRemove,
  onPackaging,
}: MaterialLineEditorProps) {
  const { t } = useTranslation()

  return (
    <article className="rounded-md border border-line bg-surface p-4">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line-soft pb-3">
        <div>
          <p className="text-sm font-semibold text-ink">{line.materialName}</p>
          <span className="mt-1 inline-block rounded bg-page px-2 py-0.5 text-[11px] text-muted">
            {line.materialCode} · {line.category}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="text-danger hover:bg-danger/10"
        >
          <Icon name="trash" size={16} />
          {t("common.delete")}
        </Button>
      </header>

      <div className="grid gap-3 py-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-[13px] font-medium text-ink">
          {t("offers.builder.packaging.rate")}
          <Input
            type="text"
            inputMode="decimal"
            value={line.ratePerKg === 0 ? "" : String(line.ratePerKg)}
            onChange={(event) => {
              const value = event.target.value.replace(/[^0-9.]/g, "")
              if (value === "" || value === ".") {
                onChange({ ratePerKg: 0 })
                return
              }
              const parsed = Number(value)
              if (!Number.isNaN(parsed)) {
                onChange({ ratePerKg: parsed })
              }
            }}
            onBlur={() => {
              if (line.ratePerKg < 0) {
                onChange({ ratePerKg: 0 })
              }
            }}
          />
        </label>
      </div>

      <div className="space-y-2">
        {line.packaging.map((row) => (
          <PackagingRowEditor
            key={row.id}
            row={row}
            packageTypes={packageTypes}
            onChange={(patch) => onPackaging.change(row.id, patch)}
            onRemove={() => onPackaging.remove(row.id)}
          />
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          icon={<Icon name="plus" size={15} />}
          onClick={onPackaging.add}
        >
          {t("offers.builder.packaging.addRow")}
        </Button>
      </div>

      <footer className="mt-3 flex flex-wrap items-center justify-end gap-6 border-t border-line-soft pt-3 text-xs text-muted">
        <span>
          {t("offers.builder.packaging.quantity")}{" "}
          <strong className="ms-1 text-base font-semibold text-primary tabular-nums">
            {formatNumber(calculation.quantityKg)}
          </strong>{" "}
          kg
        </span>
        <span>
          {t("offers.builder.packaging.amount")}{" "}
          <strong className="ms-1 text-base font-semibold text-ink tabular-nums">
            {formatNumber(calculation.amount)}
          </strong>
        </span>
      </footer>
    </article>
  )
}
