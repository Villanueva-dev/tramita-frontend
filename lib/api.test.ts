import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  ApiError,
  parseCookie,
  parseProblem,
  listWorkflowDefinitions,
  createRequest,
  CREATE_REQUEST_422_FIELD,
  searchRequests,
  getRequest,
  getRequestTimeline,
  advanceRequest,
  ADVANCE_REQUEST_422_FIELD,
} from './api'
import type { Request, RequestSummary, TimelineEntry, WorkflowDefinition } from './types'

afterEach(() => {
  vi.unstubAllGlobals()
})

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function problemResponse(status: number, title: string, detail?: string): Response {
  return new Response(JSON.stringify({ title, status, detail }), {
    status,
    headers: { 'Content-Type': 'application/problem+json' },
  })
}

describe('parseCookie', () => {
  it('extrae el valor de una cookie presente', () => {
    expect(parseCookie('XSRF-TOKEN=abc123', 'XSRF-TOKEN')).toBe('abc123')
  })

  it('encuentra la cookie entre varias', () => {
    expect(parseCookie('a=1; XSRF-TOKEN=tok; b=2', 'XSRF-TOKEN')).toBe('tok')
  })

  it('decodifica valores percent-encoded (el token puede llevar =, +)', () => {
    expect(parseCookie('XSRF-TOKEN=a%2Bb%3D', 'XSRF-TOKEN')).toBe('a+b=')
  })

  it('no confunde un nombre que es sufijo/prefijo de otro', () => {
    expect(parseCookie('X-TOKEN=1; XSRF-TOKEN=2', 'XSRF-TOKEN')).toBe('2')
  })

  it('devuelve null si la cookie no está', () => {
    expect(parseCookie('a=1; b=2', 'XSRF-TOKEN')).toBeNull()
  })

  it('devuelve null con string vacío', () => {
    expect(parseCookie('', 'XSRF-TOKEN')).toBeNull()
  })
})

describe('parseProblem', () => {
  function problem(
    status: number,
    body: unknown,
    headers: Record<string, string> = {},
  ): Response {
    return new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/problem+json', ...headers },
    })
  }

  it('mapea title y detail del cuerpo problem+json', async () => {
    const err = await parseProblem(
      problem(422, {
        title: 'Regla de negocio incumplida',
        detail: 'La contraseña actual es incorrecta',
        status: 422,
      }),
    )
    expect(err).toBeInstanceOf(ApiError)
    expect(err.status).toBe(422)
    expect(err.title).toBe('Regla de negocio incumplida')
    expect(err.detail).toBe('La contraseña actual es incorrecta')
  })

  it('captura Retry-After (segundos) en 429', async () => {
    const err = await parseProblem(
      problem(429, { title: 'Demasiados intentos', status: 429 }, { 'Retry-After': '120' }),
    )
    expect(err.status).toBe(429)
    expect(err.retryAfter).toBe(120)
  })

  it('cae al statusText cuando no hay cuerpo JSON', async () => {
    const err = await parseProblem(new Response(null, { status: 403, statusText: 'Forbidden' }))
    expect(err.status).toBe(403)
    expect(err.title).toBe('Forbidden')
    expect(err.detail).toBeUndefined()
    expect(err.retryAfter).toBeUndefined()
  })
})

describe('listWorkflowDefinitions', () => {
  it('pide GET /api/workflow-definitions y devuelve el catálogo vigente', async () => {
    const definitions: WorkflowDefinition[] = [
      { code: 'ADICION_CREDITOS', name: 'Adición de créditos', version: 1 },
    ]
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, definitions))
    vi.stubGlobal('fetch', fetchMock)

    const result = await listWorkflowDefinitions()

    expect(result).toEqual(definitions)
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/workflow-definitions',
      expect.objectContaining({ method: 'GET' }),
    )
  })

  it('lanza ApiError cuando no hay sesión (401)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 401 })))

    await expect(listWorkflowDefinitions()).rejects.toBeInstanceOf(ApiError)
  })
})

describe('createRequest', () => {
  it('envía POST /api/requests solo con definitionCode+studentName+studentDocument y devuelve la solicitud creada', async () => {
    const created: Request = {
      id: 'uuid-1',
      definition: { code: 'ADICION_CREDITOS', name: 'Adición de créditos', version: 1 },
      studentName: 'Ana María Pérez',
      studentDocument: '1000000001',
      currentState: { code: 'REGISTRADO', name: 'Registrado', isFinal: false },
      availableTransitions: [],
      createdAt: '2026-08-14T15:00:00Z',
    }
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(201, created))
    vi.stubGlobal('fetch', fetchMock)

    const result = await createRequest({
      definitionCode: 'ADICION_CREDITOS',
      studentName: 'Ana María Pérez',
      studentDocument: '1000000001',
    })

    expect(result).toEqual(created)
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('/api/requests')
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body as string)).toEqual({
      definitionCode: 'ADICION_CREDITOS',
      studentName: 'Ana María Pérez',
      studentDocument: '1000000001',
    })
  })

  it('lanza ApiError 422 cuando la definición no existe en la configuración; CREATE_REQUEST_422_FIELD identifica el selector', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(problemResponse(422, 'Unprocessable Entity', 'Trámite inexistente')),
    )

    await expect(
      createRequest({
        definitionCode: 'NO_EXISTE',
        studentName: 'Ana',
        studentDocument: '123',
      }),
    ).rejects.toMatchObject({ status: 422 })
    expect(CREATE_REQUEST_422_FIELD).toBe('definitionCode')
  })
})

