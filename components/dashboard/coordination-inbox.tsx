'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ChevronLeft, ChevronRight, Clock, CornerUpLeft } from 'lucide-react'
import { TypeBadge } from '@/components/type-badge'
import { daysSince } from '@/lib/format'
import { isReturnedForCorrection } from '@/lib/request-state'
import { typeFromCode } from '@/lib/store'
import { cn } from '@/lib/utils'
import { ORIGIN_LABELS, ORIGIN_UNKNOWN_LABEL } from '@/lib/ui-constants'
import type { InboxState } from '@/lib/use-coordination-inbox'
import type { InboxEntry } from '@/lib/types'

/** Filas por página (issue #56): paginación de vista, no una nueva consulta al servidor. */
const PAGE_SIZE = 10

/** Variante de la lista (D1, odd/tasks/lista-unica-resultados.md): por defecto la bandeja. */
export type CoordinationInboxVariant = 'inbox' | 'results'

/**
 * Rótulo de tiempo de una fila, con `waitingSince` — nunca `createdAt` (mutante 1,
 * coordination-inbox/spec.md, «La antigüedad de la espera se mide desde waitingSince»). El
 * prefijo cambia según la variante; el cálculo, no: en los resultados de búsqueda el
 * adaptador del tablero (`app/dashboard/page.tsx`, `toInboxEntry`) ya iguala
 * `waitingSince` a `createdAt`, así que «Radicada hace…» sigue leyendo el mismo campo.
 */
function ageLabelFor(prefix: string) {
  return (entry: InboxEntry, now: number): string => {
    const days = daysSince(entry.waitingSince, new Date(now))
    return `${prefix} ${days} día${days === 1 ? '' : 's'}`
  }
}

/**
 * Copy por variante (D1): título, mensaje de vacío y rótulo de tiempo. Solo eso cambia —el
 * aviso de `mayHaveMore` y el texto de carga son iguales en las dos variantes.
 */
const VARIANT_COPY: Record<
  CoordinationInboxVariant,
  { heading: string; empty: string; ageLabel: (entry: InboxEntry, now: number) => string }
> = {
  inbox: {
    heading: 'Bandeja de trabajo',
    empty: 'No hay solicitudes pendientes en este momento.',
    ageLabel: ageLabelFor('Esperando desde hace'),
  },
  results: {
    heading: 'Resultados de la búsqueda',
    empty: 'Sin coincidencias para lo buscado.',
    ageLabel: ageLabelFor('Radicada hace'),
  },
}

/**
 * `origin: null` es una anomalía de datos declarada, no un tercer origen (contrato :255-258).
 * El prefijo «Origen: » solo se antepone a los dos orígenes conocidos: la etiqueta del
 * desconocido («Origen no registrado») ya lo trae, y duplicarlo leería «Origen: Origen…».
 */
function originLabel(origin: InboxEntry['origin']): string {
  return origin === null ? ORIGIN_UNKNOWN_LABEL : `Origen: ${ORIGIN_LABELS[origin]}`
}

/**
 * Ficha de estado de una fila (issue #56). El rótulo siempre sale de `currentState.name`
 * —dato del servidor—, nunca de un texto propio. La marca de devuelta (tono cálido + ícono) sale del
 * predicado ya existente `isReturnedForCorrection` (`lib/request-state.ts`) combinado con
 * `typeFromCode` (`lib/store.tsx`): no se crea ningún mapa nuevo de estado a color (regla 1,
 * revisar-frontend-next). En novedad de notas la devolución no es un estado —la tabla de
 * `request-state.ts` no tiene fila para ella—, así que ahí la ficha siempre queda neutra.
 * Parte línea cuando su columna es angosta (768–1300 px): con `whitespace-nowrap` se montaba
 * sobre la columna de espera.
 */
