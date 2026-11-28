import type { BadgeVariant } from "../../../components/ui/Badge"

export function sparklinePoints(
  samples: number[],
  width = 100,
  height = 24,
): string {
  if (samples.length === 0) return ""
  const values = samples.slice(-20)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const step = values.length > 1 ? width / (values.length - 1) : 0
  return values
    .map(
      (value, index) =>
        `${(index * step).toFixed(1)},${(height - ((value - min) / span) * height).toFixed(1)}`,
    )
    .join(" ")
}

const STROKES: Record<BadgeVariant, string> = {
  accepted: "text-ink",
  draft: "text-warning",
  rejected: "text-danger",
  issued: "text-primary",
  neutral: "text-ink",
}

export default function Sparkline({
  samples,
  tone,
  label,
}: {
  samples: number[]
  tone: BadgeVariant
  label: string
}) {
  const points = sparklinePoints(samples)
  if (!points) return <p className="text-xs text-muted">—</p>

  return (
    <svg
      role="img"
      aria-label={label}
      viewBox="0 0 100 24"
      preserveAspectRatio="none"
      className={`h-6 w-full ${STROKES[tone]}`}
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
