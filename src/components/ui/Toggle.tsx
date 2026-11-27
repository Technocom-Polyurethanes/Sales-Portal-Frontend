import type { ReactNode } from "react"

export type ToggleProps = {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  hint?: string
  disabled?: boolean
  children?: ReactNode
}

/** Checkbox styled as a toggle switch with a label. */
export default function Toggle({
  checked,
  onChange,
  label,
  hint,
  disabled = false,
  children,
}: ToggleProps) {
  return (
    <div className="flex items-start gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-7 w-12 shrink-0 rounded-full border transition-colors ${
          checked ? "border-primary bg-primary" : "border-line bg-page"
        }`}
      >
        <span
          aria-hidden="true"
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-surface shadow-sm transition-all ${
            checked ? "start-[24px]" : "start-0.5"
          }`}
        />
      </button>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink">{label}</p>
        {hint && <p className="mt-0.5 text-xs leading-relaxed text-muted">{hint}</p>}
        {children}
      </div>
    </div>
  )
}
