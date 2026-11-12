import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"

import Button from "../../../../components/ui/Button"
import Card from "../../../../components/ui/Card"
import Icon from "../../../../components/ui/Icon"
import { useToast } from "../../../../components/ui/ToastProvider"
import { useTranslation } from "../../../../i18n/I18nProvider"
import { ApiError } from "../../../../lib/api/types"
import { getPaymentTerm } from "../../../../lib/calculations/dueDate"
import { usePdfLanguage } from "../../../../pdf/PdfLanguageProvider"
import { usePrintOffer } from "../../../../pdf/PrintProvider"
import { offersApi } from "../../api"
import { banksForOffer } from "../../bankSelection"
import { buildDocumentData } from "../../document"
import { createEmptyDraft, draftToPayload } from "../../draft"
import { useOfferBuilder } from "../../hooks/useOfferBuilder"
import type { AccountUser } from "../../../account/api"
import type { PaymentTerm } from "../../../settings/types"
import type { BuilderCatalog } from "../../hooks/useBuilderCatalog"
import {
  furthestOpenStep,
  SUMMARY_FIELD,
  validateAllSteps,
  type StepValidationContext,
} from "../../stepValidation"
import type { OfferStatus } from "../../types"
import type { OfferDraft } from "../../types"
import BankAccountsStep from "./BankAccountsStep"
import BuilderStepper from "./BuilderStepper"
import LivePreview from "./LivePreview"
import ReviewDialog from "./ReviewDialog"
import StepBasics from "./StepBasics"
import StepDelivery from "./StepDelivery"
import StepNotes from "./StepNotes"
import StepPackaging from "./StepPackaging"
import StepTaxes from "./StepTaxes"

export type BuilderWorkspaceProps = {
  catalog: BuilderCatalog
  initialDraft?: OfferDraft
  version: number
  parentOfferId?: string
  user?: AccountUser | undefined
}

