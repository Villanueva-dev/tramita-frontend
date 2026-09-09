
// El backend serializa LocalDateTime.now(ZoneOffset.UTC) SIN offset
// (Request.java:80, RequestTransitionLog.java:69). `new Date(iso)` en JS
// interpreta un date-time sin offset como hora LOCAL del navegador, no UTC —
// en America/Bogota (UTC-5) eso corre 5 horas y da un "lleva N días" incorrecto
// durante 5 de cada 24 horas del día. Único lugar autorizado a construir un
// Date a partir de un valor del servidor.
const HAS_OFFSET = /(?:Z|[+-]\d{2}:\d{2})$/

/**
 * Parsea un date-time del servidor. Si el valor ya trae offset (`+05:00`,
 * `-05:00`) o `Z`, se respeta tal cual; si no, se interpreta como UTC.
 * Chequeo determinista sobre la forma del string, no heurística.
 */
export function parseServerDateTime(value: string): Date {
  return new Date(HAS_OFFSET.test(value) ? value : `${value}Z`)
}

/** Días transcurridos desde `value` hasta `now` (inyectable para tests deterministas). */
export function daysSince(value: string, now: Date = new Date()): number {
  const then = parseServerDateTime(value)
  const diffMs = now.getTime() - then.getTime()
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

export function formatDate(iso: string) {
  const d = parseServerDateTime(iso)
  return d.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateTime(iso: string) {
  const d = parseServerDateTime(iso)
  return d.toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function addBusinessDays(iso: string, amount: number) {
  const result = parseServerDateTime(iso)
  if (Number.isNaN(result.getTime())) return iso
  result.setUTCDate(result.getUTCDate() + amount)
  return result.toISOString()
}

export function businessDaysUntil(iso: string) {
  const due = parseServerDateTime(iso)
  if (Number.isNaN(due.getTime())) return 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  due.setHours(0, 0, 0, 0)
  return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export function isOverdue(iso: string, status: string) {
  return status !== 'finalizado' && businessDaysUntil(iso) < 0
}

export type StatusVariant = 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'destructive' | 'info'

export const statusVariant: Record<string, StatusVariant> = {
  pendiente: 'warning',
  en_revision: 'info',
  devuelto: 'destructive',
  aprobado: 'success',
  finalizado: 'secondary',
}
