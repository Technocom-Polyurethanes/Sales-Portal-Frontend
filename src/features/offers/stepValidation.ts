import type { TranslationKey } from "../../i18n/types"
import { hasBankSelection } from "./bankSelection"
import type { OfferDraft } from "./types"

/** The five steps of the builder, in order. */
export const BUILDER_STEPS = [
  "basics",
  "packaging",
  "taxes",
  "delivery",
  "notes",
] as const

export type StepIssue = {
  /**
   * DOM id of the field to focus and mark as invalid, or `summary` when the
   * problem belongs to the step as a whole (a missing material, a bank, ...).
   */
  field: string
  message: TranslationKey
  params?: Record<string, string | number>
  /** Saving a draft only needs the offer to be identifiable; these block it. */
  blocksDraft?: boolean
}

/** What the validation needs to know about the catalog and the offer. */
export type StepValidationContext = {
  /** The first offer shows a sequence input that must hold a number. */
  sequenceRequired: boolean
  /** Payment terms and package types are only required when the catalog has some. */
  hasPaymentTerms: boolean
  hasPackageTypes: boolean
}

export const SUMMARY_FIELD = "summary"

const isPercent = (value: number) =>
  Number.isFinite(value) && value >= 0 && value <= 100

const isPositive = (value: number) => Number.isFinite(value) && value > 0

function basics(draft: OfferDraft, ctx: StepValidationContext): StepIssue[] {
  const issues: StepIssue[] = []

  if (!draft.customerId) {
    issues.push({
      field: "offer-customer",
      message: "offers.builder.validation.customer",
      blocksDraft: true,
    })
  }
  if (!draft.issueDate) {
    issues.push({
      field: "offer-date",
      message: "offers.builder.validation.issueDate",
    })
  }
  if (!draft.currency) {
    issues.push({
      field: "offer-currency",
      message: "offers.builder.validation.currency",
    })
  }
  if (ctx.hasPaymentTerms && !draft.paymentTermId) {
    issues.push({
      field: "offer-term",
      message: "offers.builder.validation.paymentTerm",
    })
  }
  if (ctx.sequenceRequired && !(Number.isInteger(draft.sequence) && draft.sequence > 0)) {
    issues.push({
      field: "offer-sequence",
      message: "offers.builder.validation.sequence",
    })
  }

  return issues
}

function packaging(draft: OfferDraft, ctx: StepValidationContext): StepIssue[] {
  if (draft.lines.length === 0) {
    return [
      {
        field: SUMMARY_FIELD,
        message: "offers.builder.validation.lines",
        blocksDraft: true,
      },
    ]
  }

  const issues: StepIssue[] = []

  for (const line of draft.lines) {
    const name = line.materialName || line.materialCode || ""

    if (!isPositive(line.ratePerKg)) {
      issues.push({
        field: SUMMARY_FIELD,
        message: "offers.builder.validation.rate",
        params: { name },
      })
    }

    if (line.packaging.length === 0) {
      issues.push({
        field: SUMMARY_FIELD,
        message: "offers.builder.validation.packagingMissing",
        params: { name },
      })
      continue
    }

    if (ctx.hasPackageTypes && line.packaging.some((row) => !row.packageTypeId)) {
      issues.push({
        field: SUMMARY_FIELD,
        message: "offers.builder.validation.packagingType",
        params: { name },
      })
    }
    if (line.packaging.some((row) => !isPositive(row.weightPerPackageKg))) {
      issues.push({
        field: SUMMARY_FIELD,
        message: "offers.builder.validation.packagingWeight",
        params: { name },
      })
    }
    if (line.packaging.some((row) => !isPositive(row.packages))) {
      issues.push({
        field: SUMMARY_FIELD,
        message: "offers.builder.validation.packagingPackages",
        params: { name },
      })
    }
  }

  return issues
}

function taxes(draft: OfferDraft): StepIssue[] {
  const issues: StepIssue[] = []

  if (!isPercent(draft.taxPercent)) {
    issues.push({
      field: SUMMARY_FIELD,
      message: "offers.builder.validation.taxPercent",
    })
  }
  if (!isPercent(draft.orderDiscountPercent)) {
    issues.push({
      field: SUMMARY_FIELD,
      message: "offers.builder.validation.discountPercent",
    })
  }

  return issues
}

function delivery(draft: OfferDraft): StepIssue[] {
  // The schedule itself is optional; a batch that exists needs a date.
  return draft.delivery
    .filter((batch) => !batch.date)
    .map((batch) => ({
      field: SUMMARY_FIELD,
      message: "offers.builder.validation.batchDate" as const,
      params: { number: batch.batchNumber },
    }))
}

function notes(draft: OfferDraft): StepIssue[] {
  return hasBankSelection(draft.bankAccountIds)
    ? []
    : [
        {
          field: SUMMARY_FIELD,
          message: "offers.builder.banks.required",
          blocksDraft: true,
        },
      ]
}

/** What is still missing before the user may leave the given step. */
export function validateStep(
  step: number,
  draft: OfferDraft,
  ctx: StepValidationContext,
): StepIssue[] {
  switch (step) {
    case 0:
      return basics(draft, ctx)
    case 1:
      return packaging(draft, ctx)
    case 2:
      return taxes(draft)
    case 3:
      return delivery(draft)
    case 4:
      return notes(draft)
    default:
      return []
  }
}

/** Issues of every step, indexed by step. */
export function validateAllSteps(
  draft: OfferDraft,
  ctx: StepValidationContext,
): StepIssue[][] {
  return BUILDER_STEPS.map((_, index) => validateStep(index, draft, ctx))
}

/**
 * The furthest step the user may open: the first step that is not complete, or
 * the last one when everything is filled in. Going back is always allowed.
 */
export function furthestOpenStep(issuesByStep: StepIssue[][]): number {
  const firstIncomplete = issuesByStep.findIndex((issues) => issues.length > 0)
  return firstIncomplete === -1 ? issuesByStep.length - 1 : firstIncomplete
}
