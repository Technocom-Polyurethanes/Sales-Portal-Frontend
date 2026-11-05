import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { buildOfferReference } from "../../../lib/calculations/reference"
import type { PackagingLine } from "../../../lib/calculations/packaging"
import type { Product } from "../../products/types"
import type { Customer } from "../../customers/types"
import type { PackageType } from "../../settings/types"
import {
  createDraftLine,
  createEmptyDraft,
  createPackagingRow,
  draftId,
  draftToPayload,
  reconcileDelivery,
} from "../draft"
import { offersApi } from "../api"
import { calculateDraft, type DraftCalculations } from "../calculations"
import type { DeliveryBatch, OfferDraft, OfferDraftLine } from "../types"
import type { AccountUser } from "../../account/api"

export type ServerCalculations = {
  warnings: string[]
  validationErrors: string[]
  reference: string
  dueDate: string
}

export type OfferBuilderController = {
  draft: OfferDraft
  /** Instant, locally computed numbers. Always available, drives the UI. */
  calculations: DraftCalculations
  /** Latest response of the backend calculate endpoint, if any. */
  serverCalculations: ServerCalculations | null
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
  setAllocation: (
    batchId: string,
    productId: string,
    packages: number,
    packagingRowId?: string,
  ) => void
  recalculating: boolean
  calculateError: string | null
}

export type UseOfferBuilderOptions = {
  initialDraft?: OfferDraft
  sequence: number
  packageTypes: PackageType[]
  customers: Customer[]
  user: AccountUser | undefined
}

/** State of the five step offer builder. */
export function useOfferBuilder({
  initialDraft,
  sequence,
  packageTypes,
  customers,
  user,
}: UseOfferBuilderOptions): OfferBuilderController {
  const [draft, setDraftState] = useState<OfferDraft>(() => {
    const base = initialDraft ?? createEmptyDraft()

    return {
      ...base,
      // The user owns the reference: only suggest one when the draft has none.
      reference: base.reference.trim()
        ? base.reference
        : buildOfferReference(base.offerType, sequence, user?.initials ?? ""),
      otherTaxPercent: base.otherTaxEnabled ? 1 : 0,
    }
  })
  const [step, setStep] = useState(0)
  const [serverCalculations, setServerCalculations] =
    useState<ServerCalculations | null>(null)
  const [recalculating, setRecalculating] = useState(false)
  const [calculateError, setCalculateError] = useState<string | null>(null)

  const calculations = useMemo(() => calculateDraft(draft), [draft])

  const abortControllerRef = useRef<AbortController | null>(null)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const triggerCalculate = useCallback(() => {
    // Cancel previous in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    const requestController = new AbortController()
    abortControllerRef.current = requestController

    // Clear debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Debounce 250ms
    debounceTimerRef.current = setTimeout(async () => {
      setRecalculating(true)
      setCalculateError(null)

      try {
        const payload = draftToPayload(draft, { version: 1 })

        const response = await offersApi.calculate(payload)

        // Ignore stale responses
        if (requestController.signal.aborted) {
          return
        }

        setServerCalculations({
          warnings: response.validationWarnings ?? [],
          validationErrors: response.validationErrors ?? [],
          reference: response.draft?.reference || draft.reference,
          dueDate: response.totals?.dueDate ?? "",
        })
      } catch (error: any) {
        if (error?.name === "AbortError") return
        setCalculateError(error?.message || "Failed to calculate offer")
      } finally {
        if (!requestController.signal.aborted) {
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
          patch.customerId &&
          patch.customerId !== current.customerId
        ) {
          const selected = customers.find(
            (item) => item.id === patch.customerId,
          )
          if (patch.attention === undefined && !next.attention) {
            next.attention = selected?.contactPerson ?? ""
          }
          if (patch.attentionAr === undefined && !next.attentionAr) {
            next.attentionAr =
              selected?.contactPersonAr || selected?.contactPerson || ""
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

        if (patch.offerType && patch.offerType !== current.offerType) {
          // Regenerate the reference with the new offer type prefix and user initials
          const parts = current.reference.split("/")
          const sequence = Number.parseInt(parts[0], 10)
          if (Number.isFinite(sequence)) {
            next.reference = buildOfferReference(
              patch.offerType,
              sequence,
              user?.initials ?? "",
            )
          }
        }

        return next
      })
    },
    [customers, user],
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
    serverCalculations,
    recalculating,
    calculateError,
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
