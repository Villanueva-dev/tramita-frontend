'use client'

import { useEffect, useState } from 'react'
import { Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import type { AvailableTransition } from '@/lib/types'

// Antes este diálogo fijaba las acciones en un union type
// ('revisar' | 'aprobar' | 'devolver' | 'finalizar') con un título y un color
// por cada una. Nada de eso sobrevive a un motor configurable: las acciones
// existen porque la definición del trámite las declara, y un trámite nuevo no
// tendría entrada en ese mapa.
//
// Todas las acciones se ven igual. El rojo que distinguía "Devolver" se va
// porque no hay forma de saber cuál transición es una devolución: para el
// motor, avanzar y devolver son la misma operación (FR-013).

export function TransitionDialog({
  transition,
  submitting,
  serverError,
  onClose,
  onConfirm,
}: {
  transition: AvailableTransition | null
  submitting: boolean
  /** Error del backend atado al campo de nota (422). */
  serverError: string
  onClose: () => void
  onConfirm: (note?: string) => void
}) {
  const [note, setNote] = useState('')
  const [localError, setLocalError] = useState('')

  useEffect(() => {
    setNote('')
    setLocalError('')
  }, [transition])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (transition) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [transition, onClose])

  if (!transition) return null

  const requiresNote = transition.requiresNote
  const error = localError || serverError

  function handleConfirm() {
    const trimmed = note.trim()
    // La única regla con fuente: si la transición exige observación, tiene que
    // haberla. El mínimo de 5 caracteres que pedía la versión anterior no
    // existe en el contrato ni en ninguna spec — estaba inventado.
    if (requiresNote && !trimmed) {
      setLocalError('Esta acción exige una observación.')
      return
    }
    setLocalError('')
    onConfirm(trimmed || undefined)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/40" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Registrar: ${transition.targetState.name}`}
        className="relative w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-lg"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
          aria-label="Cerrar"
        >
          <X className="size-4" />
        </button>
        <h3 className="text-lg font-semibold tracking-tight">
          Registrar: {transition.targetState.name}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Queda asentado en el historial a su nombre, en nombre de{' '}
          {transition.responsible}.
        </p>

        <div className="mt-4 flex flex-col gap-1.5">
          <Label htmlFor="transition-note">
            Observación{' '}
            {requiresNote ? (
              <span className="text-destructive">*</span>
            ) : (
              <span className="text-muted-foreground">(opcional)</span>
            )}
          </Label>
          <Textarea
            id="transition-note"
            rows={3}
            // Mismo tope que `@Size(max = 2000)` en AdvanceRequestBody: sin
            // esto el POST sale, el backend lo rechaza con un 400 y el diálogo
            // se cierra perdiendo la observación recién escrita.
            maxLength={2000}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Agregue una observación para el historial…"
            aria-invalid={!!error}
            aria-describedby={error ? 'transition-note-error' : undefined}
          />
          {error && (
            <p id="transition-note-error" className="text-xs font-medium text-destructive">
              {error}
            </p>
          )}
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={submitting} className="gap-2">
            {submitting && <Loader2 className="size-4 animate-spin" />}
            Registrar
          </Button>
        </div>
      </div>
    </div>
  )
}
