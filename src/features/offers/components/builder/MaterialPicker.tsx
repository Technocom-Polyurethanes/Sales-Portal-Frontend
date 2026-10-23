import { useMemo, useState } from "react"

import Button from "../../../../components/ui/Button"
import Icon from "../../../../components/ui/Icon"
import Input from "../../../../components/ui/Input"
import Select from "../../../../components/ui/Select"
import { useTranslation } from "../../../../i18n/I18nProvider"
import type { Product } from "../../../products/types"

export type MaterialPickerProps = {
  products: Product[]
  onAdd: (product: Product) => void
}

/** Adds a material from the catalogue to the offer. */
export default function MaterialPicker({
  products,
  onAdd,
}: MaterialPickerProps) {
  const { t } = useTranslation()
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState("")

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return products
    return products.filter((product) =>
      `${product.name} ${product.code} ${product.category}`
        .toLowerCase()
        .includes(query),
    )
  }, [products, search])

  const product = filtered.find((item) => item.id === selected)

  return (
    <div className="rounded-md border border-dashed border-line bg-page/50 p-3">
      <div className="grid gap-3 sm:grid-cols-[1fr_1.4fr_auto] sm:items-end">
        <label className="flex flex-col gap-1 text-[13px] font-medium text-ink">
          {t("offers.builder.packaging.searchMaterial")}
          <Input
            type="search"
            value={search}
            placeholder={t("shell.searchPlaceholder")}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>

        <label className="flex flex-col gap-1 text-[13px] font-medium text-ink">
          {t("offers.builder.packaging.material")}
          <Select
            value={selected}
            onChange={(event) => setSelected(event.target.value)}
          >
            <option value="">
              {t("offers.builder.packaging.chooseMaterial")}
            </option>
            {filtered.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} · {item.code}
              </option>
            ))}
          </Select>
        </label>

        <Button
          variant="primary"
          icon={<Icon name="plus" size={16} />}
          disabled={!product}
          onClick={() => {
            if (!product) return
            onAdd(product)
            setSelected("")
          }}
        >
          {t("offers.builder.packaging.addMaterial")}
        </Button>
      </div>
    </div>
  )
}
