import { useState, type ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { FiHeart, FiSearch, FiShoppingCart } from 'react-icons/fi'
import { toast } from 'sonner'
import { useAddToCart } from '@/features/cart/queries'
import { mensagemDeErro } from '@/lib/api'
import type { Nft } from '@/types/api'

const ACTION =
  'grid size-8 place-items-center rounded-sm bg-background/90 text-foreground transition-colors hover:bg-primary hover:text-primary-foreground disabled:pointer-events-none disabled:opacity-50 sm:size-9'

function IconAction({
  label,
  onClick,
  disabled,
  pressed,
  children,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  pressed?: boolean
  children: ReactNode
}) {
  return (
    <button type="button" aria-label={label} aria-pressed={pressed} onClick={onClick} disabled={disabled} className={ACTION}>
      {children}
    </button>
  )
}

export function NftCard({ nft, priority = false }: { nft: Nft; priority?: boolean }) {
  const adicionar = useAddToCart()
  const [favorito, setFavorito] = useState(false)
  const edicao = nft.editions.find((e) => e.available > 0)
  const esgotado = !edicao

  function addCarrinho() {
    if (!edicao) return
    adicionar.mutate(
      { nftId: nft.id, editionId: edicao.id, quantity: 1 },
      {
        onSuccess: () => toast.success(`${nft.name} adicionado ao carrinho`),
        onError: (erro) => toast.error(mensagemDeErro(erro)),
      },
    )
  }

  return (
    <article className="group">
      <div className="relative bg-card p-2 sm:p-4 lg:px-5 lg:py-6">
        <Link to="/nft/$id" params={{ id: nft.id }} tabIndex={-1} className="block">
          <img
            src={nft.image}
            alt={nft.name}
            width={250}
            height={250}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            className="aspect-square w-full rounded-2xl object-cover"
          />
        </Link>

        {nft.rare && (
          <span className="absolute left-0 top-2 bg-primary px-3 py-0.5 text-xs font-medium tracking-wide text-primary-foreground sm:top-4 sm:text-sm">
            RARO
          </span>
        )}
        {esgotado && (
          <span className="absolute right-2 top-2 rounded-sm bg-background/90 px-2 py-0.5 text-xs text-muted-foreground sm:right-4 sm:top-4">
            Esgotado
          </span>
        )}

        <div className="absolute inset-x-0 bottom-3 flex justify-center gap-2 transition-opacity sm:bottom-6 lg:opacity-0 lg:group-focus-within:opacity-100 lg:group-hover:opacity-100">
          <IconAction
            label={esgotado ? `${nft.name} esgotado` : `Adicionar ${nft.name} ao carrinho`}
            onClick={addCarrinho}
            disabled={esgotado || adicionar.isPending}
          >
            <FiShoppingCart className="size-4" aria-hidden="true" />
          </IconAction>
          <IconAction
            label={favorito ? `Remover ${nft.name} dos favoritos` : `Favoritar ${nft.name}`}
            pressed={favorito}
            onClick={() => setFavorito((v) => !v)}
          >
            <FiHeart className={`size-4 ${favorito ? 'fill-primary text-primary' : ''}`} aria-hidden="true" />
          </IconAction>
          <Link to="/nft/$id" params={{ id: nft.id }} aria-label={`Ver detalhes de ${nft.name}`} className={ACTION}>
            <FiSearch className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </div>

      <h3 className="mt-3 truncate text-sm sm:text-base">
        <Link to="/nft/$id" params={{ id: nft.id }} className="transition-colors hover:text-primary">
          {nft.name}
        </Link>
      </h3>
      <p className="mt-0.5 text-sm font-bold text-primary sm:text-base">
        {nft.price} ETH
        {nft.oldPrice && (
          <s className="ml-2 font-normal text-muted-foreground">
            <span className="sr-only">Preço anterior: </span>
            {nft.oldPrice} ETH
          </s>
        )}
      </p>
    </article>
  )
}