export type WordmarkProps = {
  size?: "sm" | "md" | "lg"
  className?: string
}

const SIZES = {
  sm: "text-base",
  md: "text-xl",
  lg: "text-3xl",
}

/** TECHNOCOM wordmark with the brand dot. */
export default function Wordmark({
  size = "md",
  className = "",
}: WordmarkProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 font-bold tracking-tight text-ink ${SIZES[size]} ${className}`}
    >
      TECHNOCOM
      <span className="inline-block h-2 w-2 rounded-full bg-primary" />
    </span>
  )
}
