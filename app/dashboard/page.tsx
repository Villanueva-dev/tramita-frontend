'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { FilePlus2, Search, SlidersHorizontal, Timer, UserRound, X } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { SummaryCards } from '@/components/dashboard/summary-cards'
import { RequestsTable } from '@/components/dashboard/requests-table'
import { CoordinationInbox } from '@/components/dashboard/coordination-inbox'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useTramita } from '@/lib/store'
import { useCoordinationInbox } from '@/lib/use-coordination-inbox'
import { REQUEST_TYPE_LABELS, STATUS_LABELS } from '@/lib/ui-constants'
import { isClosed, isReturnedForCorrection, isSuccessfullyClosed } from '@/lib/request-state'
import type { RequestStatus, RequestType } from '@/lib/types'

type CardFilter =
  | 'todos'
  | 'pendiente'
  | 'en_proceso'
  | 'completado'
  | 'urgente'

export default function DashboardPage() {
  const { requests, metrics, coordinatorName, searchRequests, searched, searchErrors } = useTramita()
  const inbox = useCoordinationInbox()
  const [now] = useState(() => Date.now())
  // Término que viaja al backend (localización), distinto de `query`, que filtra
  // en el cliente lo ya traído.
  const [searchTerm, setSearchTerm] = useState('')
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<RequestType | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<RequestStatus | 'all'>('all')
  const [responsibleFilter, setResponsibleFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState<'all' | '7' | '30'>('all')
  const [cardFilter, setCardFilter] = useState<CardFilter>('todos')

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      // Card quick filter
      if (cardFilter === 'pendiente' && r.status !== 'pendiente') return false
      if (
        cardFilter === 'en_proceso' &&
        !(r.status === 'en_revision' || isReturnedForCorrection(r))
      )
        return false
      // Espeja el contador de SummaryCards: el rechazo es final pero no completó (#35).
      if (
        cardFilter === 'completado' &&
        !(isSuccessfullyClosed(r) || r.status === 'aprobado')
      )
        return false
      if (
        cardFilter === 'urgente' &&
        !(r.priority === 'urgente' && !isClosed(r))
      )
        return false

      if (typeFilter !== 'all' && r.type !== typeFilter) return false
      if (statusFilter !== 'all' && r.status !== statusFilter) return false
      if (responsibleFilter !== 'all' && r.assignedTo !== responsibleFilter) return false

      if (dateFilter !== 'all') {
        const days = (now - new Date(r.createdAt).getTime()) / 86400000
        if (days > Number(dateFilter)) return false
      }

      if (query.trim()) {
        const q = query.toLowerCase()
        const hay =
          r.studentName.toLowerCase().includes(q) ||
          r.studentCedula.includes(q) ||
          r.studentCode.includes(q) ||
          r.radicado.toLowerCase().includes(q) ||
          r.assignedTo.toLowerCase().includes(q)
        if (!hay) return false
      }
      return true
    })
  }, [requests, cardFilter, typeFilter, statusFilter, responsibleFilter, dateFilter, query, now])

  const hasActiveFilters =
    typeFilter !== 'all' ||
    statusFilter !== 'all' ||
    responsibleFilter !== 'all' ||
    dateFilter !== 'all' ||
    cardFilter !== 'todos' ||
    query.trim() !== ''

  function clearFilters() {
    setTypeFilter('all')
    setStatusFilter('all')
    setResponsibleFilter('all')
    setDateFilter('all')
    setCardFilter('todos')
    setQuery('')
  }

  const firstName = coordinatorName.replace(/^Coord\.\s*/, '').split(' ')[0]
  const responsibleOptions = Array.from(new Set(requests.map((request) => request.assignedTo))).sort()
  const openRequests = requests.filter((request) => !isClosed(request))
  const returnedRequests = requests.filter(isReturnedForCorrection)
  const averageOpenAge = openRequests.length === 0
    ? 0
    : Math.round(openRequests.reduce((total, request) => total + Math.max(0, now - new Date(request.createdAt).getTime()) / 86400000, 0) / openRequests.length)

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

        {/* Bandeja de trabajo: qué espera la acción de la Coordinación, sin que nadie
            busque. El orden y el recorte son del servidor (design.md, D1). */}
        <CoordinationInbox inbox={inbox} now={now} />

        {/* Summary cards */}
        <SummaryCards
          requests={requests}
          active={cardFilter}
          onSelect={(k) => setCardFilter(k as CardFilter)}
        />

        {/* Indicadores operativos calculados sobre las solicitudes cargadas desde el backend. */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: 'Ciclo promedio', value: metrics?.averageCycleHours == null ? `${averageOpenAge} d abiertos` : `${Math.round(metrics.averageCycleHours)} h`, hint: metrics?.averageCycleHours == null ? 'Sin cierres medidos todavía' : 'Desde radicación hasta cierre', className: 'text-primary' },
            { label: 'Devoluciones', value: metrics?.returnCount ?? returnedRequests.length, hint: metrics ? 'Históricas del timeline' : 'Activas en la bandeja', className: 'text-foreground' },
          ].map((metric) => (
            <div key={metric.label} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Timer className="size-3.5" />
                {metric.label}
              </div>
              <p className={`mt-2 text-2xl font-bold ${metric.className}`}>{metric.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{metric.hint}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
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
            <div className="flex flex-col gap-1.5 xl:col-span-1 md:col-span-2">
              <Label htmlFor="search" className="text-xs text-muted-foreground">
                Buscar
              </Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="search"
                  className="pl-9"
                  placeholder="Nombre, cédula o radicado…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>
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
          <form
            className="flex flex-wrap items-end gap-3"
            onSubmit={(event) => {
              event.preventDefault()
              void searchRequests(searchTerm)
            }}
          >
            <div className="flex flex-1 flex-col gap-1.5 min-w-[220px]">
              <Label htmlFor="request-search">Cédula o nombre del estudiante</Label>
              <Input
                id="request-search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Ej. 1090234 o Pérez"
              />
            </div>
            <Button type="submit">Buscar</Button>
          </form>

          {searchErrors.map((message) => (
            <p key={message} className="text-sm text-destructive">{message}</p>
          ))}

          {!searched && searchErrors.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Busque por cédula o nombre del estudiante para ver sus trámites. El sistema localiza
              solicitudes; no muestra el listado completo de estudiantes.
            </p>
          ) : null}

          {searched ? (
            <>
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
            </>
          ) : null}
        </div>
      </div>
    </AppShell>
  )
}
