import type { ReactNode } from "react"

import Icon from "./Icon"

export type EmptyStateProps = {
  title: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
}

export default function EmptyState({
  title,
  description,
  icon,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <span className="text-muted">
        {icon ?? <Icon name="offers" size={30} />}
      </span>
      <div>
        <p className="text-sm font-semibold text-ink">{title}</p>
        {description && (
          <p className="mt-1 text-sm text-muted">{description}</p>
        )}
      </div>
      {action}
    </div>
  )
}
