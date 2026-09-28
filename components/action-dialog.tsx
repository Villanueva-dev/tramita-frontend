'use client'

import { useEffect, useState } from 'react'
import { Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/40" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={config.title}
        className="relative w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-lg"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
          aria-label="Cerrar"
        >
          <X className="size-4" />
        </button>
        <h3 className="text-lg font-semibold tracking-tight">{config.title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {config.description}
        </p>

        <div className="mt-4 flex flex-col gap-1.5">
          <Label htmlFor="action-comment">
            Comentario{' '}
            {config.commentRequired ? (
              <span className="text-destructive">*</span>
            ) : (
              <span className="text-muted-foreground">(opcional)</span>
            )}
          </Label>
          <Textarea
            id="action-comment"
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Agregue una observación para el historial…"
            aria-invalid={!!error}
          />
          {error && (
            <p className="text-xs font-medium text-destructive">{error}</p>
          )}
        </div>

        {serverError && (
          // Separado del error de validación del comentario: este viene del backend, no del
          // formulario, y el diálogo debe seguir habilitado para reintentar.
          <p role="alert" className="mt-3 text-xs font-medium text-destructive">
            {serverError}
          </p>
        )}

        <div className="mt-5 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            variant={config.variant}
            onClick={handleConfirm}
            disabled={loading}
            className="gap-2"
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            {config.confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
