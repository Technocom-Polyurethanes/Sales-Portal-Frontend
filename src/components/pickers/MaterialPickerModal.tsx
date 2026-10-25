import { useEffect, useMemo, useRef, useState } from "react"
import Button from "../ui/Button"
import Icon from "../ui/Icon"
import Input from "../ui/Input"
import { useTranslation } from "../../i18n/I18nProvider"
import { queryMaterials } from "../../lib/api/lookup"
import { useFitRowsPageSize } from "../../hooks/useFitRowsPageSize"
import type { Product } from "../../features/products/types"

export type MaterialPickerModalProps = {
  open: boolean
  materials: Product[]
  existingProductIds: string[]
  onSelect: (product: Product) => void
  onClose: () => void
}

export default function MaterialPickerModal({
  open,
  materials,
  existingProductIds,
  onSelect,
  onClose,
}: MaterialPickerModalProps) {
  const { t, language } = useTranslation()
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [highlight, setHighlight] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const pageSize = useFitRowsPageSize(containerRef, 44, 48)

  useEffect(() => {
    if (open) {
      setSearch("")
      setPage(1)
      setHighlight(0)
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [open])

  useEffect(() => {
    setPage(1)
    setHighlight(0)
  }, [search, pageSize])

  const result = useMemo(
    () => queryMaterials(materials, { search, page, pageSize }),
    [materials, search, page, pageSize],
  )

  const start = result.totalCount === 0 ? 0 : (result.page - 1) * result.pageSize + 1
  const end = Math.min(result.page * result.pageSize, result.totalCount)

  useEffect(() => {
    setHighlight((current) =>
      result.items.length === 0 ? 0 : Math.min(current, result.items.length - 1),
    )
  }, [result.items.length])

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault()
      onClose()
      return
    }
    if (event.key === "ArrowDown") {
      event.preventDefault()
      if (result.items.length === 0) return
      setHighlight((current) => (current + 1) % result.items.length)
      return
    }
    if (event.key === "ArrowUp") {
      event.preventDefault()
      if (result.items.length === 0) return
      setHighlight((current) => (current - 1 + result.items.length) % result.items.length)
      return
    }
    if (event.key === "Enter") {
      event.preventDefault()
      if (result.items[highlight]) {
        onSelect(result.items[highlight])
      }
      return
    }
    if (event.key === "PageDown") {
      event.preventDefault()
      if (result.page < result.totalPages) setPage(result.page + 1)
      return
    }
    if (event.key === "PageUp") {
      event.preventDefault()
      if (result.page > 1) setPage(result.page - 1)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-[1px] p-4 sm:p-6" onKeyDown={handleKeyDown} tabIndex={-1} onClick={onClose}>
      <div className="flex h-[78vh] min-h-[460px] max-h-[720px] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="text-base font-semibold text-ink">
            {language === "ar" ? "اختر الخامة" : "Select material"}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <Icon name="close" size={16} />
          </Button>
        </div>
        <div className="border-b border-slate-200 px-4 py-2">
          <div className="relative">
            <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <Input
              ref={inputRef}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={language === "ar" ? "ابحث بكود الخامة أو اسم المنتج..." : "Search by ERP Item Code / ID or Material Name..."}
              className="pl-9 pr-8"
            />
            {search && (
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted"
                onClick={() => setSearch("")}
              >
                <Icon name="close" size={14} />
              </button>
            )}
          </div>
        </div>
        <div ref={containerRef} className="flex-1 overflow-hidden">
          <table className="w-full table-fixed">
            <thead>
              <tr className="h-11 bg-slate-50">
                <th className="w-56 border-b border-slate-200 px-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  {language === "ar" ? "كود الخامة" : "ERP Item Code / ID"}
                </th>
                <th className="border-b border-slate-200 px-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  {language === "ar" ? "اسم الخامة" : "Material Name"}
                </th>
              </tr>
            </thead>
            <tbody>
              {result.items.map((material, index) => {
                const code = material.itemCode ?? material.erpNextItemCode ?? material.code
                const exists = existingProductIds.includes(material.id)
                return (
                  <tr
                    key={material.id}
                    className={`h-12 max-h-12 cursor-pointer border-b border-slate-100 hover:bg-slate-50 ${highlight === index ? "bg-slate-100 font-semibold" : ""}`}
                    onClick={() => onSelect(material)}
                    onMouseEnter={() => setHighlight(index)}
                  >
                    <td className="truncate whitespace-nowrap px-4 font-mono text-sm text-slate-700">{code}</td>
                    <td className="truncate whitespace-nowrap px-4 text-sm text-ink">
                      <span className="inline-flex items-center gap-2">
                        <span className="truncate">{material.name}</span>
                        {material.category && (
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">{material.category}</span>
                        )}
                        {exists && (
                          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
                            {language === "ar" ? "مضاف بالفعل" : "Already added"}
                          </span>
                        )}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="flex h-12 items-center justify-between border-t border-slate-200 px-4 text-sm text-slate-600">
          <div>
            {language === "ar"
              ? `عرض ${start}–${end} من أصل ${result.totalCount}`
              : `Showing ${start}–${end} of ${result.totalCount}`}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" disabled={result.page <= 1} onClick={() => setPage(result.page - 1)}>
              {language === "ar" ? "السابق" : "Previous"}
            </Button>
            <span>
              {language === "ar" ? `صفحة ${result.page} من ${result.totalPages}` : `Page ${result.page} of ${result.totalPages}`}
            </span>
            <Button variant="ghost" size="sm" disabled={result.page >= result.totalPages} onClick={() => setPage(result.page + 1)}>
              {language === "ar" ? "التالي" : "Next"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
