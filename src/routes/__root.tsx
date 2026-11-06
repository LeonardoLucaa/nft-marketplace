import { createRootRouteWithContext, Link, Outlet, useNavigate } from '@tanstack/react-router'
import { useQueryClient, type QueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useLogout, useSession } from '@/features/auth/queries'
import { useCart } from '@/features/cart/queries'
import { Button } from '@/components/ui/button'
import { useRealtime } from '@/features/realtime/useRealtime'
import { socket } from '@/lib/socket'

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: Layout,
  notFoundComponent: NaoEncontrado,
})

function Layout() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { data: session } = useSession()
  const { data: cart } = useCart()
  const logout = useLogout()
  useRealtime()

  // Sessão expirou durante a navegação: limpa dados privados e volta ao login
  useEffect(() => {
    function aoExpirar() {
      socket.disconnect()
      qc.clear()
      qc.setQueryData(['session'], null)
      const atual = window.location.pathname + window.location.search
      navigate({ to: '/login', search: { redirect: atual, expired: true } })
    }
    window.addEventListener('session:expired', aoExpirar)
    return () => window.removeEventListener('session:expired', aoExpirar)
  }, [qc, navigate])

  return (
    <>
      <header className="flex items-center justify-between gap-4 border-b border-border px-4 py-3">
        <Link to="/" search={{ sort: 'recent', page: 1 }} className="text-lg font-bold text-primary">
          KURIO
        </Link>
        <nav aria-label="Principal" className="flex items-center gap-4 text-sm">
          <Link to="/carrinho" className="hover:text-primary">
            Carrinho{cart && cart.count > 0 ? ` (${cart.count})` : ''}
          </Link>
          {session ? (
            <>
              <span className="text-muted-foreground">Olá, {session.user.name.split(' ')[0]}</span>
              <Button variant="outline" size="sm" onClick={() => logout.mutate()} disabled={logout.isPending}>
                Sair
              </Button>
            </>
          ) : (
            <Link to="/login" className="hover:text-primary">Entrar</Link>
          )}
        </nav>
      </header>
      <main className="p-4">
        <Outlet />
      </main>
    </>
  )
}

function NaoEncontrado() {
  return (
    <section className="mx-auto max-w-md space-y-4 py-16 text-center">
      <h1 className="text-xl font-semibold">Página não encontrada</h1>
      <Button asChild>
        <Link to="/" search={{ sort: 'recent', page: 1 }}>Voltar ao início</Link>
      </Button>
    </section>
  )
}