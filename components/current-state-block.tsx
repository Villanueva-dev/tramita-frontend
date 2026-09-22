import { Badge } from '@/components/ui/badge'
import { daysSince } from '@/lib/format'
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

  return (
    <section
      aria-labelledby="current-state-heading"
      className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm"
    >
      <h3 id="current-state-heading" className="font-semibold leading-none tracking-tight">
        Estado actual
      </h3>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-base font-medium">{state.name}</span>
        {state.isInitial && <Badge variant="info">Inicial</Badge>}
        {state.isFinal && <Badge variant="secondary">Cerrado</Badge>}
      </div>
      <dl className="flex flex-col gap-3">
        <div className="flex flex-col gap-0.5">
          <dt className="text-xs font-medium text-muted-foreground">Ahora depende de</dt>
          <dd className="text-sm">{responsibilityText(responsibility)}</dd>
        </div>
        {showAge && days !== null && (
          <div className="flex flex-col gap-0.5">
            <dt className="text-xs font-medium text-muted-foreground">Antigüedad del estado</dt>
            <dd className="text-sm">{ageLabel(days)}</dd>
          </div>
        )}
      </dl>
    </section>
  )
}
