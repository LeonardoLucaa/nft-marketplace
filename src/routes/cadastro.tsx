import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { useState, type FormEvent } from 'react'
import { useRegister } from '@/features/auth/queries'
import { errosDosCampos, mensagemDeErro } from '@/lib/api'
import { Campo } from '@/components/campo'
import { Button } from '@/components/ui/button'

type Erros = { name?: string; email?: string; password?: string; confirmar?: string }

export const Route = createFileRoute('/cadastro')({
  validateSearch: (s: Record<string, unknown>): { redirect?: string } => ({
    redirect:
      typeof s.redirect === 'string' && s.redirect.startsWith('/') && !s.redirect.startsWith('//')
        ? s.redirect
        : undefined,
  }),
  component: Cadastro,
})

function Cadastro() {
  const { redirect } = Route.useSearch()
  const router = useRouter()
  const cadastro = useRegister()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmar: '' })
  const [erros, setErros] = useState<Erros>({})
  const errosApi = errosDosCampos(cadastro.error)

  const alterar = (campo: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [campo]: e.target.value }))

  function enviar(ev: FormEvent) {
    ev.preventDefault()
    const e: Erros = {}
    if (form.name.trim().length < 2) e.name = 'Informe seu nome.'
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Informe um e-mail válido.'
    if (form.password.length < 8) e.password = 'A senha precisa ter pelo menos 8 caracteres.'
    if (form.confirmar !== form.password) e.confirmar = 'As senhas não conferem.'
    setErros(e)
    if (Object.keys(e).length) return
    cadastro.mutate(
      { name: form.name, email: form.email, password: form.password },
      { onSuccess: () => router.history.push(redirect ?? '/') },
    )
  }

  return (
    <section className="mx-auto max-w-sm space-y-6 py-10">
      <h1 className="text-2xl font-bold">Criar conta</h1>
      <form onSubmit={enviar} noValidate className="space-y-4">
        <Campo id="name" label="Nome" autoComplete="name"
          value={form.name} onChange={alterar('name')} erro={erros.name ?? errosApi.name} />
        <Campo id="email" label="E-mail" type="email" autoComplete="email"
          value={form.email} onChange={alterar('email')} erro={erros.email ?? errosApi.email} />
        <Campo id="password" label="Senha" type="password" autoComplete="new-password"
          value={form.password} onChange={alterar('password')} erro={erros.password ?? errosApi.password} />
        <Campo id="confirmar" label="Confirmar senha" type="password" autoComplete="new-password"
          value={form.confirmar} onChange={alterar('confirmar')} erro={erros.confirmar} />

        {cadastro.isError && Object.keys(errosApi).length === 0 && (
          <p role="alert" className="text-sm text-destructive">{mensagemDeErro(cadastro.error)}</p>
        )}

        <Button type="submit" className="w-full" disabled={cadastro.isPending}>
          {cadastro.isPending ? 'Criando conta...' : 'Criar conta'}
        </Button>
      </form>
      <p className="text-sm text-muted-foreground">
        Já tem conta? <Link to="/login" search={{ redirect }} className="text-primary underline">Entrar</Link>
      </p>
    </section>
  )
}