import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act, waitFor, cleanup } from '@testing-library/react'
import { useRequestDetail } from './use-request-detail'
import type { Request, TimelineEntry } from './types'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

const REQUEST: Request = {
  id: 'req-1',
  definition: { code: 'ADICION_CREDITOS', name: 'Adición de créditos', version: 1 },
  studentName: 'Ana Pérez',
  studentDocument: '1000000001',
  currentState: { code: 'REGISTRADA', name: 'Registrada', isFinal: false },
  availableTransitions: [
    {
      targetState: { code: 'EN_FACULTAD', name: 'En facultad', isFinal: false },
      responsible: 'COORDINACION',
      requiresNote: false,
    },
  ],
  createdAt: '2026-08-20T15:00:00',
}

const TIMELINE: TimelineEntry[] = [
  {
    id: 1,
    fromState: null,
    toState: { code: 'REGISTRADA', name: 'Registrada', isFinal: false },
    actorEmail: 'coord@uniremington.edu.co',
    responsible: null,
    note: null,
    occurredAt: '2026-08-20T15:00:00',
  },
]

function json(status: number, body: unknown, problem = false): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': problem ? 'application/problem+json' : 'application/json',
    },
  })
}

/** Enruta por URL: el detalle y el timeline son dos GET distintos. */
function stubFetch(detail = () => json(200, REQUEST), timeline = () => json(200, TIMELINE)) {
  const spy = vi.fn((input: RequestInfo | URL, _init?: RequestInit) =>
    Promise.resolve(String(input).includes('/timeline') ? timeline() : detail()),
  )
  vi.stubGlobal('fetch', spy)
  return spy
}

describe('useRequestDetail', () => {
  it('carga detalle y timeline con dos peticiones', async () => {
    const spy = stubFetch()
    const { result } = renderHook(() => useRequestDetail('req-1'))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.request).toEqual(REQUEST)
    expect(result.current.timeline).toEqual(TIMELINE)
    expect(result.current.notFound).toBe(false)
    expect(spy).toHaveBeenCalledTimes(2)
  })

  it('expone loading mientras las dos peticiones están en vuelo', async () => {
    stubFetch()
    const { result } = renderHook(() => useRequestDetail('req-1'))

    // Arranca cargando: la pantalla no debe pintar "no encontrado" antes de saber.
    expect(result.current.loading).toBe(true)
    expect(result.current.notFound).toBe(false)

    await waitFor(() => expect(result.current.loading).toBe(false))
  })

  it('un 404 es notFound, no un banner de error', async () => {
    stubFetch(() => json(404, { title: 'Recurso no encontrado', status: 404 }, true))
    const { result } = renderHook(() => useRequestDetail('nope'))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.notFound).toBe(true)
    expect(result.current.errors).toHaveLength(0)
    expect(result.current.request).toBeNull()
  })

  it('otros errores van a errors y no a notFound', async () => {
    stubFetch(() => json(500, { title: 'Error interno', status: 500 }, true))
    const { result } = renderHook(() => useRequestDetail('req-1'))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.notFound).toBe(false)
    expect(result.current.errors.length).toBeGreaterThan(0)
    expect(result.current.request).toBeNull()
  })

  it('reload() vuelve a consultar y refleja el estado nuevo', async () => {
    const avanzada: Request = {
      ...REQUEST,
      currentState: { code: 'EN_FACULTAD', name: 'En facultad', isFinal: false },
    }
    let current = REQUEST
    const spy = stubFetch(() => json(200, current))

    const { result } = renderHook(() => useRequestDetail('req-1'))
    await waitFor(() => expect(result.current.request?.currentState.code).toBe('REGISTRADA'))

    current = avanzada
    act(() => result.current.reload())

    await waitFor(() => expect(result.current.request?.currentState.code).toBe('EN_FACULTAD'))
    expect(spy).toHaveBeenCalledTimes(4)
  })

  it('descarta la respuesta obsoleta cuando cambia el id antes de que resuelva', async () => {
    let releaseFirst!: () => void
    const firstDetail = new Promise<Response>((resolve) => {
      releaseFirst = () => resolve(json(200, REQUEST))
    })

    const spy = vi.fn((input: RequestInfo | URL, _init?: RequestInit) => {
      const url = String(input)
      if (url.includes('/timeline')) return Promise.resolve(json(200, TIMELINE))
      if (url.includes('req-1')) return firstDetail
      return Promise.resolve(
        json(200, { ...REQUEST, id: 'req-2', studentName: 'Beto Gómez' }),
      )
    })
    vi.stubGlobal('fetch', spy)

    const { result, rerender } = renderHook(({ id }) => useRequestDetail(id), {
      initialProps: { id: 'req-1' },
    })

    rerender({ id: 'req-2' })
    await waitFor(() => expect(result.current.request?.studentName).toBe('Beto Gómez'))

    // La primera petición resuelve tarde: su respuesta ya no corresponde al id
    // vigente y no debe pisar la que sí.
    await act(async () => {
      releaseFirst()
      await Promise.resolve()
    })

    expect(result.current.request?.studentName).toBe('Beto Gómez')
  })
})
