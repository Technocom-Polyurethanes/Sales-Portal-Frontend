import Field from "../../../../components/ui/Field"
import Toggle from "../../../../components/ui/Toggle"
import DecimalInput from "../../../../components/ui/DecimalInput"
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
            <DecimalInput
              id="offer-tax"
              value={draft.taxPercent}
              max={100}
              onValueChange={(taxPercent) => onChange({ taxPercent })}
            />
          </Field>

          <Field
            label={`${t("offers.builder.taxes.orderDiscount")} (%)`}
            htmlFor="offer-discount"
          >
            <DecimalInput
              id="offer-discount"
              value={draft.orderDiscountPercent}
              max={100}
              onValueChange={(orderDiscountPercent) => onChange({ orderDiscountPercent })}
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
