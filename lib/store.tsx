'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useEffect,
  type ReactNode,
} from 'react'

import { apiFetch, problemMessage } from './api'
import { useAuth } from './auth-store'
import { addBusinessDays } from './format'
import { workflowConfig as defaultWorkflowConfig } from './mock-data'
import type {
  AcademicRequest,
  Attachment,
  AttachmentApproval,
  DocumentApprovalInput,
  RequestStatus,
  RequestMetrics,
  RequestType,
  RequestTypeConfig,
  SignatureType,
  SubjectInfo,
  TimelineEvent,
} from './types'

export interface NewRequestInput {
  type: RequestType
  priority: 'normal' | 'urgente'
  studentCode: string
  studentCedula: string
  studentName: string
  studentEmail: string
  program: string
  semester: string
  subjects: SubjectInfo[]
  reason: string
  attachments: Attachment[]
}

interface ApiDefinition { code: string; name: string; version: number }
interface ApiState { code: string; name: string; isFinal: boolean }
interface ApiTransition { targetState: ApiState; responsible: string; requiresNote: boolean }
interface ApiSubject {
  code: string
  name: string
  credits: number | null
  group: string | null
  currentGrade: string | null
  proposedGrade: string | null
}
interface ApiRequest {
  id: string
  definition: ApiDefinition
  studentName: string
  studentDocument: string
  studentCode?: string | null
  studentEmail?: string | null
  program?: string | null
  semester?: string | null
  reason?: string | null
  priority?: 'normal' | 'urgente' | null
  subjects?: ApiSubject[]
  currentState: ApiState
  availableTransitions?: ApiTransition[]
  createdAt: string
}
interface ApiTimelineEntry {
  id: number
  fromState: ApiState | null
  toState: ApiState
  actorEmail: string
  responsible: string | null
  note: string | null
  occurredAt: string
}
interface ApiDocument {
  id: string
  originalName: string
  contentType: string
  size: number
  sha256: string
}
interface ApiDocumentApproval {
  id: number
  signerName: string
  signerRole: string
  signatureType: SignatureType
  documentSha256: string
  recordedByEmail: string
  note: string | null
  signedAt: string
  timestampedAt: string
}

interface TramitaContextValue {
  isAuthenticated: boolean
  coordinatorName: string
  requests: AcademicRequest[]
  metrics: RequestMetrics | null
  workflowConfig: RequestTypeConfig[]
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  getRequest: (id: string) => AcademicRequest | undefined
  refreshRequest: (id: string) => Promise<void>
  createRequest: (input: NewRequestInput) => Promise<AcademicRequest>
  transition: (id: string, targetStateCode: string, comment?: string) => Promise<void>
  uploadDocument: (requestId: string, file: File) => Promise<Attachment>
  registerDocumentApproval: (requestId: string, documentId: string, input: DocumentApprovalInput) => Promise<AttachmentApproval>
  updateWorkflowConfig: (config: RequestTypeConfig[]) => void
}

const TramitaContext = createContext<TramitaContextValue | null>(null)

const typeFromCode = (code: string): RequestType => code === 'NOVEDAD_NOTAS' ? 'novedad_notas' : 'adicion_creditos'
const typeToCode = (type: RequestType) => type === 'novedad_notas' ? 'NOVEDAD_NOTAS' : 'ADICION_CREDITOS'

function statusFromState(state: ApiState): RequestStatus {
  if (state.isFinal) return 'finalizado'
  if (state.code === 'REGISTRADA') return 'pendiente'
  if (state.code.includes('DEVUELTA') || state.code.includes('RECHAZADA')) return 'devuelto'
  if (state.code.includes('APROBADA') || state.code === 'APROBADO') return 'aprobado'
  return 'en_revision'
}

function stageFromState(state: ApiState, type: RequestType) {
  if (state.code === 'REGISTRADA') return 'radicacion'
  if (state.isFinal) return 'cierre'
  return type === 'novedad_notas' ? 'verificacion' : 'revision'
}

