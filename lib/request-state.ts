// Semántica de los estados del motor de workflow, declarada como DATO.
//
// El contrato expone `isFinal` y, desde la 007, `isInitial` en `State`. El backend agrega
// `returnedForCorrection` en `Request`, derivado de la última entrada inmutable del timeline
// y la transición configurada. La única semántica que el cliente aún reconoce por código es
// el rechazo, porque el contrato colapsa cierre exitoso y negativo en `isFinal`.
//
// `isClosed` NO sale de la tabla a propósito: junto con `isInitialState`, es de los pocos
// predicados que el contrato garantiza directamente; mezclarlos con heurística los volvería
// tan frágiles como los demás.

import type { AvailableTransition, RequestType, State } from './types'

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
  /** `null` es una definición que el cliente no reconoce (#9 b): no recibe semántica. */
  type: RequestType | null
  returnedForCorrection?: boolean
}

interface StateSemantics {
  /** Cierre negativo: el trámite terminó, pero no con éxito. */
  rejection?: boolean
}

/**
 * Espejo de `V2.1.0__Seed_workflow_definitions.sql`. Solo aparecen los estados con
 * semántica propia; los de tránsito no necesitan entrada. El inicio ya no vive acá —lo
 * declara el propio estado (`isInitial`, contrato 007)—, así que el renombre del inicial de
 * adición de créditos en `V3.2.0__Register_coordination_review_return.sql` dejó de tener
 * consumidor en esta tabla.
 *
 * `Record<RequestType, …>` mantiene explícita la semántica que el contrato aún no expresa
 * directamente; hoy solo se necesita para distinguir rechazo de cierre exitoso.
 */
const STATE_SEMANTICS: Record<RequestType, Record<string, StateSemantics>> = {
  // `ADICION_CREDITOS` en el motor.
  adicion_creditos: {
    RECHAZADA: { rejection: true },
  },
  novedad_notas: {},
}

/** Un estado que la tabla no conoce no recibe semántica: si el motor agrega uno, la
 *  pantalla no se rompe —simplemente no habilita acciones— y el cierre sigue respondiendo. */
const SIN_SEMANTICA: StateSemantics = {}

function semanticsOf({ currentState, type }: StatefulRequest): StateSemantics {
  // Una definición que el cliente no reconoce (#9 b) no tiene fila en la tabla: no hay
  // trámite del que leerla, así que no recibe semántica, igual que un código desconocido.
  if (type === null) return SIN_SEMANTICA
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
  return request.returnedForCorrection === true
}

/** ¿Es el estado con el que nace el trámite? Lo declara el propio estado (contrato 007). */
export function isInitialState(request: StatefulRequest): boolean {
  return request.currentState.isInitial
}

export type Responsibility =
  | { kind: 'closed' }
  | { kind: 'single'; who: string }
  | { kind: 'varies' }
  | { kind: 'unknown' }

/**
 * `project.md` fija que el dato operativo central es «ahora de quién depende». Ese
 * responsable no vive en `State`: se deriva de `availableTransitions[].responsible`. Tipo
 * estructural, no `AcademicRequest`, porque `AcademicRequest.availableTransitions` es
 * opcional y este módulo no depende del modelo del store (C4a, `design.md` D4).
 *
 * El backend nunca deja un estado no final sin transiciones salientes (007 FR-014): las
 * rechaza al configurar el motor. Si igual llegan vacías o ausentes, es dato faltante en
 * el cliente (por ejemplo, `refreshRequest` falló y quedó el resumen de la búsqueda, sin
 * `availableTransitions`) — no responsables que difieran.
 */
export function currentResponsibility(request: {
  currentState: State
  availableTransitions?: AvailableTransition[]
}): Responsibility {
  if (request.currentState.isFinal) return { kind: 'closed' }
  if (!request.availableTransitions || request.availableTransitions.length === 0) {
    return { kind: 'unknown' }
  }
  const responsibilities = [
    ...new Set(request.availableTransitions.map((transition) => transition.responsible)),
  ]
  return responsibilities.length === 1
    ? { kind: 'single', who: responsibilities[0] }
    : { kind: 'varies' }
}
