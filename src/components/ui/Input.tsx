import type { InputHTMLAttributes } from "react"

export type InputProps = InputHTMLAttributes<HTMLInputElement>

export default function Input({ className = "", ...rest }: InputProps) {
  return (
    <input
      className={`h-10 w-full rounded-md border border-line bg-surface px-3 text-sm text-ink transition-colors placeholder:text-muted/70 focus:border-primary ${className}`}
      {...rest}
    />
  )
}
