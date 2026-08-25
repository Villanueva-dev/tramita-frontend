export type RequestType = 'adicion_creditos' | 'novedad_notas'

export type RequestStatus =
  | 'pendiente'
  | 'en_revision'
  | 'devuelto'
  | 'aprobado'
  | 'finalizado'

export type Priority = 'normal' | 'urgente'

export interface Attachment {
  id: string
  name: string
  size: string
  type: string
}

export interface TimelineEvent {
  id: string
  date: string // ISO
  actor: string
  action: string
  fromStatus?: RequestStatus
  toStatus?: RequestStatus
  comment?: string
}

export interface SubjectInfo {
  code: string
  name: string
  credits: number
  group?: string
  currentGrade?: string
  proposedGrade?: string
}

export interface AcademicRequest {
  id: string
  radicado: string
  type: RequestType
  status: RequestStatus
  priority: Priority
  createdAt: string // ISO
  updatedAt: string // ISO
  dueDate: string // ISO

  // Student data (student is NOT a system user)
  studentCode: string
  studentCedula: string
  studentName: string
  studentEmail: string
  program: string
  semester: string

  subjects: SubjectInfo[]
  reason: string
  attachments: Attachment[]
  timeline: TimelineEvent[]
  currentStage: string
  assignedTo: string
}

export interface WorkflowStageConfig {
  id: string
  label: string
  description: string
}

export interface RequestTypeConfig {
  id: RequestType
  label: string
  description: string
  enabled: boolean
  stages: WorkflowStageConfig[]
}

// --- Modelo del motor de workflow (Fase B) ---
// Espeja Tramita/specs/002-workflow-engine/contracts/openapi.yaml (:177-268).
// Aditivo: los tipos de arriba se borran en la Fase 5, estos los reemplazan.

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
