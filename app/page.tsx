'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  Eye,
  EyeOff,
  Loader2,
  Lock,
  ShieldCheck,
  User,
  FileCheck2,
  GitBranch,
  History,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Logo } from '@/components/brand'
import { useAuth } from '@/lib/auth-store'
import { ApiError } from '@/lib/api'

function loginErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    switch (err.status) {
      case 401:
        return 'Credenciales inválidas. Verifique su correo y contraseña.'
      case 429:
        return err.retryAfter
          ? `Demasiados intentos. Reintente en ${err.retryAfter} segundos.`
          : 'Demasiados intentos. Espere unos minutos e intente de nuevo.'
      case 400:
        return 'Solicitud inválida. Revise los datos ingresados.'
      default:
        return 'No se pudo iniciar sesión. Intente nuevamente.'
    }
  }
  return 'Sin conexión con el servidor. Intente más tarde.'
}

export default function LoginPage() {
  const router = useRouter()
  const { login, status } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Si ya hay sesión (p. ej. F5 estando logueado), no mostrar el login.
  useEffect(() => {
    if (status === 'authenticated') router.replace('/dashboard')
  }, [status, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!email.trim() || !password.trim()) {
      setError('Ingrese su correo institucional y contraseña.')
      return
    }
    setLoading(true)
    try {
      await login(email, password)
      // La navegación la dispara el useEffect cuando status pasa a 'authenticated'.
    } catch (err) {
      setError(loginErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col lg:flex-row">
      {/* Brand / info panel */}
      <section className="relative flex flex-col justify-between bg-sidebar px-8 py-10 text-sidebar-foreground lg:w-[46%] lg:px-14 lg:py-14">
        <Logo variant="light" />

        <div className="hidden max-w-md flex-col gap-6 lg:flex">
          <h1 className="font-serif text-4xl font-bold leading-tight text-primary-foreground text-balance">
            Gestión formal de solicitudes académicas
          </h1>
          <p className="leading-relaxed text-sidebar-foreground/80">
            Trámita centraliza el ciclo de vida de cada solicitud, reemplazando
            el manejo manual por correo, WhatsApp y archivos dispersos. Un
            proceso auditable, validado en el origen y cerrado con un documento
            formal.
          </p>
          <ul className="flex flex-col gap-3.5 pt-2">
            {[
              { icon: GitBranch, text: 'Flujos configurables por tipo de trámite' },
              { icon: History, text: 'Historial y auditoría de cada transición' },
              { icon: FileCheck2, text: 'Cierre con documento PDF formal' },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm">
                <span className="grid size-8 place-items-center rounded-lg bg-sidebar-accent">
                  <Icon className="size-4 text-primary-foreground" />
                </span>
                <span className="text-sidebar-foreground/90">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-sidebar-foreground/60">
          © {new Date().getFullYear()} Universidad Remington · Sede Cali.
          Plataforma interna de coordinación académica.
        </p>
      </section>

      {/* Form panel */}
      <section className="flex flex-1 items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col gap-2">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <ShieldCheck className="size-3.5" />
              Acceso Coordinación
            </span>
            <h2 className="text-2xl font-semibold tracking-tight">
              Iniciar sesión
            </h2>
            <p className="text-sm text-muted-foreground">
              Ingrese con sus credenciales institucionales para acceder a la
              bandeja de trabajo.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Correo institucional</Label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="username"
                  className="pl-9"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nombre@remington.edu.co"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Contraseña</Label>
                <button
                  type="button"
                  className="text-xs font-medium text-primary hover:underline"
                >
                  ¿Olvidó su contraseña?
                </button>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="pl-9 pr-9"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingrese su contraseña"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={
                    showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
                  }
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {error}
              </p>
            )}

            <Button
              type="submit"
              size="lg"
              disabled={loading}
              className="h-11 w-full text-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Verificando…
                </>
              ) : (
                'Ingresar a Trámita'
              )}
            </Button>
          </form>
        </div>
      </section>
    </main>
  )
}
