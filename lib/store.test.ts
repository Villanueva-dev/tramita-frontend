import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderHook, act, cleanup } from '@testing-library/react'

import { baseRequest, subjectsForApi, TramitaProvider, useTramita } from './store'
import type { NewRequestInput } from './store'

// `vi.mock` se eleva al inicio del archivo, antes de esta declaración: su factory solo
// puede usar variables creadas con `vi.hoisted` (https://vitest.dev/api/vi#vi-mock).
const apiFetchMock = vi.hoisted(() => vi.fn())

vi.mock('./auth-store', () => ({
  useAuth: () => ({
    status: 'authenticated',
    user: { email: 'coordinacion@uniremington.edu.co', active: true },
    login: vi.fn(),
    logout: vi.fn(),
  }),
}))

// Mock parcial: conserva el `problemMessage` real (es lo que se quiere ejercitar) y
// reemplaza solo `apiFetch`, que es la llamada de red que cada prueba controla por ruta.
vi.mock('./api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./api')>()
  return { ...actual, apiFetch: apiFetchMock }
})

afterEach(() => {
  cleanup()
  apiFetchMock.mockReset()
})

/**
 * Resumen tal como lo devuelve `GET /api/requests` (RequestSummaryResponse):
 * el backend ya envía el nombre legible del estado en `currentState.name`.
 */
const summary = {
  id: '11111111-1111-1111-1111-111111111111',
  definition: { code: 'ADICION_CREDITOS', name: 'Adición de créditos', version: 1 },
  studentName: 'Estudiante De Prueba',
  studentDocument: '1090234',
  currentState: { code: 'EN_COORDINACION', name: 'En coordinación (revisión)', isFinal: false, isInitial: true },
  createdAt: '2026-09-01T10:00:00',
}

const withState = (code: string, name: string, isFinal: boolean, isInitial = false) => ({
  ...summary,
  currentState: { code, name, isFinal, isInitial },
})

