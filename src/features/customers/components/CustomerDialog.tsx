import { useState } from "react"

import Button from "../../../components/ui/Button"
import Dialog from "../../../components/ui/Dialog"
import Field from "../../../components/ui/Field"
import Input from "../../../components/ui/Input"
import { useToast } from "../../../components/ui/ToastProvider"
import { useTranslation } from "../../../i18n/I18nProvider"
import { customersApi } from "../api"
import type { Customer } from "../types"

export type CustomerDialogProps = {
  open: boolean
  customer?: Customer
  onClose: () => void
  onSaved: () => void
}

const EMPTY = {
  code: "",
  name: "",
  nameAr: "",
  contactPerson: "",
  email: "",
  phone: "",
  city: "",
  address: "",
  taxId: "",
}

/** Create or edit one customer. Mount with a key so the form resets per record. */
export default function CustomerDialog({
  open,
  customer,
  onClose,
  onSaved,
}: CustomerDialogProps) {
  const { t } = useTranslation()
  const { notify } = useToast()
  const [form, setForm] = useState(
    customer
      ? {
          code: customer.customerCode ?? customer.code,
          name: customer.name,
          nameAr: customer.nameAr ?? "",
          contactPerson: customer.contactPerson,
          email: customer.email,
          phone: customer.phone,
          city: customer.city,
          address: customer.address,
          taxId: customer.taxId ?? "",
        }
      : EMPTY,
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const set = (field: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [field]: value }))

  const save = async () => {
    if (!form.code.trim() || !form.name.trim()) {
      setError(t("customers.codeNameRequired"))
      return
    }

    setSaving(true)
    setError("")
    try {
      const body: Partial<Customer> = {
        code: form.code.trim(),
        customerCode: form.code.trim(),
        name: form.name.trim(),
        nameAr: form.nameAr.trim() || undefined,
        contactPerson: form.contactPerson.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        city: form.city.trim(),
        address: form.address.trim(),
        taxId: form.taxId.trim() || undefined,
      }
      if (customer) await customersApi.update(customer.id, body)
      else await customersApi.create(body)
      notify(t(customer ? "customers.updated" : "customers.created"))
      onSaved()
      onClose()
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : t("common.somethingWrong")
      setError(message)
      notify(message, "error")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      open={open}
      title={t(customer ? "customers.edit" : "customers.newCustomer")}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            {t("common.cancel")}
          </Button>
          <Button variant="primary" onClick={save} loading={saving}>
            {t("common.save")}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("customers.code")} required htmlFor="customer-code">
          <Input
            id="customer-code"
            value={form.code}
            onChange={(event) => set("code", event.target.value)}
          />
        </Field>
        <Field label={t("customers.name")} required htmlFor="customer-name">
          <Input
            id="customer-name"
            value={form.name}
            onChange={(event) => set("name", event.target.value)}
          />
        </Field>
        <Field label={t("customers.nameAr")} htmlFor="customer-name-ar">
          <Input
            id="customer-name-ar"
            value={form.nameAr}
            onChange={(event) => set("nameAr", event.target.value)}
          />
        </Field>
        <Field label={t("customers.contact")} htmlFor="customer-contact">
          <Input
            id="customer-contact"
            value={form.contactPerson}
            onChange={(event) => set("contactPerson", event.target.value)}
          />
        </Field>
        <Field label={t("customers.email")} htmlFor="customer-email">
          <Input
            id="customer-email"
            type="email"
            value={form.email}
            onChange={(event) => set("email", event.target.value)}
          />
        </Field>
        <Field label={t("customers.phone")} htmlFor="customer-phone">
          <Input
            id="customer-phone"
            value={form.phone}
            onChange={(event) => set("phone", event.target.value)}
          />
        </Field>
        <Field label={t("customers.city")} htmlFor="customer-city">
          <Input
            id="customer-city"
            value={form.city}
            onChange={(event) => set("city", event.target.value)}
          />
        </Field>
        <Field label={t("customers.taxId")} htmlFor="customer-tax">
          <Input
            id="customer-tax"
            value={form.taxId}
            onChange={(event) => set("taxId", event.target.value)}
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label={t("customers.address")} htmlFor="customer-address">
            <Input
              id="customer-address"
              value={form.address}
              onChange={(event) => set("address", event.target.value)}
            />
          </Field>
        </div>
      </div>
      {error && (
        <p className="mt-3 rounded border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
          {error}
        </p>
      )}
    </Dialog>
  )
}