function StateChip({ entry }: { entry: InboxEntry }) {
  const type = typeFromCode(entry.definition.code)
  const returned = isReturnedForCorrection({ currentState: entry.currentState, type })
  return (
    <span
      className={cn(
        'inline-flex min-h-[30px] w-fit items-center gap-1 rounded-full px-3 py-0.5 text-base font-semibold',
        returned ? 'bg-warning/20 text-warning-foreground' : 'bg-secondary text-secondary-foreground',
      )}
    >
      {returned && (
        <CornerUpLeft
          data-testid="coordination-inbox-returned-icon"
          className="size-4"
          aria-hidden="true"
        />
      )}
      {entry.currentState.name}
    </span>
  )
}

/**
 * Una fila de la bandeja (issue #56, lista compacta): toda la fila es un único enlace a
 * `/requests/{id}` — nunca un segundo enlace al mismo destino (nombre + botón), así que hay
 * un solo punto de tabulación por fila. En escritorio cierra con «Revisar →»; a 390 px, con
 * un chevrón. Dice «Revisar» y nunca «Corregir»: el backend no expone edición de solicitudes.
 */
function InboxRow({
  entry,
  now,
  ageLabel,
}: {
  entry: InboxEntry
  now: number
  ageLabel: (entry: InboxEntry, now: number) => string
}) {
  return (
    <Link
      href={`/requests/${entry.id}`}
      className="relative flex min-h-12 flex-col gap-3 border-t border-border px-4 py-4 transition-colors hover:bg-muted/50 md:grid md:grid-cols-[minmax(0,1.6fr)_minmax(0,1.1fr)_minmax(0,1fr)_auto] md:items-center md:gap-5 md:px-6"
    >
      <div className="flex flex-col gap-1 pr-8 md:pr-0">
        <span className="text-lg font-bold text-primary">{entry.studentName}</span>
        <div className="flex flex-wrap items-center gap-2 text-base text-muted-foreground">
          <TypeBadge
            code={entry.definition.code}
            name={entry.definition.name}
            className="text-base [&_svg]:size-4"
          />
          <span>{originLabel(entry.origin)}</span>
        </div>
      </div>

      <StateChip entry={entry} />

      <div className="flex items-center gap-2 text-base text-muted-foreground">
        <Clock className="size-4" aria-hidden="true" />
        <span>{ageLabel(entry, now)}</span>
      </div>

      <span className="hidden h-12 items-center justify-center gap-1 rounded-md border border-primary px-4 text-base font-medium text-primary md:inline-flex">
        Revisar
        <ArrowRight className="size-4" aria-hidden="true" />
      </span>
      <ChevronRight
        className="absolute right-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground md:hidden"
        aria-hidden="true"
      />
    </Link>
  )
}

/**
 * Lista de solicitudes en el formato de la bandeja de trabajo (issue #56 y, con
 * `variant="results"`, lista-unica-resultados D1). Antes había dos formatos en pantalla —esta
 * bandeja y una tabla aparte para los resultados de búsqueda (`RequestsTable`, retirada)—; una
 * sola lista paginada evita que dos formatos distintos lean como "dos cosas que hacen lo
 * mismo" para una usuaria no técnica. Los resultados incluyen trámites cerrados que no
 * "esperan" nada, así que solo cambian el título, el vacío y el rótulo de tiempo (`VARIANT_COPY`)
 * — nunca el dato que muestran: el rótulo de estado sigue saliendo de `currentState.name`.
 *
 * Presentacional: el contenedor (`app/dashboard/page.tsx`) decide `inbox`/`now`/`variant`.
 * Nunca reordena ni filtra el arreglo que llega — es exactamente lo que prueba el mutante 2b.
 *
 * La paginación es estado de vista local (issue #56): de 10 en 10, recortando el arreglo ya
 * ordenado por el servidor (o, en resultados, por el filtrado del tablero). No dispara una
 * nueva consulta de red.
 */
