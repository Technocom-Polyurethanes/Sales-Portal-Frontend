import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { referenceNumber } from "../../../lib/calculations/reference"
import type { PackagingLine } from "../../../lib/calculations/packaging"
import type { Product } from "../../products/types"
import type { Customer } from "../../customers/types"
import type { PackageType } from "../../settings/types"
import {
  createDraftLine,
  createEmptyDraft,
  createPackagingRow,
  draftId,
  reconcileDelivery,
} from "../draft"
import { offersApi } from "../api"
import type { DeliveryBatch, OfferDraft, OfferDraftLine } from "../types"

export type ServerCalculations = {
  lines: Array<{
    lineId: string
    productId: string
    materialName: string
    materialCode: string
    category: string
    packaging: PackagingLine[]
    quantityKg: number
    ratePerKg: number
    discountPercent: number
    amount: number
  }>
  subtotal: number
  orderDiscountPercent: number
  orderDiscount: number
  taxPercent: number
  taxAmount: number
  otherTaxEnabled: boolean
  otherTaxPercent: number
  otherTaxAmount: number
  total: number
  deliveryCaps: Record<string, Record<string, number>>
  warnings: string[]
  validationErrors: string[]
  reference: string
  dueDate: string
  document: any
}

export type OfferBuilderController = {
  draft: OfferDraft
  calculations: ServerCalculations | null
  setDraft: (patch: Partial<OfferDraft>) => void
  setStep: (step: number) => void
  step: number
  addLine: (product: Product) => void
  removeLine: (lineId: string) => void
  updateLine: (lineId: string, patch: Partial<OfferDraftLine>) => void
  addPackaging: (lineId: string) => void
  removePackaging: (lineId: string, rowId: string) => void
  updatePackaging: (
    lineId: string,
    rowId: string,
    patch: Partial<PackagingLine>,
  ) => void
  addBatch: () => void
  removeBatch: (batchId: string) => void
  updateBatch: (batchId: string, patch: Partial<DeliveryBatch>) => void
  setAllocation: (batchId: string, productId: string, packages: number) => void
  recalculating: boolean
  calculateError: string | null
}

export type UseOfferBuilderOptions = {
  initialDraft?: OfferDraft
  sequence: number
  packageTypes: PackageType[]
  customers: Customer[]
}

