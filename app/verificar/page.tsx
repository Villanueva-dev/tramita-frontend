'use client'

// Página pública (fuera de `AppShell`, cuya barrera de login vive en `components/app-shell.tsx`):
// quien tiene el papel —la Coordinación, o la decanatura, que no tiene cuenta— consulta el código
// de verificación del pie del documento sin iniciar sesión. Contrato: openapi.yaml del backend,
// feature 006.

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { Logo } from '@/components/brand'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getPublicSeal } from '@/lib/api'
import { apiErrorMessages } from '@/lib/api-errors'
import { parseServerDateTime } from '@/lib/format'
import type { PublicSeal } from '@/lib/types'

// Hasta 13 caracteres en base 36 y en mayúsculas (backend: `VerificationCodeGenerator`); 0/O y
// 1/I son ambos válidos, así que nunca se autocorrigen.
const CODE_PATTERN = /^[0-9A-Z]{1,13}$/
const FIELD_ERROR_MESSAGE =
  'Escriba solo letras y números, hasta 13, tal como aparecen después de "Verificación:" en el pie del documento.'

type Outcome =
  | { kind: 'found'; seal: PublicSeal }
  | { kind: 'not-found' }
  | { kind: 'error'; messages: string[] }

function normalizeCode(raw: string): string {
  return raw.replace(/\s/g, '').toUpperCase()
}

/**
 * Misma zona y formato que el pie impreso por el backend (`DoFr100Renderer.java:108,445`):
 * `formatDate`/`formatDateTime` de `lib/format.ts` no fijan `timeZone` y mostrarían el día del
 * navegador, no el de la sede — un sello emitido después de las 19:00 en Bogotá aparecería con
 * el día siguiente fuera de esa zona.
 */
function formatIssuedAt(issuedAt: string): string {
  return new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(parseServerDateTime(issuedAt))
}

export default function VerifySealPage() {
  const [value, setValue] = useState('')
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const [loading, setLoading] = useState(false)

  function handleChange(next: string) {
    setValue(next)
    // Un resultado o error del código anterior junto a uno editado induciría a error.
    setFieldError(null)
    setOutcome(null)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const code = normalizeCode(value)
    if (!CODE_PATTERN.test(code)) {
      setFieldError(FIELD_ERROR_MESSAGE)
      setOutcome(null)
      return
    }

    setFieldError(null)
    setLoading(true)
    try {
      const seal = await getPublicSeal(code)
      setOutcome(seal ? { kind: 'found', seal } : { kind: 'not-found' })
    } catch (error) {
      setOutcome({ kind: 'error', messages: apiErrorMessages(error) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-[1.0625rem] sm:px-6 lg:py-12">
      <div className="mx-auto flex max-w-xl flex-col gap-6">
        <header className="flex items-center gap-4">
          <Logo />
        </header>

        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight">Verificar documento</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Escriba el código que aparece después de &quot;Verificación:&quot; en el pie del documento.
          </p>
        </div>

        <form className="flex flex-col gap-4" noValidate onSubmit={handleSubmit}>
          <div className="flex flex-col gap-2">
            <Label htmlFor="verification-code">Código de verificación</Label>
            <Input
              id="verification-code"
              type="text"
              value={value}
              onChange={(event) => handleChange(event.target.value)}
              // Sin esto, la respuesta de la consulta en curso llegaría junto a un código ya editado.
              readOnly={loading}
              autoComplete="off"
              spellCheck={false}
              aria-invalid={fieldError ? true : undefined}
              aria-describedby={fieldError ? 'verification-code-error' : undefined}
            />
            {fieldError ? (
              <p id="verification-code-error" role="alert" className="text-sm text-destructive">
                {fieldError}
              </p>
            ) : null}
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? 'Verificando…' : 'Verificar'}
          </Button>
        </form>

        {/* Montada desde el inicio: un lector de pantalla solo anuncia los cambios de una región
            viva que ya existía (el 404 y el error llevan `role="alert"`, que se anuncia al montarse). */}
        <div role="status" aria-live="polite">
          {outcome?.kind === 'found' ? (
            <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4 text-sm">
              <p className="font-medium">Trámita emitió un documento con este código.</p>
              <p>Emitido: {formatIssuedAt(outcome.seal.issuedAt)}</p>
              <p>Estado al emitir: {outcome.seal.stateName}</p>
              <p>Revisión: {outcome.seal.revision}</p>
              <p className="text-muted-foreground">
                Compare estos datos con el pie del documento. Esta consulta confirma que el
                documento lo emitió Trámita; no detecta si su contenido se modificó después.
              </p>
            </div>
          ) : null}
        </div>

        {outcome?.kind === 'not-found' ? (
          <p role="alert" className="text-sm text-destructive">
            No hay ningún documento emitido con este código. Revise que lo haya escrito tal como
            aparece en el pie; el número 0 y la letra O son distintos.
          </p>
        ) : null}

        {outcome?.kind === 'error' ? (
          <div role="alert" className="flex flex-col gap-1 text-sm text-destructive">
            {outcome.messages.map((message) => (
              <p key={message}>{message}</p>
            ))}
          </div>
        ) : null}

        <Link href="/dashboard" className="text-sm text-primary hover:underline">
          Volver a Trámita
        </Link>
      </div>
    </main>
  )
}
