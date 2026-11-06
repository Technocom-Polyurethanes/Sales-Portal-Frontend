import { useState } from "react"

import Button from "../../../components/ui/Button"
import Dialog from "../../../components/ui/Dialog"
import Field from "../../../components/ui/Field"
import Input from "../../../components/ui/Input"
import Select from "../../../components/ui/Select"
import Toggle from "../../../components/ui/Toggle"
import { useToast } from "../../../components/ui/ToastProvider"
import { useTranslation } from "../../../i18n/I18nProvider"
import type { PackageType } from "../../settings/types"
import { productsApi } from "../api"
import type { Product } from "../types"

export type MaterialDialogProps = {
  open: boolean
  product?: Product
  packageTypes: PackageType[]
  onClose: () => void
  onSaved: () => void
}

/** Create or edit one material. Mount with a key so the form resets per record. */
export default function MaterialDialog({
  open,
  product,
  packageTypes,
  onClose,
  onSaved,
}: MaterialDialogProps) {
  const { t } = useTranslation()
  const { notify } = useToast()
  const [form, setForm] = useState({
    code: product?.itemCode ?? product?.code ?? "",
    name: product?.name ?? "",
    category: product?.category ?? "",
    referencePrice: String(product?.referencePrice ?? ""),
    defaultPackageTypeId: product?.defaultPackageTypeId ?? "",
    defaultWeightKg: String(product?.defaultWeightKg ?? ""),
    isActive: product?.isActive ?? true,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const set = (field: keyof typeof form, value: string | boolean) =>
    setForm((current) => ({ ...current, [field]: value }))

  const choosePackageType = (id: string) => {
    const type = packageTypes.find((item) => item.id === id)
    setForm((current) => ({
      ...current,
      defaultPackageTypeId: id,
      defaultWeightKg:
        current.defaultWeightKg || String(type?.defaultWeightKg ?? ""),
    }))
  }

  const save = async () => {
    if (!form.code.trim() || !form.name.trim() || !form.category.trim()) {
      setError(t("products.codeNameCategoryRequired"))
      return
    }

    setSaving(true)
    setError("")
    try {
      const body: Partial<Product> = {
        code: form.code.trim(),
        itemCode: form.code.trim(),
        name: form.name.trim(),
        category: form.category.trim(),
        referencePrice: Number(form.referencePrice) || 0,
        defaultPackageTypeId: form.defaultPackageTypeId,
        defaultWeightKg: Number(form.defaultWeightKg) || 0,
        isActive: form.isActive,
      }
      if (product) await productsApi.update(product.id, body)
      else await productsApi.create(body)
      notify(t(product ? "products.updated" : "products.created"))
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
      title={t(product ? "products.edit" : "products.addMaterial")}
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
        <Field label={t("products.code")} required htmlFor="material-code">
          <Input
            id="material-code"
            value={form.code}
            onChange={(event) => set("code", event.target.value)}
          />
        </Field>
        <Field label={t("products.material")} required htmlFor="material-name">
          <Input
            id="material-name"
            value={form.name}
            onChange={(event) => set("name", event.target.value)}
          />
        </Field>
        <Field
          label={t("products.category")}
          required
          htmlFor="material-category"
        >
          <Input
            id="material-category"
            value={form.category}
            onChange={(event) => set("category", event.target.value)}
          />
        </Field>
        <Field label={t("products.pricePerKg")} htmlFor="material-price">
          <Input
            id="material-price"
            type="number"
            min="0"
            step="0.001"
            value={form.referencePrice}
            onChange={(event) => set("referencePrice", event.target.value)}
          />
        </Field>
        <Field
          label={t("products.defaultPackaging")}
          htmlFor="material-package"
        >
          <Select
            id="material-package"
            value={form.defaultPackageTypeId}
            onChange={(event) => choosePackageType(event.target.value)}
          >
            <option value="">{t("common.none")}</option>
            {packageTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t("settings.weightPerPackage")} htmlFor="material-weight">
          <Input
            id="material-weight"
            type="number"
            min="0"
            step="0.1"
            value={form.defaultWeightKg}
            onChange={(event) => set("defaultWeightKg", event.target.value)}
          />
        </Field>
      </div>

      <div className="mt-4">
        <Toggle
          checked={form.isActive}
          onChange={(checked) => set("isActive", checked)}
          label={t("products.active")}
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
