import Field from "../../../../components/ui/Field"
import Select from "../../../../components/ui/Select"
import Textarea from "../../../../components/ui/Textarea"
import { useTranslation } from "../../../../i18n/I18nProvider"
import type { TranslationKey } from "../../../../i18n/types"
import type { Customer } from "../../../customers/types"
import { lockedDeliveryMode } from "../../deliveryLock"
import { DELIVERY_PRESETS, presetFor } from "../../deliveryPresets"
import { TEXT_LIMITS, type DeliveryMode, type OfferDraft } from "../../types"
import DeliveryScheduleEditor, {
  type DeliveryScheduleEditorProps,
} from "./DeliveryScheduleEditor"

export type StepDeliveryProps = DeliveryScheduleEditorProps & {
  onChange: (patch: Partial<OfferDraft>) => void
  errors?: Record<string, string>
  customer?: Customer
}

const OUR_FACTORIES = "مصانعنا بمدينة بدر"
const customerFactories = (city: string) => `مصانعكم بمدينة ${city}`

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
 * conditions a schedule cannot express, plus a choice of delivery place. The two methods
 * exclude each other: once one has content the other is locked until it is cleared.
 */
export default function StepDelivery({
  onChange,
  errors = {},
  customer,
  ...schedule
}: StepDeliveryProps) {
  const { t, language } = useTranslation()
  const { draft } = schedule
  const preset = presetFor(draft.deliveryText)
  const locked = lockedDeliveryMode(draft)

  const city = customer?.cityAr || customer?.city || ""
  const placeOptions = [OUR_FACTORIES, ...(city ? [customerFactories(city)] : [])]
  const legacyPlace =
    draft.deliveryPlace && !placeOptions.includes(draft.deliveryPlace)
      ? draft.deliveryPlace
      : ""

  return (
    <div className="space-y-6">
      <div className="space-y-3">

        <div
          role="radiogroup"
          aria-label={t("offers.builder.delivery.modeLabel")}
          className="grid gap-3 sm:grid-cols-2"
        >
          {MODES.map(({ mode, label, hint }) => {
            const selected = draft.deliveryMode === mode
            const disabled = locked === mode
            return (
              <button
                key={mode}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-disabled={disabled}
                disabled={disabled}
                title={
                  disabled
                    ? t(
                        mode === "text"
                          ? "offers.builder.delivery.lockedByBatches"
                          : "offers.builder.delivery.lockedByText",
                      )
                    : undefined
                }
                onClick={() => onChange({ deliveryMode: mode })}
                className={`flex flex-col gap-0.5 rounded-lg border px-4 py-3 text-start transition-colors ${
                  selected
                    ? "border-primary bg-primary-soft text-primary"
                    : disabled
                      ? "cursor-not-allowed border-line bg-page text-muted opacity-60"
                      : "border-line bg-surface text-ink hover:bg-page"
                }`}
              >
                <span className="text-sm font-medium">{t(label)}</span>
                <span className="text-xs font-normal text-muted">
                  {disabled
                    ? t(
                        mode === "text"
                          ? "offers.builder.delivery.lockedByBatches"
                          : "offers.builder.delivery.lockedByText",
                      )
                    : t(hint)}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {draft.deliveryMode === "text" ? (
        <>
          <Field
            label={t("offers.builder.delivery.presetLabel")}
            htmlFor="offer-delivery-preset"
          >
            <Select
              id="offer-delivery-preset"
              value={preset?.id ?? ""}
              onChange={(event) => {
                const chosen = DELIVERY_PRESETS.find((item) => item.id === event.target.value)
                if (chosen) onChange({ deliveryText: chosen[language] })
              }}
            >
              <option value="">
                {draft.deliveryText && !preset
                  ? t("offers.builder.delivery.presetCustom")
                  : t("offers.builder.delivery.presetPlaceholder")}
              </option>
              {DELIVERY_PRESETS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item[language]}
                </option>
              ))}
            </Select>
          </Field>
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
        </>
      ) : (
        <DeliveryScheduleEditor {...schedule} />
      )}

      <Field
        label={t("offers.builder.delivery.placeLabel")}
        hint={t("offers.builder.delivery.placeHint")}
        htmlFor="offer-delivery-place"
      >
        <Select
          id="offer-delivery-place"
          value={draft.deliveryPlace}
          onChange={(event) => onChange({ deliveryPlace: event.target.value })}
        >
          <option value="">
            {t("offers.builder.delivery.placePlaceholder")}
          </option>
          {legacyPlace && <option value={legacyPlace}>{legacyPlace}</option>}
          {placeOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
      </Field>
    </div>
  )
}
