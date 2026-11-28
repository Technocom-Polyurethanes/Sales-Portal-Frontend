import { createContext, useCallback, useContext, useMemo } from "react"

import type { ReactNode } from "react"

import { sileo, Toaster, type SileoPosition } from "sileo"

import "sileo/styles.css"

import { useTranslation } from "../../i18n/I18nProvider"

import type { AppLanguage } from "../../i18n/direction"

export type ToastTone = "success" | "info" | "warning" | "error"

export type ToastAction = {
  label: string
  onClick: () => void
}

type ToastContextValue = {
  notify: (
    message: string,

    tone?: ToastTone,

    description?: string,

    action?: ToastAction,

    details?: string,
  ) => void
}

/** Tinted backgrounds make the toast readable at a glance on the busy workspace. */

const FILLS: Record<ToastTone, string> = {
  success: "#e3f3e9",

  info: "#dceafa",

  warning: "#fbf0d9",

  error: "#fae5e3",
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
    (
      message: string,

      tone: ToastTone = "success",

      description?: string,

      action?: ToastAction,

      details?: string,
    ) => {
      sileo[tone]({
        title: message,

        description:
          [description, details].filter(Boolean).join("\n") || undefined,

        position,

        duration: 9000,

        fill: FILLS[tone],

        button: action
          ? { title: action.label, onClick: action.onClick }
          : undefined,
      })
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
