// Modelo del cliente, derivado del contrato del motor de workflow
// (Tramita/specs/003-request-form-rules/contracts/openapi.yaml, que sucede a la 002).
// No hay trámites ni estados fijados acá: son datos que el backend configura (FR-009).
//
// Nota: los tipos de este archivo describen la RESPUESTA del backend y siguen reflejando
// lo que las pantallas leen hoy. El cuerpo de creación ampliado por la 003 vive en
// `CreateRequestBody` (api.ts); ampliar `Request` se difirió hasta que alguna pantalla
// necesite mostrar esos campos.

/** openapi.yaml WorkflowDefinition (:177-183). */
export interface WorkflowDefinition {
  code: string
  name: string
  version: number
}

/**
 * openapi.yaml State (:202-208). Sin `responsible`: ese vive en la transición. `isInitial`
 * lo agrega la feature 007 (Tramita/specs/007-coordination-inbox/contracts/openapi.yaml,
 * StateResponse :284-306): responde «¿es el inicio?» con dato propio del contrato, sin
 * reconocer códigos de estado en el cliente.
 */
export interface State {
  code: string
  name: string
  isInitial: boolean
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

/** Body accepted by the anonymous public request-capture endpoint. */
export interface PublicRequestBody {
  studentName: string
  studentDocument: string
  studentEmail: string
  studentPhone: string
  program: string
  campus: string
  faculty: string
  modality: string
  semester: string
  reason: string
  signature: string
}

/** Deliberately minimal public receipt: it exposes no request identifier or state. */
export interface PublicReceipt {
  message: string
}

export type RequestType = 'adicion_creditos' | 'novedad_notas'
export type RequestStatus = 'pendiente' | 'en_revision' | 'devuelto' | 'aprobado' | 'finalizado'
export type SignatureType = 'DIGITAL' | 'ESCANEADA'

export interface AttachmentApproval {
  id: number
  signerName: string
  signerRole: string
  signatureType: SignatureType
  documentSha256: string
  recordedByEmail: string
  note?: string
  signedAt: string
  timestampedAt: string
}

export interface DocumentApprovalInput {
  signerName: string
  signerRole: string
  signatureType: SignatureType
  signedAt: string
  note?: string
}

export interface Attachment {
  id: string
  name: string
  size: string
  type: string
  sha256?: string
  approvals: AttachmentApproval[]
  file?: File
}

export interface SubjectInfo {
  code: string
  name: string
  credits: number
  group?: string
  currentGrade?: string
  proposedGrade?: string
}

export interface RequestTypeConfig {
  id: RequestType
  label: string
  description: string
  enabled: boolean
  stages: { id: string; label: string; description: string }[]
}

export interface TimelineEvent {
  id: string
  date: string
  actor: string
  action: string
  fromStatus?: RequestStatus
  toStatus?: RequestStatus
  comment?: string
}

export interface AcademicRequest {
  id: string
  radicado: string
  /**
   * La definición tal como la envía el motor. Es lo que se muestra como tipo de trámite en
   * cualquier lugar de la pantalla (D2): badge, fila «Tipo de trámite», PDF.
   */
  definition: WorkflowDefinition
  /**
   * Clasificación para ramificar: columnas de asignaturas, párrafo del PDF, filtro del
   * tablero y semántica del estado. `null` es una definición que el cliente no reconoce, y
   * nunca se trata como adición de créditos (#9 b). Un ternario binario sobre este campo
   * compila igual con `null` y cae en la rama de adición: escribir siempre las tres ramas.
   */
  type: RequestType | null
  status: RequestStatus
  /**
   * Nombre del estado tal como lo define el motor de workflow y lo envía el
   * backend en `currentState.name`. Es lo que se muestra: `status` agrupa para
   * filtrar y colorear, pero no puede distinguir dos estados finales distintos
   * (RECHAZADA y FINALIZADA) ni los seis intermedios que colapsa.
   */
  stateName: string
  /**
   * El estado tal como lo envía el motor. `stateName` sigue siendo lo que se muestra, pero
   * el nombre no permite razonar: las preguntas sobre el trámite (¿cerrado?, ¿devuelto?,
   * ¿terminó bien?) se responden con los predicados de `lib/request-state.ts`, que necesitan
   * el código y `isFinal`. Descartarlos acá fue la razón de que todo colgara de `status`.
   */
  currentState: State
  priority: 'normal' | 'urgente'
  createdAt: string
  updatedAt: string
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
  availableTransitions?: AvailableTransition[]
}

export interface RequestMetrics {
  total: number
  byDefinition: Record<string, number>
  byCurrentState: Record<string, number>
  completed: number
  averageCycleHours: number | null
  returnCount: number
}

export interface WorkflowStageConfig {
  id: string
  label: string
  description: string
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
