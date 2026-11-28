import Skeleton from "../../../components/ui/Skeleton"

const CELLS = [
  {
    delay: 0,
    span: "sm:col-span-2 lg:col-span-5 lg:row-span-2",
    feature: true,
  },
  { delay: 40, span: "sm:col-span-2 lg:col-span-7" },
  { delay: 80, span: "lg:col-span-7" },
  { delay: 120, span: "lg:col-span-4" },
  { delay: 160, span: "lg:col-span-4" },
  { delay: 200, span: "lg:col-span-4" },
  { delay: 240, span: "lg:col-span-5" },
  { delay: 280, span: "lg:col-span-7" },
]

export default function SkeletonCards() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12">
      {CELLS.map(({ delay, span, feature }) => {
        const animation = `[animation-delay:${delay}ms]`
        return (
          <div
            key={delay}
            className={`min-w-0 h-full rounded-xl border border-line-soft bg-surface p-4 shadow-bento sm:p-5 ${span} ${
              feature
                ? "!border-primary/25 !bg-primary-soft/25 !shadow-bento-feature"
                : ""
            }`}
          >
            <Skeleton className={`h-5 w-1/2 ${animation}`} />
            <Skeleton className={`mt-5 h-8 w-2/3 ${animation}`} />
            <div className="mt-5 space-y-3">
              <Skeleton className={`h-3 w-full ${animation}`} />
              <Skeleton className={`h-3 w-5/6 ${animation}`} />
              <Skeleton className={`h-3 w-4/6 ${animation}`} />
            </div>
            <span className="sr-only">{delay / 40 + 1}</span>
          </div>
        )
      })}
    </div>
  )
}
