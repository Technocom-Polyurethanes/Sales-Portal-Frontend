import type { ReactNode } from "react"

export type PageHeaderProps = {
  title: string
  subtitle?: ReactNode
  eyebrow?: string
  action?: ReactNode
}

export default function PageHeader({
  title,
  subtitle,
  eyebrow,
  action,
}: PageHeaderProps) {
  return (
    <div className="no-print mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="mb-1 text-xs font-semibold text-muted">{eyebrow}</p>}
        <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {action && <div className="flex flex-wrap items-center gap-2">{action}</div>}
    </div>
  )
}
