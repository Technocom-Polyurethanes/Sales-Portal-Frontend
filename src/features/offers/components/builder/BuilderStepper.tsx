import Icon from "../../../../components/ui/Icon"

export type BuilderStep = {
  id: string
  label: string
}

export type BuilderStepperProps = {
  steps: BuilderStep[]
  current: number
  /** The furthest step the user may open. Steps after it are locked. */
  furthest: number
  /** Which steps have everything they need. */
  complete: boolean[]
  onChange: (index: number) => void
  label: string
  lockedHint: string
}

/**
 * Progress through the builder. Every step can be revisited, but the user cannot
 * jump past a step that still misses required information.
 */
export default function BuilderStepper({
  steps,
  current,
  furthest,
  complete,
  onChange,
  label,
  lockedHint,
}: BuilderStepperProps) {
  return (
    <nav aria-label={label} className="no-print">
      <ol className="flex items-start">
        {steps.map((step, index) => {
          const active = index === current
          const done = !active && Boolean(complete[index]) && index < current
          const locked = index > furthest
          const reached = index <= current

          return (
            <li
              key={step.id}
              className="relative flex min-w-0 flex-1 justify-center"
            >
              {index > 0 && (
                <span
                  aria-hidden
                  className={`absolute top-[21px] h-0.5 ${
                    reached ? "bg-primary" : "bg-line"
                  } start-[-50%] end-[50%]`}
                />
              )}

              <button
                type="button"
                // aria-disabled keeps the step focusable, so the reason can be read.
                aria-disabled={locked || undefined}
                aria-current={active ? "step" : undefined}
                title={locked ? lockedHint : undefined}
                onClick={() => {
                  if (!locked) onChange(index)
                }}
                className={`relative flex min-h-12 w-full min-w-0 flex-col items-center gap-1.5 rounded-md px-1 py-2 text-center ${
                  locked ? "cursor-not-allowed" : "hover:bg-primary-soft/60"
                }`}
              >
                <span
                  className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-semibold ${
                    active
                      ? "border-primary bg-primary text-white"
                      : done
                        ? "border-primary bg-primary-soft text-primary"
                        : locked
                          ? "border-line bg-page text-muted"
                          : "border-primary/40 bg-surface text-primary"
                  }`}
                >
                  {done ? <Icon name="check" size={14} /> : index + 1}
                </span>
                <span
                  // On a phone only the current step keeps its visible label; the
                  // others stay readable by screen readers.
                  className={`text-xs leading-tight ${
                    active ? "" : "sr-only sm:not-sr-only"
                  } ${
                    active
                      ? "font-semibold text-ink"
                      : locked
                        ? "text-muted"
                        : "font-medium text-ink/80"
                  }`}
                >
                  {step.label}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
