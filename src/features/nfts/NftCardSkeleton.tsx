import { Skeleton } from '@/components/ui/skeleton'

export function NftCardSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="bg-card p-2 sm:p-4 lg:px-5 lg:py-6">
        <Skeleton className="aspect-square w-full rounded-2xl" style={{ background: 'var(--secondary)' }} />
      </div>
      <Skeleton className="mt-3 h-4 w-3/4" />
      <Skeleton className="mt-2 h-4 w-1/3" />
    </div>
  )
}