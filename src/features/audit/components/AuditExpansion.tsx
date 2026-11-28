import type { ReactNode } from "react"

export type AuditExpansionProps = {
  id: string
  open: boolean
  children: ReactNode
}

export default function AuditExpansion({
  id,
  open,
  children,
}: AuditExpansionProps) {
  return (
    <div
      id={id}
      role="region"
      aria-hidden={!open}
      inert={!open}
      className={`activity-expand ${open ? "activity-expand-open" : ""}`}
    >
      <div className="activity-expand-body">{children}</div>
    </div>
  )
}
