import Skeleton from "../../../components/ui/Skeleton"

export default function AuditSkeleton() {
  return (
    <div
      className="rounded-xl border border-line-soft bg-surface p-4"
      aria-busy="true"
    >
      <div className="space-y-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div
            key={index}
            className="flex animate-pulse items-center gap-4 [&>span]:animate-none"
            style={{ animationDelay: `${index * 40}ms` }}
          >
            <Skeleton className="h-4 w-20" />
            <Skeleton className="size-8 rounded-full" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="hidden h-4 flex-1 sm:block" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  )
}
