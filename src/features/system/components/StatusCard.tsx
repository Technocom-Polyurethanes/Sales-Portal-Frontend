import type { ReactNode } from "react"

import Badge, { type BadgeVariant } from "../../../components/ui/Badge"
import Card from "../../../components/ui/Card"

export default function StatusCard({
  title,
  status,
  tone = "neutral",
  headline,
  children,
}: {
  title: string
  status?: string
  tone?: BadgeVariant
  headline: ReactNode
  children?: ReactNode
}) {
  return (
    <Card
      title={title}
      actions={
        status ? (
          <Badge variant={tone}>{status}</Badge>
        ) : (
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 rounded-full bg-muted"
          />
        )
      }
    >
      <p className="min-w-0 break-words text-2xl font-semibold tabular-nums text-ink">
        {headline}
      </p>
      {children && <div className="mt-4">{children}</div>}
    </Card>
  )
}
