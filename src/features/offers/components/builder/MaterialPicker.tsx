import { useState } from "react"

import Button from "../../../../components/ui/Button"
import Icon from "../../../../components/ui/Icon"
import { useTranslation } from "../../../../i18n/I18nProvider"
import MaterialPickerModal from "../../../../components/pickers/MaterialPickerModal"
import type { Product } from "../../../products/types"

export type MaterialPickerProps = {
  products: Product[]
  existingProductIds?: string[]
  onAdd: (product: Product) => void
}

/** Adds a material from the catalogue to the offer. */
export default function MaterialPicker({
  products,
  existingProductIds = [],
  onAdd,
}: MaterialPickerProps) {
  const { t, language } = useTranslation()
  const [open, setOpen] = useState(false)

  return (
    <div className="flex items-center justify-between rounded-md border border-dashed border-line bg-page/50 p-3">
      <p className="text-sm text-muted">
        {language === "ar" ? "إضافة خامات إلى عرض السعر" : "Add materials to the offer"}
      </p>
      <Button
        variant="primary"
        icon={<Icon name="plus" size={16} />}
        onClick={() => setOpen(true)}
      >
        {language === "ar" ? "+ إضافة خامة" : "+ Add material"}
      </Button>
      <MaterialPickerModal
        open={open}
        materials={products}
        existingProductIds={existingProductIds}
        onSelect={(product) => {
          if (existingProductIds.includes(product.id)) {
            setOpen(false)
            return
          }
          onAdd(product)
          setOpen(false)
        }}
        onClose={() => setOpen(false)}
      />
    </div>
  )
}
