import type { SelectHTMLAttributes } from "react"

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>

export default function Select({
  className = "",
  children,
  ...rest
}: SelectProps) {
  return (
    <select
      className={`h-10 w-full rounded-md border border-line bg-surface px-3 text-sm text-ink transition-colors focus:border-primary ${className}`}
      {...rest}
    >
      {children}
    </select>
  )
}
