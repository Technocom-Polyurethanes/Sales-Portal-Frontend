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
      className={`rounded-lg border border-line bg-surface ${className}`}
    >
      {(title || actions) && (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line-soft px-5 py-4">
          <div>
            {title && (
              <h2 className="text-base font-semibold text-ink">{title}</h2>
            )}
            {description && (
              <p className="mt-1 text-sm text-muted">{description}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={`px-5 py-4 ${bodyClassName}`}>{children}</div>
    </section>
  )
}