function deriveDueDate(createdAt: string): string {
  // El SLA provisional del proceso es de hasta 6 días hábiles, sin depender de prioridad.
  return addBusinessDays(createdAt, 6)
}

function baseRequest(apiRequest: ApiRequest): AcademicRequest {
  const type = typeFromCode(apiRequest.definition.code)
  const status = statusFromState(apiRequest.currentState)
  const priority = apiRequest.priority ?? 'normal'
  return {
    id: apiRequest.id,
    radicado: apiRequest.id,
    type,
    status,
    createdAt: apiRequest.createdAt,
    updatedAt: apiRequest.createdAt,
    dueDate: deriveDueDate(apiRequest.createdAt),
    studentCedula: apiRequest.studentDocument,
    studentName: apiRequest.studentName,
    subjects: apiRequest.subjects?.map((subject) => ({
      code: subject.code,
      name: subject.name,
      credits: subject.credits ?? 0,
      group: subject.group ?? undefined,
      currentGrade: subject.currentGrade ?? undefined,
      proposedGrade: subject.proposedGrade ?? undefined,
    })) ?? [],
    reason: apiRequest.reason ?? '',
    attachments: [],
    timeline: [],
    currentStage: stageFromState(apiRequest.currentState, type),
    assignedTo: apiRequest.availableTransitions?.[0]?.responsible ?? '',
    // Estos valores ya vienen persistidos desde V2.3.0.
    studentCode: apiRequest.studentCode ?? '',
    studentEmail: apiRequest.studentEmail ?? '',
    program: apiRequest.program ?? '',
    semester: apiRequest.semester ?? '',
    priority,
    availableTransitions: apiRequest.availableTransitions,
  }
}

function applyTimeline(request: AcademicRequest, entries: ApiTimelineEntry[]): AcademicRequest {
  return {
    ...request,
    timeline: entries.map((entry): TimelineEvent => ({
      id: String(entry.id),
      date: entry.occurredAt,
      actor: entry.actorEmail,
      action: entry.fromState ? `Transición a ${entry.toState.name}` : 'Solicitud radicada',
      fromStatus: entry.fromState ? statusFromState(entry.fromState) : undefined,
      toStatus: statusFromState(entry.toState),
      comment: entry.note ?? undefined,
    })),
  }
}

function mapApproval(approval: ApiDocumentApproval): AttachmentApproval {
  return {
    id: approval.id,
    signerName: approval.signerName,
    signerRole: approval.signerRole,
    signatureType: approval.signatureType,
    documentSha256: approval.documentSha256,
    recordedByEmail: approval.recordedByEmail,
    note: approval.note ?? undefined,
    signedAt: approval.signedAt,
    timestampedAt: approval.timestampedAt,
  }
}

async function loadAttachment(requestId: string, document: ApiDocument): Promise<Attachment> {
  const approvalsResponse = await apiFetch(`/requests/${requestId}/documents/${document.id}/approvals`)
  const approvals = approvalsResponse.ok
    ? (await approvalsResponse.json() as ApiDocumentApproval[]).map(mapApproval)
    : []
  return {
    id: document.id,
    name: document.originalName,
    size: `${Math.ceil(document.size / 1024)} KB`,
    type: document.contentType,
    sha256: document.sha256,
    approvals,
  }
}

async function loadRequest(id: string): Promise<AcademicRequest> {
  const [requestResponse, timelineResponse, documentsResponse] = await Promise.all([
    apiFetch(`/requests/${id}`),
    apiFetch(`/requests/${id}/timeline`),
    apiFetch(`/requests/${id}/documents`),
  ])
  if (!requestResponse.ok) throw new Error(await problemMessage(requestResponse, 'No se pudo cargar la solicitud'))
  const request = baseRequest(await requestResponse.json() as ApiRequest)
  const withTimeline = timelineResponse.ok
    ? applyTimeline(request, await timelineResponse.json() as ApiTimelineEntry[])
    : request
  if (!documentsResponse.ok) return withTimeline
  const documents = await documentsResponse.json() as ApiDocument[]
  return {
    ...withTimeline,
    // Cada adjunto trae su traza de aprobaciones desde el backend real.
    attachments: await Promise.all(documents.map((document) => loadAttachment(id, document))),
  }
}

