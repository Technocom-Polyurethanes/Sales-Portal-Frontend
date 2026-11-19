export type BillToBlockProps = {
  heading: string
  customerName: string
  address: string
  city?: string
  attention: string
  attentionLabel: string
  taxId?: string
  taxIdLabel?: string
}

/** Customer block shown on the left of the document header. */
export default function BillToBlock({
  heading,
  customerName,
  address,
  city,
  attention,
  attentionLabel,
  taxId,
  taxIdLabel,
}: BillToBlockProps) {
  return (
    <div className="doc-bill-to">
      <p className="doc-block-title">{heading}</p>
      <strong>{customerName}</strong>
      <p>{address}</p>
      {taxId && (
        <p>
          {taxIdLabel}: {taxId}
        </p>
      )}
      {attention && (
        <p>
          {attentionLabel}: {attention}
        </p>
      )}
    </div>
  )
}
