import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { FiLogIn, FiLogOut, FiMenu, FiSearch, FiShoppingCart, FiX } from 'react-icons/fi'
import { useLogout, useSession } from '@/features/auth/queries'
import { useCart } from '@/features/cart/queries'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

const CONTAINER = 'mx-auto w-full max-w-[1200px] px-4 sm:px-6 xl:px-0'

type NavKey = 'inicio' | 'mercado' | 'criadores' | 'aprenda'

const NAV: { key: NavKey; label: string; hash?: string }[] = [
  { key: 'inicio', label: 'Início' },
  { key: 'mercado', label: 'Mercado', hash: 'catalogo' },
  { key: 'criadores', label: 'Criadores', hash: 'destaques' },
  { key: 'aprenda', label: 'Aprenda', hash: 'diario' },
]

function useActiveNav(): NavKey | null {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  if (pathname === '/') return 'inicio'
  if (/^\/(nft|carrinho|checkout|pedido)/.test(pathname)) return 'mercado'
  return null
}

export function SiteHeader() {
  const ativo = useActiveNav()
  const navigate = useNavigate()
  const { data: session } = useSession()
  const { data: cart } = useCart()
  const logout = useLogout()

  const [buscaAberta, setBuscaAberta] = useState(false)
  const [termo, setTermo] = useState('')
  const [menuAberto, setMenuAberto] = useState(false)

  const count = cart?.count ?? 0
  const primeiroNome = session?.user.name.split(' ')[0]

  function buscar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const q = termo.trim()
    void navigate({ to: '/', search: { q: q || undefined, sort: 'recent', page: 1 }, hash: 'catalogo' })
    setBuscaAberta(false)
  }

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className={CONTAINER}>
        <div className="flex h-[68px] items-center justify-between gap-4 border-b border-primary/40">
          <Link to="/" className="text-sm font-bold tracking-[0.2em]" aria-label="Kurio, página inicial">
            KURIO
          </Link>

          <nav aria-label="Principal" className="hidden h-full md:flex md:items-stretch md:gap-10">
            {NAV.map((item) => {
              const atual = ativo === item.key
              return (
                <Link
                  key={item.key}
                  to="/"
                  hash={item.hash}
                  aria-current={atual ? 'page' : undefined}
                  className={`relative flex items-center text-base transition-colors hover:text-primary ${
                    atual
                      ? 'font-medium text-primary after:absolute after:inset-x-0 after:-bottom-px after:h-[3px] after:bg-primary'
                      : 'text-foreground'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center gap-1 sm:gap-3">
            <button
              type="button"
              aria-label={buscaAberta ? 'Fechar busca' : 'Buscar NFTs'}
              aria-expanded={buscaAberta}
              aria-controls="busca-global"
              onClick={() => setBuscaAberta((v) => !v)}
              className="grid size-10 place-items-center rounded-md transition-colors hover:text-primary"
            >
              {buscaAberta ? <FiX className="size-5" aria-hidden="true" /> : <FiSearch className="size-5" aria-hidden="true" />}
            </button>

            <Link
              to="/carrinho"
              aria-label={`Carrinho, ${count} ${count === 1 ? 'item' : 'itens'}`}
              className="relative grid size-10 place-items-center rounded-md transition-colors hover:text-primary"
            >
              <FiShoppingCart className="size-5" aria-hidden="true" />
              {count > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute right-0.5 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground"
                >
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </Link>

            {session ? (
              <div className="hidden items-center gap-3 sm:flex">
                <span className="text-sm text-muted-foreground">Olá, {primeiroNome}</span>
                <button
                  type="button"
                  onClick={() => logout.mutate()}
                  disabled={logout.isPending}
                  className="inline-flex items-center gap-2 rounded-md border border-primary px-3 py-1.5 text-sm text-primary transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-50"
                >
                  <FiLogOut className="size-4" aria-hidden="true" />
                  Sair
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="hidden items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-base font-medium text-primary-foreground transition-colors hover:bg-primary/90 sm:inline-flex"
              >
                <FiLogIn className="size-5" aria-hidden="true" />
                Entrar
              </Link>
            )}

            <Sheet open={menuAberto} onOpenChange={setMenuAberto}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  aria-label="Abrir menu"
                  className="grid size-10 place-items-center rounded-md transition-colors hover:text-primary md:hidden"
                >
                  <FiMenu className="size-5" aria-hidden="true" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" aria-describedby={undefined} className="w-72 border-border bg-card p-6">
                <SheetTitle className="text-sm font-bold tracking-[0.2em]">KURIO</SheetTitle>
                <nav aria-label="Menu" className="mt-4 flex flex-col gap-1">
                  {NAV.map((item) => {
                    const atual = ativo === item.key
                    return (
                      <Link
                        key={item.key}
                        to="/"
                        hash={item.hash}
                        aria-current={atual ? 'page' : undefined}
                        onClick={() => setMenuAberto(false)}
                        className={`rounded-md px-3 py-3 text-base transition-colors hover:bg-secondary ${
                          atual ? 'bg-secondary font-medium text-primary' : ''
                        }`}
                      >
                        {item.label}
                      </Link>
                    )
                  })}
                </nav>
                <div className="mt-4 border-t border-border pt-6">
                  {session ? (
                    <button
                      type="button"
                      onClick={() => {
                        logout.mutate()
                        setMenuAberto(false)
                      }}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-primary px-3 py-2 text-primary"
                    >
                      <FiLogOut className="size-4" aria-hidden="true" />
                      Sair ({primeiroNome})
                    </button>
                  ) : (
                    <Link
                      to="/login"
                      onClick={() => setMenuAberto(false)}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 font-medium text-primary-foreground"
                    >
                      <FiLogIn className="size-5" aria-hidden="true" />
                      Entrar
                    </Link>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {buscaAberta && (
          <form id="busca-global" role="search" onSubmit={buscar} className="flex gap-2 py-3">
            <label htmlFor="busca-global-input" className="sr-only">
              Buscar NFTs por nome
            </label>
            <input
              id="busca-global-input"
              type="search"
              autoFocus
              value={termo}
              onChange={(e) => setTermo(e.target.value)}
              onKeyDown={(e) => e.key === 'Escape' && setBuscaAberta(false)}
              placeholder="Buscar NFTs por nome..."
              className="h-10 min-w-0 flex-1 rounded-md border border-primary/40 bg-card px-3 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
            <button
              type="submit"
              className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Buscar
            </button>
          </form>
        )}
      </div>
    </header>
  )
}