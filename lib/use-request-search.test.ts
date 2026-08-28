import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act, cleanup } from '@testing-library/react'
import { useRequestSearch } from './use-request-search'
import type { RequestSummary } from './types'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

const MATCH: RequestSummary = {
  id: 'req-1',
  definition: { code: 'ADICION_CREDITOS', name: 'Adición de créditos', version: 1 },
  studentName: 'Ana Pérez',
  studentDocument: '1000000001',
  currentState: { code: 'REGISTRADA', name: 'Registrada', isFinal: false },
  createdAt: '2026-08-28T17:33:15.542189426',
}

function stubFetch(body: unknown = [MATCH], status = 200) {
  const spy = vi.fn((_input: RequestInfo | URL, _init?: RequestInit) =>
    Promise.resolve(
      new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
      }),
    ),
  )
  vi.stubGlobal('fetch', spy)
  return spy
}

describe('useRequestSearch', () => {
  it('arranca sin resultados y sin haber consultado', () => {
    stubFetch()
    const { result } = renderHook(() => useRequestSearch())

    // null distingue "todavía no buscaste" de "buscaste y no hubo nada" ([]).
    expect(result.current.results).toBeNull()
    expect(result.current.loading).toBe(false)
    expect(result.current.canSearch).toBe(false)
  })

  it('no emite la petición con menos de 2 caracteres', async () => {
    const spy = stubFetch()
    const { result } = renderHook(() => useRequestSearch())

    act(() => result.current.setTerm('a'))
    expect(result.current.canSearch).toBe(false)

    await act(async () => {
      await result.current.search()
    })

    expect(spy).not.toHaveBeenCalled()
    expect(result.current.results).toBeNull()
    // Bloquear en silencio no es informar: el usuario debe saber por qué no pasa nada.
    expect(result.current.errors.length).toBeGreaterThan(0)
  })

  it('tampoco cuenta el espacio en blanco como carácter', async () => {
    const spy = stubFetch()
    const { result } = renderHook(() => useRequestSearch())

    act(() => result.current.setTerm(' a '))

    expect(result.current.canSearch).toBe(false)
    await act(async () => {
      await result.current.search()
    })
    expect(spy).not.toHaveBeenCalled()
  })

  it('consulta con 2 caracteres y expone los resultados', async () => {
    const spy = stubFetch()
    const { result } = renderHook(() => useRequestSearch())

    act(() => result.current.setTerm('Pé'))
    expect(result.current.canSearch).toBe(true)

    await act(async () => {
      await result.current.search()
    })

    expect(spy).toHaveBeenCalledTimes(1)
    expect(String(spy.mock.calls[0][0])).toContain('/requests?search=P%C3%A9')
    expect(result.current.results).toEqual([MATCH])
  })

  it('envía el término recortado', async () => {
    const spy = stubFetch()
    const { result } = renderHook(() => useRequestSearch())

    act(() => result.current.setTerm('  Ana  '))
    await act(async () => {
      await result.current.search()
    })

    expect(String(spy.mock.calls[0][0])).toContain('/requests?search=Ana')
  })

  it('distingue "sin resultados" del estado inicial', async () => {
    stubFetch([])
    const { result } = renderHook(() => useRequestSearch())

    act(() => result.current.setTerm('zzz'))
    await act(async () => {
      await result.current.search()
    })

    // Lista vacía, no null: la UI debe decir "sin resultados", no el estado inicial.
    expect(result.current.results).toEqual([])
    expect(result.current.errors).toHaveLength(0)
  })

  it('traduce un error del backend y no deja resultados a medias', async () => {
    stubFetch({ title: 'Error interno', status: 500 }, 500)
    const { result } = renderHook(() => useRequestSearch())

    act(() => result.current.setTerm('Ana'))
    await act(async () => {
      await result.current.search()
    })

    expect(result.current.errors.length).toBeGreaterThan(0)
    expect(result.current.results).toBeNull()
    expect(result.current.loading).toBe(false)
  })
})