describe('baseRequest', () => {
  // El modelo del cliente descartaba el estado crudo y se quedaba solo con su nombre, así
  // que ninguna pantalla podía preguntar nada sobre él y todo se derivaba de `status`, que
  // colapsa cuatro preguntas distintas en un valor. Conservarlo es lo que permite que los
  // predicados de `request-state` respondan sin adivinar.
  it('conserva el estado crudo que envía el backend, no solo su nombre', () => {
    const rechazada = baseRequest(withState('RECHAZADA', 'Rechazada', true))

    expect(rechazada.currentState).toEqual({
      code: 'RECHAZADA',
      name: 'Rechazada',
      isFinal: true,
      isInitial: false,
    })
  })

  it('conserva el nombre del estado que envía el backend', () => {
    expect(baseRequest(withState('RECHAZADA', 'Rechazada', true)).stateName).toBe('Rechazada')
  })

  // RECHAZADA y FINALIZADA son ambos estados finales del motor (is_final = true).
  // Sin el nombre del backend, la pantalla rotula «Finalizado» un trámite negado.
  it('distingue un trámite rechazado de uno finalizado', () => {
    const rechazada = baseRequest(withState('RECHAZADA', 'Rechazada', true))
    const finalizada = baseRequest(withState('FINALIZADA', 'Finalizada', true))

    expect(rechazada.stateName).not.toBe(finalizada.stateName)
  })

  // El motor renombró el estado inicial de ADICION_CREDITOS en la migración V3.2.0:
  // `REGISTRADA` pasó a `EN_COORDINACION` para que la devolución de la Coordinación
  // tuviera dónde registrarse. La 007 expone `isInitial` en el propio `State`, así que el
  // cliente ya no tiene que reconocerlo por su código.
  it('reconoce el estado inicial vigente como pendiente de radicación', () => {
    const recienRadicada = baseRequest(
      withState('EN_COORDINACION', 'En coordinación (revisión)', false, true),
    )

    expect(recienRadicada.status).toBe('pendiente')
  })

  // El renombre de V3.2.0 alcanzó SOLO a ADICION_CREDITOS: su UPDATE lleva
  // `AND d.code = 'ADICION_CREDITOS'`. Novedad de notas sigue naciendo en `REGISTRADA`, con
  // su propio `isInitial: true`: cada definición nombra su inicio de forma independiente.
  it('reconoce el estado inicial de novedad de notas, que el motor no renombró', () => {
    const recienRadicada = baseRequest({
      ...summary,
      definition: { code: 'NOVEDAD_NOTAS', name: 'Novedad de notas', version: 1 },
      currentState: { code: 'REGISTRADA', name: 'Registrada', isFinal: false, isInitial: true },
    })

    expect(recienRadicada.status).toBe('pendiente')
  })

  // La 007 expone `isInitial` en el propio `State`. `status: 'pendiente'` debe salir de
  // ese campo, no de una tabla de códigos: un código CONOCIDO sin `isInitial` no es
  // pendiente, y un código DESCONOCIDO con `isInitial: true` sí lo es. Literal crudo, sin
  // pasar por `withState`, para que la prueba no dependa de cómo se migre ese helper.
  it('el estado pendiente sale de isInitial, no de una tabla de códigos por código conocido', () => {
    const conocidoNoInicial = baseRequest({
      ...summary,
      currentState: { code: 'EN_COORDINACION', name: 'En coordinación (revisión)', isFinal: false, isInitial: false },
    })

    expect(conocidoNoInicial.status).not.toBe('pendiente')

    const desconocidoInicial = baseRequest({
      ...summary,
      currentState: { code: 'ESTADO_QUE_NO_EXISTE', name: 'Estado nuevo', isFinal: false, isInitial: true },
    })

    expect(desconocidoInicial.status).toBe('pendiente')
  })

  // #9(b): una definición que el cliente no reconoce no se adivina como adición de
  // créditos. `baseRequest` conserva `definition` tal cual llega, y `type` allowlist a
  // `null` en vez de caer al primer valor de un ternario.
  it('conserva la definición cruda y clasifica un código de definición desconocido como type: null (#9b)', () => {
    const desconocida = baseRequest({
      ...summary,
      definition: { code: 'CODIGO_QUE_NO_EXISTE', name: 'Trámite piloto', version: 1 },
    })

    expect(desconocida.definition).toEqual({
      code: 'CODIGO_QUE_NO_EXISTE',
      name: 'Trámite piloto',
      version: 1,
    })
    expect(desconocida.type).toBeNull()
  })

  // Los seis estados intermedios del motor se colapsan a 'en_revision' en `status`;
  // el nombre real es el único dato que dice de quién depende ahora el trámite.
  it('conserva los estados intermedios sin aplanarlos', () => {
    const enRegistro = baseRequest(
      withState('EN_REGISTRO_CALI', 'En registro Cali (carga en QF)', false),
    )

    expect(enRegistro.stateName).toBe('En registro Cali (carga en QF)')
  })
})

/**
 * `credits: 0` es el sentinel de «vacío» del FORMULARIO: `emptySubject()` lo inicializa
 * así y el input controlado lo lee como `s.credits || ''`. El backend no comparte ese
 * vocabulario — declara `@Min(1)` en `SubjectRequestBody`, de modo que para él «sin
 * créditos» es la clave AUSENTE, no un cero.
 *
 * Sin la traducción, la novedad de notas era irradicable: su formulario no pide créditos,
 * así que el cuerpo salía con `credits: 0` y `POST /api/requests` respondía 400 SIEMPRE.
 * Medido en vivo el 2026-09-19 — `credits: 0` → 400; ausente o null → 201.
 */
describe('subjectsForApi', () => {
  const notas = { code: 'IS-704', name: 'Arquitectura', credits: 0, group: '', currentGrade: '2.9', proposedGrade: '3.5' }
  const creditos = { code: 'IS-704', name: 'Arquitectura', credits: 3, group: 'A1', currentGrade: '', proposedGrade: '' }

  // Se afirma sobre el JSON porque es lo que realmente viaja: `{credits: undefined}`
  // también se serializaría sin la clave, y el contrato que importa es el del cuerpo.
  const enviado = (s: object) => JSON.parse(JSON.stringify(subjectsForApi([s] as never)))[0]

  it('omite los créditos cuando el formulario no los pide y deja el cero centinela', () => {
    expect(enviado(notas)).not.toHaveProperty('credits')
  })

  // Mata al mutante «borrar credits siempre»: eso arreglaría notas y rompería la adición,
  // donde los créditos son el dato que origina el trámite.
  it('conserva los créditos reales de una adición', () => {
    expect(enviado(creditos).credits).toBe(3)
  })

  // Mata al mutante «devolver solo {code, name}»: omitir el centinela no puede costar
  // las notas, que en novedad de notas son TODO el contenido del trámite.
  it('no pierde ningún otro campo al omitir el centinela', () => {
    expect(enviado(notas)).toEqual({
      code: 'IS-704', name: 'Arquitectura', group: '', currentGrade: '2.9', proposedGrade: '3.5',
    })
  })
})

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function problemResponse(status: number, detail: string): Response {
  return new Response(JSON.stringify({ title: 'Error', detail, status }), {
    status,
    headers: { 'Content-Type': 'application/problem+json' },
  })
}

