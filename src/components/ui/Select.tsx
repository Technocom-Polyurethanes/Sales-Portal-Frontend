import type { SelectHTMLAttributes } from "react"

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>

export default function Select({
  className = "",
  children,
  ...rest
}: SelectProps) {
  return (
    <select
      className={`h-11 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink transition-colors focus:border-primary sm:h-10 ${className}`}
      {...rest}
    >
      {children}
    </select>
  )
}
