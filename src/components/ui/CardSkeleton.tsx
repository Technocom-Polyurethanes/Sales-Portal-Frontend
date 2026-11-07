import Skeleton from "./Skeleton"

export type CardGridSkeletonProps = {
  count?: number
}

/** Loading placeholder shaped like the card grid, so nothing jumps when the data arrives. */
export default function CardGridSkeleton({ count = 6 }: CardGridSkeletonProps) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading"
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
    >
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-4"
        >
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="mt-2 flex items-center justify-between border-t border-line-soft pt-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      ))}
    </div>
  )
}
