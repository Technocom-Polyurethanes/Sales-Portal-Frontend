import Icon from "../../../../components/ui/Icon"

export type BuilderStep = {
  id: string
  label: string
}

export type BuilderStepperProps = {
  steps: BuilderStep[]
  current: number
  onChange: (index: number) => void
}

/** Navigation between the five steps of the builder. */
export default function BuilderStepper({
  steps,
  current,
  onChange,
}: BuilderStepperProps) {
  return (
    <nav aria-label="Builder steps" className="no-print">
      <ol className="flex flex-wrap items-center gap-1.5">
        {steps.map((step, index) => {
          const done = index < current
          const active = index === current

          return (
            <li key={step.id} className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onChange(index)}
                aria-current={active ? "step" : undefined}
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? "border-primary bg-primary text-white"
                    : done
                      ? "border-primary/30 bg-primary-soft text-primary"
                      : "border-line bg-surface text-muted hover:text-ink"
                }`}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${
                    active ? "bg-white/20" : done ? "bg-primary/15" : "bg-page"
                  }`}
                >
                  {done ? <Icon name="check" size={12} /> : index + 1}
                </span>
                {step.label}
              </button>
              {index < steps.length - 1 && (
                <span aria-hidden className="h-px w-3 bg-line" />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
