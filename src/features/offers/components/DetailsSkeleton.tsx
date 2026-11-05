import Skeleton from "../../../components/ui/Skeleton"

/** Placeholder with the shape of the offer details page: summary on the left, document on the right. */
export default function DetailsSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading"
      className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_26rem]"
    >
      <div className="space-y-4">
        <div className="space-y-4 rounded-lg border border-line bg-surface p-5">
          <Skeleton className="h-4 w-32" />
          {[0, 1, 2, 3, 4].map((row) => (
            <div key={row} className="flex items-center justify-between gap-6">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-3 w-40" />
            </div>
          ))}
        </div>

        <div className="space-y-3 rounded-lg border border-line bg-surface p-5">
          <Skeleton className="h-4 w-36" />
          {[0, 1, 2].map((row) => (
            <Skeleton key={row} className="h-10 w-full" />
          ))}
        </div>
      </div>

      <Skeleton className="hidden aspect-[210/297] w-full lg:block" />
    </div>
  )
}
