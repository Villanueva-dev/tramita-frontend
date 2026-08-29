// Modelo del cliente, derivado del contrato del motor de workflow
// (Tramita/specs/002-workflow-engine/contracts/openapi.yaml). No hay trámites
// ni estados fijados acá: son datos que el backend configura (FR-009).

/** openapi.yaml WorkflowDefinition (:177-183). */
export interface WorkflowDefinition {
  code: string
  name: string
  version: number
}

/** openapi.yaml State (:202-208). Sin `responsible`: ese vive en la transición. */
export interface State {
  code: string
  name: string
  isFinal: boolean
}

/** openapi.yaml AvailableTransition (:210-219). Cuelga de `Request`, no de `State`. */
export interface AvailableTransition {
  targetState: State
  responsible: string
  requiresNote: boolean
}

/**
 * openapi.yaml Request (:221-235). Nota: el nombre sombrea el `Request` global
 * del DOM dentro de los módulos que lo importen — es intencional (design.md).
 */
export interface Request {
  id: string
  definition: WorkflowDefinition
  studentName: string
  studentDocument: string
  currentState: State
  availableTransitions: AvailableTransition[]
  createdAt: string
}

/** openapi.yaml RequestSummary (:237-246). Sin `updatedAt`. */
export interface RequestSummary {
  id: string
  definition: WorkflowDefinition
  studentName: string
  studentDocument: string
  currentState: State
  createdAt: string
}

/** openapi.yaml TimelineEntry (:248-270). `id` es int64 (number), no string. */
export interface TimelineEntry {
  id: number
  fromState: State | null
  toState: State
  actorEmail: string
  // Jackson serializa con `ALWAYS` (no hay @JsonInclude ni
  // default-property-inclusion en el backend): la clave viaja presente con
  // `null`, nunca ausente. Tiparlo `?: string` habilitaría `!== undefined` y
  // el default de destructuring, que sólo cubren `undefined` y dejarían pasar
  // el `null` a la UI.
  responsible: string | null
  note: string | null
  occurredAt: string
}
