import Input from "./Input"

export type StepperProps = {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  ariaLabel?: string
}

/** Number input with − and + buttons. */
export default function Stepper({
  value,
  onChange,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  step = 1,
  disabled = false,
  ariaLabel = "Quantity",
}: StepperProps) {
  const clamp = (next: number) => Math.min(max, Math.max(min, next))

  return (
    <div className="inline-flex items-stretch overflow-hidden rounded-md border border-line bg-surface">
      <button
        type="button"
        onClick={() => onChange(clamp(value - step))}
        disabled={disabled || value <= min}
        aria-label={`Decrease ${ariaLabel}`}
        className="w-9 border-e border-line text-lg leading-none text-muted transition-colors hover:bg-page disabled:cursor-not-allowed disabled:opacity-40"
      >
        −
      </button>
      <Input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        aria-label={ariaLabel}
        onChange={(event) => onChange(clamp(Number(event.target.value) || 0))}
        className="h-10 w-24 rounded-none border-0 text-center"
      />
      <button
        type="button"
        onClick={() => onChange(clamp(value + step))}
        disabled={disabled || value >= max}
        aria-label={`Increase ${ariaLabel}`}
        className="w-9 border-s border-line text-lg leading-none text-muted transition-colors hover:bg-page disabled:cursor-not-allowed disabled:opacity-40"
      >
        +
      </button>
    </div>
  )
}
