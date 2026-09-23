// Cliente HTTP central para la sesión de la Coordinación.
// Autoridad del contrato: specs/<feature>/contracts/openapi.yaml en el repo del backend, y
// el código que lo implementa. docs/integracion-auth.md es guía narrativa, no autoridad.
//
// Reglas del backend que este módulo encapsula:
// - Sesión por cookie HttpOnly (el JS no la ve): "¿hay sesión?" solo lo sabe GET /auth/me.
// - CSRF double-submit: cookie XSRF-TOKEN (legible) -> header X-XSRF-TOKEN en cada POST.
// - Errores en application/problem+json (RFC 9457, que obsoleta a la 7807): { title, status, detail? }.

import type {
  InboxEntry,
  PublicReceipt,
  PublicRequestBody,
  Request,
  RequestSummary,
  TimelineEntry,
  WorkflowDefinition,
} from './types'

const BASE = '/api'
const XSRF_COOKIE = 'XSRF-TOKEN'
const XSRF_HEADER = 'X-XSRF-TOKEN'

/** Error tipado que espeja el formato problem+json (RFC 9457) del backend. */
export class ApiError extends Error {
  readonly status: number
  readonly title: string
  readonly detail?: string
  /** Segundos a esperar (header Retry-After); presente en 429. */
  readonly retryAfter?: number
  /** Compatibilidad para consumidores que aún usan un único arreglo de campos. */
  readonly fieldNames?: string[]
  readonly missingFields?: string[]
  readonly invalidFields?: string[]

  constructor(
    status: number,
    title: string,
    detail?: string,
    retryAfter?: number,
    fieldNames?: string[],
    missingFields?: string[],
    invalidFields?: string[],
  ) {
    super(detail ? `${title}: ${detail}` : title)
    this.name = 'ApiError'
    this.status = status
    this.title = title
    this.detail = detail
    this.retryAfter = retryAfter
    this.fieldNames = fieldNames
    this.missingFields = missingFields
    this.invalidFields = invalidFields
  }
}

/** Extrae el valor de una cookie de un string de cookies. Puro: testeable sin DOM. */
export function parseCookie(cookieString: string, name: string): string | null {
  for (const part of cookieString.split(';')) {
    const trimmed = part.trim()
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    if (trimmed.slice(0, eq) === name) {
      return decodeURIComponent(trimmed.slice(eq + 1))
    }
  }
  return null
}

function readXsrfToken(): string | null {
  if (typeof document === 'undefined') return null
  return parseCookie(document.cookie, XSRF_COOKIE)
}

/** Convierte una respuesta de error en un ApiError, leyendo problem+json si viene. */
export async function parseProblem(res: Response): Promise<ApiError> {
  let title = res.statusText || 'Error de solicitud'
  let detail: string | undefined
  let missingFields: string[] | undefined
  let invalidFields: string[] | undefined

  try {
    const body = (await res.json()) as {
      title?: unknown
      detail?: unknown
      missingFields?: unknown
      invalidFields?: unknown
    }
    if (typeof body.title === 'string' && body.title) title = body.title
    if (typeof body.detail === 'string' && body.detail) detail = body.detail
    const fieldsFrom = (value: unknown) =>
      Array.isArray(value) ? value.filter((field): field is string => typeof field === 'string') : []
    const missing = fieldsFrom(body.missingFields)
    const invalid = fieldsFrom(body.invalidFields)
    if (missing.length > 0) missingFields = missing
    if (invalid.length > 0) invalidFields = invalid
  } catch {
    // Sin cuerpo JSON: nos quedamos con el statusText.
  }

  const retryHeader = res.headers.get('Retry-After')
  const retryAfter =
    retryHeader && Number.isFinite(Number(retryHeader)) ? Number(retryHeader) : undefined

  const fieldNames = [...(missingFields ?? []), ...(invalidFields ?? [])]
  return new ApiError(
    res.status,
    title,
    detail,
    retryAfter,
    fieldNames.length > 0 ? fieldNames : undefined,
    missingFields,
    invalidFields,
  )
}

interface RequestOptions {
  method?: 'GET' | 'POST'
  body?: Record<string, unknown>
}

