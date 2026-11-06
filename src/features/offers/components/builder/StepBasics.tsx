import { useState } from "react"
import Field from "../../../../components/ui/Field"
import Icon from "../../../../components/ui/Icon"
import Input from "../../../../components/ui/Input"
import Select from "../../../../components/ui/Select"
import { useTranslation } from "../../../../i18n/I18nProvider"
import {
  expiryDateFrom,
  MAX_VALIDITY_DAYS,
  normalizeValidityDays,
} from "../../../../lib/calculations/validity"
import { formatCurrencyLabel } from "../../../../lib/formatters/currency"
import { formatIsoDay } from "../../../../lib/formatters/date"
import { localeForLanguage } from "../../../../lib/formatters/locale"
import CustomerPickerModal from "../../../../components/pickers/CustomerPickerModal"
import type { Customer } from "../../../customers/types"
import type { TranslationKey } from "../../../../i18n/types"
import type { OfferDraft } from "../../types"

export type StepBasicsProps = {
  draft: OfferDraft
  customers: Customer[]
  paymentTerms?: any[]
  dueDate: string
  onChange: (patch: Partial<OfferDraft>) => void
  /** Messages of the fields that failed validation, keyed by field id. */
  errors?: Record<string, string>
  /** The next free sequence: the first offer may start from it or from a higher number. */
  nextSequence?: number
  /** Only the very first offer shows the sequence input; later offers number themselves. */
  showSequence?: boolean
}

const CURRENCIES = ["EGP", "USD", "EUR", "SAR", "AED"]

const OFFER_TYPES: { value: "Loc" | "Int"; labelKey: TranslationKey }[] = [
  { value: "Loc", labelKey: "offers.builder.basics.offerTypeLocal" },
  { value: "Int", labelKey: "offers.builder.basics.offerTypeInternational" },
]

