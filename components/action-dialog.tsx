'use client'

import { useEffect, useState } from 'react'
import { ArrowRight, CircleAlert, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export interface ActionConfig {
  action: string
  targetStateCode: string
  title: string
  description: string
  confirmLabel: string
  commentRequired: boolean
  variant: 'default' | 'destructive'
}

export function ActionDialog({
  config,
  onClose,
  onConfirm,
}: {
  config: ActionConfig | null
  onClose: () => void
  // Contrato: resuelve cuando el backend confirmó la transición (y el padre cierra el diálogo)
  // y rechaza con un `Error` cuyo `message` se muestra al usuario dentro del propio diálogo,
  // que permanece abierto para reintentar.
  onConfirm: (comment: string) => Promise<void>
}) {
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (config) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [config, onClose])

  if (!config) return null

  const activeConfig = config

  async function handleConfirm() {
    // Cada intento limpia el error del servidor del intento anterior, exista o no uno nuevo.
    setServerError('')
    if (activeConfig.commentRequired && !comment.trim()) {
      setError('Ingrese una observación para continuar.')
      return
    }
    setLoading(true)
    try {
      // Se espera la promesa: si rechaza, el diálogo permanece abierto y muestra el motivo
      // (antes se disparaba sin esperar y el error solo llegaba al toast, detrás del modal).
      await onConfirm(comment.trim())
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'No se pudo registrar la transición.')
      setLoading(false)
    }
  }

  // D3 (rediseno-detalle-solicitud.md): la variante ya elegía tono en el botón de confirmar;
  // el ícono de cabecera sigue la misma variante para que el aviso visual sea coherente antes
  // de leer el texto.
  const isDestructive = activeConfig.variant === 'destructive'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/40" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={config.title}
        className="relative w-full max-w-[560px] rounded-2xl border border-border bg-card p-6 shadow-xl sm:p-7"
      >
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-muted-foreground hover:text-foreground"
          aria-label="Cerrar"
        >
          <X className="size-5" />
        </button>

        <div className="flex items-start gap-4 pr-8">
          <span
            className={cn(
              'grid size-11 shrink-0 place-items-center rounded-full',
              isDestructive ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary',
            )}
          >
            <ArrowRight className="size-5" />
          </span>
          <div className="flex flex-col gap-1 pt-1">
            <h2 className="text-2xl font-bold tracking-tight">{config.title}</h2>
            <p className="text-[17px] leading-relaxed text-muted-foreground">
              {config.description}
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-1.5">
          <Label htmlFor="action-comment" className="text-[17px] font-semibold text-foreground">
            Comentario{' '}
            {config.commentRequired ? (
              <span className="text-destructive">*</span>
            ) : (
              <span className="text-[17px] font-normal text-muted-foreground">(opcional)</span>
            )}
          </Label>
          <Textarea
            id="action-comment"
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Agregue una observación para el historial…"
            aria-invalid={!!error}
            aria-describedby={error ? 'action-comment-error' : undefined}
            className="text-[17px]"
          />
          {error && (
            <p id="action-comment-error" className="flex items-center gap-1.5 text-base font-medium text-destructive">
              <CircleAlert className="size-4 shrink-0" />
              {error}
            </p>
          )}
        </div>

        {serverError && (
          // Separado del error de validación del comentario: este viene del backend, no del
          // formulario, y el diálogo debe seguir habilitado para reintentar (T4a).
          <p
            role="alert"
            className="mt-4 flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2.5 text-base font-medium text-destructive"
          >
            <CircleAlert className="size-4 shrink-0" />
            {serverError}
          </p>
        )}

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="h-[52px] px-5 text-[17px]"
          >
            Cancelar
          </Button>
          <Button
            variant={config.variant}
            onClick={handleConfirm}
            disabled={loading}
            className="h-[52px] gap-2 px-5 text-[17px]"
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            {config.confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
