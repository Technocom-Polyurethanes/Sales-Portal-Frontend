import { createContext, useCallback, useContext, useMemo } from "react"
import type { ReactNode } from "react"
import { sileo, Toaster, type SileoPosition } from "sileo"
import "sileo/styles.css"

import { useTranslation } from "../../i18n/I18nProvider"
import type { AppLanguage } from "../../i18n/direction"

export type ToastTone = "success" | "info" | "warning" | "error"

type ToastContextValue = {
  notify: (message: string, tone?: ToastTone, description?: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

/** Arabic reads right to left, so its toasts sit on the opposite corner. */
export function toastPosition(language: AppLanguage): SileoPosition {
  return language === "ar" ? "bottom-left" : "bottom-right"
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const { language } = useTranslation()
  const position = toastPosition(language)

  const notify = useCallback(
    (message: string, tone: ToastTone = "success", description?: string) => {
      sileo[tone]({ title: message, description, position })
    },
    [position],
  )

  const value = useMemo(() => ({ notify }), [notify])

  return (
    <ToastContext.Provider value={value}>
      <Toaster position={position} />
      {children}
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)
  if (!context) throw new Error("useToast must be used inside <ToastProvider>")
  return context
}
