import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import DashboardPage from './page'
import { TramitaProvider } from '@/lib/store'

/**
 * Estas pruebas montan el `TramitaProvider` real y stubean `fetch`, en lugar de
 * mockear el store como hace `page.test.tsx`.
 *
 * El motivo es el comportamiento que verifican: descartar los resultados de la
 * búsqueda anterior vive dentro de `searchRequests` del store, no en la página.
 * Con el store mockeado se estaría afirmando contra un doble propio, que es
 * exactamente lo que no prueba nada. Van en un archivo aparte porque `vi.mock`
 * es de módulo: los dos montajes no conviven en el mismo archivo.
 */

vi.mock('@/components/app-shell', () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))
vi.mock('@/lib/auth-store', () => ({
  useAuth: () => ({
    status: 'authenticated',
    user: { email: 'coordinacion@correo.test' },
    login: vi.fn(),
    logout: vi.fn(),
  }),
}))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/dashboard',
}))

const MATCH = {
  id: 'req-1',
  definition: { code: 'ADICION_CREDITOS', name: 'Adición de créditos', version: 1 },
  studentName: 'Ana Pérez',
  studentDocument: '1000000001',
  currentState: { code: 'EN_COORDINACION', name: 'En coordinación (revisión)', isFinal: false, isInitial: true },
  createdAt: '2026-09-01T12:00:00',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

/** El 500 se declara solo con `title`: es el campo que el backend llena siempre. */
function problem(title: string, status: number) {
  return new Response(JSON.stringify({ title, status }), {
    status,
    headers: { 'Content-Type': 'application/problem+json' },
  })
}

/**
 * El provider consulta el catálogo al montar, así que el stub enruta por URL.
 * `onSearch` decide qué responde cada búsqueda, en orden de llamada.
 */
function stubFetch(...onSearch: Response[]) {
  const queue = [...onSearch]
  const spy = vi.fn((input: RequestInfo | URL) => {
    const url = String(input)
    if (url.includes('/workflow-definitions')) return Promise.resolve(json([]))
    if (url.includes('/requests')) {
      return Promise.resolve(queue.shift() ?? json([]))
    }
    throw new Error(`URL no esperada en la prueba: ${url}`)
  })
  vi.stubGlobal('fetch', spy)
  return spy
}

function search(term: string) {
  fireEvent.change(screen.getByLabelText(/cédula o nombre/i), { target: { value: term } })
  fireEvent.click(screen.getByRole('button', { name: /buscar/i }))
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe('DashboardPage con el store real', () => {
  it('un error del backend se muestra y no deja los resultados anteriores en pantalla', async () => {
    stubFetch(json([MATCH]), problem('No se pudo consultar el directorio', 500))
    render(<TramitaProvider><DashboardPage /></TramitaProvider>)

    search('Pérez')
    await waitFor(() => {
      expect(screen.getAllByText('Ana Pérez').length).toBeGreaterThan(0)
    })

    search('Gómez')
    // Esperar el mensaje antes de afirmar la ausencia: si se mira el DOM
    // demasiado pronto, la petición todavía está en vuelo y el test pasa en
    // verde sin que el store haya hecho nada.
    await waitFor(() => {
      expect(screen.getByText(/no se pudo consultar el directorio/i)).toBeDefined()
    })
    expect(screen.queryByText('Ana Pérez')).toBeNull()
  })

  it('con menos de 2 caracteres avisa, no consulta y limpia los resultados anteriores', async () => {
    const spy = stubFetch(json([MATCH]))
    render(<TramitaProvider><DashboardPage /></TramitaProvider>)

    search('Pérez')
    await waitFor(() => {
      expect(screen.getAllByText('Ana Pérez').length).toBeGreaterThan(0)
    })
    const afterFirstSearch = spy.mock.calls.length

    search('a')

    await waitFor(() => {
      expect(screen.getByText(/escriba al menos 2 caracteres/i)).toBeDefined()
    })
    expect(screen.queryByText('Ana Pérez')).toBeNull()
    // El mínimo lo impone el contrato (`@Size(min = 2)`): la guarda evita el
    // 400, no solo el mensaje.
    expect(spy.mock.calls.length).toBe(afterFirstSearch)
  })
})
