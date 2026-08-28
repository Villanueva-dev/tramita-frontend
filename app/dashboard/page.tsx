'use client'

import Link from 'next/link'
import { FilePlus2, Info, Loader2, Search } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { RequestsTable } from '@/components/dashboard/requests-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth-store'
import { displayNameFromEmail } from '@/lib/identity'
import { useRequestSearch } from '@/lib/use-request-search'

// La bandeja pasó de filtrar una lista completa en memoria a consultar al
// servidor. El motor no expone "listar todo" —solo GET /requests?search= con
// mínimo 2 caracteres—, así que no hay nada que mostrar hasta que alguien
// busque. Los filtros por tipo, estado y fecha y las tarjetas de conteo salen
// por la misma razón: todos exigían tener el universo de solicitudes cargado.

export default function DashboardPage() {
  const { user } = useAuth()
  const { term, setTerm, results, loading, errors, canSearch, search } =
    useRequestSearch()

  const firstName = user ? displayNameFromEmail(user.email).split(' ')[0] : ''

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    void search()
  }

  return (
    <AppShell title="Bandeja de trabajo">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-serif text-2xl font-bold tracking-tight">
              Buenos días, {firstName}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Busque una solicitud por el nombre o la cédula del estudiante.
            </p>
          </div>
          <Link href="/requests/new">
            <Button size="lg" className="h-10 gap-2">
              <FilePlus2 className="size-4" />
              Nueva solicitud
            </Button>
          </Link>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4"
          noValidate
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="search">Nombre o cédula del estudiante</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="search"
                  className="pl-9"
                  placeholder="Ej. Pérez o 1000000001"
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  aria-invalid={errors.length > 0}
                />
              </div>
              <Button type="submit" className="h-10 gap-2 sm:w-36" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Buscando…
                  </>
                ) : (
                  'Buscar'
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              La cédula se busca completa; del nombre alcanza un fragmento.
            </p>
          </div>

          {errors.length > 0 && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              <Info className="mt-0.5 size-4 shrink-0" />
              <div className="flex flex-col gap-1">
                {errors.map((msg) => (
                  <span key={msg}>{msg}</span>
                ))}
              </div>
            </div>
          )}
        </form>

        {results === null ? (
          // Estado inicial: no es "sin resultados". Todavía no se consultó nada.
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card py-16 text-center">
            <span className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
              <Search className="size-6" />
            </span>
            <div>
              <p className="font-medium">Busque una solicitud para empezar</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Escriba al menos {canSearch ? '' : 'dos '}caracteres del nombre o
                la cédula del estudiante.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{results.length}</span>{' '}
              {results.length === 1 ? 'solicitud encontrada' : 'solicitudes encontradas'}
            </p>
            <RequestsTable requests={results} />
          </div>
        )}
      </div>
    </AppShell>
  )
}