/** State of the five step offer builder. */
export function useOfferBuilder({
  initialDraft,
  sequence,
  packageTypes,
  customers,
}: UseOfferBuilderOptions): OfferBuilderController {
  const [draft, setDraftState] = useState<OfferDraft>(() => {
    const base = initialDraft ?? createEmptyDraft()

    return {
      ...base,
      // The user owns the reference: only suggest one when the draft has none.
      reference: base.reference.trim()
        ? base.reference
        : referenceNumber(sequence, base.issueDate),
      otherTaxPercent: base.otherTaxEnabled ? 1 : 0,
    }
  })
  const [step, setStep] = useState(0)
  const [calculations, setCalculations] = useState<ServerCalculations | null>(null)
  const [recalculating, setRecalculating] = useState(false)
  const [calculateError, setCalculateError] = useState<string | null>(null)

  const abortControllerRef = useRef<AbortController | null>(null)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const triggerCalculate = useCallback(() => {
    // Cancel previous in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    // Clear debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Debounce 250ms
    debounceTimerRef.current = setTimeout(async () => {
      setRecalculating(true)
      setCalculateError(null)

      try {
        // Prepare draft for server calculate
        const calculateDraft = {
          reference: draft.reference,
          customerId: draft.customerId,
          attention: draft.attention,
          attentionAr: (draft as any).attentionAr,
          taxId: draft.taxId,
          issueDate: draft.issueDate,
          currency: draft.currency,
          paymentTermId: draft.paymentTermId,
          lines: draft.lines.map((line: any) => ({
            productId: line.productId || line.materialId,
            materialName: line.materialName,
            materialCode: line.materialCode,
            category: line.category,
            ratePerKg: line.ratePerKg,
            discountPercent: line.discountPercent,
            packaging: line.packaging,
          })),
          taxPercent: draft.taxPercent,
          otherTaxEnabled: draft.otherTaxEnabled,
          otherTaxPercent: draft.otherTaxPercent,
          orderDiscountPercent: draft.orderDiscountPercent,
          delivery: draft.delivery,
          notes: draft.notes,
          documentLanguage: draft.documentLanguage,
        }

        const response = await offersApi.calculate(calculateDraft)

        // Ignore stale responses
        if (abortControllerRef.current.signal.aborted) {
          return
        }

        // Map server response to our calculations type
        setCalculations({
          lines: (response.lines || []).map((l: any, idx: number) => ({
            lineId: draft.lines[idx]?.id || l.productId || `line-${idx}`,
            productId: l.productId || l.materialId || "",
            materialName: l.materialName || "",
            materialCode: l.materialCode || "",
            category: l.category || "",
            packaging: l.packaging || [],
            quantityKg: l.quantityKg || 0,
            ratePerKg: l.ratePerKg || 0,
            discountPercent: l.discountPercent || 0,
            amount: l.amount || 0,
          })),
          subtotal: response.subtotal || 0,
          orderDiscountPercent: response.orderDiscountPercent || 0,
          orderDiscount: response.orderDiscount || 0,
          taxPercent: response.taxPercent || 0,
          taxAmount: response.taxAmount || 0,
          otherTaxEnabled: response.otherTaxEnabled || false,
          otherTaxPercent: response.otherTaxPercent || 0,
          otherTaxAmount: response.otherTaxAmount || 0,
          total: response.total || 0,
          deliveryCaps: response.deliveryCaps || {},
          warnings: response.warnings || [],
          validationErrors: response.validationErrors || [],
          reference: response.reference || draft.reference,
          dueDate: response.dueDate || "",
          document: response.document,
        })
      } catch (error: any) {
        if (error?.name === "AbortError") return
        setCalculateError(error?.message || "Failed to calculate offer")
      } finally {
        if (!abortControllerRef.current?.signal.aborted) {
          setRecalculating(false)
        }
      }
    }, 250)
  }, [draft])

  // Trigger calculation when draft changes
  useEffect(() => {
    triggerCalculate()
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [triggerCalculate])

  const setDraft = useCallback(
    (patch: Partial<OfferDraft>) => {
      setDraftState((current) => {
        const next = { ...current, ...patch }

        // Selecting a customer prefills the attention with the contact person
        // of the customer record, unless the user already typed their own.
        if (
          patch.attention === undefined &&
          patch.customerId &&
          patch.customerId !== current.customerId
        ) {
          const previous = customers.find(
            (item) => item.id === current.customerId,
          )
          const untouched =
            current.attention.trim() === "" ||
            current.attention.trim() === previous?.contactPerson.trim()

          if (untouched) {
            const selected = customers.find(
              (item) => item.id === patch.customerId,
            )
            next.attention = selected?.contactPerson ?? ""
            // Also prefill attentionAr if available
            if (selected?.contactPersonAr && !(next as any).attentionAr) {
              (next as any).attentionAr = selected.contactPersonAr
            }
          }
        }

        if (
          patch.taxId === undefined &&
          patch.customerId &&
          patch.customerId !== current.customerId
        ) {
          const selected = customers.find(
            (item) => item.id === patch.customerId,
          )
          if (current.taxId === undefined || current.taxId === "") {
            next.taxId = selected?.taxId ?? ""
          } else if (
            customers.find((item) => item.id === current.customerId)?.taxId ===
              current.taxId
          ) {
            next.taxId = selected?.taxId ?? ""
          }
        }

        if (patch.issueDate && patch.issueDate !== current.issueDate) {
          // Option: if reference follows the standard format, update its month automatically
          const parts = current.reference.split("/")
          if (parts.length === 4) {
            const newMonth = referenceNumber(1, patch.issueDate).split("/")[1]
            parts[1] = newMonth
            next.reference = parts.join("/")
          }
        }

        return next
      })
    },
    [customers],
  )

  const addLine = useCallback(
    (product: Product) => {
      setDraftState((current) => ({
        ...current,
        lines: [...current.lines, createDraftLine(product, packageTypes)],
      }))
    },
    [packageTypes],
  )

  const removeLine = useCallback((lineId: string) => {
    setDraftState((current) => {
      const lines = current.lines.filter((line) => line.id !== lineId)
      return {
        ...current,
        lines,
        delivery: reconcileDelivery(lines, current.delivery),
      }
    })
  }, [])

  const updateLine = useCallback(
    (lineId: string, patch: Partial<OfferDraftLine>) => {
      setDraftState((current) => {
        const lines = current.lines.map((line) =>
          line.id === lineId ? { ...line, ...patch } : line,
        )
        return {
          ...current,
          lines,
          delivery: reconcileDelivery(lines, current.delivery),
        }
      })
    },
    [],
  )

  const updatePackaging = useCallback(
    (lineId: string, rowId: string, patch: Partial<PackagingLine>) => {
      setDraftState((current) => {
        const lines = current.lines.map((line) =>
          line.id === lineId
            ? {
                ...line,
                packaging: line.packaging.map((row) =>
                  row.id === rowId ? { ...row, ...patch } : row,
                ),
              }
            : line,
        )
        return {
          ...current,
          lines,
          delivery: reconcileDelivery(lines, current.delivery),
        }
      })
    },
    [],
  )

  const addPackaging = useCallback(
    (lineId: string) => {
      const fallback = packageTypes[0]
      if (!fallback) return

      setDraftState((current) => {
        const lines = current.lines.map((line) =>
          line.id === lineId
            ? {
                ...line,
                packaging: [...line.packaging, createPackagingRow(fallback)],
              }
            : line,
        )
        return {
          ...current,
          lines,
          delivery: reconcileDelivery(lines, current.delivery),
        }
      })
    },
    [packageTypes],
  )

  const removePackaging = useCallback((lineId: string, rowId: string) => {
    setDraftState((current) => {
      const lines = current.lines.map((line) =>
        line.id === lineId
          ? {
              ...line,
              packaging: line.packaging.filter((row) => row.id !== rowId),
            }
          : line,
      )
      return {
        ...current,
        lines,
        delivery: reconcileDelivery(lines, current.delivery),
      }
    })
  }, [])

  const addBatch = useCallback(() => {
    setDraftState((current) => ({
      ...current,
      delivery: [
        ...current.delivery,
        {
          id: draftId("batch"),
          batchNumber: current.delivery.length + 1,
          date: current.issueDate,
          allocations: current.lines.flatMap((line) =>
            line.packaging.map((row) => ({
              productId: line.productId,
              packagingRowId: row.id,
              packageTypeId: row.packageTypeId,
              packageTypeName: row.packageTypeName,
              weightPerPackageKg: row.weightPerPackageKg,
              packages: 0,
            })),
          ),
        },
      ],
    }))
  }, [])

  const removeBatch = useCallback((batchId: string) => {
    setDraftState((current) => ({
      ...current,
      delivery: current.delivery
        .filter((batch) => batch.id !== batchId)
        .map((batch, index) => ({ ...batch, batchNumber: index + 1 })),
    }))
  }, [])

  const updateBatch = useCallback(
    (batchId: string, patch: Partial<DeliveryBatch>) => {
      setDraftState((current) => ({
        ...current,
        delivery: current.delivery.map((batch) =>
          batch.id === batchId ? { ...batch, ...patch } : batch,
        ),
      }))
    },
    [],
  )

  const setAllocation = useCallback(
    (
      batchId: string,
      productId: string,
      packages: number,
      packagingRowId?: string,
    ) => {
      setDraftState((current) => {
        const line = current.lines.find((item) => item.productId === productId)
        const row = packagingRowId
          ? line?.packaging.find((item) => item.id === packagingRowId)
          : line?.packaging[0]
        const ordered = row?.packages ?? 0
        const scheduledElsewhere = current.delivery.reduce(
          (sum, batch) =>
            batch.id === batchId
              ? sum
              : sum +
                (batch.allocations.find(
                  (allocation) =>
                    allocation.productId === productId &&
                    (packagingRowId
                      ? allocation.packagingRowId === packagingRowId
                      : !allocation.packagingRowId),
                )?.packages ?? 0),
          0,
        )
        const maxAllowed = Math.max(0, ordered - scheduledElsewhere)
        const safe = Number.isFinite(packages) ? packages : 0
        const next = Math.min(maxAllowed, Math.max(0, Math.floor(safe)))

        return {
          ...current,
          delivery: current.delivery.map((batch) => {
            if (batch.id !== batchId) return batch

            const allocations = batch.allocations.map((allocation) => {
              const match = packagingRowId
                ? allocation.packagingRowId === packagingRowId &&
                  allocation.productId === productId
                : allocation.productId === productId && !allocation.packagingRowId
              if (!match) return allocation
              return {
                ...allocation,
                productId,
                packagingRowId: packagingRowId ?? row?.id,
                packageTypeId: row?.packageTypeId ?? allocation.packageTypeId,
                packageTypeName: row?.packageTypeName ?? allocation.packageTypeName,
                weightPerPackageKg:
                  row?.weightPerPackageKg ?? allocation.weightPerPackageKg,
                packages: next,
              }
            })

            const hasMatch = allocations.some((allocation) => {
              const match = packagingRowId
                ? allocation.packagingRowId === packagingRowId &&
                  allocation.productId === productId
                : allocation.productId === productId && !allocation.packagingRowId
              return match
            })

            if (!hasMatch && row) {
              allocations.push({
                productId,
                packagingRowId: row.id,
                packageTypeId: row.packageTypeId,
                packageTypeName: row.packageTypeName,
                weightPerPackageKg: row.weightPerPackageKg,
                packages: next,
              })
            }

            return { ...batch, allocations }
          }),
        }
      })
    },
    [],
  )

  return {
    draft,
    calculations,
    setDraft,
    step,
    setStep,
    addLine,
    removeLine,
    updateLine,
    addPackaging,
    removePackaging,
    updatePackaging,
    addBatch,
    removeBatch,
    updateBatch,
    setAllocation,
  }
}