describe('searchRequests', () => {
  it('arma el query string con encodeURIComponent y devuelve las coincidencias', async () => {
    const summaries: RequestSummary[] = [
      {
        id: 'uuid-1',
        definition: { code: 'ADICION_CREDITOS', name: 'Adición de créditos', version: 1 },
        studentName: 'Ana María Pérez',
        studentDocument: '1000000001',
        currentState: { code: 'REGISTRADO', name: 'Registrado', isFinal: false },
        createdAt: '2026-08-14T15:00:00Z',
      },
    ]
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, summaries))
    vi.stubGlobal('fetch', fetchMock)

    const result = await searchRequests('Ana María')

    expect(result).toEqual(summaries)
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/requests?search=Ana%20Mar%C3%ADa',
      expect.objectContaining({ method: 'GET' }),
    )
  })

  it('devuelve lista vacía sin lanzar error cuando el backend responde 200 sin coincidencias', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(200, [])))

    const result = await searchRequests('nadie-coincide')

    expect(result).toEqual([])
  })
})

describe('getRequest', () => {
  it('pide GET /api/requests/{id} y devuelve el detalle', async () => {
    const request: Request = {
      id: 'uuid-1',
      definition: { code: 'ADICION_CREDITOS', name: 'Adición de créditos', version: 1 },
      studentName: 'Ana María Pérez',
      studentDocument: '1000000001',
      currentState: { code: 'EN_FACULTAD', name: 'En facultad', isFinal: false },
      availableTransitions: [
        { targetState: { code: 'APROBADO', name: 'Aprobado', isFinal: true }, responsible: 'FACULTAD', requiresNote: false },
      ],
      createdAt: '2026-08-14T15:00:00Z',
    }
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, request))
    vi.stubGlobal('fetch', fetchMock)

    const result = await getRequest('uuid-1')

    expect(result).toEqual(request)
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/requests/uuid-1',
      expect.objectContaining({ method: 'GET' }),
    )
  })

  it('lanza ApiError 404 cuando la solicitud no existe', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 404 })))

    await expect(getRequest('no-existe')).rejects.toMatchObject({ status: 404 })
  })
})

describe('getRequestTimeline', () => {
  it('pide GET /api/requests/{id}/timeline y devuelve las entradas', async () => {
    const timeline: TimelineEntry[] = [
      {
        id: 1,
        fromState: null,
        toState: { code: 'REGISTRADO', name: 'Registrado', isFinal: false },
        actorEmail: 'coordinacion@example.edu.co',
        // La entrada de registro no trae responsable ni nota. El backend las
        // manda como `null` explícito, no ausentes: omitirlas aquí hacía que
        // el test corriera contra una forma que el servidor nunca produce.
        responsible: null,
        note: null,
        occurredAt: '2026-08-14T15:00:00Z',
      },
    ]
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, timeline))
    vi.stubGlobal('fetch', fetchMock)

    const result = await getRequestTimeline('uuid-1')

    expect(result).toEqual(timeline)
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/requests/uuid-1/timeline',
      expect.objectContaining({ method: 'GET' }),
    )
  })
})

describe('advanceRequest', () => {
  it('envía POST .../transitions con solo targetStateCode cuando no hay note', async () => {
    const updated: Request = {
      id: 'uuid-1',
      definition: { code: 'ADICION_CREDITOS', name: 'Adición de créditos', version: 1 },
      studentName: 'Ana',
      studentDocument: '123',
      currentState: { code: 'EN_FACULTAD', name: 'En facultad', isFinal: false },
      availableTransitions: [],
      createdAt: '2026-08-14T15:00:00Z',
    }
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, updated))
    vi.stubGlobal('fetch', fetchMock)

    const result = await advanceRequest('uuid-1', 'EN_FACULTAD')

    expect(result).toEqual(updated)
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('/api/requests/uuid-1/transitions')
    expect(JSON.parse(init.body as string)).toEqual({ targetStateCode: 'EN_FACULTAD' })
  })

  it('incluye note en el body cuando se pasa (devolución con observación obligatoria)', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, {}))
    vi.stubGlobal('fetch', fetchMock)

    await advanceRequest('uuid-1', 'DEVUELTO', 'Falta soporte de notas')

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(JSON.parse(init.body as string)).toEqual({
      targetStateCode: 'DEVUELTO',
      note: 'Falta soporte de notas',
    })
  })

  it('lanza ApiError 422 cuando falta la nota obligatoria; ADVANCE_REQUEST_422_FIELD identifica el campo', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(problemResponse(422, 'Unprocessable Entity')))

    await expect(advanceRequest('uuid-1', 'DEVUELTO')).rejects.toMatchObject({ status: 422 })
    expect(ADVANCE_REQUEST_422_FIELD).toBe('note')
  })

  it('lanza ApiError 409 ante transición no definida, estado final, o conflicto de concurrencia', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(problemResponse(409, 'Conflict', 'Transición no definida')),
    )

    await expect(advanceRequest('uuid-1', 'EN_FACULTAD')).rejects.toMatchObject({ status: 409 })
  })
})
