import { cloneElement, isValidElement, type ReactElement, type ReactNode } from "react"

export type FieldProps = {
  label: string
  hint?: string
  error?: string
  required?: boolean
  htmlFor?: string
  children: ReactNode
}

type ControlProps = {
  "aria-describedby"?: string
  "aria-invalid"?: boolean
  "aria-required"?: boolean
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
  const hintId = htmlFor ? `${htmlFor}-hint` : undefined
  const errorId = htmlFor ? `${htmlFor}-error` : undefined
  const describedBy =
    [error ? errorId : hint ? hintId : undefined].filter(Boolean).join(" ") ||
    undefined

  // Link the hint, the error and the required state to the control itself, so a
  // screen reader announces them together with the label.
  const control =
    htmlFor && isValidElement<ControlProps>(children)
      ? cloneElement(children as ReactElement<ControlProps>, {
          "aria-describedby":
            describedBy ?? (children.props["aria-describedby"] || undefined),
          // aria-invalid is not valid on a plain button (the customer picker).
          "aria-invalid":
            error && children.type !== "button" ? true : undefined,
          "aria-required":
            required && children.type !== "button" ? true : undefined,
        })
      : children

  return (
    <div className="flex flex-col gap-1.5">
      <label
        className="flex items-center gap-1 text-[13px] font-medium text-ink"
        htmlFor={htmlFor}
      >
        {label}
        {required && (
          <span aria-hidden="true" className="text-danger">
            *
          </span>
        )}
      </label>
      {control}
      {hint && !error && (
        <p id={hintId} className="text-xs leading-relaxed text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs font-medium leading-relaxed text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
