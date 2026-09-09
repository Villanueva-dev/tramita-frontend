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
              <span
                aria-hidden
                className="absolute left-[15px] top-9 h-[calc(100%-1rem)] w-px bg-border"
              />
            )}
            <span
              className={cn(
                'z-10 grid size-8 shrink-0 place-items-center rounded-full ring-4 ring-card',
                toneForStatus[status],
              )}
            >
              <Icon className="size-4" />
            </span>
            <div className="flex flex-1 flex-col gap-1 pt-0.5">
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5">
                <p className="text-sm font-medium">{ev.action}</p>
                <time className="text-xs text-muted-foreground">
                  {formatDateTime(ev.date)}
                </time>
              </div>
              <p className="text-xs text-muted-foreground">{ev.actor}</p>
              {ev.comment && (
                <div className="mt-1 flex items-start gap-2 rounded-lg bg-muted/60 px-3 py-2 text-sm text-foreground/80">
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