/** Step 1: customer, offer type, contact, dates, currency and payment terms. */
export default function StepBasics({
  draft,
  customers,
  paymentTerms = [],
  onChange,
  errors = {},
  nextSequence = 1,
  showSequence = false,
}: StepBasicsProps) {
  const { t, language } = useTranslation()
  const locale = localeForLanguage(language)
  const [open, setOpen] = useState(false)
  const selected = customers.find((customer) => customer.id === draft.customerId)

  // The attention field edits the name printed on the document language that
  // is selected: the Arabic name on the Arabic document, the English name on
  // the English one. Both come from the customer record and both stay editable.
  const arabicDocument = draft.documentLanguage === "ar"
  const attentionValue = arabicDocument
    ? (draft.attentionAr ??
      selected?.contactPersonAr ??
      selected?.contactPerson ??
      "")
    : (draft.attention ?? "")
  const validityDays = normalizeValidityDays(draft.validityDays)
  const minSequence = Math.max(1, nextSequence)

  const customerLabel = selected
    ? language === "ar" && selected.nameAr
      ? selected.nameAr
      : selected.name
    : ""
  const customerCode = selected
    ? (selected.customerCode ?? selected.erpNextId ?? selected.code)
    : ""

  return (
    <div className="space-y-8">
      <section aria-labelledby="basics-customer-heading" className="space-y-4">
        <h3
          id="basics-customer-heading"
          className="text-xs font-semibold uppercase tracking-wide text-muted"
        >
          {t("offers.builder.basics.sectionCustomer")}
        </h3>

        <div className="grid items-start gap-x-4 gap-y-4 sm:grid-cols-2">
          <Field
            label={t("offers.builder.basics.customer")}
            htmlFor="offer-customer"
            error={errors["offer-customer"]}
            required
          >
            <button
              id="offer-customer"
              type="button"
              aria-haspopup="dialog"
              data-invalid={errors["offer-customer"] ? "true" : undefined}
              className="flex h-10 w-full items-center justify-between gap-2 rounded-md border border-line bg-surface px-3 text-start transition-colors hover:border-primary/50"
              onClick={() => setOpen(true)}
            >
              <span className="min-w-0 flex-1 truncate text-sm">
                {selected ? (
                  <>
                    <span className="font-medium text-ink">{customerLabel}</span>
                    {customerCode ? (
                      <span className="text-muted"> · {customerCode}</span>
                    ) : null}
                  </>
                ) : (
                  <span className="text-muted">
                    {t("offers.builder.basics.customerPlaceholder")}
                  </span>
                )}
              </span>
              <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-primary">
                {selected ? t("offers.builder.basics.customerChange") : null}
                <Icon name="chevron" size={14} />
              </span>
            </button>
          </Field>
          <CustomerPickerModal
            open={open}
            customers={customers}
            onSelect={(customer) => {
              onChange({
                customerId: customer.id,
                attention: customer.contactPerson ?? "",
                attentionAr:
                  customer.contactPersonAr || customer.contactPerson || "",
                taxId: customer.taxId ?? "",
                paymentTermId: customer.paymentTermId ?? draft.paymentTermId,
              })
              setOpen(false)
            }}
            onClose={() => setOpen(false)}
          />

          <div className="space-y-4">
            <Field
              label={t("offers.builder.basics.offerType")}
              htmlFor="offer-type"
            >
              <Select
                id="offer-type"
                value={draft.offerType}
                onChange={(event) =>
                  onChange({ offerType: event.target.value as "Loc" | "Int" })
                }
              >
                {OFFER_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {t(type.labelKey)}
                  </option>
                ))}
              </Select>
            </Field>

            {showSequence && (
              <Field
                label={t("offers.builder.basics.sequence")}
                htmlFor="offer-sequence"
                hint={t("offers.builder.basics.sequenceHint", { min: minSequence })}
                error={errors["offer-sequence"]}
                required
              >
                <Input
                  id="offer-sequence"
                  dir="ltr"
                  type="number"
                  inputMode="numeric"
                  min={minSequence}
                  step={1}
                  value={draft.sequence > 0 ? draft.sequence : ""}
                  onChange={(event) => {
                    const value = Math.floor(Number(event.target.value))
                    onChange({
                      sequence:
                        Number.isFinite(value) && value > 0 ? value : minSequence,
                    })
                  }}
                />
              </Field>
            )}
          </div>

          <Field
            label={`${t("offers.builder.basics.attention")} · ${
              arabicDocument ? t("common.arabic") : t("common.english")
            }`}
            htmlFor="offer-attention"
          >
            <Input
              id="offer-attention"
              dir={arabicDocument ? "rtl" : "ltr"}
              value={attentionValue}
              placeholder={t("offers.builder.basics.attentionPlaceholder")}
              onChange={(event) =>
                onChange(
                  arabicDocument
                    ? { attentionAr: event.target.value }
                    : { attention: event.target.value },
                )
              }
            />
          </Field>

          <Field
            label={
              language === "ar" ? "رقم التسجيل الضريبي" : "Tax Registration Number"
            }
            htmlFor="offer-tax-id"
          >
            <Input
              id="offer-tax-id"
              dir="ltr"
              value={draft.taxId ?? ""}
              onChange={(event) => onChange({ taxId: event.target.value })}
            />
          </Field>
        </div>
      </section>

      <section
        aria-labelledby="basics-terms-heading"
        className="space-y-4 border-t border-line-soft pt-6"
      >
        <h3
          id="basics-terms-heading"
          className="text-xs font-semibold uppercase tracking-wide text-muted"
        >
          {t("offers.builder.basics.sectionTerms")}
        </h3>

        <div className="grid items-start gap-x-4 gap-y-4 sm:grid-cols-2">
          <Field
            label={t("offers.builder.basics.issueDate")}
            htmlFor="offer-date"
            error={errors["offer-date"]}
            required
          >
            <Input
              id="offer-date"
              type="date"
              value={draft.issueDate}
              onChange={(event) => onChange({ issueDate: event.target.value })}
            />
          </Field>

          <Field
            label={t("common.currency")}
            htmlFor="offer-currency"
            error={errors["offer-currency"]}
            required
          >
            <Select
              id="offer-currency"
              value={draft.currency}
              onChange={(event) => onChange({ currency: event.target.value })}
            >
              {CURRENCIES.map((currency) => (
                <option key={currency} value={currency}>
                  {formatCurrencyLabel(currency, locale)}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label={t("offers.builder.basics.paymentTerm")}
            htmlFor="offer-term"
            hint={t("offers.builder.basics.paymentTermHint")}
            error={errors["offer-term"]}
            required={paymentTerms.length > 0}
          >
            <Select
              id="offer-term"
              value={draft.paymentTermId}
              onChange={(event) => onChange({ paymentTermId: event.target.value })}
            >
              {paymentTerms.map((term: any) => (
                <option key={term.id} value={term.id}>
                  {language === "ar" ? term.labelAr || term.label : term.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label={t("offers.builder.basics.validity")}
            htmlFor="offer-validity"
            hint={
              validityDays > 0
                ? t("offers.builder.basics.validityExpires", {
                    date: formatIsoDay(
                      expiryDateFrom(draft.issueDate, validityDays),
                    ),
                    days: validityDays,
                  })
                : t("offers.builder.basics.validityHint")
            }
          >
            <Input
              id="offer-validity"
              type="number"
              inputMode="numeric"
              min={0}
              max={MAX_VALIDITY_DAYS}
              step={1}
              value={validityDays > 0 ? validityDays : ""}
              placeholder="7"
              onChange={(event) =>
                onChange({ validityDays: normalizeValidityDays(event.target.value) })
              }
            />
          </Field>
        </div>
      </section>
    </div>
  )
}
