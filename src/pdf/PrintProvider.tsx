import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import type { ReactNode } from "react"
import { createPortal } from "react-dom"

import OfferDocument from "./OfferDocument"
import type { DocumentLanguage } from "./PdfLanguageProvider"
import type { OfferDocumentData } from "./templates/types"

export type PrintTarget = {
  data: OfferDocumentData
  language: DocumentLanguage
}

type PrintContextValue = {
  print: (target: PrintTarget) => void
}

const PrintContext = createContext<PrintContextValue | null>(null)

/**
 * Prints the offer document on its own.
 *
 * The document is rendered in a portal outside of the application, so the
 * printer only ever receives the document and never the workspace, the
 * summary or the scaled preview around it.
 */
export function PrintProvider({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<PrintTarget | null>(null)
  const pending = useRef(false)

  const print = useCallback((next: PrintTarget) => {
    pending.current = true
    setTarget(next)
  }, [])

  useEffect(() => {
    if (!pending.current || !target) return

    pending.current = false
    window.print()
  }, [target])

  const value = useMemo(() => ({ print }), [print])

  return (
    <PrintContext.Provider value={value}>
      {children}
      {createPortal(
        <div id="print-root">
          {target && (
            <OfferDocument data={target.data} language={target.language} />
          )}
        </div>,
        document.body,
      )}
    </PrintContext.Provider>
  )
}

/** Prints an offer document without the surrounding application. */
export function usePrintOffer(): PrintContextValue {
  const context = useContext(PrintContext)
  if (!context) {
    throw new Error("usePrintOffer must be used inside <PrintProvider>")
  }
  return context
}
