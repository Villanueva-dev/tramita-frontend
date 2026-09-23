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

// Spy estable (vi.hoisted): un `vi.fn()` nuevo en cada llamada a `useAuth` cambiaría la
// dependencia del efecto de `useCoordinationInbox` en cada render y lo pondría en bucle
// (design.md, «Trampas de estas pruebas»).
const sessionExpired = vi.hoisted(() => vi.fn())

vi.mock('@/components/app-shell', () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))
vi.mock('@/lib/auth-store', () => ({
  useAuth: () => ({
    status: 'authenticated',
    user: { email: 'coordinacion@correo.test' },
    login: vi.fn(),
    logout: vi.fn(),
    sessionExpired,
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
 * El stub enruta por URL. `/requests/inbox` (la bandeja, C7) responde por separado de
 * `/requests?search=` (la búsqueda): antes de este endurecimiento, una carga de la
 * bandeja al montar habría consumido la primera respuesta encolada para una búsqueda
 * (design.md, «Arreglo del stub de fetch en la integración»). `onSearch` sigue
 * decidiendo qué responde cada búsqueda, en orden de llamada. Cualquier otra URL —
 * incluida `/workflow-definitions`, sin consumidor desde que C5 borró el efecto que la
 * llamaba— sigue arrojando, para que una llamada inesperada se vea como error.
 */
function stubFetch(...onSearch: Response[]) {
  const queue = [...onSearch]
  const spy = vi.fn((input: RequestInfo | URL) => {
    const url = String(input)
    if (url.includes('/requests/inbox')) return Promise.resolve(json([]))
    if (url.includes('/requests?search=')) {
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

describe('DashboardPage con el store real — la bandeja convive con la búsqueda', () => {
  it('cargar la bandeja al montar no consume las respuestas encoladas de la búsqueda', async () => {
    const spy = stubFetch(json([MATCH]))
    render(<TramitaProvider><DashboardPage /></TramitaProvider>)

    await waitFor(() => {
      const inboxCalls = spy.mock.calls.filter(([input]) => String(input).includes('/requests/inbox'))
      expect(inboxCalls).toHaveLength(1)
    })
    const [inboxCall] = spy.mock.calls.filter(([input]) => String(input).includes('/requests/inbox'))
    expect(String(inboxCall[0])).toBe('/api/requests/inbox?responsible=COORDINACION&limit=50')

    search('Pérez')
    await waitFor(() => {
      expect(screen.getAllByText('Ana Pérez').length).toBeGreaterThan(0)
    })
  })

  it('buscar después de que la bandeja cargó sigue funcionando: el resultado mostrado es el de la búsqueda, no el de la bandeja', async () => {
    stubFetch(json([MATCH]))
    render(<TramitaProvider><DashboardPage /></TramitaProvider>)

    // La bandeja del stub responde vacía por defecto: confirma que ya cargó, sin buscar.
    await waitFor(() => {
      expect(screen.getByText(/no hay solicitudes pendientes/i)).toBeDefined()
    })

    search('Pérez')

    await waitFor(() => {
      expect(screen.getAllByText('Ana Pérez').length).toBeGreaterThan(0)
    })
  })
})
