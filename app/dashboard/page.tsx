'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ArrowLeft, FilePlus2, Search, SlidersHorizontal, UserRound, X } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { CoordinationInbox } from '@/components/dashboard/coordination-inbox'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { typeFromCode, useTramita } from '@/lib/store'
import { useCoordinationInbox } from '@/lib/use-coordination-inbox'
import { REQUEST_TYPE_LABELS } from '@/lib/ui-constants'
import type { AcademicRequest, InboxEntry, RequestType } from '@/lib/types'

/**
 * Adapta un resultado de búsqueda al formato de la bandeja (lista-unica-resultados D2):
 * una sola lista en pantalla, en vez de la tabla sin paginar que antes mostraban los
 * resultados. `waitingSince = createdAt` porque los resultados no "esperan" una
 * transición —incluyen trámites cerrados—; la variante `results` de `CoordinationInbox`
 * ya rotula ese instante como "Radicada hace…", no "Esperando desde hace…".
 * `pendingResponsible: request.assignedTo` (#96, D2): con el filtro unificado sobre
 * `InboxEntry[]`, «Responsable» lee este campo también en los resultados.
 */
function toInboxEntry(request: AcademicRequest): InboxEntry {
  return {
    id: request.id,
    definition: request.definition,
    studentName: request.studentName,
    currentState: request.currentState,
    createdAt: request.createdAt,
    waitingSince: request.createdAt,
    pendingResponsible: request.assignedTo,
    origin: request.origin ?? null,
  }
}

export default function DashboardPage() {
  const { requests, coordinatorName, searchRequests, searched, searchErrors, clearSearch } = useTramita()
  const inbox = useCoordinationInbox()
  const [now] = useState(() => Date.now())
  // Término que viaja al backend (localización); los filtros de abajo acotan
  // los resultados ya traídos, sin volver a preguntarle al servidor.
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<RequestType | 'all'>('all')
  // Nombre de estado del servidor (`currentState.name`), no `RequestStatus` (#96, D3):
  // el selector se arma con los estados presentes en la lista activa, no con un mapa fijo.
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [responsibleFilter, setResponsibleFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState<'all' | '7' | '30'>('all')

  // Todos los resultados adaptados al formato de la bandeja (#96, D1): antes solo se
  // adaptaban los ya filtrados; ahora el filtro corre sobre esta lista completa.
  const resultEntries = useMemo(() => requests.map(toInboxEntry), [requests])
  const inboxEntries = inbox.status === 'ready' ? inbox.entries : []
  // Lista activa (#96, D1): la bandeja sin buscar, los resultados con búsqueda. Un solo
  // predicado filtra las dos, en vez de duplicar reglas entre `AcademicRequest` e `InboxEntry`.
  const activeEntries: InboxEntry[] = searched ? resultEntries : inboxEntries

  const filtered = useMemo(() => {
    return activeEntries.filter((entry) => {
      if (typeFilter !== 'all' && typeFromCode(entry.definition.code) !== typeFilter) return false
      if (statusFilter !== 'all' && entry.currentState.name !== statusFilter) return false
      // Responsable solo tiene sentido con resultados (#96): sin buscar, la lista activa
      // es la bandeja y siempre es la Coordinación (decisión del propietario).
      if (searched && responsibleFilter !== 'all' && entry.pendingResponsible !== responsibleFilter) {
        return false
      }

      if (dateFilter !== 'all') {
        const days = (now - new Date(entry.createdAt).getTime()) / 86400000
        if (days > Number(dateFilter)) return false
      }

      return true
    })
  }, [activeEntries, typeFilter, statusFilter, responsibleFilter, dateFilter, searched, now])

  // Estados presentes en la lista activa, no un mapa legado (#96, D3): sin lista
  // (cargando, error, vacía) `activeEntries` es `[]` y solo queda «Todos los estados».
  const statusOptions = Array.from(new Set(activeEntries.map((entry) => entry.currentState.name))).sort(
    (a, b) => a.localeCompare(b, 'es'),
  )

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

  // «Volver a la bandeja» (D5): deja el tablero como al entrar. `clearSearch` es la única
  // forma honesta de apagar `searched` (D3); limpiar filtros y el término evita que
  // reaparezcan al buscar de nuevo.
  function returnToInbox() {
    clearSearch()
    setSearchTerm('')
    clearFilters()
  }

  const firstName = coordinatorName.replace(/^Coord\.\s*/, '').split(' ')[0]
  // `GET /requests?search=` no devuelve el responsable (RequestSummary, contrato :237-246):
  // `assignedTo` llega vacío salvo en solicitudes ya cargadas con su detalle. Sin datos, el
  // selector no se ofrece; antes mostraba una opción en blanco.
  const responsibleOptions = Array.from(
    new Set(resultEntries.map((entry) => entry.pendingResponsible).filter((responsible) => responsible !== '')),
  ).sort()
  // Un filtro nuevo es una lista nueva: la `key` la vuelve a montar en la página 1.
  const filtersKey = `${typeFilter}|${statusFilter}|${responsibleFilter}|${dateFilter}`

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

          {searched && (
            <Button
              type="button"
              variant="ghost"
              className="h-12 w-fit gap-2 text-base"
              onClick={returnToInbox}
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Volver a la bandeja
            </Button>
          )}

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

        {/* El panel acota la lista activa (#96): la bandeja sin buscar, los resultados con
            búsqueda. Sustituye la D4 de #56 (filtros solo tras buscar): la Coordinación
            quiere acotar los pendientes sin buscar. La bandeja se filtra en el cliente
            porque `GET /requests/inbox` solo acepta `responsible` y `limit` (contrato 007,
            :67-95), sin parámetro de filtro. */}
        <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <SlidersHorizontal className="size-4 text-primary" />
            Filtros
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
            {searched && responsibleOptions.length > 0 && (
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
            )}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="status" className="text-xs text-muted-foreground">
                Estado
              </Label>
              <Select
                id="status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Todos los estados</option>
                {statusOptions.map((name) => (
                  <option key={name} value={name}>
                    {name}
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

        {/* La lista de resultados ya dice «Mostrando a–b de n» (D4): esto solo explica
            por qué se ve menos, cuando hay un filtro activo. */}
        {hasActiveFilters && (
          <p className="text-sm text-muted-foreground">
            {filtered.length} de {activeEntries.length} coinciden con los filtros
          </p>
        )}

        {/* Una sola lista en pantalla (lista-unica-resultados): sin buscar, la bandeja de
            trabajo —qué espera la acción de la Coordinación, en el orden del servidor
            (design.md, D1)—; tras buscar, los resultados en el mismo formato (D1/D2), para
            que dos listas con distinto propósito no lean como "la misma cosa". Los filtros
            (#96) se aplican sobre ambas mediante `filtered`; `filtersKey` (D5) las remonta
            en la página 1 al cambiar. */}
        {!searched && (
          <CoordinationInbox
            key={filtersKey}
            inbox={inbox.status === 'ready' ? { ...inbox, entries: filtered } : inbox}
            now={now}
          />
        )}
        {searched && (
          <CoordinationInbox
            key={filtersKey}
            variant="results"
            inbox={{ status: 'ready', entries: filtered, mayHaveMore: false }}
            now={now}
          />
        )}
      </div>
    </AppShell>
  )
}
