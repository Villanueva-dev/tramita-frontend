'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  COORDINATOR_NAME,
  mockRequests,
  workflowConfig as defaultWorkflowConfig,
} from './mock-data'
import type {
  AcademicRequest,
  RequestStatus,
  RequestType,
  RequestTypeConfig,
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
  attachments: { id: string; name: string; size: string; type: string }[]
}

interface TramitaContextValue {
  isAuthenticated: boolean
  coordinatorName: string
  requests: AcademicRequest[]
  workflowConfig: RequestTypeConfig[]
  login: (email: string) => void
  logout: () => void
  getRequest: (id: string) => AcademicRequest | undefined
  createRequest: (input: NewRequestInput) => AcademicRequest
  transition: (
    id: string,
    action: 'revisar' | 'aprobar' | 'devolver' | 'finalizar',
    comment?: string,
  ) => void
  updateWorkflowConfig: (config: RequestTypeConfig[]) => void
}

const TramitaContext = createContext<TramitaContextValue | null>(null)

function nowISO() {
  return new Date().toISOString().slice(0, 19)
}

function nextStatusFor(
  action: 'revisar' | 'aprobar' | 'devolver' | 'finalizar',
): { status: RequestStatus; label: string } {
  switch (action) {
    case 'revisar':
      return { status: 'en_revision', label: 'Inició revisión' }
    case 'aprobar':
      return { status: 'aprobado', label: 'Aprobó la solicitud' }
    case 'devolver':
      return { status: 'devuelto', label: 'Devolvió la solicitud' }
    case 'finalizar':
      return { status: 'finalizado', label: 'Finalizó el trámite' }
  }
}

function stageForStatus(status: RequestStatus, type: RequestType): string {
  const map: Record<RequestStatus, string> = {
    pendiente: 'radicacion',
    en_revision: type === 'novedad_notas' ? 'verificacion' : 'revision',
    devuelto: type === 'novedad_notas' ? 'verificacion' : 'revision',
    aprobado: 'aprobacion',
    finalizado: 'cierre',
  }
  return map[status]
}

export function TramitaProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [requests, setRequests] = useState<AcademicRequest[]>(mockRequests)
  const [workflowConfig, setWorkflowConfig] = useState<RequestTypeConfig[]>(
    defaultWorkflowConfig,
  )

  const login = useCallback(() => setIsAuthenticated(true), [])
  const logout = useCallback(() => setIsAuthenticated(false), [])

  const getRequest = useCallback(
    (id: string) => requests.find((r) => r.id === id),
    [requests],
  )

  const createRequest = useCallback((input: NewRequestInput) => {
    const ts = nowISO()
    const seq = Math.floor(Math.random() * 900 + 100)
    const newRequest: AcademicRequest = {
      id: `REQ-${Date.now().toString().slice(-4)}`,
      radicado: `TRA-2025-0${seq}`,
      type: input.type,
      status: 'pendiente',
      priority: input.priority,
      createdAt: ts,
      updatedAt: ts,
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3)
        .toISOString()
        .slice(0, 19),
      studentCode: input.studentCode,
      studentCedula: input.studentCedula,
      studentName: input.studentName,
      studentEmail: input.studentEmail,
      program: input.program,
      semester: input.semester,
      subjects: input.subjects,
      reason: input.reason,
      attachments: input.attachments,
      currentStage: 'radicacion',
      assignedTo: COORDINATOR_NAME,
      timeline: [
        {
          id: `t-${Date.now()}`,
          date: ts,
          actor: 'Sistema Trámita',
          action: 'Solicitud radicada',
          toStatus: 'pendiente',
          comment: 'Solicitud creada y registrada en el sistema.',
        },
      ],
    }
    setRequests((prev) => [newRequest, ...prev])
    return newRequest
  }, [])

  const transition = useCallback(
    (
      id: string,
      action: 'revisar' | 'aprobar' | 'devolver' | 'finalizar',
      comment?: string,
    ) => {
      setRequests((prev) =>
        prev.map((r) => {
          if (r.id !== id) return r
          const { status, label } = nextStatusFor(action)
          const ts = nowISO()
          const event: TimelineEvent = {
            id: `t-${Date.now()}`,
            date: ts,
            actor: COORDINATOR_NAME,
            action: label,
            fromStatus: r.status,
            toStatus: status,
            comment: comment || undefined,
          }
          return {
            ...r,
            status,
            updatedAt: ts,
            currentStage: stageForStatus(status, r.type),
            timeline: [...r.timeline, event],
          }
        }),
      )
    },
    [],
  )

  const updateWorkflowConfig = useCallback(
    (config: RequestTypeConfig[]) => setWorkflowConfig(config),
    [],
  )

  const value = useMemo<TramitaContextValue>(
    () => ({
      isAuthenticated,
      coordinatorName: COORDINATOR_NAME,
      requests,
      workflowConfig,
      login,
      logout,
      getRequest,
      createRequest,
      transition,
      updateWorkflowConfig,
    }),
    [
      isAuthenticated,
      requests,
      workflowConfig,
      login,
      logout,
      getRequest,
      createRequest,
      transition,
      updateWorkflowConfig,
    ],
  )

  return (
    <TramitaContext.Provider value={value}>{children}</TramitaContext.Provider>
  )
}

export function useTramita() {
  const ctx = useContext(TramitaContext)
  if (!ctx) throw new Error('useTramita must be used within TramitaProvider')
  return ctx
}
