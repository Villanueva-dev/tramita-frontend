import { describe, expect, it } from 'vitest'

import { baseRequest, subjectsForApi } from './store'

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
    expect(recienRadicada.currentStage).toBe('radicacion')
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
    expect(recienRadicada.currentStage).toBe('radicacion')
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
