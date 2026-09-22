import type {
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

export const PROGRAMS = [
  'Ingeniería de Sistemas',
  'Administración de Empresas',
  'Contaduría Pública',
  'Derecho',
  'Psicología',
]
