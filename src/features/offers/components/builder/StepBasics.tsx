import Field from "../../../../components/ui/Field"
import Input from "../../../../components/ui/Input"
import Select from "../../../../components/ui/Select"
import { useTranslation } from "../../../../i18n/I18nProvider"
import { PAYMENT_TERMS } from "../../../../lib/calculations/dueDate"
import { formatIsoDay } from "../../../../lib/formatters/date"
import { formatCurrencyLabel } from "../../../../lib/formatters/currency"
import { localeForLanguage } from "../../../../lib/formatters/locale"
import type { Customer } from "../../../customers/types"
import type { OfferDraft } from "../../types"

export type StepBasicsProps = {
  draft: OfferDraft
  customers: Customer[]
  dueDate: string
  onChange: (patch: Partial<OfferDraft>) => void
}

const CURRENCIES = ["EGP", "USD", "EUR"]

/** Step 1: customer, reference, dates, currency and payment terms. */
export default function StepBasics({
  draft,
  customers,
  dueDate,
  onChange,
}: StepBasicsProps) {
  const { t, language } = useTranslation()
  const locale = localeForLanguage(language)

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Field
          label={t("offers.builder.basics.customer")}
          hint={t("offers.builder.basics.customerHint")}
          htmlFor="offer-customer"
          required
        >
          <Select
            id="offer-customer"
            value={draft.customerId}
            onChange={(event) => onChange({ customerId: event.target.value })}
          >
            <option value="">{t("offers.builder.chooseCustomer")}</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name} · {customer.code}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label={t("offers.builder.basics.issueDate")} htmlFor="offer-date">
        <Input
          id="offer-date"
          type="date"
          value={draft.issueDate}
          onChange={(event) => onChange({ issueDate: event.target.value })}
        />
      </Field>

      <Field label={t("common.currency")} htmlFor="offer-currency">
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
      >
        <Select
          id="offer-term"
          value={draft.paymentTermId}
          onChange={(event) => onChange({ paymentTermId: event.target.value })}
        >
          {PAYMENT_TERMS.map((term) => (
            <option key={term.id} value={term.id}>
              {language === "ar" ? term.labelAr : term.label}
            </option>
          ))}
        </Select>
      </Field>

      <Field
        label={t("offers.builder.basics.reference")}
        htmlFor="offer-reference"
        hint={t("offers.builder.basics.referenceInputHint")}
      >
        <Input
          id="offer-reference"
          dir="ltr"
          value={draft.reference}
          placeholder="3090/OCT./YL/AA"
          onChange={(event) => onChange({ reference: event.target.value })}
          className="font-medium text-primary"
        />
      </Field>

      <div className="sm:col-span-2">
        <p className="rounded-md border-s-[3px] border-primary/40 bg-primary-soft/60 px-3.5 py-2.5 text-xs leading-relaxed text-muted">
          <strong className="block text-ink">
            {t("offers.builder.basics.referenceHint")}
          </strong>
          {t("offers.builder.basics.referencePreview", {
            date: formatIsoDay(draft.issueDate),
            reference: draft.reference,
            dueDate: formatIsoDay(dueDate),
          })}
        </p>
      </div>
    </div>
  )
}
