export type Customer = {
  id: string
  code: string
  customerCode?: string
  erpNextId?: string
  name: string
  nameAr?: string
  contactPerson: string
  contactPersonAr?: string
  email: string
  phone: string
  city: string
  cityAr?: string
  address: string
  addressAr?: string
  taxId?: string
  paymentTermId: string
  offersCount: number
  totalValue: number
  lastOfferDate?: string
}
