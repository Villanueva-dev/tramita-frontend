import { describe, expect, it } from 'vitest'

import {
  currentResponsibility,
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
const adicion = (code: string, { isFinal = false, isInitial = false } = {}): StatefulRequest => ({
  currentState: { code, name: code, isFinal, isInitial },
  type: 'adicion_creditos',
})

const novedad = (code: string, { isFinal = false, isInitial = false } = {}): StatefulRequest => ({
  currentState: { code, name: code, isFinal, isInitial },
  type: 'novedad_notas',
})

/**
 * Estados reales del motor, tomados de las migraciones del backend:
 * `V2.1.0__Seed_workflow_definitions.sql` y, para el renombre del inicial de adición de
 * créditos, `V3.2.0__Register_coordination_review_return.sql`. Si el motor agrega o
 * renombra un estado, esta lista es lo primero que hay que actualizar.
 */
const ADICION_STATES = [
  adicion('EN_COORDINACION', { isInitial: true }),
  adicion('EN_FACULTAD'),
  adicion('APROBADA_FACULTAD'),
  adicion('EN_REGISTRO_CALI'),
  adicion('EN_REGISTRO_NACIONAL'),
  adicion('FINALIZADA', { isFinal: true }),
  adicion('DEVUELTA'),
  adicion('RECHAZADA', { isFinal: true }),
]

const NOVEDAD_STATES = [
  novedad('REGISTRADA', { isInitial: true }),
  novedad('EN_PREPARACION'),
  novedad('EN_FACULTAD'),
  novedad('EN_REVISION_FINANCIERA'),
  novedad('EN_REGISTRO_CONTROL'),
  novedad('FINALIZADA', { isFinal: true }),
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
    expect(isClosed(adicion('ESTADO_QUE_NO_EXISTE', { isFinal: true }))).toBe(true)
    expect(isClosed(adicion('ESTADO_QUE_NO_EXISTE'))).toBe(false)
  })
})

