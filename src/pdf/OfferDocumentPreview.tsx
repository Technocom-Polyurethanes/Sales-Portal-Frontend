import { useEffect, useRef, useState } from "react"

import OfferDocument from "./OfferDocument"
import type { DocumentLanguage } from "./PdfLanguageProvider"
import type { OfferDocumentData } from "./templates/types"

/** Width of an A4 page in CSS pixels (210mm at 96dpi). */
const A4_WIDTH_PX = 794

/** Height of an A4 page in CSS pixels (297mm at 96dpi). */
const A4_HEIGHT_PX = 1123

export type OfferDocumentPreviewProps = {
  data: OfferDocumentData
  language: DocumentLanguage
  className?: string
}

/**
 * Scaled preview of the printed offer.
 *
 * The preview shows a real A4 sheet, 210mm wide with 15mm margins, and the
 * whole sheet is scaled down to fit the panel. The document itself is never
 * modified.
 */
export default function OfferDocumentPreview({
  data,
  language,
  className = "",
}: OfferDocumentPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const pageRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [pageSize, setPageSize] = useState({
    width: A4_WIDTH_PX,
    height: A4_HEIGHT_PX,
  })

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const updateScale = () => {
      const styles = getComputedStyle(container)
      const available =
        container.clientWidth -
        parseFloat(styles.paddingLeft) -
        parseFloat(styles.paddingRight)

      if (available <= 0) return
      setScale(Math.min(1, available / A4_WIDTH_PX))
    }

    updateScale()
    const observer = new ResizeObserver(updateScale)
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const page = pageRef.current
    if (!page) return

    const updateSize = () =>
      setPageSize({ width: page.offsetWidth, height: page.offsetHeight })

    updateSize()
    const observer = new ResizeObserver(updateSize)
    observer.observe(page)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={containerRef} className={`offer-preview ${className}`}>
      <div
        className="offer-preview__frame"
        style={{
          width: pageSize.width * scale,
          height: pageSize.height * scale,
        }}
      >
        <div
          ref={pageRef}
          className="offer-preview__page"
          style={{ transform: `scale(${scale})` }}
        >
          <OfferDocument data={data} language={language} />
        </div>
      </div>
    </div>
  )
}
