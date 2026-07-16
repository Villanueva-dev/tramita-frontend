'use client'

import { useEffect, useState } from 'react'
import { Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

export interface ActionConfig {
  action: 'revisar' | 'aprobar' | 'devolver' | 'finalizar'
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
  onConfirm: (comment: string) => void
}) {
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setComment('')
    setError('')
    setLoading(false)
  }, [config])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (config) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [config, onClose])

  if (!config) return null

  const activeConfig = config

  function handleConfirm() {
    if (activeConfig.commentRequired && comment.trim().length < 5) {
      setError('Ingrese un comentario de al menos 5 caracteres.')
      return
    }
    setLoading(true)
    setTimeout(() => {
      onConfirm(comment.trim())
    }, 700)
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
