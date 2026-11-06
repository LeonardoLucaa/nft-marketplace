export function NftCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="shimmer aspect-square w-full rounded-lg" />
      <div className="shimmer mt-3 h-4 w-3/4 rounded" />
      <div className="shimmer mt-2 h-4 w-1/3 rounded" />
    </div>
  )
}