/** The five step offer builder with its live document preview. */
export default function BuilderWorkspace({
  catalog,
  initialDraft,
  version,
  parentOfferId,
  user,
}: BuilderWorkspaceProps) {
  const { t } = useTranslation()
  const { notify } = useToast()
  const navigate = useNavigate()
  const { language: defaultDocumentLanguage } = usePdfLanguage()
  const { print } = usePrintOffer()
  const [saving, setSaving] = useState<OfferStatus | null>(null)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)

  const controller = useOfferBuilder({
    sequence: catalog.sequence,
    packageTypes: catalog.packageTypes,
    customers: catalog.customers,
    user: user ?? undefined,
    initialDraft:
      initialDraft ??
      createEmptyDraft(
        {
          documentLanguage: defaultDocumentLanguage,
          paymentTermId: catalog.paymentTerms[0]?.id ?? "",
        },
        catalog.banks,
      ),
  })

  const { draft, calculations, serverCalculations } = controller

  const customer = catalog.customers.find(
    (item) => item.id === draft.customerId,
  )

  const documentData = useMemo(
    () => {
      return buildDocumentData(
        {
          reference: serverCalculations?.reference || calculations.reference,
          issueDate: draft.issueDate,
          dueDate: serverCalculations?.dueDate || calculations.dueDate,
          currency: draft.currency,
          paymentTermId: draft.paymentTermId,
          customerId: draft.customerId,
          attention: draft.attention,
          attentionAr: draft.attentionAr,
          validityDays: draft.validityDays,
          taxId: draft.taxId ?? "",
          lines: draft.lines.map((line: any, index) => ({
            productId: line.productId || line.materialId || "",
            materialName: line.materialName,
            materialCode: line.materialCode || "",
            category: line.category,
            packaging: line.packaging,
            quantityKg: calculations.lines[index]?.quantityKg ?? 0,
            ratePerKg: line.ratePerKg,
            amount: calculations.lines[index]?.amount ?? 0,
          })),
          subtotal: calculations.subtotal,
          orderDiscountPercent: draft.orderDiscountPercent,
          orderDiscount: calculations.totals.orderDiscount,
          taxPercent: draft.taxPercent,
          taxAmount: calculations.totals.taxAmount,
          otherTaxEnabled: draft.otherTaxEnabled,
          otherTaxPercent: calculations.totals.otherTaxPercent,
          otherTaxAmount: calculations.totals.otherTaxAmount,
          total: calculations.totals.total,
          delivery: draft.delivery,
          deliveryMode: draft.deliveryMode,
          deliveryText: draft.deliveryText,
          deliveryPlace: draft.deliveryPlace,
          paymentTermsText: draft.paymentTermsText,
          notes: draft.notes,
        },
        {
          customer,
          company: catalog.company,
          banks: banksForOffer(catalog.banks, draft.bankAccountIds),
          packageTypes: catalog.packageTypes,
          language: draft.documentLanguage,
          paymentTermLabel: paymentTermLabel(
            catalog.paymentTerms,
            draft.paymentTermId,
            draft.documentLanguage,
          ),
        },
      )
    },
    [calculations, serverCalculations, draft, customer, catalog],
  )

  const steps = [
    { id: "basics", label: t("offers.builder.steps.basics") },
    { id: "packaging", label: t("offers.builder.steps.packaging") },
    { id: "taxes", label: t("offers.builder.steps.taxes") },
    { id: "delivery", label: t("offers.builder.steps.delivery") },
    { id: "notes", label: t("offers.builder.steps.notes") },
  ]

  // What each step still needs. The stepper and the Next button are gated on it.
  const validationContext = useMemo<StepValidationContext>(
    () => ({
      sequenceRequired: catalog.isFirstOffer && !parentOfferId,
      hasPaymentTerms: catalog.paymentTerms.length > 0,
      hasPackageTypes: catalog.packageTypes.length > 0,
    }),
    [catalog.isFirstOffer, catalog.paymentTerms, catalog.packageTypes, parentOfferId],
  )
  const issuesByStep = useMemo(
    () => validateAllSteps(draft, validationContext),
    [draft, validationContext],
  )
  const furthestStep = furthestOpenStep(issuesByStep)
  const stepComplete = issuesByStep.map((issues) => issues.length === 0)

  // Errors only appear once the user tried to leave a step, then follow the edits live.
  const [revealed, setRevealed] = useState<number[]>([])
  const [focusRequest, setFocusRequest] = useState(0)
  const summaryRef = useRef<HTMLDivElement>(null)

  const reveal = (stepIndex: number) => {
    setRevealed((current) =>
      current.includes(stepIndex) ? current : [...current, stepIndex],
    )
    setFocusRequest((value) => value + 1)
  }

  const currentIssues = issuesByStep[controller.step] ?? []
  const showIssues = revealed.includes(controller.step)
  const fieldErrors: Record<string, string> = {}
  if (showIssues) {
    for (const issue of currentIssues) {
      if (issue.field !== SUMMARY_FIELD && !fieldErrors[issue.field]) {
        fieldErrors[issue.field] = t(issue.message, issue.params)
      }
    }
  }
  const summaryIssues = showIssues
    ? currentIssues.filter((issue) => issue.field === SUMMARY_FIELD)
    : []

  // Move the focus to the first thing that needs attention.
  useEffect(() => {
    if (focusRequest === 0) return
    const first = (issuesByStep[controller.step] ?? [])[0]
    if (!first) return
    const target =
      first.field === SUMMARY_FIELD
        ? summaryRef.current
        : document.getElementById(first.field)
    target?.focus()
    target?.scrollIntoView({ block: "center", behavior: "smooth" })
    // Only a new request moves the focus, not every edit of the draft.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusRequest])

  const goToStep = (index: number) => {
    // Going back is always possible; going forward stops at the first incomplete step.
    if (index <= controller.step || index <= furthestStep) {
      controller.setStep(index)
    }
  }

  const goNext = () => {
    if (currentIssues.length > 0) {
      reveal(controller.step)
      return
    }
    controller.setStep(controller.step + 1)
  }

  // A draft only needs a customer, a material and a bank; issuing needs every step complete.
  const validate = (mode: "draft" | "issue"): boolean => {
    for (let index = 0; index < issuesByStep.length; index += 1) {
      const blocking =
        mode === "draft"
          ? issuesByStep[index].filter((issue) => issue.blocksDraft)
          : issuesByStep[index]
      if (blocking.length > 0) {
        controller.setStep(index)
        reveal(index)
        setError(undefined)
        return false
      }
    }
    setError(undefined)
    return true
  }

  // The API always creates a draft, so issuing is a second call on the saved offer.
  const save = async (status: OfferStatus) => {
    if (saving || !validate(status === "issued" ? "issue" : "draft")) return

    setSaving(status)
    let saved
    try {
      saved = await offersApi.create(
        draftToPayload(draft, { version, parentOfferId }),
      )
    } catch (e) {
      setError(apiMessage(e, t("common.somethingWrong")))
      setSaving(null)
      return
    }

    if (status === "issued") {
      try {
        await offersApi.setStatus(saved.id, "issued")
        notify(t("offers.builder.issued"))
      } catch {
        notify(t("offers.builder.issueFailed"), "warning")
      }
    } else {
      notify(t("offers.builder.draftSaved"))
    }
    navigate(`/offers/${saved.id}`)
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_26rem]">
      <div className="no-print space-y-4">
        <BuilderStepper
          steps={steps}
          current={controller.step}
          furthest={furthestStep}
          complete={stepComplete}
          onChange={goToStep}
          label={t("offers.builder.stepsLabel")}
          lockedHint={t("offers.builder.stepLocked")}
        />

        <p className="sr-only" aria-live="polite">
          {controller.step + 1} / {steps.length} · {steps[controller.step]?.label}
        </p>

        {error && (
          <p className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
            {error}
          </p>
        )}

        <Card title={steps[controller.step]?.label}>
          {summaryIssues.length > 0 && (
            <div
              ref={summaryRef}
              role="alert"
              tabIndex={-1}
              className="mb-4 rounded-md border border-danger/30 bg-danger/10 px-3 py-2.5 text-sm text-danger focus:outline-none"
            >
              <p className="font-medium">
                {t("offers.builder.validation.summaryTitle")}
              </p>
              <ul className="mt-1 list-disc space-y-0.5 ps-5 text-xs">
                {summaryIssues.map((issue, index) => (
                  <li key={`${issue.message}-${index}`}>
                    {t(issue.message, issue.params)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {controller.step === 0 && (
            <StepBasics
              draft={draft}
              customers={catalog.customers}
              paymentTerms={catalog.paymentTerms}
              dueDate={serverCalculations?.dueDate || calculations.dueDate}
              onChange={controller.setDraft}
              errors={fieldErrors}
              nextSequence={catalog.sequence}
              showSequence={catalog.isFirstOffer && !parentOfferId}
            />
          )}

          {controller.step === 1 && (
            <StepPackaging
              controller={controller}
              products={catalog.products}
              packageTypes={catalog.packageTypes}
            />
          )}

          {controller.step === 2 && (
            <StepTaxes
              draft={draft}
              totals={calculations.totals}
              onChange={controller.setDraft}
            />
          )}

          {controller.step === 3 && (
            <StepDelivery
              onChange={controller.setDraft}
              errors={fieldErrors}
              draft={draft}
              calculations={calculations}
              packageTypes={catalog.packageTypes}
              onAddBatch={controller.addBatch}
              onRemoveBatch={controller.removeBatch}
              onUpdateBatch={controller.updateBatch}
              onSetAllocation={controller.setAllocation}
            />
          )}

          {controller.step === 4 && (
            <div className="space-y-4">
              <BankAccountsStep
                banks={catalog.banks}
                selected={draft.bankAccountIds}
                onChange={(bankAccountIds) =>
                  controller.setDraft({ bankAccountIds })
                }
              />
              <StepNotes
                notes={draft.notes}
                onChange={(notes) => controller.setDraft({ notes })}
              />
            </div>
          )}
        </Card>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button
            variant="secondary"
            disabled={controller.step === 0}
            onClick={() => controller.setStep(controller.step - 1)}
          >
            {t("common.previous")}
          </Button>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              icon={<Icon name="print" size={16} />}
              onClick={() =>
                print({ data: documentData, language: draft.documentLanguage })
              }
            >
              {t("offers.builder.printExport")}
            </Button>

            <Button
              variant="secondary"
              onClick={() => void save("draft")}
              loading={saving === "draft"}
              disabled={saving !== null}
            >
              {t("offers.builder.saveDraft")}
            </Button>

            {controller.step < steps.length - 1 ? (
              <Button variant="primary" onClick={goNext}>
                {t("common.next")}
              </Button>
            ) : (
              <Button
                variant="primary"
                icon={<Icon name="check" size={16} />}
                onClick={() => {
                  if (validate("issue")) setReviewOpen(true)
                }}
              >
                {t("offers.builder.saveIssue")}
              </Button>
            )}
          </div>
        </div>
      </div>

      <LivePreview
        data={documentData}
        language={draft.documentLanguage}
        onLanguageChange={(documentLanguage) =>
          controller.setDraft({ documentLanguage })
        }
      />

      <ReviewDialog
        open={reviewOpen}
        reference={serverCalculations?.reference || calculations.reference}
        customerName={customer?.name ?? ""}
        issueDate={draft.issueDate}
        dueDate={serverCalculations?.dueDate || calculations.dueDate}
        totals={calculations.totals}
        otherTaxEnabled={draft.otherTaxEnabled}
        currency={draft.currency}
        documentLanguage={draft.documentLanguage}
        saving={saving === "issued"}
        onClose={() => setReviewOpen(false)}
        onConfirm={() => void save("issued")}
      />
    </div>
  )
}

// The backend term ids are GUIDs, so look the term up in the catalog first.
function paymentTermLabel(
  terms: PaymentTerm[],
  termId: string,
  language: "en" | "ar",
): string {
  const term = terms.find((item) => item.id === termId) ?? getPaymentTerm(termId)
  return language === "ar" ? term.labelAr || term.label : term.label
}

function apiMessage(e: unknown, fallback: string): string {
  if (!(e instanceof ApiError)) return fallback
  const list = Array.isArray(e.errors) ? e.errors.join(" ") : ""
  return [e.message, list].filter(Boolean).join(" ")
}
