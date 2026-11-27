export type BadgeVariant = "draft" | "issued" | "accepted" | "rejected" | "neutral"

const VARIANTS: Record<BadgeVariant, string> = {
  draft: "bg-warning/10 text-warning border-warning/30",
  issued: "bg-primary-soft text-primary border-primary/25",
  accepted: "bg-success/10 text-success border-success/30",
  rejected: "bg-danger/10 text-danger border-danger/30",
  neutral: "bg-surface-soft text-muted border-line-soft",
}

const DOTS: Record<BadgeVariant, string> = {
  draft: "bg-warning",
  issued: "bg-primary",
  accepted: "bg-success",
  rejected: "bg-danger",
  neutral: "bg-muted",
}

export type BadgeProps = {
  variant?: BadgeVariant
  children: string
  className?: string
}

export default function Badge({
  variant = "neutral",
  children,
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${VARIANTS[variant]} ${className}`}
    >
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${DOTS[variant]}`} />
      {children}
    </span>
  )
}
