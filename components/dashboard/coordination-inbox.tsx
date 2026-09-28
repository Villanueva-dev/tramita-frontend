'use client'

import Link from 'next/link'
import { TypeBadge } from '@/components/type-badge'
import { daysSince } from '@/lib/format'
import { ORIGIN_LABELS, ORIGIN_UNKNOWN_LABEL } from '@/lib/ui-constants'
import type { InboxState } from '@/lib/use-coordination-inbox'
import type { InboxEntry } from '@/lib/types'

/**
 * «Esperando desde hace N días», con `waitingSince` — nunca `createdAt` (mutante 1,
 * coordination-inbox/spec.md, «La antigüedad de la espera se mide desde waitingSince»).
 */
function ageLabel(entry: InboxEntry, now: number): string {
  const days = daysSince(entry.waitingSince, new Date(now))
  return `Esperando desde hace ${days} día${days === 1 ? '' : 's'}`
}

/** `origin: null` es una anomalía de datos declarada, no un tercer origen (contrato :255-258). */
function originLabel(origin: InboxEntry['origin']): string {
  return origin === null ? ORIGIN_UNKNOWN_LABEL : ORIGIN_LABELS[origin]
}

/**
 * La bandeja de trabajo de la Coordinación: qué espera su acción, en el orden y el
 * recorte que decide el servidor (design.md, D1). Presentacional: el contenedor
 * (`app/dashboard/page.tsx`) llama a `useCoordinationInbox()` y reparte `inbox`/`now`.
 * Nunca reordena ni filtra en el cliente — es exactamente lo que prueba el mutante 2b.
 */
export function CoordinationInbox({ inbox, now }: { inbox: InboxState; now: number }) {
  return (
    <section
      aria-labelledby="coordination-inbox-heading"
      className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4"
    >
      <h3 id="coordination-inbox-heading" className="font-semibold leading-none tracking-tight">
        Bandeja de trabajo
      </h3>

      {inbox.status === 'loading' && (
        <p className="text-sm text-muted-foreground">Cargando bandeja de la Coordinación…</p>
      )}

      {inbox.status === 'error' && (
        <div role="alert" className="flex flex-col gap-1 text-sm text-destructive">
          {inbox.messages.map((message) => (
            <p key={message}>{message}</p>
          ))}
        </div>
      )}

      {inbox.status === 'ready' && inbox.entries.length === 0 && (
        <p className="text-sm text-muted-foreground">No hay solicitudes pendientes en este momento.</p>
      )}

      {inbox.status === 'ready' && inbox.entries.length > 0 && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-3 py-2 font-semibold">Estudiante</th>
                  <th className="px-3 py-2 font-semibold">Trámite</th>
                  <th className="px-3 py-2 font-semibold">Estado</th>
                  <th className="px-3 py-2 font-semibold">Esperando</th>
                  <th className="px-3 py-2 font-semibold">Origen</th>
                </tr>
              </thead>
              <tbody>
                {inbox.entries.map((entry) => (
                  <tr key={entry.id} className="border-b border-border/60 last:border-0">
                    <td className="px-3 py-2">
                      <Link href={`/requests/${entry.id}`} className="font-medium text-primary">
                        {entry.studentName}
                      </Link>
                    </td>
                    <td className="px-3 py-2">
                      <TypeBadge code={entry.definition.code} name={entry.definition.name} />
                    </td>
                    <td className="px-3 py-2">{entry.currentState.name}</td>
                    <td className="px-3 py-2 text-muted-foreground">{ageLabel(entry, now)}</td>
                    <td className="px-3 py-2 text-muted-foreground">{originLabel(entry.origin)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {inbox.mayHaveMore && (
            <p className="text-xs text-muted-foreground">
              Puede haber más solicitudes en espera además de las que se muestran.
            </p>
          )}
        </>
      )}
    </section>
  )
}
