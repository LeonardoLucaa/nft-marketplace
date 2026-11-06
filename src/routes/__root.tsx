import { createRootRouteWithContext, Link, Outlet, useNavigate, useRouterState } from '@tanstack/react-router'
import { useQueryClient, type QueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { useRealtime } from '@/features/realtime/useRealtime'
import { socket } from '@/lib/socket'

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: Layout,
  notFoundComponent: NaoEncontrado,
})

function Layout() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const isHome = useRouterState({ select: (s) => s.location.pathname === '/' })
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
    <div className="flex min-h-dvh flex-col">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Pular para o conteúdo
      </a>
      <SiteHeader />
      <main id="conteudo" className={isHome ? 'flex-1' : 'flex-1 px-4 py-6'}>
        <Outlet />
      </main>
      <SiteFooter />
      <Toaster position="bottom-right" theme="dark" />
    </div>
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