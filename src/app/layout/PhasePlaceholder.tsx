import type { ReactNode } from "react"

import Card from "../../components/ui/Card"
import Icon from "../../components/ui/Icon"

export type PhasePlaceholderProps = {
  title: string
  description: string
  phase: string
  icon?: ReactNode
}

/**
 * Marks a screen that is scheduled for a later phase of the build so the
 * navigation stays complete and reviewable.
 */
export default function PhasePlaceholder({
  title,
  description,
  phase,
  icon,
}: PhasePlaceholderProps) {
  return (
    <Card>
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <span className="text-primary">
          {icon ?? <Icon name="clock" size={30} />}
        </span>
        <div>
          <p className="text-sm font-semibold text-ink">{title}</p>
          <p className="mt-1 max-w-md text-sm text-muted">{description}</p>
        </div>
        <span className="rounded-full border border-line bg-page px-3 py-1 text-xs font-medium text-muted">
          {phase}
        </span>
      </div>
    </Card>
  )
}
