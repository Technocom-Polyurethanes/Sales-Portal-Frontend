import { useEffect, useMemo, useRef, useState } from "react"
import Button from "../ui/Button"
import Icon from "../ui/Icon"
import Input from "../ui/Input"
import TableSkeleton from "../ui/TableSkeleton"
import PickerFooter from "./PickerFooter"
import { useLookupPage } from "./useLookupPage"
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

const FALLBACK_ROWS = 8

export default function MaterialPickerModal({
  open,
  materials,
  existingProductIds,
  onSelect,
  onClose,
}: MaterialPickerModalProps) {
  const { language } = useTranslation()
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [highlight, setHighlight] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const pageSize = useFitRowsPageSize(containerRef, 44, 48, 0, open)

  const lookup = useLookupPage<Product>({
    path: "/materials/lookup",
    tag: "materials",
    search,
    page,
    pageSize,
    enabled: open,
  })

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

  // The lists the builder already holds answer when the lookup endpoint is unavailable.
  const fallback = useMemo(
    () =>
      lookup.failed
        ? queryMaterials(materials, { search, page, pageSize: pageSize || FALLBACK_ROWS })
        : null,
    [lookup.failed, materials, search, page, pageSize],
  )

  const current = fallback ?? lookup.data
  const shown = current ?? lookup.previous
  const items = shown?.items ?? []
  const showSkeleton = lookup.loading && !lookup.previous
  const totals = fallback ?? lookup.totals
  const totalCount = totals?.totalCount ?? 0
  const totalPages = Math.max(1, totals?.totalPages ?? 1)
  const currentPage = Math.min(Math.max(1, page), totalPages)
  const rows = pageSize || FALLBACK_ROWS
  const start = totalCount === 0 ? 0 : (currentPage - 1) * rows + 1
  const end = Math.min(currentPage * rows, totalCount)

  useEffect(() => {
    setHighlight((value) => (items.length === 0 ? 0 : Math.min(value, items.length - 1)))
  }, [items.length])

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault()
      onClose()
      return
    }
    if (event.key === "ArrowDown") {
      event.preventDefault()
      if (items.length === 0) return
      setHighlight((value) => (value + 1) % items.length)
      return
    }
    if (event.key === "ArrowUp") {
      event.preventDefault()
      if (items.length === 0) return
      setHighlight((value) => (value - 1 + items.length) % items.length)
      return
    }
    if (event.key === "Enter") {
      event.preventDefault()
      if (items[highlight]) onSelect(items[highlight])
      return
    }
    if (event.key === "PageDown") {
      event.preventDefault()
      if (currentPage < totalPages) setPage(currentPage + 1)
      return
    }
    if (event.key === "PageUp") {
      event.preventDefault()
      if (currentPage > 1) setPage(currentPage - 1)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-[1px] p-4 sm:p-6" onKeyDown={handleKeyDown} tabIndex={-1} onClick={onClose}>
      <div className="flex h-[78vh] min-h-115 max-h-180 w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
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
            <Icon name="search" size={16} className="absolute inset-s-3 top-1/2 -translate-y-1/2 text-muted" />
            <Input
              ref={inputRef}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={language === "ar" ? "ابحث بكود الخامة أو اسم المنتج..." : "Search by Item Code or Material Name..."}
              className="ps-9 pe-8"
            />
            {search && (
              <button
                className="absolute inset-e-2 top-1/2 -translate-y-1/2 text-muted"
                onClick={() => setSearch("")}
              >
                <Icon name="close" size={14} />
              </button>
            )}
          </div>
        </div>
        <div ref={containerRef} className="flex-1 overflow-hidden">
          <table className="w-full table-fixed" aria-busy={lookup.loading}>
            <thead>
              <tr className="h-11 bg-page">
                <th className="w-56 border-b border-line px-4 text-start text-xs font-semibold uppercase tracking-wide text-muted">
                  {language === "ar" ? "كود الخامة" : "Item Code"}
                </th>
                <th className="border-b border-line px-4 text-start text-xs font-semibold uppercase tracking-wide text-muted">
                  {language === "ar" ? "اسم الخامة" : "Material Name"}
                </th>
              </tr>
            </thead>
            <tbody className={lookup.loading && lookup.previous ? "opacity-60 transition-opacity" : ""}>
              {showSkeleton && <TableSkeleton asRows rows={rows} columns={2} />}
              {!showSkeleton &&
                items.map((material, index) => {
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
                      <td className="w-full">
                        <div className="flex w-full items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span>{material.name}</span>
                            {material.category && (
                              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                                {material.category}
                              </span>
                            )}
                          </div>

                          {exists && (
                            <span className="shrink-0 rounded bg-danger/10 px-1.5 py-0.5 mr-4 text-xs text-danger">
                              {language === "ar" ? "مضاف بالفعل" : "Already added"}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
        <PickerFooter
          language={language}
          page={currentPage}
          totalPages={totalPages}
          start={start}
          end={end}
          totalCount={totalCount}
          pending={totals === null}
          onPage={setPage}
        />
      </div>
    </div>
  )
}
