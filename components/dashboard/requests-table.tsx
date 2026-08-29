'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronRight, Inbox } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { RequestSummary } from '@/lib/types'
import { formatDate } from '@/lib/format'

// `RequestSummary` (openapi.yaml :237-246) trae seis campos: id, definition,
// studentName, studentDocument, currentState y createdAt. Las columnas de
// radicado, programa, vencimiento y urgencia salieron con la migración porque
// el motor no las produce — no son un recorte visual, son datos sin fuente.
//
// Los badges son genéricos a propósito: un motor configurable no puede tener
// un color ni un icono por estado fijado en el cliente, porque un trámite que
// se configure mañana no tendría entrada en ese mapa.

export function RequestsTable({ requests }: { requests: RequestSummary[] }) {
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
            Revise el nombre o la cédula e intente de nuevo.
          </p>
        </div>
        <Link href="/requests/new">
          <Button variant="outline" size="sm">
            Registrar nueva solicitud
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
              <th className="px-4 py-3 font-semibold">Estudiante</th>
              <th className="px-4 py-3 font-semibold">Trámite</th>
              <th className="px-4 py-3 font-semibold">Estado</th>
              <th className="px-4 py-3 font-semibold">Registrado el</th>
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
                  <div className="flex flex-col">
                    <span className="font-medium">{req.studentName}</span>
                    <span className="text-xs text-muted-foreground">
                      C.C. {req.studentDocument}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline">{req.definition.name}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="info">{req.currentState.name}</Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatDate(req.createdAt)}
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
              <span className="font-medium">{req.studentName}</span>
              <Badge variant="info">{req.currentState.name}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              C.C. {req.studentDocument}
            </p>
            <div className="flex items-center justify-between gap-2 pt-1">
              <Badge variant="outline">{req.definition.name}</Badge>
              <span className="text-xs text-muted-foreground">
                {formatDate(req.createdAt)}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
