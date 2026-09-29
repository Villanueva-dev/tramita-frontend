'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { ChevronLeft, ChevronRight, FilePlus2, LoaderCircle, Search, SlidersHorizontal, Timer, UserRound, X } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { SummaryCards } from '@/components/dashboard/summary-cards'
import { RequestsTable } from '@/components/dashboard/requests-table'
import { CoordinationInbox } from '@/components/dashboard/coordination-inbox'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useTramita } from '@/lib/store'
import { fetchDashboardCategory } from '@/lib/api'
import { useCoordinationInbox } from '@/lib/use-coordination-inbox'
import { REQUEST_TYPE_LABELS, STATUS_LABELS } from '@/lib/ui-constants'
import { isClosed, isReturnedForCorrection } from '@/lib/request-state'
import { formatDate } from '@/lib/format'
import type { DashboardRequestCategory, DashboardRequestPage, RequestStatus, RequestType } from '@/lib/types'

type CardFilter =
  | 'todos'
  | 'pendiente'
  | 'en_proceso'
  | 'completado'
  | 'urgente'

const CATEGORY_BY_CARD: Record<Exclude<CardFilter, 'todos'>, DashboardRequestCategory> = {
  pendiente: 'PENDING',
  en_proceso: 'IN_PROGRESS',
  completado: 'COMPLETED',
  urgente: 'URGENT',
}

const FILTERS_STORAGE_KEY = 'tramita-dashboard-filters-v1'
const FILTERS_CHANGED_EVENT = 'tramita-dashboard-filters-changed'
let fallbackFiltersSnapshot = ''

const DEFAULT_FILTERS: PersistedFilters = {
  typeFilter: 'all',
  statusFilter: 'all',
  responsibleFilter: 'all',
  dateFilter: 'all',
  cardFilter: 'todos',
}

interface PersistedFilters {
  typeFilter: RequestType | 'all'
  statusFilter: RequestStatus | 'all'
  responsibleFilter: string
  dateFilter: 'all' | '7' | '30'
  cardFilter: CardFilter
}

function subscribeToPersistedFilters(onChange: () => void) {
  window.addEventListener(FILTERS_CHANGED_EVENT, onChange)
  window.addEventListener('storage', onChange)
  return () => {
    window.removeEventListener(FILTERS_CHANGED_EVENT, onChange)
    window.removeEventListener('storage', onChange)
  }
}

function getPersistedFiltersSnapshot(): string {
  try {
    return window.sessionStorage.getItem(FILTERS_STORAGE_KEY) ?? ''
  } catch {
    return fallbackFiltersSnapshot
  }
}

function readPersistedFilters(stored: string): PersistedFilters {
  try {
    if (!stored) return DEFAULT_FILTERS
    const value = JSON.parse(stored) as Record<string, unknown>

    return {
      typeFilter:
        typeof value.typeFilter === 'string' &&
        value.typeFilter in REQUEST_TYPE_LABELS
          ? (value.typeFilter as RequestType)
          : 'all',
      statusFilter:
        typeof value.statusFilter === 'string' &&
        value.statusFilter in STATUS_LABELS
          ? (value.statusFilter as RequestStatus)
          : 'all',
      responsibleFilter:
        typeof value.responsibleFilter === 'string'
          ? value.responsibleFilter
          : 'all',
      dateFilter:
        value.dateFilter === '7' || value.dateFilter === '30'
          ? value.dateFilter
          : 'all',
      cardFilter:
        value.cardFilter === 'pendiente' ||
        value.cardFilter === 'en_proceso' ||
        value.cardFilter === 'completado' ||
        value.cardFilter === 'urgente'
          ? value.cardFilter
          : 'todos',
    }
  } catch {
    return DEFAULT_FILTERS
  }
}

