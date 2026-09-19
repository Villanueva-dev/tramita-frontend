import { describe, expect, it } from 'vitest'

import {
  isClosed,
  isInitialState,
  isReturnedForCorrection,
  isSuccessfullyClosed,
} from './request-state'
import type { State } from './types'

const ADICION = 'ADICION_CREDITOS'
const NOVEDAD = 'NOVEDAD_NOTAS'

const state = (code: string, isFinal = false): State => ({ code, name: code, isFinal })

/**
 * Estados reales del motor, tomados de las migraciones del backend:
 * `V2.1.0__Seed_workflow_definitions.sql` y, para el renombre del inicial de adición de
 * créditos, `V3.2.0__Register_coordination_review_return.sql`. Si el motor agrega o
 * renombra un estado, esta lista es lo primero que hay que actualizar.
 */
const ADICION_STATES = [
  state('EN_COORDINACION'),
  state('EN_FACULTAD'),
  state('APROBADA_FACULTAD'),
  state('EN_REGISTRO_CALI'),
  state('EN_REGISTRO_NACIONAL'),
  state('FINALIZADA', true),
  state('DEVUELTA'),
  state('RECHAZADA', true),
]

const NOVEDAD_STATES = [
  state('REGISTRADA'),
  state('EN_PREPARACION'),
  state('EN_FACULTAD'),
  state('EN_REVISION_FINANCIERA'),
  state('EN_REGISTRO_CONTROL'),
  state('FINALIZADA', true),
]

// «¿Está cerrado?» es la única de las cuatro preguntas que el contrato responde:
// el schema State declara `isFinal` (openapi.yaml:212-218). No lleva heurística.
describe('isClosed', () => {
  it('cierra exactamente los estados que el motor marca como finales', () => {
    expect(ADICION_STATES.filter(isClosed).map((s) => s.code)).toEqual(['FINALIZADA', 'RECHAZADA'])
    expect(NOVEDAD_STATES.filter(isClosed).map((s) => s.code)).toEqual(['FINALIZADA'])
  })

  it('no consulta el código del estado, así que un estado desconocido sigue respondiendo', () => {
    expect(isClosed(state('ESTADO_QUE_NO_EXISTE', true))).toBe(true)
    expect(isClosed(state('ESTADO_QUE_NO_EXISTE'))).toBe(false)
  })
})

// El contrato no distingue un cierre exitoso de un rechazo: ambos llegan con isFinal.
// Es la causa del issue #35, donde el dashboard contaba los rechazos como completados.
describe('isSuccessfullyClosed', () => {
  it('separa el cierre exitoso del rechazo, que el contrato colapsa en isFinal', () => {
    expect(isSuccessfullyClosed(state('FINALIZADA', true), ADICION)).toBe(true)
    expect(isSuccessfullyClosed(state('RECHAZADA', true), ADICION)).toBe(false)
  })

  it('no considera exitoso un trámite que sigue abierto', () => {
    expect(isSuccessfullyClosed(state('EN_FACULTAD'), ADICION)).toBe(false)
    expect(isSuccessfullyClosed(state('APROBADA_FACULTAD'), ADICION)).toBe(false)
  })
})

describe('isReturnedForCorrection', () => {
  it('reconoce la devolución de adición de créditos, que el motor modela como estado', () => {
    expect(isReturnedForCorrection(state('DEVUELTA'), ADICION)).toBe(true)
  })

  it('no confunde el rechazo definitivo con una devolución', () => {
    expect(isReturnedForCorrection(state('RECHAZADA', true), ADICION)).toBe(false)
  })

  // LIMITACIÓN CONOCIDA Y ACEPTADA DE A1, no un descuido.
  // Novedad de notas no tiene estado de devolución: el motor la modela como la transición
  // de retorno a EN_PREPARACION (V2.1.0, «la devolución NO es un estado»). Por eso «estar
  // devuelto» no es una propiedad del estado actual —EN_PREPARACION es indistinguible de
  // estar ahí por primera vez— y ningún dato del contrato permite responderlo hoy.
  // Este test fija el hueco para que sea visible y deje de ser una ceguera silenciosa.
  it('no puede reconocer la devolución de novedad de notas, que el motor modela como transición', () => {
    for (const s of NOVEDAD_STATES) {
      expect(isReturnedForCorrection(s, NOVEDAD)).toBe(false)
    }
  })
})

describe('isInitialState', () => {
  // V3.2.0 renombró el inicial SOLO de adición de créditos (su UPDATE lleva
  // `AND d.code = 'ADICION_CREDITOS'`), así que cada trámite nombra su inicio distinto.
  it('reconoce el inicio propio de cada trámite', () => {
    expect(isInitialState(state('EN_COORDINACION'), ADICION)).toBe(true)
    expect(isInitialState(state('REGISTRADA'), NOVEDAD)).toBe(true)
  })

  it('no acepta el inicio de un trámite como inicio del otro', () => {
    expect(isInitialState(state('EN_COORDINACION'), NOVEDAD)).toBe(false)
    expect(isInitialState(state('REGISTRADA'), ADICION)).toBe(false)
  })

  it('reconoce exactamente un estado inicial por trámite', () => {
    expect(ADICION_STATES.filter((s) => isInitialState(s, ADICION))).toHaveLength(1)
    expect(NOVEDAD_STATES.filter((s) => isInitialState(s, NOVEDAD))).toHaveLength(1)
  })
})

// Degradación segura: si el motor agrega un estado o un trámite que la tabla no conoce,
// la app no se rompe — el estado simplemente no habilita ninguna acción. `isClosed` sigue
// funcionando porque no depende de la tabla.
describe('degradación ante lo que la tabla no conoce', () => {
  it('no atribuye semántica a un estado ausente de la tabla', () => {
    const desconocido = state('ESTADO_QUE_NO_EXISTE')

    expect(isInitialState(desconocido, ADICION)).toBe(false)
    expect(isReturnedForCorrection(desconocido, ADICION)).toBe(false)
    expect(isSuccessfullyClosed(desconocido, ADICION)).toBe(false)
  })

  it('no atribuye semántica a un trámite ausente de la tabla', () => {
    expect(isInitialState(state('EN_COORDINACION'), 'TRAMITE_NUEVO')).toBe(false)
    expect(isReturnedForCorrection(state('DEVUELTA'), 'TRAMITE_NUEVO')).toBe(false)
  })

  it('sigue reconociendo el cierre de un trámite que la tabla no conoce', () => {
    expect(isClosed(state('LO_QUE_SEA', true))).toBe(true)
    expect(isSuccessfullyClosed(state('LO_QUE_SEA', true), 'TRAMITE_NUEVO')).toBe(true)
  })
})