/** Cuerpo mínimo válido de `NewRequestInput`. Datos ficticios, claramente sintéticos. */
function newRequestInput(): NewRequestInput {
  return {
    type: 'adicion_creditos',
    priority: 'normal',
    studentCode: 'EST-0000',
    studentCedula: '00000000',
    studentName: 'Estudiante Ficticio',
    studentEmail: 'estudiante.ficticio@example.com',
    program: 'Ingeniería de Sistemas',
    semester: '8',
    subjects: [{ code: 'IS-000', name: 'Materia ficticia', credits: 3 }],
    reason: 'Motivo de prueba, con longitud suficiente para pasar la validación del formulario.',
  }
}

/** Cuerpo de `POST /requests`: el mismo `RequestResponse` que devuelve `GET /requests/{id}`. */
const CREATED_REQUEST = {
  id: '22222222-2222-2222-2222-222222222222',
  definition: { code: 'ADICION_CREDITOS', name: 'Adición de créditos', version: 1 },
  studentName: 'Estudiante Ficticio',
  studentDocument: '00000000',
  currentState: { code: 'EN_COORDINACION', name: 'En coordinación (revisión)', isFinal: false, isInitial: true },
  createdAt: '2026-09-23T10:00:00',
}

/**
 * `createRequest` se ejercita a través del `TramitaProvider` real, como ya hace
 * `lib/use-coordination-inbox.test.ts` con su hook: sin extraer una función solo para
 * probarla (decisión registrada en el documento de la feature).
 *
 * Issue #12: tras el `201` de `POST /requests`, `createRequest` recargaba la solicitud
 * (`GET /requests/{id}`, `/timeline`, `/documents`) y subía cada adjunto contra
 * `POST /requests/{id}/documents`, que no existe en el backend. Si cualquiera de esas
 * llamadas fallaba, la solicitud ya estaba creada pero el formulario mostraba un error,
 * y quien reintentaba creaba un duplicado.
 */
describe('createRequest (TramitaProvider)', () => {
  it('con el POST en 201, resuelve con la solicitud creada aunque cualquier otra llamada falle', async () => {
    apiFetchMock.mockImplementation((path: string, opts: { method?: string } = {}) => {
      const method = (opts.method ?? 'GET').toUpperCase()
      if (path === '/requests' && method === 'POST') {
        return Promise.resolve(jsonResponse(201, CREATED_REQUEST))
      }
      // Cualquier otra llamada (recarga del detalle, subida de adjuntos) no debería
      // ocurrir; si ocurre, que falle en vez de disfrazarse de éxito.
      return Promise.resolve(problemResponse(500, 'No debería llamarse'))
    })

    const { result } = renderHook(() => useTramita(), { wrapper: TramitaProvider })

    let created: Awaited<ReturnType<typeof result.current.createRequest>> | undefined
    await act(async () => {
      created = await result.current.createRequest(newRequestInput())
    })

    expect(created?.id).toBe(CREATED_REQUEST.id)
    // Queda en el store: el detalle la muestra aunque su propia recarga falle.
    expect(result.current.getRequest(CREATED_REQUEST.id)?.id).toBe(CREATED_REQUEST.id)
    expect(apiFetchMock).toHaveBeenCalledTimes(1)
    expect(apiFetchMock).toHaveBeenCalledWith('/requests', expect.objectContaining({ method: 'POST' }))
  })

  it('si el POST es rechazado, reporta el error del backend', async () => {
    apiFetchMock.mockResolvedValue(problemResponse(422, 'La definición no existe'))

    const { result } = renderHook(() => useTramita(), { wrapper: TramitaProvider })

    await expect(result.current.createRequest(newRequestInput())).rejects.toThrow('La definición no existe')
  })
})
