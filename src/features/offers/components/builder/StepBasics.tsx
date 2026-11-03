import { useState } from "react"
import Field from "../../../../components/ui/Field"
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
import type { OfferDraft } from "../../types"

export type StepBasicsProps = {
  draft: OfferDraft
  customers: Customer[]
  paymentTerms?: any[]
  dueDate: string
  onChange: (patch: Partial<OfferDraft>) => void
}

const CURRENCIES = ["EGP", "USD", "EUR", "SAR", "AED"]

/** Step 1: customer, reference, dates, currency and payment terms. */
export default function StepBasics({
  draft,
  customers,
  paymentTerms = [],
  onChange,
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

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Field
          label={t("offers.builder.basics.customer")}
          hint={t("offers.builder.basics.customerHint")}
          required
        >
          <button
            type="button"
            className="flex w-full items-center justify-between rounded-md border border-line bg-surface px-3 py-2 text-start"
            onClick={() => setOpen(true)}
          >
            <span className="text-sm text-ink">
              {selected
                ? `${selected.customerCode ?? selected.erpNextId ?? selected.code} — ${language === "ar" && selected.nameAr ? selected.nameAr : selected.name}`
                : language === "ar"
                  ? "اختر العميل..."
                  : "Select customer..."}
            </span>
            <span className="text-xs text-primary">
              {selected
                ? language === "ar"
                  ? "تغيير العميل"
                  : "Change customer"
                : ""}
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
              attentionAr: customer.contactPersonAr || customer.contactPerson || "",
              taxId: customer.taxId ?? "",
              paymentTermId: customer.paymentTermId ?? draft.paymentTermId,
            })
            setOpen(false)
          }}
          onClose={() => setOpen(false)}
        />
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

      <div className="sm:col-span-2 grid gap-4 sm:grid-cols-2">
        <Field
          label={`${t("offers.builder.basics.attention")} · ${
            arabicDocument ? t("common.arabic") : t("common.english")
          }`}
          htmlFor="offer-attention"
          hint={t("offers.builder.basics.attentionHint")}
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
        <Field label={language === "ar" ? "رقم التسجيل الضريبي" : "Tax Registration Number"} htmlFor="offer-tax-id">
          <Input
            id="offer-tax-id"
            value={draft.taxId ?? ""}
            onChange={(event) => onChange({ taxId: event.target.value })}
          />
        </Field>
      </div>

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
          dir="ltr"
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
    </div>
  )
}
