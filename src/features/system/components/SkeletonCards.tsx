import Skeleton from "../../../components/ui/Skeleton"

const DELAYS = [
  "[animation-delay:0ms]",
  "[animation-delay:40ms]",
  "[animation-delay:80ms]",
  "[animation-delay:120ms]",
  "[animation-delay:160ms]",
  "[animation-delay:200ms]",
  "[animation-delay:240ms]",
  "[animation-delay:280ms]",
]

export default function SkeletonCards() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {DELAYS.map((delay, index) => (
        <div
          key={delay}
          className="rounded-xl border border-line-soft bg-surface p-4 sm:p-5"
        >
          <Skeleton className={`h-5 w-1/2 ${delay}`} />
          <Skeleton className={`mt-5 h-8 w-2/3 ${delay}`} />
          <div className="mt-5 space-y-3">
            <Skeleton className={`h-3 w-full ${delay}`} />
            <Skeleton className={`h-3 w-5/6 ${delay}`} />
            <Skeleton className={`h-3 w-4/6 ${delay}`} />
          </div>
          <span className="sr-only">{index + 1}</span>
        </div>
      ))}
    </div>
  )
}