export async function apiFetch(
  path: string,
  opts: RequestOptions | RequestInit = {},
): Promise<Response> {
  const method = (opts.method ?? 'GET').toUpperCase()
  const isMutation = method !== 'GET'

  const body = typeof opts.body === 'string'
    ? opts.body
    : opts.body === undefined
      ? undefined
      : JSON.stringify(opts.body)

  const run = (): Promise<Response> => {
    const headers = new Headers('headers' in opts ? opts.headers : undefined)
    if (body !== undefined && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
    if (isMutation) {
      const token = readXsrfToken()
      if (token) headers.set(XSRF_HEADER, token)
    }
    return fetch(BASE + path, {
      ...opts,
      method,
      credentials: 'include',
      headers,
      body,
    })
  }

  let res = await run()

  // CSRF double-submit: si el token faltaba o estaba desincronizado (403), re-sembrar
  // con un GET y reintentar exactamente una vez.
  if (isMutation && res.status === 403) {
    await fetch(`${BASE}/auth/me`, { credentials: 'include' })
    res = await run()
  }

  return res
}

export async function problemMessage(response: Response, fallback: string) {
  try {
    const problem = await response.json() as { detail?: unknown; title?: unknown }
    return typeof problem.detail === 'string'
      ? problem.detail
      : typeof problem.title === 'string'
        ? problem.title
        : fallback
  } catch {
    return fallback
  }
}

// --- API de dominio ---

export interface SessionUser {
  email: string
  active: boolean
}

/**
 * Snapshot de la sesión. `null` si no hay sesión (401 es señal, no error).
 * Como es un GET, además siembra la cookie XSRF-TOKEN para los POST siguientes.
 */
export async function getMe(): Promise<SessionUser | null> {
  const res = await apiFetch('/auth/me')
  if (res.status === 401) return null
  if (!res.ok) throw await parseProblem(res)
  return (await res.json()) as SessionUser
}

export async function login(email: string, password: string): Promise<void> {
  const res = await apiFetch('/auth/login', { method: 'POST', body: { email, password } })
  if (!res.ok) throw await parseProblem(res)
}

export async function logout(): Promise<void> {
  const res = await apiFetch('/auth/logout', { method: 'POST' })
  if (!res.ok) throw await parseProblem(res)
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const res = await apiFetch('/auth/password', {
    method: 'POST',
    body: { currentPassword, newPassword },
  })
  if (!res.ok) throw await parseProblem(res)
}

// --- Motor de workflow (Fase B) ---
// Autoridad: Tramita/specs/002-workflow-engine/contracts/openapi.yaml.
// El mapa 422→campo (D-E) es estático por operación: cada operación tiene una
// sola causa de 422 (los datos inválidos por Bean Validation salen 400). Nunca
// se inspecciona el texto de `detail` para adivinar el campo.

/**
 * Catálogo de trámites vigentes (US1) — insumo del selector de registro.
 *
 * La 007 amplía `/workflow-definitions` para que cada definición traiga sus `states`
 * (`WorkflowDefinitionDetailResponse`, contrato :263-282). Esta función sigue tipando
 * `WorkflowDefinition[]` a propósito: `states` no se agrega acá porque ese mismo tipo
 * también tipa la definición anidada en `Request`, `RequestSummary` e `InboxEntry`,
 * donde el backend NO envía `states` — agregarlo ahí afirmaría un campo que nunca llega.
 * Nada en esta change lee `states[]` (el inicio sale de `currentState.isInitial`, D3 de
 * `design.md`); el día que una pantalla lo necesite, se tipa con su propio tipo.
 */
export async function listWorkflowDefinitions(): Promise<WorkflowDefinition[]> {
  const res = await apiFetch('/workflow-definitions')
  if (!res.ok) throw await parseProblem(res)
  return (await res.json()) as WorkflowDefinition[]
}

/**
 * Bandeja de trabajo de un responsable (007, contrato :35-119): las solicitudes que
 * esperan su acción, en el orden que decide el servidor (de la que más espera a la que
 * menos). `limit` es requerido en la firma a propósito: el contrato exige que quien llama
 * decida cuánto pide (:92-95), así que no hay un default silencioso en el cliente.
 */
export async function getInbox(responsible: string, limit: number): Promise<InboxEntry[]> {
  const res = await apiFetch(
    `/requests/inbox?responsible=${encodeURIComponent(responsible)}&limit=${limit}`,
  )
  if (!res.ok) throw await parseProblem(res)
  return (await res.json()) as InboxEntry[]
}

/** Campo del formulario al que se ata el 422 de `createRequest` (definición inexistente). */
export const CREATE_REQUEST_422_FIELD = 'definitionCode'

/**
 * Nombre del archivo que el backend declara en `Content-Disposition`, con reserva.
 *
 * El nombre no es decorativo: `DO-FR-100-{id}.pdf` identifica el formato institucional que
 * circula para firmarse, y lo fija el backend (`RequestController#getDocument`) junto con la
 * decisión de no incluir cédula ni nombre del estudiante. Reescribirlo en el cliente rompe esa
 * correspondencia y además duplica una decisión que ya está tomada del otro lado.
 *
 * Un nombre con separadores de ruta se descarta: viaja al disco de quien descarga y permitiría
 * escribir fuera de la carpeta de descargas.
 */
export function filenameFromContentDisposition(header: string | null, fallback: string): string {
  const name = header?.match(/filename="?([^";]+)"?/i)?.[1]?.trim()
  if (!name || name.includes('/') || name.includes('\\')) return fallback
  return name
}

