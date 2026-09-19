// Semántica de los estados del motor de workflow, declarada como DATO.
//
// El contrato (Tramita/specs/002-workflow-engine/contracts/openapi.yaml:212-218) expone de
// `State` solo `code`, `name` e `isFinal`. Eso responde «¿está cerrado?» y nada más, así que
// las otras tres preguntas —¿es el inicio?, ¿está devuelto?, ¿terminó con éxito?— hay que
// resolverlas reconociendo códigos de estado.
//
// DEUDA DECLARADA: la tabla de abajo fija códigos del motor en el cliente, en tensión con
// FR-009. La alternativa que reemplazó —comparar con `includes('DEVUELTA')` disperso entre
// funciones— cometía la misma violación, pero escondida y sin forma de auditarla. Acá está
// a la vista, en un solo lugar y con tests: cuando el backend exponga la semántica, se
// cambia de dónde sale esta tabla y ningún consumidor se entera.
//
// `isClosed` NO sale de la tabla a propósito: es el único predicado que el contrato
// garantiza, y mezclarlo con heurística lo volvería tan frágil como los demás.

import type { State } from './types'

interface StateSemantics {
  /** Estado con el que nace el trámite. Cada definición nombra el suyo. */
  initial?: boolean
  /** Devuelto para corrección: sale del flujo y vuelve a entrar una vez corregido. */
  returned?: boolean
  /** Cierre negativo: el trámite terminó, pero no con éxito. */
  rejection?: boolean
}

/**
 * Espejo de las migraciones del motor: `V2.1.0__Seed_workflow_definitions.sql` y, para el
 * renombre del inicial de adición de créditos, `V3.2.0__Register_coordination_review_return.sql`.
 * Solo aparecen los estados con semántica propia; los de tránsito no necesitan entrada.
 */
const STATE_SEMANTICS: Record<string, Record<string, StateSemantics>> = {
  ADICION_CREDITOS: {
    EN_COORDINACION: { initial: true },
    DEVUELTA: { returned: true },
    RECHAZADA: { rejection: true },
  },
  NOVEDAD_NOTAS: {
    REGISTRADA: { initial: true },
    // Sin devolución ni rechazo, y no es un olvido: el motor modela la devolución de este
    // trámite como la transición de retorno a EN_PREPARACION, no como un estado («la
    // devolución NO es un estado», V2.1.0). Por eso «estar devuelto» no es una propiedad
    // del estado actual acá: EN_PREPARACION es indistinguible de estar ahí por primera vez.
    // Resolverlo necesita que el backend exponga la devolución como propiedad del trámite.
  },
}

/** Sin entrada en la tabla no se atribuye ninguna semántica: un estado nuevo del motor no
 *  rompe la app, solo no habilita acciones. */
const SIN_SEMANTICA: StateSemantics = {}

function semanticsOf(state: State, definitionCode: string): StateSemantics {
  return STATE_SEMANTICS[definitionCode]?.[state.code] ?? SIN_SEMANTICA
}

/** ¿Terminó el trámite? Lo responde el contrato; no lleva heurística. */
export function isClosed(state: State): boolean {
  return state.isFinal
}

/** ¿Terminó bien? El contrato colapsa el cierre exitoso y el rechazo en un mismo `isFinal`. */
export function isSuccessfullyClosed(state: State, definitionCode: string): boolean {
  return isClosed(state) && !semanticsOf(state, definitionCode).rejection
}

/** ¿Está devuelto para que la Coordinación lo corrija? Un rechazo definitivo no lo está. */
export function isReturnedForCorrection(state: State, definitionCode: string): boolean {
  return semanticsOf(state, definitionCode).returned === true
}

/** ¿Es el estado con el que nace el trámite? Cada definición nombra el suyo distinto. */
export function isInitialState(state: State, definitionCode: string): boolean {
  return semanticsOf(state, definitionCode).initial === true
}
