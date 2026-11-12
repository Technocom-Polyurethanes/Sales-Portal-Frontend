import Field from "../../../../components/ui/Field"
import Textarea from "../../../../components/ui/Textarea"
import { useTranslation } from "../../../../i18n/I18nProvider"
import type { TranslationKey } from "../../../../i18n/types"
import { TEXT_LIMITS, type DeliveryMode, type OfferDraft } from "../../types"
import DeliveryScheduleEditor, {
  type DeliveryScheduleEditorProps,
} from "./DeliveryScheduleEditor"

export type StepDeliveryProps = DeliveryScheduleEditorProps & {
  onChange: (patch: Partial<OfferDraft>) => void
  errors?: Record<string, string>
}

const MODES: {
  mode: DeliveryMode
  label: TranslationKey
  hint: TranslationKey
}[] = [
  {
    mode: "batches",
    label: "offers.builder.delivery.modeBatches",
    hint: "offers.builder.delivery.modeBatchesHint",
  },
  {
    mode: "text",
    label: "offers.builder.delivery.modeText",
    hint: "offers.builder.delivery.modeTextHint",
  },
]

/**
 * Step 4: how the delivery is described. Either the dated batch schedule or free text for
 * conditions a schedule cannot express, plus the place of delivery, which is always free text.
 * Switching the mode keeps what was typed in the other one, so nothing is lost by a misclick.
 */
export default function StepDelivery({
  onChange,
  errors = {},
  ...schedule
}: StepDeliveryProps) {
  const { t } = useTranslation()
  const { draft } = schedule

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <p className="text-[13px] font-medium text-ink">
          {t("offers.builder.delivery.modeLabel")}
        </p>

        <div
          role="radiogroup"
          aria-label={t("offers.builder.delivery.modeLabel")}
          className="grid gap-3 sm:grid-cols-2"
        >
          {MODES.map(({ mode, label, hint }) => {
            const selected = draft.deliveryMode === mode
            return (
              <button
                key={mode}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onChange({ deliveryMode: mode })}
                className={`flex flex-col gap-0.5 rounded-lg border px-4 py-3 text-start transition-colors ${
                  selected
                    ? "border-primary bg-primary-soft text-primary"
                    : "border-line bg-surface text-ink hover:bg-page"
                }`}
              >
                <span className="text-sm font-medium">{t(label)}</span>
                <span className="text-xs font-normal text-muted">{t(hint)}</span>
              </button>
            )
          })}
        </div>
      </div>

      {draft.deliveryMode === "text" ? (
        <Field
          label={t("offers.builder.delivery.textLabel")}
          hint={t("offers.builder.delivery.textHint")}
          htmlFor="offer-delivery-text"
          error={errors["offer-delivery-text"]}
          required
        >
          <Textarea
            id="offer-delivery-text"
            rows={4}
            maxLength={TEXT_LIMITS.deliveryText}
            value={draft.deliveryText}
            placeholder={t("offers.builder.delivery.textPlaceholder")}
            onChange={(event) => onChange({ deliveryText: event.target.value })}
          />
        </Field>
      ) : (
        <DeliveryScheduleEditor {...schedule} />
      )}

      <Field
        label={t("offers.builder.delivery.placeLabel")}
        hint={t("offers.builder.delivery.placeHint")}
        htmlFor="offer-delivery-place"
      >
        <Textarea
          id="offer-delivery-place"
          rows={2}
          maxLength={TEXT_LIMITS.deliveryPlace}
          value={draft.deliveryPlace}
          placeholder={t("offers.builder.delivery.placePlaceholder")}
          onChange={(event) => onChange({ deliveryPlace: event.target.value })}
        />
      </Field>
    </div>
  )
}