// El contrato no distingue un cierre exitoso de un rechazo: ambos llegan con isFinal.
// Es la causa del issue #35, donde el dashboard contaba los rechazos como completados.
describe('isSuccessfullyClosed', () => {
  it('separa el cierre exitoso del rechazo, que el contrato colapsa en isFinal', () => {
    expect(isSuccessfullyClosed(adicion('FINALIZADA', { isFinal: true }))).toBe(true)
    expect(isSuccessfullyClosed(adicion('RECHAZADA', { isFinal: true }))).toBe(false)
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
    expect(isReturnedForCorrection(adicion('RECHAZADA', { isFinal: true }))).toBe(false)
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
  // `AND d.code = 'ADICION_CREDITOS'`), así que cada trámite nombra su inicio distinto —
  // ahora como dato propio de `isInitial` (contrato 007), no como una fila por código.
  it('reconoce el inicio propio de cada trámite', () => {
    expect(isInitialState(adicion('EN_COORDINACION', { isInitial: true }))).toBe(true)
    expect(isInitialState(novedad('REGISTRADA', { isInitial: true }))).toBe(true)
  })

  // `EN_COORDINACION` y `REGISTRADA` solo llegan con `isInitial: true` en su propia
  // definición: el fixture no le pone esa marca al inicio del otro trámite, así que no hay
  // combinación que confundirlos.
  it('no acepta el inicio de un trámite como inicio del otro', () => {
    expect(isInitialState(novedad('EN_COORDINACION'))).toBe(false)
    expect(isInitialState(adicion('REGISTRADA'))).toBe(false)
  })

  it('reconoce exactamente un estado inicial por trámite', () => {
    expect(ADICION_STATES.filter(isInitialState)).toHaveLength(1)
    expect(NOVEDAD_STATES.filter(isInitialState)).toHaveLength(1)
  })
})

// La 007 expone `isInitial` en el propio `State` (contrato, C:295-301). Estos tres casos
// prueban que `isInitialState` lee ese campo directamente, no una tabla de códigos por
// trámite — construidos con literales crudos, sin pasar por los helpers `adicion`/`novedad`,
// para que la prueba no dependa de cómo se migren esos helpers.
describe('isInitialState lee isInitial del contrato, no una tabla por código', () => {
  it('cada trámite reconoce su propio inicio a partir de isInitial, con códigos de inicio distintos', () => {
    const inicioAdicion: StatefulRequest = {
      currentState: { code: 'EN_COORDINACION', name: 'En coordinación (revisión)', isFinal: false, isInitial: true },
      type: 'adicion_creditos',
    }
    const inicioNovedad: StatefulRequest = {
      currentState: { code: 'REGISTRADA', name: 'Registrada', isFinal: false, isInitial: true },
      type: 'novedad_notas',
    }

    expect(isInitialState(inicioAdicion)).toBe(true)
    expect(isInitialState(inicioNovedad)).toBe(true)
  })

  it('un estado que el cliente no reconoce en su tabla de devolución/rechazo igual se presenta como pendiente de radicación si isInitial lo marca', () => {
    const desconocidoInicial: StatefulRequest = {
      currentState: { code: 'ESTADO_QUE_NO_EXISTE', name: 'Estado nuevo', isFinal: false, isInitial: true },
      type: 'adicion_creditos',
    }

    expect(isInitialState(desconocidoInicial)).toBe(true)
  })

  // Mutante «isInitialState vuelve a la tabla por código»: EN_COORDINACION es un código
  // CONOCIDO que la tabla vieja marcaba inicial para adición de créditos. Con isInitial en
  // false, ya no debe reportarse como inicial: si la implementación volviera a mirar el
  // código en lugar del campo, este caso da falso positivo.
  it('un código conocido con isInitial false no se reporta como inicial', () => {
    const enCoordinacionNoInicial: StatefulRequest = {
      currentState: { code: 'EN_COORDINACION', name: 'En coordinación (revisión)', isFinal: false, isInitial: false },
      type: 'adicion_creditos',
    }

    expect(isInitialState(enCoordinacionNoInicial)).toBe(false)
  })
})

// Degradación segura: si el motor agrega un estado que la tabla no conoce, la pantalla no
// se rompe —ese estado no habilita ninguna acción— y `isClosed` sigue funcionando porque no
// depende de la tabla.
describe('degradación ante un estado que la tabla no conoce', () => {
  it('no le atribuye semántica', () => {
    const desconocido = adicion('ESTADO_QUE_NO_EXISTE')

    expect(isInitialState(desconocido)).toBe(false)
    expect(isReturnedForCorrection(desconocido)).toBe(false)
    expect(isSuccessfullyClosed(desconocido)).toBe(false)
  })

  it('sigue reconociendo su cierre si el motor lo marca como final', () => {
    expect(isClosed(adicion('LO_QUE_SEA', { isFinal: true }))).toBe(true)
    expect(isSuccessfullyClosed(adicion('LO_QUE_SEA', { isFinal: true }))).toBe(true)
  })
})

// Con `typeFromCode` como allowlist (#9 b, C3), `type: null` SÍ es alcanzable: una
// definición que el cliente no reconoce. `StatefulRequest.type` deja de ser una unión
// cerrada y el compilador ya no puede exigir la fila — este caso, antes inalcanzable, ahora
// necesita su propia degradación segura.
describe('degradación ante type: null (#9b)', () => {
  it('no le atribuye semántica a un trámite de definición desconocida', () => {
    const desconocido: StatefulRequest = {
      currentState: { code: 'ALGO', name: 'Algo', isFinal: false, isInitial: false },
      type: null,
    }

    expect(isReturnedForCorrection(desconocido)).toBe(false)
    expect(isSuccessfullyClosed(desconocido)).toBe(false)
  })

  it('la respuesta sobre el cierre sigue siendo válida, porque isClosed no depende del tipo', () => {
    const desconocidoCerrado: StatefulRequest = {
      currentState: { code: 'ALGO', name: 'Algo', isFinal: true, isInitial: false },
      type: null,
    }

    expect(isClosed(desconocidoCerrado)).toBe(true)
  })
})

// C4a: `currentResponsibility` se muda de `app/requests/[id]/page.tsx` a este módulo, con
// un tipo estructural `{ currentState, availableTransitions? }` — responde una pregunta
// sobre el estado, como los demás predicados de este archivo. Sin cambio de comportamiento.
describe('currentResponsibility', () => {
  it('responsable único en las transiciones salientes', () => {
    const request = {
      currentState: { code: 'EN_FACULTAD', name: 'En facultad', isFinal: false, isInitial: false },
      availableTransitions: [
        { targetState: { code: 'A', name: 'A', isFinal: false, isInitial: false }, responsible: 'FACULTAD', requiresNote: false },
        { targetState: { code: 'B', name: 'B', isFinal: false, isInitial: false }, responsible: 'FACULTAD', requiresNote: true },
      ],
    }

    expect(currentResponsibility(request)).toEqual({ kind: 'single', who: 'FACULTAD' })
  })

  it('responsables divergentes no eligen uno', () => {
    const request = {
      currentState: { code: 'EN_FACULTAD', name: 'En facultad', isFinal: false, isInitial: false },
      availableTransitions: [
        { targetState: { code: 'A', name: 'A', isFinal: false, isInitial: false }, responsible: 'FACULTAD', requiresNote: false },
        { targetState: { code: 'B', name: 'B', isFinal: false, isInitial: false }, responsible: 'REGISTRO', requiresNote: false },
      ],
    }

    expect(currentResponsibility(request)).toEqual({ kind: 'varies' })
  })

  it('un estado final no tiene responsable', () => {
    const request = {
      currentState: { code: 'FINALIZADA', name: 'Finalizada', isFinal: true, isInitial: false },
      availableTransitions: [],
    }

    expect(currentResponsibility(request)).toEqual({ kind: 'closed' })
  })
})
