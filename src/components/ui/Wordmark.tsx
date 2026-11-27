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
      className={`inline-flex items-center gap-2 font-bold tracking-tight text-ink ${SIZES[size]} ${className}`}
    >
      <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full bg-accent" />
      Technocom Portal
    </span>
  )
}
