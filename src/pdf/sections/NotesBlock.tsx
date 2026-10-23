export type NotesBlockProps = {
  heading: string
  notes: string
}

/** Free text notes, printed only when the offer carries some. */
export default function NotesBlock({ heading, notes }: NotesBlockProps) {
  if (!notes.trim()) return null

  return (
    <section className="doc-section doc-notes">
      <h3>{heading}</h3>
      <p>{notes}</p>
    </section>
  )
}
