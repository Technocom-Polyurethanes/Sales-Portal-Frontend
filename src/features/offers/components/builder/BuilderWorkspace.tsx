import { useMemo, useState } from "react"
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
import { buildDocumentData } from "../../document"
import { createEmptyDraft, draftToPayload } from "../../draft"
import { useOfferBuilder } from "../../hooks/useOfferBuilder"
import type { PaymentTerm } from "../../../settings/types"
import type { BuilderCatalog } from "../../hooks/useBuilderCatalog"
import type { OfferStatus } from "../../types"
import type { OfferDraft } from "../../types"
import BuilderStepper from "./BuilderStepper"
import DeliveryScheduleEditor from "./DeliveryScheduleEditor"
import LivePreview from "./LivePreview"
import ReviewDialog from "./ReviewDialog"
import StepBasics from "./StepBasics"
import StepNotes from "./StepNotes"
import StepPackaging from "./StepPackaging"
import StepTaxes from "./StepTaxes"

export type BuilderWorkspaceProps = {
  catalog: BuilderCatalog
  initialDraft?: OfferDraft
  version: number
  parentOfferId?: string
}

/** The five step offer builder with its live document preview. */
export default function BuilderWorkspace({
  catalog,
  initialDraft,
  version,
  parentOfferId,
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
    initialDraft:
      initialDraft ??
      createEmptyDraft({
        documentLanguage: defaultDocumentLanguage,
        paymentTermId: catalog.paymentTerms[0]?.id ?? "",
      }),
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
          notes: draft.notes,
        },
        {
          customer,
          company: catalog.company,
          banks: catalog.banks,
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

  const validate = (): boolean => {
    if (!draft.customerId) {
      setError(t("offers.builder.validation.customer"))
      return false
    }
    if (!draft.reference?.trim()) {
      setError("Reference is required")
      return false
    }
    if (draft.lines.length === 0) {
      setError(t("offers.builder.validation.lines"))
      return false
    }
    setError(undefined)
    return true
  }

  // The API always creates a draft, so issuing is a second call on the saved offer.
  const save = async (status: OfferStatus) => {
    if (saving || !validate()) return

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
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_26rem]">
      <div className="no-print space-y-4">
        <BuilderStepper
          steps={steps}
          current={controller.step}
          onChange={controller.setStep}
        />

        {error && (
          <p className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
            {error}
          </p>
        )}

        <Card
          title={steps[controller.step]?.label}
          description={t("offers.builder.packagingHint")}
        >
          {controller.step === 0 && (
            <StepBasics
              draft={draft}
              customers={catalog.customers}
              paymentTerms={catalog.paymentTerms}
              dueDate={serverCalculations?.dueDate || calculations.dueDate}
              onChange={controller.setDraft}
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
            <DeliveryScheduleEditor
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
            <StepNotes
              notes={draft.notes}
              onChange={(notes) => controller.setDraft({ notes })}
            />
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
              <Button
                variant="primary"
                onClick={() => controller.setStep(controller.step + 1)}
              >
                {t("common.next")}
              </Button>
            ) : (
              <Button
                variant="primary"
                icon={<Icon name="check" size={16} />}
                onClick={() => {
                  if (validate()) setReviewOpen(true)
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
