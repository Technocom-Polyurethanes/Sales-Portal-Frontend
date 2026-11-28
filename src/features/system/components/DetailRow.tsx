import type { ReactNode } from "react"

export default function DetailRow({
  label,
  value,
  mono = false,
}: {
  label: string
  value?: ReactNode
  mono?: boolean
}) {
  return (
    <div className="flex min-w-0 items-baseline justify-between gap-3 text-sm">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd
        className={`min-w-0 break-words text-end text-ink ${
          mono ? "font-mono text-xs" : ""
        }`}
        dir={mono ? "ltr" : undefined}
      >
        {value ?? "—"}
      </dd>
    </div>
  )
}
