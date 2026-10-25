import { useTranslation } from "../../../../i18n/I18nProvider"
import type { Product } from "../../../products/types"
import type { PackageType } from "../../../settings/types"
import type { OfferBuilderController } from "../../hooks/useOfferBuilder"
import MaterialLineEditor from "./MaterialLineEditor"
import MaterialPicker from "./MaterialPicker"

export type StepPackagingProps = {
  controller: OfferBuilderController
  products: Product[]
  packageTypes: PackageType[]
}

/** Step 2: materials, packaging and prices. */
export default function StepPackaging({
  controller,
  products,
  packageTypes,
}: StepPackagingProps) {
  const { t } = useTranslation()
  const { draft, calculations } = controller

  return (
    <div className="space-y-4">
      <MaterialPicker
        products={products}
        existingProductIds={controller.draft.lines.map((line) => line.productId)}
        onAdd={controller.addLine}
      />

      {draft.lines.length === 0 ? (
        <p className="rounded-md border border-line-soft bg-page/50 px-4 py-6 text-center text-sm text-muted">
          {t("offers.builder.packaging.empty")}
        </p>
      ) : (
        <div className="space-y-3">
          {draft.lines.map((line, index) => (
            <MaterialLineEditor
              key={line.id}
              line={line}
              calculation={
                calculations.lines[index] ?? {
                  id: line.id,
                  quantityKg: 0,
                  packages: 0,
                  amount: 0,
                  breakdown: [],
                }
              }
              packageTypes={packageTypes}
              onChange={(patch) => controller.updateLine(line.id, patch)}
              onRemove={() => controller.removeLine(line.id)}
              onPackaging={{
                change: (rowId, patch) =>
                  controller.updatePackaging(line.id, rowId, patch),
                add: () => controller.addPackaging(line.id),
                remove: (rowId) => controller.removePackaging(line.id, rowId),
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
