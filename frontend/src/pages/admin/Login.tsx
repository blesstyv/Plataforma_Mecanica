import { zodResolver } from '@hookform/resolvers/zod'
import { Lock } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { LogoMark } from '@/components/Logo'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Field'
import { useAuth } from '@/hooks/useAuth'
import { errorMessage } from '@/lib/utils'

const schema = z.object({ username: z.string().min(1, 'Ingresa tu usuario'), password: z.string().min(1, 'Ingresa tu contraseña') })
type Form = z.infer<typeof schema>

export default function Login() {
  const { user, login } = useAuth()
  const nav = useNavigate()
  const from = (useLocation().state as { from?: string } | null)?.from ?? '/admin'
  const [error, setError] = useState('')
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({ resolver: zodResolver(schema) })
  if (user) return <Navigate to="/admin" replace />
  return (
    <div className="grid min-h-dvh place-items-center bg-gradient-to-br from-[var(--hero-from)] to-[var(--hero-to)] px-4">
      <div className="blueprint pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative w-full max-w-sm rounded-2xl border border-line bg-surface p-7 shadow-2xl">
        <div className="mb-6 flex flex-col items-center text-center">
          <LogoMark size={52} />
          <h1 className="mt-4 text-2xl font-bold">Acceso del profesor</h1>
          <p className="mt-1 text-sm text-muted">Administra asignaturas y materiales.</p>
        </div>
        <form noValidate className="space-y-4" onSubmit={handleSubmit(async (v) => {
          setError('')
          try { await login(v.username, v.password); nav(from, { replace: true }) } catch (e) { setError(errorMessage(e)) }
        })}>
          {error && <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}
          <Field label="Usuario" error={errors.username?.message}>{(p) => <Input {...p} autoComplete="username" autoFocus {...register('username')} />}</Field>
          <Field label="Contraseña" error={errors.password?.message}>{(p) => <Input {...p} type="password" autoComplete="current-password" {...register('password')} />}</Field>
          <Button type="submit" className="w-full" loading={isSubmitting}><Lock className="size-4" aria-hidden />Ingresar</Button>
        </form>
        <Link to="/" className="mt-5 block text-center text-sm text-muted hover:text-ink">← Volver al portal</Link>
      </div>
    </div>
  )
}
