import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, waitFor, cleanup } from '@testing-library/react'
import { useCoordinationInbox, COORDINATION_RESPONSIBLE, INBOX_LIMIT } from './use-coordination-inbox'
import type { InboxEntry } from './types'

// Spy estable (vi.hoisted): si `useAuth` devolviera un `vi.fn()` nuevo en cada llamada,
// la dependencia del efecto del hook cambiaría en cada render y el efecto correría en
// bucle (design.md, «Trampas de estas pruebas»).
const sessionExpired = vi.hoisted(() => vi.fn())

vi.mock('./auth-store', () => ({
  useAuth: () => ({ sessionExpired }),
}))

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

function entry(overrides: Partial<InboxEntry> = {}): InboxEntry {
  return {
    id: 'entry-1',
    definition: { code: 'ADICION_CREDITOS', name: 'Adición de créditos', version: 1 },
    studentName: 'Estudiante de prueba 1',
    currentState: { code: 'EN_COORDINACION', name: 'En coordinación (revisión)', isFinal: false, isInitial: true },
    createdAt: '2026-08-20T15:00:00-05:00',
    waitingSince: '2026-09-20T15:00:00-05:00',
    pendingResponsible: 'COORDINACION',
    origin: 'COORDINATION',
    ...overrides,
  }
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function problemResponse(status: number, title: string): Response {
  return new Response(JSON.stringify({ title, status }), {
    status,
    headers: { 'Content-Type': 'application/problem+json' },
  })
}

describe('useCoordinationInbox', () => {
  it('consulta con responsible=COORDINACION y limit=50 al montar', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, []))
    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(() => useCoordinationInbox())

    expect(COORDINATION_RESPONSIBLE).toBe('COORDINACION')
    expect(INBOX_LIMIT).toBe(50)
    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/requests/inbox?responsible=COORDINACION&limit=50',
      expect.objectContaining({ method: 'GET' }),
    )
  })

  // Regla del fixture (design.md, «Regla del fixture para el orden»): el orden no coincide
  // con lo que produciría ordenar por ninguna clave candidata, así que un `.sort()` sobre
  // cualquiera de ellas cambia el resultado observado.
  it('transiciona loading → ready con las entradas en el orden exacto del servidor', async () => {
    const entries = [
      entry({ id: 'entry-a', studentName: 'Estudiante de prueba 2', waitingSince: daysAgo(5), createdAt: daysAgo(40) }),
      entry({ id: 'entry-b', studentName: 'Estudiante de prueba 3', waitingSince: daysAgo(20), createdAt: daysAgo(10) }),
      entry({ id: 'entry-c', studentName: 'Estudiante de prueba 1', waitingSince: daysAgo(1), createdAt: daysAgo(60) }),
    ]
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(200, entries)))

    const { result } = renderHook(() => useCoordinationInbox())

    expect(result.current.status).toBe('loading')
    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(result.current).toMatchObject({ status: 'ready', entries })
  })

  it('mayHaveMore es true con exactamente INBOX_LIMIT (50) entradas', async () => {
    const entries = Array.from({ length: 50 }, (_, i) => entry({ id: `entry-${i}` }))
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(200, entries)))

    const { result } = renderHook(() => useCoordinationInbox())

    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(result.current).toMatchObject({ mayHaveMore: true })
  })

  it('mayHaveMore es false con INBOX_LIMIT − 1 (49) entradas', async () => {
    const entries = Array.from({ length: 49 }, (_, i) => entry({ id: `entry-${i}` }))
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(200, entries)))

    const { result } = renderHook(() => useCoordinationInbox())

    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(result.current).toMatchObject({ mayHaveMore: false })
  })

  it('una bandeja vacía resuelve ready con entries: [], no error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(200, [])))

    const { result } = renderHook(() => useCoordinationInbox())

    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(result.current).toMatchObject({ status: 'ready', entries: [], mayHaveMore: false })
  })

  it('un 500 resuelve error con el title del problem, sin fallback', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(problemResponse(500, 'No se pudo consultar la bandeja')))

    const { result } = renderHook(() => useCoordinationInbox())

    await waitFor(() => expect(result.current.status).toBe('error'))
    expect(result.current).toMatchObject({
      status: 'error',
      messages: ['No se pudo consultar la bandeja'],
    })
  })

  it('una falla de red resuelve error con el mensaje de conexión', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    const { result } = renderHook(() => useCoordinationInbox())

    await waitFor(() => expect(result.current.status).toBe('error'))
    expect(result.current).toMatchObject({
      status: 'error',
      messages: ['Sin conexión con el servidor. Intente más tarde.'],
    })
  })

  it('un 401 llama a sessionExpired exactamente una vez y no produce mensaje', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 401 })))

    renderHook(() => useCoordinationInbox())

    await waitFor(() => expect(sessionExpired).toHaveBeenCalledTimes(1))
    expect(sessionExpired).toHaveBeenCalledTimes(1)
  })
})

/** Fecha relativa a "ahora", sin offset — como el backend. Con al menos una hora de margen. */
function daysAgo(days: number): string {
  const d = new Date(Date.now() - days * 86400000 - 3600000)
  return d.toISOString().slice(0, 19)
}
