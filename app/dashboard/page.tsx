'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { FilePlus2, Search, SlidersHorizontal, UserRound, X } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { RequestsTable } from '@/components/dashboard/requests-table'
import { CoordinationInbox } from '@/components/dashboard/coordination-inbox'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useTramita } from '@/lib/store'
import { useCoordinationInbox } from '@/lib/use-coordination-inbox'
import { REQUEST_TYPE_LABELS, STATUS_LABELS } from '@/lib/ui-constants'
import type { RequestStatus, RequestType } from '@/lib/types'

export default function DashboardPage() {
  const { requests, coordinatorName, searchRequests, searched, searchErrors } = useTramita()
  const inbox = useCoordinationInbox()
  const [now] = useState(() => Date.now())
  // Término que viaja al backend (localización); los filtros de abajo acotan
  // los resultados ya traídos, sin volver a preguntarle al servidor.
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<RequestType | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<RequestStatus | 'all'>('all')
  const [responsibleFilter, setResponsibleFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState<'all' | '7' | '30'>('all')

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      if (typeFilter !== 'all' && r.type !== typeFilter) return false
      if (statusFilter !== 'all' && r.status !== statusFilter) return false
      if (responsibleFilter !== 'all' && r.assignedTo !== responsibleFilter) return false

      if (dateFilter !== 'all') {
        const days = (now - new Date(r.createdAt).getTime()) / 86400000
        if (days > Number(dateFilter)) return false
      }

      return true
    })
  }, [requests, typeFilter, statusFilter, responsibleFilter, dateFilter, now])

  const hasActiveFilters =
    typeFilter !== 'all' ||
    statusFilter !== 'all' ||
    responsibleFilter !== 'all' ||
    dateFilter !== 'all'

  function clearFilters() {
    setTypeFilter('all')
    setStatusFilter('all')
    setResponsibleFilter('all')
    setDateFilter('all')
  }

  const firstName = coordinatorName.replace(/^Coord\.\s*/, '').split(' ')[0]
  const responsibleOptions = Array.from(new Set(requests.map((request) => request.assignedTo))).sort()

  return (
    <AppShell title="Bandeja de trabajo">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-serif text-2xl font-bold tracking-tight">
              Buenos días, {firstName}
            </h2>
            {inbox.status === 'ready' && (
              <p className="mt-1 text-sm text-muted-foreground">
                Tiene {inbox.entries.length} solicitud{inbox.entries.length === 1 ? '' : 'es'}
                {inbox.mayHaveMore ? ' o más' : ''} esperando su acción.
              </p>
            )}
          </div>
          <Link href="/requests/new">
            <Button size="lg" className="h-10 gap-2">
              <FilePlus2 className="size-4" />
              Nueva solicitud
            </Button>
          </Link>
        </div>

        {/* Buscador: primer bloque tras el encabezado (#56). Localizar por nombre o cédula
            es la tarea diaria de la Coordinación (entrevista 3); antes vivía al final del
            tablero, debajo de la bandeja, las tarjetas y los indicadores. */}
        <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 md:p-6">
          <form
            className="flex flex-col gap-3 md:flex-row md:items-end"
            onSubmit={(event) => {
              event.preventDefault()
              void searchRequests(searchTerm)
            }}
          >
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="request-search" className="text-base font-semibold">
                Cédula o nombre del estudiante
              </Label>
              <div className="relative">
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  id="request-search"
                  className="h-12 pl-9 text-base"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Ej. 1090234 o Pérez"
                />
              </div>
            </div>
            <Button type="submit" className="h-12 px-6 text-base">
              Buscar
            </Button>
          </form>

          {searchErrors.map((message) => (
            <p key={message} className="text-sm text-destructive">{message}</p>
          ))}

          {!searched && searchErrors.length === 0 ? (
            <p className="text-base text-muted-foreground">
              Busque por cédula o nombre del estudiante para ver sus trámites. El sistema localiza
              solicitudes; no muestra el listado completo de estudiantes.
            </p>
          ) : null}
        </div>

        {/* Los filtros acotan los resultados de la búsqueda: antes de buscar no hay nada que
            filtrar y solo empujarían la bandeja hacia abajo (#56). */}
        {searched && (
          <>
            <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <SlidersHorizontal className="size-4 text-primary" />
                Filtros y búsqueda
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={clearFilters}
                    className="ml-auto gap-1 text-muted-foreground"
                  >
                    <X className="size-3" />
                    Limpiar
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="type" className="text-xs text-muted-foreground">
                    Tipo de trámite
                  </Label>
                  <Select
                    id="type"
                    value={typeFilter}
                    onChange={(e) =>
                      setTypeFilter(e.target.value as RequestType | 'all')
                    }
                  >
                    <option value="all">Todos los tipos</option>
                    {Object.entries(REQUEST_TYPE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="responsible" className="text-xs text-muted-foreground">
                    Responsable
                  </Label>
                  <div className="relative">
                    <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Select
                      id="responsible"
                      className="pl-9"
                      value={responsibleFilter}
                      onChange={(e) => setResponsibleFilter(e.target.value)}
                    >
                      <option value="all">Todos los responsables</option>
                      {responsibleOptions.map((responsible) => (
                        <option key={responsible} value={responsible}>
                          {responsible}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="status" className="text-xs text-muted-foreground">
                    Estado
                  </Label>
                  <Select
                    id="status"
                    value={statusFilter}
                    onChange={(e) =>
                      setStatusFilter(e.target.value as RequestStatus | 'all')
                    }
                  >
                    <option value="all">Todos los estados</option>
                    {Object.entries(STATUS_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="date" className="text-xs text-muted-foreground">
                    Fecha de radicación
                  </Label>
                  <Select
                    id="date"
                    value={dateFilter}
                    onChange={(e) =>
                      setDateFilter(e.target.value as 'all' | '7' | '30')
                    }
                  >
                    <option value="all">Cualquier fecha</option>
                    <option value="7">Últimos 7 días</option>
                    <option value="30">Últimos 30 días</option>
                  </Select>
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Mostrando{' '}
                  <span className="font-medium text-foreground">
                    {filtered.length}
                  </span>{' '}
                  de {requests.length} solicitudes
                </p>
              </div>
              {requests.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Sin coincidencias para lo buscado.
                </p>
              ) : (
                <RequestsTable requests={filtered} />
              )}
            </div>
          </>
        )}

        {/* Bandeja de trabajo: qué espera la acción de la Coordinación, sin que nadie
            busque. El orden y el recorte son del servidor (design.md, D1). */}
        <CoordinationInbox inbox={inbox} now={now} />
      </div>
    </AppShell>
  )
}
