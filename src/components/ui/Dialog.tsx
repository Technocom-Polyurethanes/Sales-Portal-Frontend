import { useEffect, useState } from "react"
import type { ReactNode } from "react"

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
  // Keep the dialog mounted until the closing animation has finished.
  const [visible, setVisible] = useState(open)

  useEffect(() => {
    if (open) {
      setVisible(true)
      return
    }

    const timer = window.setTimeout(() => setVisible(false), 200)
    return () => window.clearTimeout(timer)
  }, [open])

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }

    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [open, onClose])

  if (!visible) return null
  const closing = !open

  return (
    <div
      className={`fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 p-4 backdrop-blur-[2px] sm:items-center ${closing ? "motion-safe:animate-fade-out" : "motion-safe:animate-fade-in"}`}
      onClick={onClose}
      role="presentation"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
        className={`w-full ${SIZES[size]} rounded-xl border border-line bg-surface shadow-xl ${closing ? "motion-safe:animate-panel-out" : "motion-safe:animate-panel-in"}`}
      >
        <header className="flex items-center justify-between gap-4 border-b border-line-soft px-5 py-4">
          <h2 className="text-base font-semibold text-ink">{title}</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Close dialog"
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
