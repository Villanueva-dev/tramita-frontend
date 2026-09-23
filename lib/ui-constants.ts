import type {
  InboxOrigin,
  RequestStatus,
  RequestType,
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

/**
 * Traduce `InboxEntry.origin` a texto legible (coordination-inbox/spec.md, «El origen se
 * presenta en sus tres casos»). Enum cerrado del contrato de la bandeja, no del motor de
 * trámites configurable — no se confunde con `REQUEST_TYPE_LABELS`.
 */
export const ORIGIN_LABELS: Record<InboxOrigin, string> = {
  COORDINATION: 'Coordinación',
  PUBLIC_LINK: 'Enlace público',
}

/** `origin: null` es una anomalía de datos declarada, no un tercer origen (contrato :255-258). */
export const ORIGIN_UNKNOWN_LABEL = 'Origen no registrado'

export const PROGRAMS = [
  'Ingeniería de Sistemas',
  'Administración de Empresas',
  'Contaduría Pública',
  'Derecho',
  'Psicología',
]
