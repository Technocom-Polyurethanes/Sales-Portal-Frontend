import Button from "../../../../components/ui/Button"
import Icon from "../../../../components/ui/Icon"
import Input from "../../../../components/ui/Input"
import Select from "../../../../components/ui/Select"
import Stepper from "../../../../components/ui/Stepper"
import { useTranslation } from "../../../../i18n/I18nProvider"
import type { PackagingLine } from "../../../../lib/calculations/packaging"
import type { PackageType } from "../../../settings/types"

export type PackagingRowEditorProps = {
  row: PackagingLine
  packageTypes: PackageType[]
  onChange: (patch: Partial<PackagingLine>) => void
  onRemove: () => void
}

/** One packaging row: type, weight per package and number of packages. */
export default function PackagingRowEditor({
  row,
  packageTypes,
  onChange,
  onRemove,
}: PackagingRowEditorProps) {
  const { t } = useTranslation()

  return (
    <div className="grid gap-3 rounded-md border border-line-soft bg-page/60 p-3 sm:grid-cols-[1fr_1.4fr_1fr_auto] sm:items-end">
      <label className="flex flex-col gap-1 text-[13px] font-medium text-ink">
        {t("offers.builder.packaging.type")}
        <Select
          value={row.packageTypeId}
          onChange={(event) => {
            const next = packageTypes.find(
              (type) => type.id === event.target.value,
            )
            onChange({
              packageTypeId: next?.id ?? row.packageTypeId,
              packageTypeName: next?.name ?? row.packageTypeName,
              weightPerPackageKg:
                next?.defaultWeightKg ?? row.weightPerPackageKg,
            })
          }}
        >
          {packageTypes.map((type) => (
            <option key={type.id} value={type.id}>
              {type.name}
            </option>
          ))}
        </Select>
      </label>

      <label className="flex flex-col gap-1 text-[13px] font-medium text-ink">
        {t("offers.builder.packaging.weight")}
        <Input
          type="text"
          inputMode="decimal"
          value={row.weightPerPackageKg === 0 ? "" : String(row.weightPerPackageKg)}
          onChange={(event) => {
            const value = event.target.value.replace(/[^0-9.]/g, "")
            if (value === "" || value === ".") {
              onChange({ weightPerPackageKg: 0 })
              return
            }
            const parsed = Number(value)
            if (!Number.isNaN(parsed)) {
              onChange({ weightPerPackageKg: parsed })
            }
          }}
          onBlur={() => {
            if (row.weightPerPackageKg < 0) {
              onChange({ weightPerPackageKg: 0 })
            }
          }}
        />
      </label>

      <label className="flex flex-col gap-1 text-[13px] font-medium text-ink">
        {t("offers.builder.packaging.packages")}
        <Stepper
          value={row.packages}
          min={0}
          onChange={(packages) => onChange({ packages })}
          ariaLabel={t("offers.builder.packaging.packages")}
        />
      </label>

      <Button
        variant="ghost"
        size="sm"
        onClick={onRemove}
        aria-label={t("offers.builder.packaging.removeRow")}
        className="justify-self-start text-danger hover:bg-danger/10 sm:justify-self-end"
      >
        <Icon name="trash" size={16} />
      </Button>
    </div>
  )
}
