import { forwardRef, type InputHTMLAttributes } from "react"

export type InputProps = InputHTMLAttributes<HTMLInputElement>

const Input = forwardRef<HTMLInputElement, InputProps>(({ className = "", ...rest }, ref) => {
  return (
    <input
      ref={ref}
      className={`h-10 w-full rounded-md border border-line bg-surface px-3 text-sm text-ink transition-colors placeholder:text-muted/70 focus:border-primary ${className}`}
      {...rest}
    />
  )
})

Input.displayName = "Input"

export default Input
