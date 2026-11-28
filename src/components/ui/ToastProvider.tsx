import { createContext, useCallback, useContext, useMemo } from "react"

import type { ReactNode } from "react"

import { sileo, Toaster } from "sileo"

import "sileo/styles.css"

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

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
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

        duration: 9000,

        button: action
          ? { title: action.label, onClick: action.onClick }
          : undefined,
      })
    },

    [],
  )

  const value = useMemo(() => ({ notify }), [notify])

  return (
    <ToastContext.Provider value={value}>
      {/* Sileo's "light" theme paints a dark toast on a light workspace. */}
      <Toaster position="bottom-right" theme="light" />
      {children}
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)

  if (!context) throw new Error("useToast must be used inside <ToastProvider>")

  return context
}
