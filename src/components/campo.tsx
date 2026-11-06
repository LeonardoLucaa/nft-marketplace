import type { ComponentProps } from 'react'
import { Input } from '@/components/ui/input'

type Props = ComponentProps<'input'> & { id: string; label: string; erro?: string }

export function Campo({ id, label, erro, ...props }: Props) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-sm font-medium">{label}</label>
      <Input
        id={id}
        aria-invalid={erro ? true : undefined}
        aria-describedby={erro ? `${id}-erro` : undefined}
        {...props}
      />
      {erro && <p id={`${id}-erro`} className="text-sm text-destructive">{erro}</p>}
    </div>
  )
}