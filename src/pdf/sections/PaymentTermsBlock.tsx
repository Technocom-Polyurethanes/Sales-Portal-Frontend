export type PaymentTermsBlockProps = {
  heading: string
  /** The selected payment term, always printed first. */
  term: string
  /** Extra conditions typed on the offer, 2-4 lines long. */
  conditions?: string
}

/**
 * The payment terms in a block of their own, so conditions of several lines are not squeezed into
 * a cell of the reference table.
 */
export default function PaymentTermsBlock({ heading, term, conditions }: PaymentTermsBlockProps) {
  const extra = conditions?.trim()
  if (!term.trim() && !extra) return null

  return (
    <section className="doc-section doc-text doc-payment-terms">
      <h3>{heading}</h3>
      {term.trim() && <p className="doc-payment-terms__term">{term}</p>}
      {extra && <p>{extra}</p>}
    </section>
  )
}
