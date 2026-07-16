'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { CheckCircle2, Eye, EyeOff, Loader2, Lock, ShieldCheck } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth-store'
import { ApiError } from '@/lib/api'
import { apiErrorMessages } from '@/lib/api-errors'
import { validateNewPassword } from '@/lib/password-policy'

export default function ChangePasswordPage() {
  const router = useRouter()
  const { changePassword } = useAuth()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [done, setDone] = useState(false)

  const check = validateNewPassword({ current, next, confirm })
  const showPolicy = next.length > 0 || confirm.length > 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors([])
    setDone(false)
    if (!current) {
      setErrors(['Ingrese su contraseña actual.'])
      return
    }
    if (!check.valid) {
      setErrors(check.errors)
      return
    }
    setLoading(true)
    try {
      await changePassword(current, next)
      setDone(true)
      setCurrent('')
      setNext('')
      setConfirm('')
    } catch (err) {
      setErrors(
        apiErrorMessages(err, {
          unauthorized: 'Tu sesión expiró. Iniciá sesión de nuevo.',
          fallback: 'No se pudo cambiar la contraseña.',
        }),
      )
      if (err instanceof ApiError && err.status === 401) {
        router.replace('/')
      }
    } finally {
      setLoading(false)
    }
  }

  const inputType = show ? 'text' : 'password'

  return (
    <AppShell title="Cambiar contraseña">
      <div className="mx-auto max-w-lg">
        <Card>
          <CardHeader>
            <span className="mb-1 inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <ShieldCheck className="size-3.5" />
              Seguridad de la cuenta
            </span>
            <CardTitle>Cambiar contraseña</CardTitle>
            <CardDescription>
              La contraseña debe tener al menos 15 caracteres y no superar 72 bytes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  {show ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  {show ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="current">Contraseña actual</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="current"
                    type={inputType}
                    autoComplete="current-password"
                    className="pl-9"
                    value={current}
                    onChange={(e) => setCurrent(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="next">Nueva contraseña</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="next"
                    type={inputType}
                    autoComplete="new-password"
                    className="pl-9"
                    value={next}
                    onChange={(e) => setNext(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="confirm">Confirmar nueva contraseña</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="confirm"
                    type={inputType}
                    autoComplete="new-password"
                    className="pl-9"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                  />
                </div>
              </div>

              {showPolicy && !check.valid && (
                <ul className="flex flex-col gap-1 rounded-lg bg-muted px-3 py-2.5 text-xs text-muted-foreground">
                  {check.errors.map((msg) => (
                    <li key={msg} className="flex items-center gap-2">
                      <span className="size-1 shrink-0 rounded-full bg-muted-foreground" />
                      {msg}
                    </li>
                  ))}
                </ul>
              )}

              {errors.length > 0 && (
                <div
                  role="alert"
                  className="flex flex-col gap-1 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                >
                  {errors.map((msg) => (
                    <span key={msg}>{msg}</span>
                  ))}
                </div>
              )}

              {done && (
                <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">
                  <CheckCircle2 className="size-4" />
                  Contraseña actualizada correctamente.
                </div>
              )}

              <Button
                type="submit"
                size="lg"
                disabled={loading || !current || !check.valid}
                className="h-11 w-full text-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Guardando…
                  </>
                ) : (
                  'Cambiar contraseña'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
