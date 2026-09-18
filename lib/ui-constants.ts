import type {
  RequestStatus,
  RequestType,
  RequestTypeConfig,
} from './types'

export const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
  adicion_creditos: 'Adición de Créditos',
  novedad_notas: 'Novedad de Notas',
}

export const STATUS_LABELS: Record<RequestStatus, string> = {
  pendiente: 'Pendiente',
  en_revision: 'En Revisión',
  devuelto: 'Devuelto',
  aprobado: 'Aprobado',
  finalizado: 'Finalizado',
}

export const PROGRAMS = [
  'Ingeniería de Sistemas',
  'Administración de Empresas',
  'Contaduría Pública',
  'Derecho',
  'Psicología',
]


export const workflowConfig: RequestTypeConfig[] = [
  {
    id: 'adicion_creditos',
    label: 'Adición de Créditos',
    description:
      'Solicitud para inscribir créditos adicionales por encima del límite regular del semestre.',
    enabled: true,
    stages: [
      { id: 'radicacion', label: 'Radicación', description: 'Registro inicial de la solicitud' },
      { id: 'revision', label: 'Revisión de Coordinación', description: 'Validación de requisitos académicos' },
      { id: 'aprobacion', label: 'Aprobación', description: 'Decisión final del coordinador' },
      { id: 'cierre', label: 'Cierre y Notificación', description: 'Generación de PDF y notificación al estudiante' },
    ],
  },
  {
    id: 'novedad_notas',
    label: 'Novedad de Notas',
    description:
      'Solicitud de corrección o modificación de una calificación registrada.',
    enabled: true,
    stages: [
      { id: 'radicacion', label: 'Radicación', description: 'Registro inicial de la novedad' },
      { id: 'verificacion', label: 'Verificación Docente', description: 'Confirmación con el docente responsable' },
      { id: 'aprobacion', label: 'Aprobación', description: 'Autorización del cambio de nota' },
      { id: 'cierre', label: 'Cierre y Notificación', description: 'Generación de PDF y notificación al estudiante' },
    ],
  },
]
