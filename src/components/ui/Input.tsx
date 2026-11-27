import { forwardRef, type InputHTMLAttributes } from "react"

export type InputProps = InputHTMLAttributes<HTMLInputElement>

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", ...rest }, ref) => {
    return (
      <input
        ref={ref}
        className={`h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink transition-colors placeholder:text-muted focus:border-primary sm:h-10 ${className}`}
        {...rest}
      />
    )
  },
)

Input.displayName = "Input"

export default Input
