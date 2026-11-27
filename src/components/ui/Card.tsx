import type { ReactNode } from "react"

export type CardProps = {
  title?: string
  description?: string
  actions?: ReactNode
  className?: string
  bodyClassName?: string
  children?: ReactNode
}

export default function Card({
  title,
  description,
  actions,
  className = "",
  bodyClassName = "",
  children,
}: CardProps) {
  return (
    <section
      className={`rounded-xl border border-line-soft bg-surface ${className}`}
    >
      {(title || actions) && (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line-soft px-4 py-4 sm:px-5">
          <div className="min-w-0">
            {title && (
              <h2 className="text-base font-semibold text-ink">{title}</h2>
            )}
            {description && (
              <p className="mt-1 text-sm text-muted">{description}</p>
            )}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={`px-4 py-4 sm:px-5 ${bodyClassName}`}>{children}</div>
    </section>
  )
}