export interface CreateRequestBody {
  definitionCode: string
  studentName: string
  studentDocument: string
  /** Opcionales en el contrato 003 (`required` solo exige los tres de arriba). */
  program?: string
  /** Ordinal del semestre cursado y aprobado (`'8'`), no un periodo académico. */
  semester?: string
  reason?: string
}

/** Registra una solicitud de trámite (US1). */
export async function createRequest(body: CreateRequestBody): Promise<Request> {
  // Allowlist explícito: guarda de privacidad, no una preferencia de estilo. La pantalla
  // del DO-FR-100 recoge ocho campos que no se persisten (contacto, sede, motivos…); con
  // una propagación del objeto llegarían al cuerpo y a sus registros de acceso.
  // NO reemplazar por spread — ver design.md, Decisión 1.
  const { definitionCode, studentName, studentDocument, program, semester, reason } = body
  const res = await apiFetch('/requests', {
    method: 'POST',
    body: { definitionCode, studentName, studentDocument, program, semester, reason },
  })
  if (!res.ok) throw await parseProblem(res)
  return (await res.json()) as Request
}

/**
 * Registers a public form submission. The workflow definition belongs exclusively
 * to the route; the explicit destructuring keeps UI-only values out of the request.
 */
export async function submitPublicRequest(
  definitionCode: string,
  body: PublicRequestBody,
): Promise<PublicReceipt> {
  const {
    studentName,
    studentDocument,
    studentEmail,
    studentPhone,
    program,
    campus,
    faculty,
    modality,
    semester,
    reason,
    signature,
  } = body
  const res = await apiFetch(`/public/requests/${encodeURIComponent(definitionCode)}`, {
    method: 'POST',
    body: {
      studentName,
      studentDocument,
      studentEmail,
      studentPhone,
      program,
      campus,
      faculty,
      modality,
      semester,
      reason,
      signature,
    },
  })
  if (!res.ok) throw await parseProblem(res)
  return (await res.json()) as PublicReceipt
}

/** Localiza solicitudes por nombre o cédula (US3, FR-011). El backend exige `minLength: 2`. */
export async function searchRequests(term: string): Promise<RequestSummary[]> {
  const res = await apiFetch(`/requests?search=${encodeURIComponent(term)}`)
  if (!res.ok) throw await parseProblem(res)
  return (await res.json()) as RequestSummary[]
}

/** Detalle de una solicitud con sus transiciones disponibles. */
export async function getRequest(id: string): Promise<Request> {
  const res = await apiFetch(`/requests/${encodeURIComponent(id)}`)
  if (!res.ok) throw await parseProblem(res)
  return (await res.json()) as Request
}

/** Timeline de auditoría completo, en orden cronológico ascendente (US3, FR-008). */
export async function getRequestTimeline(id: string): Promise<TimelineEntry[]> {
  const res = await apiFetch(`/requests/${encodeURIComponent(id)}/timeline`)
  if (!res.ok) throw await parseProblem(res)
  return (await res.json()) as TimelineEntry[]
}

/** Campo del formulario al que se ata el 422 de `advanceRequest` (nota obligatoria faltante). */
export const ADVANCE_REQUEST_422_FIELD = 'note'

/**
 * Avanza o devuelve una solicitud por una transición definida (US2, US5). `note`
 * solo viaja en el body cuando se pasa: es obligatoria únicamente si la
 * transición la exige (devoluciones, FR-014) y el backend valida eso, no el front.
 */
export async function advanceRequest(
  id: string,
  targetStateCode: string,
  note?: string,
): Promise<Request> {
  const body: Record<string, unknown> = { targetStateCode }
  if (note !== undefined) body.note = note

  const res = await apiFetch(`/requests/${encodeURIComponent(id)}/transitions`, {
    method: 'POST',
    body,
  })
  if (!res.ok) throw await parseProblem(res)
  return (await res.json()) as Request
}