export function TramitaProvider({ children }: { children: ReactNode }) {
  const { status: authStatus, user, login: authLogin, logout: authLogout } = useAuth()
  const [requests, setRequests] = useState<AcademicRequest[]>([])
  const [metrics, setMetrics] = useState<RequestMetrics | null>(null)
  const [workflowConfig, setWorkflowConfig] = useState(defaultWorkflowConfig)

  const refreshRequests = useCallback(async () => {
    const response = await apiFetch('/requests')
    if (!response.ok) throw new Error(await problemMessage(response, 'No se pudieron cargar las solicitudes'))
    const summaries = await response.json() as ApiRequest[]
    setRequests(summaries.map(baseRequest))
    const metricsResponse = await apiFetch('/metrics/requests')
    if (metricsResponse.ok) setMetrics(await metricsResponse.json() as RequestMetrics)
  }, [])

  const isAuthenticated = authStatus === 'authenticated'

  useEffect(() => {
    if (!isAuthenticated) return

    let active = true
    queueMicrotask(() => {
      void refreshRequests().catch(() => {
        if (active) setRequests([])
      })
    })
    return () => { active = false }
  }, [isAuthenticated, refreshRequests])

  useEffect(() => {
    // Todas las pantallas vuelven al login cuando la sesión server-side expira.
    const expireSession = () => {
      setRequests([])
      setMetrics(null)
    }
    window.addEventListener('tramita:session-expired', expireSession)
    return () => window.removeEventListener('tramita:session-expired', expireSession)
  }, [])

  useEffect(() => {
    // El catálogo real evita que el formulario dependa de tipos hardcodeados.
    if (!isAuthenticated) return
    apiFetch('/workflow-definitions').then(async (response) => {
      if (!response.ok) return
      const definitions = await response.json() as ApiDefinition[]
      setWorkflowConfig((current) => definitions.map((definition) =>
        current.find((item) => item.id === typeFromCode(definition.code)) ?? {
          id: typeFromCode(definition.code),
          label: definition.name,
          description: definition.name,
          enabled: true,
          stages: [],
        },
      ))
    })
  }, [isAuthenticated])

  const login = useCallback(async (email: string, password: string) => {
    await authLogin(email, password)
    await refreshRequests()
  }, [authLogin, refreshRequests])

  const logout = useCallback(async () => {
    await authLogout()
    setRequests([])
    setMetrics(null)
  }, [authLogout])

  const getRequest = useCallback((id: string) => requests.find((request) => request.id === id), [requests])
  const refreshRequest = useCallback(async (id: string) => {
    const refreshed = await loadRequest(id)
    // Inserta solicitudes abiertas por URL y conserva campos aún no persistidos por el backend.
    setRequests((previous) => {
      const existing = previous.some((item) => item.id === id)
      return existing
        ? previous.map((item) => item.id === id ? refreshed : item)
        : [refreshed, ...previous]
    })
  }, [])

  const uploadDocument = useCallback(async (requestId: string, file: File) => {
    const form = new FormData()
    form.append('file', file)
    const response = await apiFetch(`/requests/${requestId}/documents`, { method: 'POST', body: form })
    if (!response.ok) throw new Error(await problemMessage(response, 'No se pudo adjuntar el documento'))
    const document = await response.json() as ApiDocument
    return {
      id: document.id,
      name: document.originalName,
      size: `${Math.ceil(document.size / 1024)} KB`,
      type: document.contentType,
      sha256: document.sha256,
      approvals: [],
    }
  }, [])

  const registerDocumentApproval = useCallback(async (requestId: string, documentId: string, input: DocumentApprovalInput) => {
    const response = await apiFetch(`/requests/${requestId}/documents/${documentId}/approvals`, {
      method: 'POST',
      body: JSON.stringify({
        ...input,
        note: input.note?.trim() || undefined,
      }),
    })
    if (!response.ok) throw new Error(await problemMessage(response, 'No se pudo registrar la aprobación documental'))
    const approval = mapApproval(await response.json() as ApiDocumentApproval)
    // Después de persistir, el detalle se recarga para reflejar la traza documental real.
    await refreshRequest(requestId)
    return approval
  }, [refreshRequest])

  const createRequest = useCallback(async (input: NewRequestInput) => {
    const response = await apiFetch('/requests', {
      method: 'POST',
      body: JSON.stringify({
        definitionCode: typeToCode(input.type),
        studentName: input.studentName,
        studentDocument: input.studentCedula,
        // El formulario completo se envía al backend; solo los adjuntos siguen diferidos.
        studentCode: input.studentCode,
        studentEmail: input.studentEmail,
        program: input.program,
        semester: input.semester,
        reason: input.reason,
        priority: input.priority,
        subjects: input.subjects,
      }),
    })
    if (!response.ok) throw new Error(await problemMessage(response, 'No se pudo registrar la solicitud'))
    const created = await loadRequest((await response.json() as ApiRequest).id)
    // Los adjuntos se suben después de crear la solicitud y reciben su ID de PostgreSQL.
    const uploadedAttachments = await Promise.all(
      input.attachments.filter((attachment) => attachment.file).map((attachment) =>
        uploadDocument(created.id, attachment.file!)),
    )
    const complete = { ...created, attachments: uploadedAttachments }
    setRequests((previous) => [complete, ...previous.filter((request) => request.id !== complete.id)])
    return complete
  }, [uploadDocument])

  const transition = useCallback(async (id: string, targetStateCode: string, comment?: string) => {
    const request = getRequest(id)
    if (!request) throw new Error('Solicitud no encontrada')
    const detailResponse = await apiFetch(`/requests/${id}`)
    if (!detailResponse.ok) throw new Error(await problemMessage(detailResponse, 'No se pudo consultar la solicitud'))
    const detail = await detailResponse.json() as ApiRequest
    const selected = (detail.availableTransitions ?? []).find(
      (item) => item.targetState.code === targetStateCode,
    )
    if (!selected) throw new Error('La transición ya no está disponible para esta solicitud')
    const response = await apiFetch(`/requests/${id}/transitions`, {
      method: 'POST',
      body: JSON.stringify({ targetStateCode, note: comment || undefined }),
    })
    if (!response.ok) throw new Error(await problemMessage(response, 'No se pudo aplicar la transición'))
    const updated = await loadRequest(id)
    setRequests((previous) => previous.map((item) => item.id === id ? {
      ...updated,
      // El backend todavía no persiste estos campos complementarios del formulario.
      priority: item.priority,
      studentCode: item.studentCode,
      studentEmail: item.studentEmail,
      program: item.program,
      semester: item.semester,
      subjects: item.subjects,
      reason: item.reason,
      dueDate: item.dueDate,
    } : item))
  }, [getRequest])

  const updateWorkflowConfig = useCallback((config: RequestTypeConfig[]) => setWorkflowConfig(config), [])
  const visibleRequests = useMemo(
    () => isAuthenticated ? requests : [],
    [isAuthenticated, requests],
  )
  const visibleMetrics = useMemo(
    () => isAuthenticated ? metrics : null,
    [isAuthenticated, metrics],
  )
  const value = useMemo(() => ({
    isAuthenticated,
    coordinatorName: user?.email ?? '',
    requests: visibleRequests,
    metrics: visibleMetrics,
    workflowConfig,
    login,
    logout,
    getRequest,
    refreshRequest,
    createRequest,
    transition,
    uploadDocument,
    registerDocumentApproval,
    updateWorkflowConfig,
  }), [isAuthenticated, user, visibleRequests, visibleMetrics, workflowConfig, login, logout, getRequest, refreshRequest, createRequest, transition, uploadDocument, registerDocumentApproval, updateWorkflowConfig])
  return <TramitaContext.Provider value={value}>{children}</TramitaContext.Provider>
}

export function useTramita() {
  const context = useContext(TramitaContext)
  if (!context) throw new Error('useTramita must be used within TramitaProvider')
  return context
}
