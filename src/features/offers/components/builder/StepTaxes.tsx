import Field from "../../../../components/ui/Field"
import Input from "../../../../components/ui/Input"
import Toggle from "../../../../components/ui/Toggle"
import { useTranslation } from "../../../../i18n/I18nProvider"
import { OTHER_TAX_PERCENT } from "../../../../lib/calculations/tax"
import type { Totals } from "../../../../lib/calculations/tax"
import type { OfferDraft } from "../../types"
import TotalsSummary from "./TotalsSummary"

export type StepTaxesProps = {
  draft: OfferDraft
  totals: Totals
  onChange: (patch: Partial<OfferDraft>) => void
}

/** Step 3: tax, order discount and the fixed 1% deduction. */
export default function StepTaxes({ draft, totals, onChange }: StepTaxesProps) {
  const { t } = useTranslation()

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label={t("offers.builder.taxes.tax")}
            hint={t("offers.builder.taxes.taxHint")}
            htmlFor="offer-tax"
          >
            <Input
              id="offer-tax"
              type="number"
              min={0}
              max={100}
              step={0.5}
              value={draft.taxPercent}
              onChange={(event) =>
                onChange({ taxPercent: Number(event.target.value) || 0 })
              }
            />
          </Field>

          <Field
            label={t("offers.builder.taxes.orderDiscount")}
            htmlFor="offer-discount"
          >
            <Input
              id="offer-discount"
              type="number"
              min={0}
              step={0.01}
              value={draft.orderDiscount}
              onChange={(event) =>
                onChange({ orderDiscount: Number(event.target.value) || 0 })
              }
            />
          </Field>
        </div>

        <div className="rounded-md border border-line bg-surface p-4">
          <Toggle
            checked={draft.otherTaxEnabled}
            onChange={(otherTaxEnabled) =>
              onChange({
                otherTaxEnabled,
                otherTaxPercent: otherTaxEnabled ? OTHER_TAX_PERCENT : 0,
              })
            }
            label={t("offers.builder.taxes.otherTax")}
            hint={t("offers.builder.taxes.otherTaxHint")}
          />
        </div>
      </div>

      <TotalsSummary
        totals={totals}
        otherTaxEnabled={draft.otherTaxEnabled}
        currency={draft.currency}
        documentLanguage={draft.documentLanguage}
      />
    </div>
  )
}
