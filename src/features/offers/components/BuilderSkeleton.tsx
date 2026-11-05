import Skeleton from "../../../components/ui/Skeleton"

/** Placeholder with the shape of the offer builder: steps and form on the left, preview on the right. */
export default function BuilderSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading"
      className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_26rem]"
    >
      <div className="space-y-4">
        <div className="flex gap-2">
          {[0, 1, 2, 3, 4].map((step) => (
            <Skeleton key={step} className="h-9 flex-1" />
          ))}
        </div>

        <div className="space-y-5 rounded-lg border border-line bg-surface p-5">
          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-64 max-w-full" />
          </div>
          {[0, 1, 2].map((field) => (
            <div key={field} className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>

        <div className="flex justify-between">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-48" />
        </div>
      </div>

      <Skeleton className="hidden aspect-[210/297] w-full lg:block" />
    </div>
  )
}
