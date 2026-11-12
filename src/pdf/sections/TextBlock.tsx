export type TextBlockProps = {
  heading: string
  text?: string
  /** Extra class of the section, used to style one block apart from the others. */
  className?: string
}

/** A block of free text under a heading, printed only when it has some. Line breaks are kept. */
export default function TextBlock({ heading, text, className }: TextBlockProps) {
  if (!text?.trim()) return null

  return (
    <section className={`doc-section doc-text${className ? ` ${className}` : ""}`}>
      <h3>{heading}</h3>
      <p>{text}</p>
    </section>
  )
}
