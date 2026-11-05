export type SkeletonProps = {
  className?: string
}

/** A pulsing placeholder block. Size it with width and height classes. */
export default function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      className={`block animate-pulse rounded bg-line-soft motion-reduce:animate-none ${className}`}
    />
  )
}
