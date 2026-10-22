import { addDays, isValidIsoDate } from "./date"

export type PaymentTerm = {
  id: string
  label: string
  labelAr: string
  /** Days after the issue date. `0` means the offer is due on issue. */
  days: number
}

/** Payment terms offered in the offer builder. */
export const PAYMENT_TERMS: PaymentTerm[] = [
  {
    id: "bank-transfer-purchase-order",
    label: "Bank transfer with purchase order",
    labelAr: "تحويل بنكي بأمر شراء",
    days: 0,
  },
  {
    id: "cheque-30",
    label: "Cheque — 30 days",
    labelAr: "شيك — ٣٠ يوم",
    days: 30,
  },
  {
    id: "cheque-60",
    label: "Cheque — 60 days",
    labelAr: "شيك — ٦٠ يوم",
    days: 60,
  },
  {
    id: "cash-on-delivery",
    label: "Cash on delivery",
    labelAr: "نقداً عند التسليم",
    days: 0,
  },
]

export const DEFAULT_PAYMENT_TERM_ID = PAYMENT_TERMS[0].id

export function getPaymentTerm(id: string): PaymentTerm {
  return PAYMENT_TERMS.find((term) => term.id === id) ?? PAYMENT_TERMS[0]
}

/**
 * Due date of an offer: the issue date shifted by the payment term.
 * Returns an ISO day string (`YYYY-MM-DD`).
 */
export function dueDateFrom(
  issueDate: string,
  term: PaymentTerm | string,
): string {
  const paymentTerm = typeof term === "string" ? getPaymentTerm(term) : term
  if (!isValidIsoDate(issueDate)) return issueDate
  return addDays(issueDate, paymentTerm.days)
}

/** Number of days between the issue date and the due date. */
export function paymentTermDays(term: PaymentTerm | string): number {
  const paymentTerm = typeof term === "string" ? getPaymentTerm(term) : term
  return paymentTerm.days
}
