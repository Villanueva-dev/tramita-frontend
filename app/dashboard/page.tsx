'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { FilePlus2, Search, SlidersHorizontal, X } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { SummaryCards } from '@/components/dashboard/summary-cards'
import { RequestsTable } from '@/components/dashboard/requests-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useTramita } from '@/lib/store'
import { useAuth } from '@/lib/auth-store'
import { displayNameFromEmail } from '@/lib/identity'
import { REQUEST_TYPE_LABELS, STATUS_LABELS } from '@/lib/mock-data'
import { isOverdue } from '@/lib/format'
import type { RequestStatus, RequestType } from '@/lib/types'

type CardFilter =
  | 'todos'
  | 'pendiente'
  | 'en_proceso'
  | 'completado'
  | 'urgente'

export default function DashboardPage() {
  const { requests } = useTramita()
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<RequestType | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<RequestStatus | 'all'>('all')
  const [dateFilter, setDateFilter] = useState<'all' | '7' | '30'>('all')
  const [cardFilter, setCardFilter] = useState<CardFilter>('todos')

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      // Card quick filter
      if (cardFilter === 'pendiente' && r.status !== 'pendiente') return false
      if (
        cardFilter === 'en_proceso' &&
        !(r.status === 'en_revision' || r.status === 'devuelto')
      )
        return false
      if (
        cardFilter === 'completado' &&
        !(r.status === 'aprobado' || r.status === 'finalizado')
      )
        return false
      if (
        cardFilter === 'urgente' &&
        !(
          (r.priority === 'urgente' || isOverdue(r.dueDate, r.status)) &&
          r.status !== 'finalizado'
        )
      )
        return false

      if (typeFilter !== 'all' && r.type !== typeFilter) return false
      if (statusFilter !== 'all' && r.status !== statusFilter) return false

      if (dateFilter !== 'all') {
        const days = (Date.now() - new Date(r.createdAt).getTime()) / 86400000
        if (days > Number(dateFilter)) return false
      }

      if (query.trim()) {
        const q = query.toLowerCase()
        const hay =
          r.studentName.toLowerCase().includes(q) ||
          r.studentCedula.includes(q) ||
          r.studentCode.includes(q) ||
          r.radicado.toLowerCase().includes(q)
        if (!hay) return false
      }
      return true
    })
  }, [requests, cardFilter, typeFilter, statusFilter, dateFilter, query])

  const hasActiveFilters =
    typeFilter !== 'all' ||
    statusFilter !== 'all' ||
    dateFilter !== 'all' ||
    cardFilter !== 'todos' ||
    query.trim() !== ''

  function clearFilters() {
    setTypeFilter('all')
    setStatusFilter('all')
    setDateFilter('all')
    setCardFilter('todos')
    setQuery('')
  }

  const firstName = user ? displayNameFromEmail(user.email).split(' ')[0] : ''

  return (
    <AppShell title="Bandeja de trabajo">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-serif text-2xl font-bold tracking-tight">
              Buenos días, {firstName}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Tiene {requests.filter((r) => r.status === 'pendiente').length}{' '}
              solicitudes pendientes y{' '}
              {
                requests.filter(
                  (r) =>
                    r.priority === 'urgente' && r.status !== 'finalizado',
                ).length
              }{' '}
              con atención prioritaria.
            </p>
          </div>
          <Link href="/requests/new">
            <Button size="lg" className="h-10 gap-2">
              <FilePlus2 className="size-4" />
              Nueva solicitud
            </Button>
          </Link>
        </div>

        {/* Summary cards */}
        <SummaryCards
          requests={requests}
          active={cardFilter}
          onSelect={(k) => setCardFilter(k as CardFilter)}
        />

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
          <RequestsTable requests={filtered} />
        </div>
      </div>
    </AppShell>
  )
}
