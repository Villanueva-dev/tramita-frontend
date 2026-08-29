import { Circle, MessageSquare } from 'lucide-react'
import type { TimelineEntry } from '@/lib/types'
import { formatDateTime } from '@/lib/format'

// El orden lo fija el backend (findByRequestIdOrderByOccurredAtAscIdAsc) y se
// respeta tal cual: la bitácora es cronológica ascendente, la más antigua
// primero. Reordenar en el cliente rompería la lectura de auditoría.
//
// El icono es único para toda entrada. Los mapas por estado que había antes
// (un icono y un color por cada estado del modelo viejo) no sobreviven a un
// motor configurable:
// un trámite que se configure mañana no tendría entrada en ese Record.

export function WorkflowTimeline({ entries }: { entries: TimelineEntry[] }) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Esta solicitud todavía no registra movimientos.
      </p>
    )
  }

  return (
    <ol className="relative flex flex-col">
      {entries.map((entry, i) => {
        const isLast = i === entries.length - 1
        return (
          <li key={entry.id} className="relative flex gap-4 pb-6 last:pb-0">
            {!isLast && (
              <span
                aria-hidden
                className="absolute left-[15px] top-9 h-[calc(100%-1rem)] w-px bg-border"
              />
            )}
            <span className="z-10 grid size-8 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground ring-4 ring-card">
              <Circle className="size-3 fill-current" />
            </span>
            <div className="flex flex-1 flex-col gap-1 pt-0.5">
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5">
                <p className="text-sm font-medium">{entry.toState.name}</p>
                <time className="text-xs text-muted-foreground">
                  {formatDateTime(entry.occurredAt)}
                </time>
              </div>
              <p className="text-xs text-muted-foreground">
                registrado por {entry.actorEmail}
                {/* La entrada de registro (fromState null) no trae responsable:
                    la spec prohíbe mostrarle la cláusula. */}
                {entry.responsible && <> · en nombre de {entry.responsible}</>}
              </p>
              {entry.note && (
                <div className="mt-1 flex items-start gap-2 rounded-lg bg-muted/60 px-3 py-2 text-sm text-foreground/80">
                  <MessageSquare className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                  <span className="text-pretty">{entry.note}</span>
                </div>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
