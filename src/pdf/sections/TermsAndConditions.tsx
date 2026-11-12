export type TermsAndConditionsProps = {
  heading: string
  terms: string[]
}

/** The fixed terms and conditions, numbered, printed on every offer. */
export default function TermsAndConditions({ heading, terms }: TermsAndConditionsProps) {
  if (terms.length === 0) return null

  return (
    <section className="doc-section doc-terms">
      <h3>{heading}</h3>
      <ol>
        {terms.map((term) => (
          <li key={term}>{term}</li>
        ))}
      </ol>
    </section>
  )
}
