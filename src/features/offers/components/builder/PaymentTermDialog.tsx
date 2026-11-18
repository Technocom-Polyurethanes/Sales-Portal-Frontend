import { useState } from "react"

import Button from "../../../../components/ui/Button"
import DecimalInput from "../../../../components/ui/DecimalInput"
import Dialog from "../../../../components/ui/Dialog"
import Field from "../../../../components/ui/Field"
import Input from "../../../../components/ui/Input"
import Textarea from "../../../../components/ui/Textarea"
import { useTranslation } from "../../../../i18n/I18nProvider"
import type { PaymentTerm } from "../../../settings/types"

export type NewPaymentTerm = Omit<PaymentTerm, "id" | "code">

export type PaymentTermDialogProps = {
  open: boolean
  onClose: () => void
  /** Saves the term; resolves with the stored term so the offer can select it. */
  onCreate: (term: NewPaymentTerm) => Promise<PaymentTerm>
  onCreated: (term: PaymentTerm) => void
}

const EMPTY = { label: "", labelAr: "", days: 0, conditions: "", conditionsAr: "" }

/** Creates a custom payment term with its English and Arabic name and optional conditions. */
export default function PaymentTermDialog({
  open,
  onClose,
  onCreate,
  onCreated,
}: PaymentTermDialogProps) {
  const { t } = useTranslation()
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | undefined>()

  const close = () => {
    setForm(EMPTY)
    setError(undefined)
    onClose()
  }

  const submit = async () => {
    if (!form.label.trim() || !form.labelAr.trim()) {
      setError(t("offers.builder.paymentTermDialog.namesRequired"))
      return
    }
    setSaving(true)
    setError(undefined)
    try {
      const created = await onCreate({
        label: form.label.trim(),
        labelAr: form.labelAr.trim(),
        days: form.days,
        isActive: true,
        conditions: form.conditions.trim() || null,
        conditionsAr: form.conditionsAr.trim() || null,
      })
      onCreated(created)
      close()
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : t("offers.builder.paymentTermDialog.failed"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      open={open}
      title={t("offers.builder.paymentTermDialog.title")}
      onClose={close}
      footer={
        <>
          <Button variant="ghost" onClick={close} disabled={saving}>
            {t("common.cancel")}
          </Button>
          <Button onClick={() => void submit()} disabled={saving}>
            {t("common.save")}
          </Button>
        </>
      }
    >
      <div className="grid gap-3">
        <Field label={t("offers.builder.paymentTermDialog.label")} htmlFor="term-label" required>
          <Input
            id="term-label"
            value={form.label}
            onChange={(event) => setForm({ ...form, label: event.target.value })}
          />
        </Field>
        <Field label={t("offers.builder.paymentTermDialog.labelAr")} htmlFor="term-label-ar" required>
          <Input
            id="term-label-ar"
            dir="rtl"
            value={form.labelAr}
            onChange={(event) => setForm({ ...form, labelAr: event.target.value })}
          />
        </Field>
        <Field
          label={t("offers.builder.paymentTermDialog.days")}
          htmlFor="term-days"
          hint={t("offers.builder.paymentTermDialog.daysHint")}
        >
          <DecimalInput
            id="term-days"
            value={form.days}
            onValueChange={(days) => setForm({ ...form, days: Math.round(days) })}
            max={365}
          />
        </Field>
        <Field
          label={t("offers.builder.paymentTermDialog.conditions")}
          htmlFor="term-conditions"
          hint={t("offers.builder.paymentTermDialog.conditionsHint")}
        >
          <Textarea
            id="term-conditions"
            rows={2}
            maxLength={800}
            value={form.conditions}
            onChange={(event) => setForm({ ...form, conditions: event.target.value })}
          />
        </Field>
        <Field label={t("offers.builder.paymentTermDialog.conditionsAr")} htmlFor="term-conditions-ar">
          <Textarea
            id="term-conditions-ar"
            dir="rtl"
            rows={2}
            maxLength={800}
            value={form.conditionsAr}
            onChange={(event) => setForm({ ...form, conditionsAr: event.target.value })}
          />
        </Field>
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
      </div>
    </Dialog>
  )
}
