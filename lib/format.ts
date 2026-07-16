import type { RequestStatus } from './types'

export function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function daysUntil(iso: string) {
  const now = new Date()
  const due = new Date(iso)
  const diff = due.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export function isOverdue(iso: string, status: RequestStatus) {
  if (status === 'finalizado') return false
  return daysUntil(iso) < 0
}

export type StatusVariant =
  | 'default'
  | 'secondary'
  | 'outline'
  | 'success'
  | 'warning'
  | 'destructive'
  | 'info'

export const statusVariant: Record<RequestStatus, StatusVariant> = {
  pendiente: 'warning',
  en_revision: 'info',
  devuelto: 'destructive',
  aprobado: 'success',
  finalizado: 'secondary',
}
