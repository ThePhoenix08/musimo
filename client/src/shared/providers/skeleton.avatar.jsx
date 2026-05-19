import { Skeleton } from "@/components/ui/skeleton"

export function SkeletonAvatar() {
  return (
    <div className="flex items-center gap-4">
      <Skeleton className="size-10 shrink-0 rounded-full" />
      <div className="flex flex-col justify-center gap-2">
        <Skeleton className="h-4 w-[150px]" />
        <Skeleton className="h-4 w-[100px]" />
      </div>
    </div>
  )
}