import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { useState, type FormEvent } from 'react'
import { useLogin } from '@/features/auth/queries'
import { mensagemDeErro } from '@/lib/api'
import { Campo } from '@/components/campo'
import { Button } from '@/components/ui/button'

type BuscaLogin = { redirect?: string; expired?: boolean }

export const Route = createFileRoute('/login')({
  validateSearch: (s: Record<string, unknown>): BuscaLogin => ({
    // só aceita caminhos internos (evita open redirect)
    redirect:
      typeof s.redirect === 'string' && s.redirect.startsWith('/') && !s.redirect.startsWith('//')
        ? s.redirect
        : undefined,
    expired: s.expired === true || s.expired === 'true' ? true : undefined,
  }),
  component: Login,
})

function Login() {
  const { redirect, expired } = Route.useSearch()
  const router = useRouter()
  const login = useLogin()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erros, setErros] = useState<{ email?: string; senha?: string }>({})

  function enviar(ev: FormEvent) {
    ev.preventDefault()
    const e: typeof erros = {}
    if (!/^\S+@\S+\.\S+$/.test(email)) e.email = 'Informe um e-mail válido.'
    if (!senha) e.senha = 'Informe a senha.'
    setErros(e)
    if (Object.keys(e).length) return
    login.mutate({ email, password: senha }, { onSuccess: () => router.history.push(redirect ?? '/') })
  }

  return (
    <section className="mx-auto max-w-sm space-y-6 py-10">
      <h1 className="text-2xl font-bold">Entrar</h1>

      {expired && (
        <p role="status" className="rounded-md border border-primary p-3 text-sm">
          Sua sessão expirou. Entre novamente para continuar de onde parou.
        </p>
      )}

      <form onSubmit={enviar} noValidate className="space-y-4">
        <Campo id="email" label="E-mail" type="email" autoComplete="email"
          value={email} onChange={(e) => setEmail(e.target.value)} erro={erros.email} />
        <Campo id="senha" label="Senha" type="password" autoComplete="current-password"
          value={senha} onChange={(e) => setSenha(e.target.value)} erro={erros.senha} />

        {login.isError && (
          <p role="alert" className="text-sm text-destructive">{mensagemDeErro(login.error)}</p>
        )}

        <Button type="submit" className="w-full" disabled={login.isPending}>
          {login.isPending ? 'Entrando...' : 'Entrar'}
        </Button>
      </form>

      <p className="text-sm text-muted-foreground">
        Não tem conta?{' '}
        <Link to="/cadastro" search={{ redirect }} className="text-primary underline">Cadastre-se</Link>
      </p>
    </section>
  )
}