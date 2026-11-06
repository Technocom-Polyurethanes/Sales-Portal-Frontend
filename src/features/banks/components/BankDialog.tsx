import { useState } from "react"

import Button from "../../../components/ui/Button"
import Dialog from "../../../components/ui/Dialog"
import Field from "../../../components/ui/Field"
import Input from "../../../components/ui/Input"
import Select from "../../../components/ui/Select"
import Toggle from "../../../components/ui/Toggle"
import { useToast } from "../../../components/ui/ToastProvider"
import { useTranslation } from "../../../i18n/I18nProvider"
import type { BankAccount } from "../../settings/types"
import { banksApi } from "../api"

export type BankDialogProps = {
  open: boolean
  bank?: BankAccount
  onClose: () => void
  onSaved: () => void
}

const CURRENCIES = ["EGP", "USD", "EUR", "SAR", "AED"]

/** Create or edit one bank account. Mount with a key so the form resets per record. */
export default function BankDialog({
  open,
  bank,
  onClose,
  onSaved,
}: BankDialogProps) {
  const { t } = useTranslation()
  const { notify } = useToast()
  const [form, setForm] = useState({
    bank: bank?.bank ?? "",
    bankAr: bank?.bankAr ?? "",
    branch: bank?.branch ?? "",
    branchAr: bank?.branchAr ?? "",
    accountHolderName: bank?.accountHolderName ?? "",
    accountNumber: bank?.accountNumber ?? "",
    swift: bank?.swift ?? "",
    iban: bank?.iban ?? "",
    currency: bank?.currency ?? "EGP",
    isActive: bank?.isActive ?? true,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const set = (field: keyof typeof form, value: string | boolean) =>
    setForm((current) => ({ ...current, [field]: value }))

  const save = async () => {
    if (
      !form.bank.trim() ||
      !form.branch.trim() ||
      !form.accountNumber.trim()
    ) {
      setError(t("banks.requiredFields"))
      return
    }

    setSaving(true)
    setError("")
    try {
      const body: Partial<BankAccount> = {
        bank: form.bank.trim(),
        bankAr: form.bankAr.trim() || undefined,
        branch: form.branch.trim(),
        branchAr: form.branchAr.trim() || undefined,
        accountHolderName: form.accountHolderName.trim(),
        accountNumber: form.accountNumber.trim(),
        swift: form.swift.trim(),
        iban: form.iban.trim(),
        currency: form.currency,
        isActive: form.isActive,
        sortOrder: bank?.sortOrder,
      }
      if (bank) await banksApi.update(bank.id, body)
      else await banksApi.create(body)
      notify(t(bank ? "banks.updated" : "banks.created"))
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
      title={t(bank ? "banks.edit" : "banks.newBank")}
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
        <Field label={t("banks.bank")} required htmlFor="bank-name">
          <Input
            id="bank-name"
            value={form.bank}
            onChange={(event) => set("bank", event.target.value)}
          />
        </Field>
        <Field label={t("banks.bankAr")} htmlFor="bank-name-ar">
          <Input
            id="bank-name-ar"
            value={form.bankAr}
            onChange={(event) => set("bankAr", event.target.value)}
          />
        </Field>
        <Field label={t("banks.branch")} required htmlFor="bank-branch">
          <Input
            id="bank-branch"
            value={form.branch}
            onChange={(event) => set("branch", event.target.value)}
          />
        </Field>
        <Field label={t("banks.branchAr")} htmlFor="bank-branch-ar">
          <Input
            id="bank-branch-ar"
            value={form.branchAr}
            onChange={(event) => set("branchAr", event.target.value)}
          />
        </Field>
        <Field label={t("banks.accountNumber")} required htmlFor="bank-account">
          <Input
            id="bank-account"
            value={form.accountNumber}
            onChange={(event) => set("accountNumber", event.target.value)}
          />
        </Field>
        <Field label={t("banks.accountHolder")} htmlFor="bank-holder">
          <Input
            id="bank-holder"
            value={form.accountHolderName}
            onChange={(event) => set("accountHolderName", event.target.value)}
          />
        </Field>
        <Field label={t("banks.swift")} htmlFor="bank-swift">
          <Input
            id="bank-swift"
            value={form.swift}
            onChange={(event) => set("swift", event.target.value)}
          />
        </Field>
        <Field label={t("banks.iban")} htmlFor="bank-iban">
          <Input
            id="bank-iban"
            value={form.iban}
            onChange={(event) => set("iban", event.target.value)}
          />
        </Field>
        <Field label={t("common.currency")} htmlFor="bank-currency">
          <Select
            id="bank-currency"
            value={form.currency}
            onChange={(event) => set("currency", event.target.value)}
          >
            {CURRENCIES.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="mt-4">
        <Toggle
          checked={form.isActive}
          onChange={(checked) => set("isActive", checked)}
          label={t("banks.active")}
          hint={t("banks.activeHint")}
        />
      </div>

      {error && (
        <p className="mt-3 rounded border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
          {error}
        </p>
      )}
    </Dialog>
  )
}
