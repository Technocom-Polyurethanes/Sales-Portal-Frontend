export type BillToBlockProps = {
  heading: string
  customerName: string
  address: string
  attention: string
  attentionLabel: string
}

/** Customer block shown on the left of the document header. */
export default function BillToBlock({
  heading,
  customerName,
  address,
  attention,
  attentionLabel,
}: BillToBlockProps) {
  return (
    <div className="doc-bill-to">
      <p className="doc-block-title">{heading}</p>
      <strong>{customerName}</strong>
      <p>{address}</p>
      {attention && (
        <p>
          {attentionLabel}: {attention}
        </p>
      )}
    </div>
  )
}
