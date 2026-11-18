import type { PaymentTerm } from "../../features/settings/types"

/** Payment terms of the mock catalogue; the two instalment terms carry conditions. */
export const paymentTerms: PaymentTerm[] = [
  { id: "bank-transfer-purchase-order", code: "transfer-order", label: "Bank transfer with purchase order", labelAr: "تحويل بنكي بأمر شراء", days: 0, isActive: true, conditions: null, conditionsAr: null },
  { id: "cheque-30", code: "cheque-30", label: "Cheque — 30 days", labelAr: "شيك — ٣٠ يوم", days: 30, isActive: true, conditions: null, conditionsAr: null },
  {
    id: "instalment-50-50",
    code: "instalment-50-50",
    label: "50% Down Payment / 50% After Receiving the Shipment",
    labelAr: "50% دفعة مقدمة / 50% بعد استلام الشحنة",
    days: 30,
    isActive: true,
    conditions:
      "50% of the total offer value as a down payment with the purchase order, and the remaining 50% by a cheque issued to Technocom, due {days} days after receipt.",
    conditionsAr:
      "50% من إجمالي قيمة العرض دفعة مقدمة مع أمر التوريد و50% المتبقية بموجب شيك صادر لشركة تيكنوكوم ويستحق الاستلام بعد {days} يوم",
  },
  {
    id: "instalment-40-60",
    code: "instalment-40-60",
    label: "40% Down Payment / 60% After Receiving the Shipment",
    labelAr: "40% دفعة مقدمة / 60% بعد استلام الشحنة",
    days: 30,
    isActive: true,
    conditions:
      "40% of the total offer value as a down payment with the purchase order, and the remaining 60% by a cheque issued to Technocom, due {days} days after receipt.",
    conditionsAr:
      "40% من إجمالي قيمة العرض دفعة مقدمة مع أمر التوريد و60% المتبقية بموجب شيك صادر لشركة تيكنوكوم ويستحق الاستلام بعد {days} يوم",
  },
]
