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
