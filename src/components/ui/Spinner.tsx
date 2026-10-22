export type SpinnerProps = {
  size?: number
  className?: string
}

export default function Spinner({ size = 20, className = "" }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label="Loading"
      style={{ width: size, height: size }}
      className={`inline-block animate-spin rounded-full border-2 border-line border-t-primary ${className}`}
    />
  )
}
