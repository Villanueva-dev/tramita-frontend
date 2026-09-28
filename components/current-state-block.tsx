import { Clock, Lock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { daysSince } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Responsibility } from '@/lib/request-state'
import type { State } from '@/lib/types'

/**
 * «De quién depende ahora» es el dato central de la pantalla (CLAUDE.md, «Qué se está
 * construyendo»). Presentacional: el contenedor deriva `responsibility` y `waitingSince`
 * (última entrada del timeline, nunca `createdAt` — design.md D4); este componente solo
 * presenta. Nunca un stepper ni «paso N de M»: el conjunto de estados no tiene orden
 * significativo (FR-011b, contrato 007).
 */
function responsibilityText(responsibility: Responsibility): string {
  switch (responsibility.kind) {
    case 'single':
      return responsibility.who
    case 'varies':
      return 'Depende de la acción que se registre'
    case 'closed':
      return 'Trámite cerrado'
    case 'unknown':
      return 'Sin información del responsable'
  }
}

function ageLabel(days: number): string {
  return `Lleva ${days} día${days === 1 ? '' : 's'}`
}

export function CurrentStateBlock({
  state,
  responsibility,
  waitingSince,
  now,
}: {
  state: State
  responsibility: Responsibility
  /** `occurredAt` de la última entrada del timeline; `null` si no hay timeline cargado. */
  waitingSince: string | null
  now: number
}) {
  const showAge = !state.isFinal && waitingSince !== null
  const days = showAge && waitingSince !== null ? daysSince(waitingSince, new Date(now)) : null

  // Tono neutro en un estado final, no el de éxito (`success`): un cierre puede ser negado
  // (spec.md :496-503), así que el bloque no puede afirmar que el trámite terminó bien.
  return (
    <section
      aria-labelledby="current-state-heading"
      className={cn(
        'grid gap-5 rounded-2xl border-2 px-6 py-5 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center sm:px-7 2xl:grid-cols-[auto_minmax(16rem,1.2fr)_minmax(0,0.8fr)] 2xl:gap-x-8',
        state.isFinal ? 'border-border bg-muted/40' : 'border-primary/30 bg-primary/5',
      )}
    >
      <span
        aria-hidden
        className={cn(
          'grid size-16 shrink-0 place-items-center rounded-full text-white sm:row-span-2 2xl:row-span-1',
          state.isFinal ? 'bg-muted-foreground' : 'bg-primary',
        )}
      >
        {state.isFinal ? <Lock className="size-8" /> : <Clock className="size-8" />}
      </span>
      <div className="min-w-0 flex flex-col gap-2 sm:col-start-2 2xl:col-start-auto">
        {/* `h2`: el banner es una sección de primer nivel y va antes del `h2` con el nombre
            del estudiante; un `h3` aquí invertiría la jerarquía de encabezados. */}
        <h2
          id="current-state-heading"
          className={cn(
            'text-base font-semibold uppercase tracking-wide',
            state.isFinal ? 'text-muted-foreground' : 'text-primary',
          )}
        >
          Estado actual
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <span className="break-words text-[34px] font-bold leading-tight">{state.name}</span>
          {state.isInitial && <Badge variant="info">Inicial</Badge>}
          {state.isFinal && <Badge variant="secondary">Cerrado</Badge>}
        </div>
      </div>
      <dl className="min-w-0 grid gap-3 text-[18px] sm:col-start-2 sm:grid-cols-2 2xl:col-start-auto 2xl:gap-x-6">
        <div className="min-w-0 flex flex-col gap-0.5">
          <dt className="font-medium text-muted-foreground">Ahora depende de</dt>
          <dd className="break-words">{responsibilityText(responsibility)}</dd>
        </div>
        {showAge && days !== null && (
          <div className="min-w-0 flex flex-col gap-0.5">
            <dt className="font-medium text-muted-foreground">Antigüedad del estado</dt>
            <dd>{ageLabel(days)}</dd>
          </div>
        )}
      </dl>
    </section>
  )
}
