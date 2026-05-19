import { Skeleton } from "@/components/ui/skeleton"

export function CardSkeleton() {
  return (
<div className="flex h-screen w-full animate-pulse items-start gap-6 p-6">
      {/* Left Sidebar */}
      <div className="w-72 border-r p-4">
        <div className="space-y-6">
          {/* Logo */}
          <Skeleton className="h-10 w-32 rounded-md" />

          {/* Menu Items */}
          <div className="space-y-4 mt-10">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <Skeleton className="h-4 flex-1" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="space-y-6">
          <Skeleton className="h-10 w-1/3 rounded-md" />

          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton
                key={i}
                className="h-40 w-full rounded-xl"
              />
            ))}
          </div>

          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton
                key={i}
                className="h-16 w-full rounded-lg"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}