import { Link } from '@tanstack/react-router'
import type { Nft } from '@/types/api'

export function NftCard({ nft }: { nft: Nft }) {
  return (
    <Link
      to="/nft/$id"
      params={{ id: nft.id }}
      className="block rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary"
    >
      <div className="relative">
        <img
          src={nft.image}
          alt={nft.name}
          className="aspect-square w-full rounded-lg object-cover"
        />
        {nft.rare && (
          <span className="absolute left-2 top-2 rounded bg-primary px-2 py-0.5 text-xs font-bold text-background">
            RARO
          </span>
        )}
      </div>
      <p className="mt-3 truncate text-sm font-bold">{nft.name}</p>
      <p className="text-xs text-muted-foreground">{nft.collection}</p>
      <p className="mt-1 text-primary">
        {nft.price} ETH
        {nft.oldPrice && (
          <span className="ml-2 text-xs text-muted-foreground line-through">
            {nft.oldPrice}
          </span>
        )}
      </p>
    </Link>
  )
}