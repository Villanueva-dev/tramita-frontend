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

import type { RequestType, State } from './types'

/**
 * Lo mínimo que hay que saber de un trámite para interrogar su estado. Es un tipo
 * estructural: `AcademicRequest` encaja sin que este módulo lo importe ni dependa de él.
 *
 * Recibir el trámite entero, en vez del estado y el trámite por separado, es deliberado:
 * con dos argumentos sueltos un test puede construir una combinación imposible —un estado
 * de adición de créditos declarado como novedad de notas— y pasar en verde describiendo
 * algo que el motor nunca produce.
 */
export interface StatefulRequest {
  currentState: State
  type: RequestType
}

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
 *
 * `Record<RequestType, …>` no es decorativo: si mañana el cliente reconoce un tercer
 * trámite, el compilador exige su fila acá en vez de dejarlo sin semántica en silencio.
 */
const STATE_SEMANTICS: Record<RequestType, Record<string, StateSemantics>> = {
  // `ADICION_CREDITOS` en el motor.
  adicion_creditos: {
    EN_COORDINACION: { initial: true },
    DEVUELTA: { returned: true },
    RECHAZADA: { rejection: true },
  },
  // `NOVEDAD_NOTAS` en el motor.
  novedad_notas: {
    REGISTRADA: { initial: true },
    // Sin devolución ni rechazo, y no es un olvido: el motor modela la devolución de este
    // trámite como la transición de retorno a EN_PREPARACION, no como un estado («la
    // devolución NO es un estado», V2.1.0). Por eso «estar devuelto» no es una propiedad
    // del estado actual acá: EN_PREPARACION es indistinguible de estar ahí por primera vez.
    // Resolverlo necesita que el backend exponga la devolución como propiedad del trámite.
  },
}

/** Un estado que la tabla no conoce no recibe semántica: si el motor agrega uno, la
 *  pantalla no se rompe —simplemente no habilita acciones— y el cierre sigue respondiendo. */
const SIN_SEMANTICA: StateSemantics = {}

function semanticsOf({ currentState, type }: StatefulRequest): StateSemantics {
  return STATE_SEMANTICS[type][currentState.code] ?? SIN_SEMANTICA
}

/** ¿Terminó el trámite? Lo responde el contrato; no lleva heurística. */
export function isClosed(request: StatefulRequest): boolean {
  return request.currentState.isFinal
}

/** ¿Terminó bien? El contrato colapsa el cierre exitoso y el rechazo en un mismo `isFinal`. */
export function isSuccessfullyClosed(request: StatefulRequest): boolean {
  return isClosed(request) && !semanticsOf(request).rejection
}

/** ¿Está devuelto para que la Coordinación lo corrija? Un rechazo definitivo no lo está. */
export function isReturnedForCorrection(request: StatefulRequest): boolean {
  return semanticsOf(request).returned === true
}

/** ¿Es el estado con el que nace el trámite? Cada definición nombra el suyo distinto. */
export function isInitialState(request: StatefulRequest): boolean {
  return semanticsOf(request).initial === true
}
