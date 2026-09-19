import { describe, expect, it } from 'vitest'

import {
  isClosed,
  isInitialState,
  isReturnedForCorrection,
  isSuccessfullyClosed,
  type StatefulRequest,
} from './request-state'

/**
 * Los predicados reciben el trámite entero, así que un caso de prueba no puede declarar una
 * combinación que el motor nunca produce: el estado y el trámite viajan juntos.
 */
const adicion = (code: string, isFinal = false): StatefulRequest => ({
  currentState: { code, name: code, isFinal },
  type: 'adicion_creditos',
})

const novedad = (code: string, isFinal = false): StatefulRequest => ({
  currentState: { code, name: code, isFinal },
  type: 'novedad_notas',
})

/**
 * Estados reales del motor, tomados de las migraciones del backend:
 * `V2.1.0__Seed_workflow_definitions.sql` y, para el renombre del inicial de adición de
 * créditos, `V3.2.0__Register_coordination_review_return.sql`. Si el motor agrega o
 * renombra un estado, esta lista es lo primero que hay que actualizar.
 */
const ADICION_STATES = [
  adicion('EN_COORDINACION'),
  adicion('EN_FACULTAD'),
  adicion('APROBADA_FACULTAD'),
  adicion('EN_REGISTRO_CALI'),
  adicion('EN_REGISTRO_NACIONAL'),
  adicion('FINALIZADA', true),
  adicion('DEVUELTA'),
  adicion('RECHAZADA', true),
]

const NOVEDAD_STATES = [
  novedad('REGISTRADA'),
  novedad('EN_PREPARACION'),
  novedad('EN_FACULTAD'),
  novedad('EN_REVISION_FINANCIERA'),
  novedad('EN_REGISTRO_CONTROL'),
  novedad('FINALIZADA', true),
]

const codesOf = (requests: StatefulRequest[]) => requests.map((r) => r.currentState.code)

// «¿Está cerrado?» es la única de las cuatro preguntas que el contrato responde:
// el schema State declara `isFinal` (openapi.yaml:212-218). No lleva heurística.
describe('isClosed', () => {
  it('cierra exactamente los estados que el motor marca como finales', () => {
    expect(codesOf(ADICION_STATES.filter(isClosed))).toEqual(['FINALIZADA', 'RECHAZADA'])
    expect(codesOf(NOVEDAD_STATES.filter(isClosed))).toEqual(['FINALIZADA'])
  })

  it('no consulta el código del estado, así que un estado desconocido sigue respondiendo', () => {
    expect(isClosed(adicion('ESTADO_QUE_NO_EXISTE', true))).toBe(true)
    expect(isClosed(adicion('ESTADO_QUE_NO_EXISTE'))).toBe(false)
  })
})

// El contrato no distingue un cierre exitoso de un rechazo: ambos llegan con isFinal.
// Es la causa del issue #35, donde el dashboard contaba los rechazos como completados.
describe('isSuccessfullyClosed', () => {
  it('separa el cierre exitoso del rechazo, que el contrato colapsa en isFinal', () => {
    expect(isSuccessfullyClosed(adicion('FINALIZADA', true))).toBe(true)
    expect(isSuccessfullyClosed(adicion('RECHAZADA', true))).toBe(false)
  })

  it('no considera exitoso un trámite que sigue abierto', () => {
    expect(isSuccessfullyClosed(adicion('EN_FACULTAD'))).toBe(false)
    expect(isSuccessfullyClosed(adicion('APROBADA_FACULTAD'))).toBe(false)
  })
})

describe('isReturnedForCorrection', () => {
  it('reconoce la devolución de adición de créditos, que el motor modela como estado', () => {
    expect(isReturnedForCorrection(adicion('DEVUELTA'))).toBe(true)
  })

  it('no confunde el rechazo definitivo con una devolución', () => {
    expect(isReturnedForCorrection(adicion('RECHAZADA', true))).toBe(false)
  })

  // LIMITACIÓN CONOCIDA Y ACEPTADA DE A1, no un descuido.
  // Novedad de notas no tiene estado de devolución: el motor la modela como la transición
  // de retorno a EN_PREPARACION (V2.1.0, «la devolución NO es un estado»). Por eso «estar
  // devuelto» no es una propiedad del estado actual —EN_PREPARACION es indistinguible de
  // estar ahí por primera vez— y ningún dato del contrato permite responderlo hoy.
  // Este test fija el hueco para que sea visible y deje de ser una ceguera silenciosa.
  it('no puede reconocer la devolución de novedad de notas, que el motor modela como transición', () => {
    for (const request of NOVEDAD_STATES) {
      expect(isReturnedForCorrection(request)).toBe(false)
    }
  })
})

describe('isInitialState', () => {
  // V3.2.0 renombró el inicial SOLO de adición de créditos (su UPDATE lleva
  // `AND d.code = 'ADICION_CREDITOS'`), así que cada trámite nombra su inicio distinto.
  it('reconoce el inicio propio de cada trámite', () => {
    expect(isInitialState(adicion('EN_COORDINACION'))).toBe(true)
    expect(isInitialState(novedad('REGISTRADA'))).toBe(true)
  })

  it('no acepta el inicio de un trámite como inicio del otro', () => {
    expect(isInitialState(novedad('EN_COORDINACION'))).toBe(false)
    expect(isInitialState(adicion('REGISTRADA'))).toBe(false)
  })

  it('reconoce exactamente un estado inicial por trámite', () => {
    expect(ADICION_STATES.filter(isInitialState)).toHaveLength(1)
    expect(NOVEDAD_STATES.filter(isInitialState)).toHaveLength(1)
  })
})

// Degradación segura: si el motor agrega un estado que la tabla no conoce, la pantalla no
// se rompe —ese estado no habilita ninguna acción— y `isClosed` sigue funcionando porque no
// depende de la tabla. No hay un caso equivalente para un trámite desconocido: `RequestType`
// es una unión cerrada y la tabla es un `Record` sobre ella, así que el compilador exige la
// fila. Testear ese caso sería testear algo inalcanzable.
describe('degradación ante un estado que la tabla no conoce', () => {
  it('no le atribuye semántica', () => {
    const desconocido = adicion('ESTADO_QUE_NO_EXISTE')

    expect(isInitialState(desconocido)).toBe(false)
    expect(isReturnedForCorrection(desconocido)).toBe(false)
    expect(isSuccessfullyClosed(desconocido)).toBe(false)
  })

  it('sigue reconociendo su cierre si el motor lo marca como final', () => {
    expect(isClosed(adicion('LO_QUE_SEA', true))).toBe(true)
    expect(isSuccessfullyClosed(adicion('LO_QUE_SEA', true))).toBe(true)
  })
})
