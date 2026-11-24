import type { ButtonHTMLAttributes, ReactNode } from "react"

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger"
export type ButtonSize = "sm" | "md"

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  icon?: ReactNode
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-primary text-white hover:bg-primary-hover border border-primary",
  secondary: "bg-surface text-ink border border-line hover:bg-page",
  ghost:
    "bg-transparent text-primary border border-transparent hover:bg-primary-soft",
  danger: "bg-danger text-white border border-danger hover:opacity-90",
}

const SIZES: Record<ButtonSize, string> = {
  sm: "h-8 px-0",
  md: "h-10 px-4 text-sm",
}

export default function Button({
  variant = "secondary",
  size = "md",
  loading = false,
  icon,
  children,
  className = "",
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      aria-busy={loading}
      className={`inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <span
          aria-hidden="true"
          className="h-4 w-4 shrink-0 rounded-full border-2 border-current border-t-transparent motion-safe:animate-spin"
        />
      ) : (
        icon
      )}
      {children}
    </button>
  )
}
