import type { ReactNode } from "react"

export type FieldProps = {
  label: string
  hint?: string
  error?: string
  required?: boolean
  htmlFor?: string
  children: ReactNode
}

/** Label + control + hint wrapper used by every form in the app. */
export default function Field({
  label,
  hint,
  error,
  required = false,
  htmlFor,
  children,
}: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        className="flex items-center gap-1 text-[13px] font-medium text-ink"
        htmlFor={htmlFor}
      >
        {label}
        {required && <span className="text-danger">*</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="text-xs leading-relaxed text-muted">{hint}</p>
      )}
      {error && (
        <p className="rounded border border-danger/30 bg-danger/10 px-2.5 py-1.5 text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