export default function DashboardPage() {
  const { requests, metrics, coordinatorName, searchRequests, searched, searchErrors } = useTramita()
  const inbox = useCoordinationInbox()
  const filtersSnapshot = useSyncExternalStore(
    subscribeToPersistedFilters,
    getPersistedFiltersSnapshot,
    () => '',
  )
  const filters = useMemo(() => readPersistedFilters(filtersSnapshot), [filtersSnapshot])
  const [now] = useState(() => Date.now())
  // Término que viaja al backend (localización), distinto de `query`, que filtra
  // en el cliente lo ya traído.
  const [searchTerm, setSearchTerm] = useState('')
  const [query, setQuery] = useState('')
  const [dashboardPage, setDashboardPage] = useState(0)
  function updateFilters(changes: Partial<PersistedFilters>) {
    const next = { ...filters, ...changes }
    const serialized = JSON.stringify(next)
    fallbackFiltersSnapshot = serialized
    try {
      window.sessionStorage.setItem(FILTERS_STORAGE_KEY, serialized)
    } catch {}
    window.dispatchEvent(new Event(FILTERS_CHANGED_EVENT))
  }

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      if (filters.typeFilter !== 'all' && r.type !== filters.typeFilter) return false
      if (filters.statusFilter !== 'all' && r.status !== filters.statusFilter) return false
      if (filters.responsibleFilter !== 'all' && r.assignedTo !== filters.responsibleFilter) return false

      if (filters.dateFilter !== 'all') {
        const days = (now - new Date(r.createdAt).getTime()) / 86400000
        if (days > Number(filters.dateFilter)) return false
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
  }, [requests, filters, query, now])

  const hasActiveFilters =
    filters.typeFilter !== 'all' ||
    filters.statusFilter !== 'all' ||
    filters.responsibleFilter !== 'all' ||
    filters.dateFilter !== 'all' ||
    filters.cardFilter !== 'todos' ||
    query.trim() !== ''

  function clearFilters() {
    updateFilters(DEFAULT_FILTERS)
    setQuery('')
  }

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
              Buenos días
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
          metrics={metrics}
          active={filters.cardFilter}
          onSelect={(k) => {
            setDashboardPage(0)
            updateFilters({ cardFilter: k as CardFilter })
          }}
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
                value={filters.typeFilter}
                onChange={(e) =>
                  updateFilters({ typeFilter: e.target.value as RequestType | 'all' })
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
                  value={filters.responsibleFilter}
                  onChange={(e) => updateFilters({ responsibleFilter: e.target.value })}
                >
                  <option value="all">Todos los responsables</option>
                  {filters.responsibleFilter !== 'all' &&
                    !responsibleOptions.includes(filters.responsibleFilter) && (
                      <option value={filters.responsibleFilter}>{filters.responsibleFilter}</option>
                    )}
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
                value={filters.statusFilter}
                onChange={(e) =>
                  updateFilters({ statusFilter: e.target.value as RequestStatus | 'all' })
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
                value={filters.dateFilter}
                onChange={(e) =>
                  updateFilters({ dateFilter: e.target.value as 'all' | '7' | '30' })
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

          {filters.cardFilter === 'todos' && !searched && searchErrors.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Busque por cédula o nombre del estudiante para ver sus trámites. El sistema localiza
              solicitudes; no muestra el listado completo de estudiantes.
            </p>
          ) : null}

          {filters.cardFilter !== 'todos' ? (
            <DashboardCategoryResults
              category={CATEGORY_BY_CARD[filters.cardFilter]}
              page={dashboardPage}
              onPageChange={setDashboardPage}
            />
          ) : searched ? (
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

function DashboardCategoryResults({
  category,
  page,
  onPageChange,
}: {
  category: DashboardRequestCategory
  page: number
  onPageChange: (page: number) => void
}) {
  const [resultState, setResultState] = useState<{
    key: string
    result?: DashboardRequestPage
    error?: string
  }>({ key: '' })
  const requestKey = `${category}:${page}`

  useEffect(() => {
    let active = true
    fetchDashboardCategory(category, page, 25)
      .then((result) => {
        if (active) setResultState({ key: requestKey, result })
      })
      .catch((error: unknown) => {
        if (active) {
          setResultState({
            key: requestKey,
            error: error instanceof Error ? error.message : 'No se pudieron cargar los trámites.',
          })
        }
      })
    return () => {
      active = false
    }
  }, [category, page, requestKey])

  if (resultState.key !== requestKey) {
    return (
      <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
        <LoaderCircle className="size-4 animate-spin" /> Cargando trámites...
      </p>
    )
  }
  if (resultState.error) {
    return <p role="alert" className="text-sm text-destructive">{resultState.error}</p>
  }

  const result = resultState.result!
  if (result.content.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay trámites en esta categoría.</p>
  }

  return (
    <section aria-label="Trámites de la categoría" className="flex flex-col gap-3">
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium">Estudiante</th>
              <th className="px-4 py-3 font-medium">Trámite</th>
              <th className="px-4 py-3 font-medium">Estado actual</th>
              <th className="px-4 py-3 font-medium">Radicado</th>
              <th className="px-4 py-3 font-medium">Prioridad</th>
            </tr>
          </thead>
          <tbody>
            {result.content.map((request) => (
              <tr key={request.id} className="border-b border-border/60 last:border-0 hover:bg-muted/40">
                <td className="px-4 py-3">
                  <Link href={`/requests/${request.id}`} className="font-medium text-primary hover:underline">
                    {request.studentName}
                  </Link>
                </td>
                <td className="px-4 py-3">{request.definition.name}</td>
                <td className="px-4 py-3">{request.currentState.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{formatDate(request.createdAt)}</td>
                <td className="px-4 py-3">{request.priority === 'urgente' ? 'Urgente' : 'Normal'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
        <span>
          {result.totalElements} trámites · Página {result.page + 1} de {Math.max(result.totalPages, 1)}
        </span>
        <nav aria-label="Paginación de trámites" className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Página anterior"
            disabled={!result.hasPrevious}
            onClick={() => onPageChange(result.page - 1)}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Página siguiente"
            disabled={!result.hasNext}
            onClick={() => onPageChange(result.page + 1)}
          >
            <ChevronRight className="size-4" />
          </Button>
        </nav>
      </div>
    </section>
  )
}
