import { useEffect, useId, useRef, useState } from "react"
import type { ReactNode } from "react"

import { useTranslation } from "../../i18n/I18nProvider"
import { useFocusTrap } from "../../lib/hooks/useFocusTrap"
import Button from "./Button"
import Icon from "./Icon"

export type DialogProps = {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  size?: "sm" | "md" | "lg"
}

const SIZES = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-3xl",
}

export default function Dialog({
  open,
  title,
  onClose,
  children,
  footer,
  size = "md",
}: DialogProps) {
  const { t } = useTranslation()

  // Keep the dialog mounted until the closing animation has finished.
  const [visible, setVisible] = useState(open)
  const titleId = useId()
  const panelRef = useRef<HTMLElement>(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (open) {
      setVisible(true)
      return
    }

    const timer = window.setTimeout(() => setVisible(false), 200)
    return () => window.clearTimeout(timer)
  }, [open])

  useFocusTrap(open && visible, panelRef)

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current()
    }

    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [open])

  if (!visible) return null
  const closing = !open

  return (
    <div
      className={`fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/50 p-4 sm:items-center ${closing ? "motion-safe:animate-fade-out" : "motion-safe:animate-fade-in"}`}
      onClick={onClose}
      role="presentation"
    >
      <section
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        className={`w-full ${SIZES[size]} rounded-2xl border border-line-soft bg-surface shadow-lg focus:outline-none ${closing ? "motion-safe:animate-panel-out" : "motion-safe:animate-panel-in"}`}
      >
        <header className="flex items-center justify-between gap-4 border-b border-line-soft px-5 py-4">
          <h2 id={titleId} className="text-base font-semibold text-ink">{title}</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label={t("common.close")}
          >
            <Icon name="close" size={18} />
          </Button>
        </header>
        <div className="px-5 py-4 text-sm leading-relaxed text-ink">
          {children}
        </div>
        {footer && (
          <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-line-soft px-5 py-4">
            {footer}
          </footer>
        )}
      </section>
    </div>
  )
}
