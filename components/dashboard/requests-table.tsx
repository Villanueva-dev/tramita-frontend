'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertTriangle, ChevronRight, Inbox, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { StatusBadge } from '@/components/brand'
import { TypeBadge } from '@/components/type-badge'
import { Button } from '@/components/ui/button'
import type { AcademicRequest } from '@/lib/types'
import { formatDate, daysUntil, isOverdue } from '@/lib/format'

function DueCell({ req }: { req: AcademicRequest }) {
  if (req.status === 'finalizado') {
    return <span className="text-muted-foreground">—</span>
  }
  const days = daysUntil(req.dueDate)
  const overdue = isOverdue(req.dueDate, req.status)
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-sm',
        overdue
          ? 'font-medium text-destructive'
          : days <= 1
            ? 'font-medium text-warning-foreground'
            : 'text-muted-foreground',
      )}
    >
      {overdue && <AlertTriangle className="size-3.5" />}
      {overdue
        ? `Vencida (${Math.abs(days)}d)`
        : days === 0
          ? 'Vence hoy'
          : `${days} día${days === 1 ? '' : 's'}`}
    </span>
  )
}

export function RequestsTable({ requests }: { requests: AcademicRequest[] }) {
  const router = useRouter()

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card py-16 text-center">
        <span className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
          <Inbox className="size-6" />
        </span>
        <div>
          <p className="font-medium">No hay solicitudes que coincidan</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Ajuste los filtros o la búsqueda para ver más resultados.
          </p>
        </div>
        <Link href="/requests/new">
          <Button variant="outline" size="sm">
            Crear nueva solicitud
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {/* Desktop table */}
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-semibold">Radicado</th>
              <th className="px-4 py-3 font-semibold">Estudiante</th>
              <th className="px-4 py-3 font-semibold">Tipo</th>
              <th className="px-4 py-3 font-semibold">Estado</th>
              <th className="px-4 py-3 font-semibold">Radicado el</th>
              <th className="px-4 py-3 font-semibold">Vencimiento</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {requests.map((req) => (
              <tr
                key={req.id}
                onClick={() => router.push(`/requests/${req.id}`)}
                className="cursor-pointer border-b border-border/60 transition-colors last:border-0 hover:bg-muted/40"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {req.priority === 'urgente' && (
                      <span
                        className="size-2 shrink-0 rounded-full bg-brand-red"
                        aria-label="Urgente"
                      />
                    )}
                    <span className="font-medium text-primary">
                      {req.radicado}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <span className="font-medium">{req.studentName}</span>
                    <span className="text-xs text-muted-foreground">
                      C.C. {req.studentCedula} · {req.program}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <TypeBadge type={req.type} />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={req.status} />
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatDate(req.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <DueCell req={req} />
                </td>
                <td className="px-4 py-3 text-right">
                  <ChevronRight className="ml-auto size-4 text-muted-foreground" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="flex flex-col divide-y divide-border lg:hidden">
        {requests.map((req) => (
          <Link
            key={req.id}
            href={`/requests/${req.id}`}
            className="flex flex-col gap-2 p-4 transition-colors hover:bg-muted/40"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {req.priority === 'urgente' && (
                  <span className="size-2 rounded-full bg-brand-red" />
                )}
                <span className="font-medium text-primary">{req.radicado}</span>
              </div>
              <StatusBadge status={req.status} />
            </div>
            <p className="font-medium">{req.studentName}</p>
            <p className="text-xs text-muted-foreground">
              C.C. {req.studentCedula} · {req.program}
            </p>
            <div className="flex items-center justify-between gap-2 pt-1">
              <TypeBadge type={req.type} />
              <DueCell req={req} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export { Search }
