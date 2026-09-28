import {
  CheckCircle2,
  CornerUpLeft,
  FileCheck2,
  FilePlus2,
  MessageSquare,
  Search,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { RequestStatus, TimelineEvent } from '@/lib/types'
import { formatDateTime } from '@/lib/format'

const iconForStatus: Record<RequestStatus, LucideIcon> = {
  pendiente: FilePlus2,
  en_revision: Search,
  devuelto: CornerUpLeft,
  aprobado: CheckCircle2,
  finalizado: FileCheck2,
}

const toneForStatus: Record<RequestStatus, string> = {
  pendiente: 'bg-warning/20 text-warning-foreground',
  en_revision: 'bg-primary/10 text-primary',
  devuelto: 'bg-destructive/12 text-destructive',
  aprobado: 'bg-success/12 text-success',
  finalizado: 'bg-secondary text-secondary-foreground',
}

export function WorkflowTimeline({ events }: { events: TimelineEvent[] }) {
  const ordered = [...events].reverse()
  return (
    <ol className="relative flex flex-col">
      {ordered.map((ev, i) => {
        const status = ev.toStatus ?? 'pendiente'
        const Icon = iconForStatus[status]
        const isLast = i === ordered.length - 1
        return (
          <li key={ev.id} className="relative flex gap-4 pb-6 last:pb-0">
            {!isLast && (
              // Línea alineada al centro del punto de 36px (`size-9`): centro en 18px, ancho
              // de línea 3px, offset izquierdo 18 − 1.5 = 16.5px.
              <span
                aria-hidden
                className="absolute left-[16.5px] top-10 h-[calc(100%-1rem)] w-[3px] rounded-full bg-border"
              />
            )}
            <span
              className={cn(
                'z-10 grid size-9 shrink-0 place-items-center rounded-full border-2 border-card',
                toneForStatus[status],
              )}
            >
              <Icon className="size-4" />
            </span>
            {/* `min-w-0` deja que el bloque se encoja dentro del flex; sin él, un correo largo
                (el actor) estira la página en un celular. */}
            <div className="flex min-w-0 flex-1 flex-col gap-1 pt-0.5">
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5">
                <p className="text-[17px] font-bold">{ev.action}</p>
                <time className="text-base text-muted-foreground">
                  {formatDateTime(ev.date)}
                </time>
              </div>
              {/* El actor suele ser un correo: sin espacios donde partirse, necesita
                  `overflow-wrap:anywhere`. */}
              <p className="text-base text-muted-foreground [overflow-wrap:anywhere]">{ev.actor}</p>
              {ev.comment && (
                <div className="mt-1 flex items-start gap-2 rounded-xl bg-muted/60 px-3 py-2 text-base leading-relaxed text-foreground/80">
                  <MessageSquare className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                  <span className="text-pretty">{ev.comment}</span>
                </div>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
