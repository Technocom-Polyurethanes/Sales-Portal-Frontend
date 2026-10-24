import { useCallback, useMemo, useState } from "react"

import { referenceNumber } from "../../../lib/calculations/reference"
import { OTHER_TAX_PERCENT } from "../../../lib/calculations/tax"
import type { PackagingLine } from "../../../lib/calculations/packaging"
import type { Product } from "../../products/types"
import type { Customer } from "../../customers/types"
import type { PackageType } from "../../settings/types"
import {
  calculateDraft,
  orderedPackages,
  type DraftCalculations,
} from "../calculations"
import {
  createDraftLine,
  createEmptyDraft,
  createPackagingRow,
  draftId,
} from "../draft"
import type { DeliveryBatch, OfferDraft, OfferDraftLine } from "../types"

export type OfferBuilderController = {
  draft: OfferDraft
  calculations: DraftCalculations
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
      otherTaxPercent: base.otherTaxEnabled ? OTHER_TAX_PERCENT : 0,
    }
  })
  const [step, setStep] = useState(0)

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
          }
        }

        return next
      })
    },
    [customers],
  )

  const calculations = useMemo(() => calculateDraft(draft), [draft])

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
      const productIds = new Set(lines.map((line) => line.productId))

      return {
        ...current,
        lines,
        // A material that is gone cannot keep packages in a delivery batch.
        delivery: current.delivery.map((batch) => ({
          ...batch,
          allocations: batch.allocations.filter((allocation) =>
            productIds.has(allocation.productId),
          ),
        })),
      }
    })
  }, [])

  const updateLine = useCallback(
    (lineId: string, patch: Partial<OfferDraftLine>) => {
      setDraftState((current) => ({
        ...current,
        lines: current.lines.map((line) =>
          line.id === lineId ? { ...line, ...patch } : line,
        ),
      }))
    },
    [],
  )

  const updatePackaging = useCallback(
    (lineId: string, rowId: string, patch: Partial<PackagingLine>) => {
      setDraftState((current) => ({
        ...current,
        lines: current.lines.map((line) =>
          line.id === lineId
            ? {
                ...line,
                packaging: line.packaging.map((row) =>
                  row.id === rowId ? { ...row, ...patch } : row,
                ),
              }
            : line,
        ),
      }))
    },
    [],
  )

  const addPackaging = useCallback(
    (lineId: string) => {
      const fallback = packageTypes[0]
      if (!fallback) return

      setDraftState((current) => ({
        ...current,
        lines: current.lines.map((line) =>
          line.id === lineId
            ? {
                ...line,
                packaging: [...line.packaging, createPackagingRow(fallback)],
              }
            : line,
        ),
      }))
    },
    [packageTypes],
  )

  const removePackaging = useCallback((lineId: string, rowId: string) => {
    setDraftState((current) => ({
      ...current,
      lines: current.lines.map((line) =>
        line.id === lineId
          ? {
              ...line,
              packaging: line.packaging.filter((row) => row.id !== rowId),
            }
          : line,
      ),
    }))
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
          allocations: [
            ...new Set(current.lines.map((line) => line.productId)),
          ].map((productId) => ({ productId, packages: 0 })),
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
    (batchId: string, productId: string, packages: number) => {
      setDraftState((current) => {
        const ordered = orderedPackages(current.lines, productId)
        const scheduledElsewhere = current.delivery.reduce(
          (sum, batch) =>
            batch.id === batchId
              ? sum
              : sum +
                (batch.allocations.find(
                  (allocation) => allocation.productId === productId,
                )?.packages ?? 0),
          0,
        )
        const maxAllowed = Math.max(0, ordered - scheduledElsewhere)
        const safe = Number.isFinite(packages) ? packages : 0
        const next = Math.min(maxAllowed, Math.max(0, safe))

        return {
          ...current,
          delivery: current.delivery.map((batch) => {
            if (batch.id !== batchId) return batch

            const exists = batch.allocations.some(
              (allocation) => allocation.productId === productId,
            )

            const allocations = exists
              ? batch.allocations.map((allocation) =>
                  allocation.productId === productId
                    ? { ...allocation, packages: next }
                    : allocation,
                )
              : [...batch.allocations, { productId, packages: next }]

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