export function CoordinationInbox({
  inbox,
  now,
  variant = 'inbox',
}: {
  inbox: InboxState
  now: number
  variant?: CoordinationInboxVariant
}) {
  const [page, setPage] = useState(0)
  const sectionRef = useRef<HTMLElement>(null)
  const copy = VARIANT_COPY[variant]

  const entries = inbox.status === 'ready' ? inbox.entries : []
  const totalPages = Math.max(1, Math.ceil(entries.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages - 1)
  const start = safePage * PAGE_SIZE
  const end = Math.min(start + PAGE_SIZE, entries.length)
  const pageEntries = entries.slice(start, end)

  /**
   * Al cambiar de página (issue #56) la vista se quedaba al pie de la lista, como si el
   * clic no hubiera hecho nada. Llevar el foco a la sección sirve tanto a teclado como a lector
   * de pantalla, y el desplazamiento acompaña a quien usa el mouse.
   */
  function goToPage(next: number) {
    setPage(next)
    const section = sectionRef.current
    if (!section) return
    section.scrollIntoView({ block: 'start' })
    section.focus({ preventScroll: true })
  }

  return (
    <section
      ref={sectionRef}
      tabIndex={-1}
      aria-labelledby="coordination-inbox-heading"
      className="flex scroll-mt-20 flex-col overflow-hidden rounded-xl border border-border bg-card"
    >
      <div className="flex flex-col gap-3 p-4 md:p-6">
        <h3 id="coordination-inbox-heading" className="text-xl font-bold leading-none tracking-tight">
          {copy.heading}
        </h3>

        {inbox.status === 'loading' && (
          <p className="text-base text-muted-foreground">Cargando bandeja de la Coordinación…</p>
        )}

        {inbox.status === 'error' && (
          <div role="alert" className="flex flex-col gap-1 text-base text-destructive">
            {inbox.messages.map((message) => (
              <p key={message}>{message}</p>
            ))}
          </div>
        )}

        {inbox.status === 'ready' && entries.length === 0 && (
          <p className="text-base text-muted-foreground">{copy.empty}</p>
        )}

        {inbox.status === 'ready' && entries.length > 0 && inbox.mayHaveMore && (
          <p className="text-base text-muted-foreground">
            Puede haber más solicitudes en espera además de las que se muestran.
          </p>
        )}
      </div>

      {entries.length > 0 && (
        <div>
          {pageEntries.map((entry) => (
            <InboxRow key={entry.id} entry={entry} now={now} ageLabel={copy.ageLabel} />
          ))}
        </div>
      )}

      {entries.length > PAGE_SIZE && (
        <div className="flex flex-col gap-3 border-t border-border bg-muted/40 px-4 py-3 md:flex-row md:items-center md:justify-between md:px-6">
          <p className="text-center text-base text-muted-foreground md:text-left">
            Mostrando {start + 1}–{end} de {entries.length}
          </p>
          <div className="flex flex-col items-center gap-2 md:flex-row md:gap-3">
            <span aria-live="polite" aria-atomic="true" className="text-base text-muted-foreground">
              Página {safePage + 1} de {totalPages}
            </span>
            <div className="flex w-full gap-2 md:w-auto">
              <button
                type="button"
                onClick={() => goToPage(Math.max(0, safePage - 1))}
                disabled={safePage === 0}
                className="inline-flex h-12 flex-1 items-center justify-center gap-1 rounded-md border border-border px-4 text-base font-medium text-foreground disabled:cursor-not-allowed disabled:opacity-40 md:flex-none"
              >
                <ChevronLeft className="size-4" aria-hidden="true" />
                Anterior
              </button>
              <button
                type="button"
                onClick={() => goToPage(Math.min(totalPages - 1, safePage + 1))}
                disabled={safePage === totalPages - 1}
                className="inline-flex h-12 flex-1 items-center justify-center gap-1 rounded-md border border-border px-4 text-base font-medium text-foreground disabled:cursor-not-allowed disabled:opacity-40 md:flex-none"
              >
                Siguiente
                <ChevronRight className="size-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
