'use client'

import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AlertTriangle, ArrowLeft, CheckCircle2, FileText, Info, Loader2, User, X } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { WorkflowTimeline } from '@/components/workflow-timeline'
import { TransitionDialog } from '@/components/transition-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ADVANCE_REQUEST_422_FIELD, ApiError, advanceRequest } from '@/lib/api'
import { apiErrorMessages } from '@/lib/api-errors'
import { useAuth } from '@/lib/auth-store'
import { useRequestDetail } from '@/lib/use-request-detail'
import { daysSince, formatDate } from '@/lib/format'
import type { AvailableTransition, Request } from '@/lib/types'

// El detalle muestra los siete campos que `Request` produce. Radicado,
// prioridad, vencimiento, programa, semestre, correo, asignaturas, adjuntos,
// motivo y responsable asignado no están en el contrato: no se recortaron por
// alcance, nunca existieron del lado del motor.
//
// Sin radicado, el encabezado pasa a ser el nombre del estudiante: es el dato
// con el que la Coordinación identifica el caso y por el que lo busca.

/**
 * El responsable no vive en el estado (`State` es {code, name, isFinal}): se
 * deriva de las transiciones salientes. Si todas declaran el mismo, ese es el
 * responsable del estado actual; si difieren, no hay uno solo y elegir alguno
 * sería inventar. Un trámite cerrado no depende de nadie.
 *
 * Devuelve los tres casos como un valor y no un `string | null`, para que el
 * render no tenga que volver a preguntar por `isFinal`: con esa duplicación,
 * la rama de trámite cerrado de esta función nunca podía cambiar lo que se ve
 * — era código incapaz de fallar y, por lo tanto, de verificarse.
 */
export type Responsibility =
  | { kind: 'closed' }
  | { kind: 'single'; who: string }
  | { kind: 'varies' }

export function currentResponsibility(request: Request): Responsibility {
  if (request.currentState.isFinal) return { kind: 'closed' }
  const distinct = [...new Set(request.availableTransitions.map((t) => t.responsible))]
  return distinct.length === 1 ? { kind: 'single', who: distinct[0] } : { kind: 'varies' }
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm">{value}</dd>
    </div>
  )
}

function NotFound() {
  return (
    <AppShell title="Solicitud">
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-20 text-center">
        <span className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
          <FileText className="size-6" />
        </span>
        <div>
          <h2 className="text-lg font-semibold">Solicitud no encontrada</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            La solicitud que busca no existe o fue removida.
          </p>
        </div>
        <Link href="/dashboard">
          <Button variant="outline">Volver a la bandeja</Button>
        </Link>
      </div>
    </AppShell>
  )
}

export default function RequestDetailPage() {
  const params = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const { request, timeline, loading, errors, notFound, unauthorized, reload } =
    useRequestDetail(params.id)
  const { sessionExpired } = useAuth()
  const [showCreated, setShowCreated] = useState(searchParams.get('created') === '1')
  const [pending, setPending] = useState<AvailableTransition | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [noteError, setNoteError] = useState('')
  const [conflict, setConflict] = useState('')
  const [formErrors, setFormErrors] = useState<string[]>([])

  // Un 401 en la lectura tiene la misma respuesta que en la escritura: la
  // sesión terminó y el gate de AppShell debe llevar al login.
  useEffect(() => {
    if (unauthorized) sessionExpired()
  }, [unauthorized, sessionExpired])

  async function runTransition(note?: string) {
    if (!pending) return
    setSubmitting(true)
    setNoteError('')
    setConflict('')
    setFormErrors([])
    try {
      await advanceRequest(params.id, pending.targetState.code, note)
      setPending(null)
      // Se relee en vez de confiar en el Request devuelto: el timeline también
      // cambió, y son dos recursos distintos.
      reload()
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        // El 422 pertenece al campo de nota (ADVANCE_REQUEST_422_FIELD), no a
        // un banner: es la observación que la transición exige y no llegó.
        setNoteError(apiErrorMessages(err).join(' '))
      } else if (err instanceof ApiError && err.status === 409) {
        // Ni transición no vigente ni conflicto de concurrencia se distinguen
        // desde acá, y en ambos casos el estado no cambió: se ofrece releer.
        setPending(null)
        setConflict(apiErrorMessages(err, { fallback: err.detail }).join(' '))
      } else if (err instanceof ApiError && err.status === 401) {
        sessionExpired()
      } else {
        setPending(null)
        // Sin override para el 400: Spring devuelve el literal
        // "Invalid request content." (MethodArgumentNotValidException:57) y el
        // backend no define messages.properties, así que ese `detail` no nombra
        // ningún campo y llega en inglés. El default en español es mejor.
        setFormErrors(apiErrorMessages(err))
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <AppShell title="Detalle de solicitud">
        <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Cargando la solicitud…
        </div>
      </AppShell>
    )
  }

  if (notFound) return <NotFound />

  // El 401 no deja mensaje en `errors` — su respuesta es terminar la sesión.
  // Sin esta guarda, la rama de abajo pinta un role="alert" vacío mientras el
  // gate de AppShell completa la redirección.
  if (unauthorized) {
    return (
      <AppShell title="Detalle de solicitud">
        <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Su sesión expiró. Volviendo al inicio de sesión…
        </div>
      </AppShell>
    )
  }

  if (!request) {
    return (
      <AppShell title="Detalle de solicitud">
        <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-20 text-center">
          <div
            role="alert"
            className="flex flex-col gap-1 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {errors.map((msg) => (
              <span key={msg}>{msg}</span>
            ))}
          </div>
          <Link href="/dashboard">
            <Button variant="outline">Volver a la bandeja</Button>
          </Link>
        </div>
      </AppShell>
    )
  }

  void ADVANCE_REQUEST_422_FIELD // el 422 de advanceRequest se ata al campo de nota
  const responsibility = currentResponsibility(request)
  const lastEntry = timeline.at(-1)
  const waitingDays = lastEntry ? daysSince(lastEntry.occurredAt) : null

  return (
    <AppShell title="Detalle de solicitud">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        {showCreated && (
          <div className="flex items-center gap-3 rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
            <CheckCircle2 className="size-5 shrink-0" />
            <span className="flex-1">
              Solicitud registrada correctamente a nombre de{' '}
              <span className="font-semibold">{request.studentName}</span>.
            </span>
            <button onClick={() => setShowCreated(false)} aria-label="Cerrar">
              <X className="size-4" />
            </button>
          </div>
        )}

        {conflict && (
          <div
            role="alert"
            className="flex flex-wrap items-center gap-3 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning-foreground"
          >
            <AlertTriangle className="size-5 shrink-0" />
            <span className="flex-1">{conflict}</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setConflict('')
                setFormErrors([])
                reload()
              }}
            >
              Actualizar estado vigente
            </Button>
          </div>
        )}

        {formErrors.length > 0 && (
          <div
            role="alert"
            className="flex flex-col gap-1 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {formErrors.map((msg) => (
              <span key={msg}>{msg}</span>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-4">
          <Link
            href="/dashboard"
            className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Volver a la bandeja
          </Link>
          <div className="flex flex-col gap-2">
            <h2 className="font-serif text-2xl font-bold tracking-tight">
              {request.studentName}
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{request.definition.name}</Badge>
              <Badge variant="info">{request.currentState.name}</Badge>
              <span className="text-sm text-muted-foreground">
                Registrado el {formatDate(request.createdAt)}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <User className="size-4 text-primary" />
                  Datos del estudiante
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-4">
                  <InfoRow label="Nombre" value={request.studentName} />
                  <InfoRow label="Cédula" value={request.studentDocument} />
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Historial y auditoría</CardTitle>
              </CardHeader>
              <CardContent>
                <WorkflowTimeline entries={timeline} />
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Estado actual</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="flex flex-col gap-3">
                  <InfoRow label="Estado" value={request.currentState.name} />
                  <InfoRow
                    label="Ahora depende de"
                    value={
                      responsibility.kind === 'closed' ? (
                        'Trámite cerrado'
                      ) : responsibility.kind === 'single' ? (
                        responsibility.who
                      ) : (
                        // Salientes con responsables distintos: no hay uno solo,
                        // y elegir el primero sería inventar un dato.
                        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                          <Info className="size-3.5" />
                          Depende de la acción que se registre
                        </span>
                      )
                    }
                  />
                  {waitingDays !== null && responsibility.kind !== 'closed' && (
                    <InfoRow
                      label="Antigüedad del estado"
                      value={`Lleva ${waitingDays} ${waitingDays === 1 ? 'día' : 'días'}`}
                    />
                  )}
                </dl>
              </CardContent>
            </Card>

            {request.availableTransitions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Registrar movimiento</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  {request.availableTransitions.map((t) => (
                    <div key={t.targetState.code} className="flex flex-col gap-1">
                      <Button
                        variant="outline"
                        className="justify-start"
                        onClick={() => setPending(t)}
                      >
                        Registrar: {t.targetState.name}
                      </Button>
                      <span className="pl-1 text-xs text-muted-foreground">
                        en nombre de {t.responsible}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {request.currentState.isFinal && (
              <Link href={`/requests/${request.id}/documento`}>
                <Button variant="outline" className="w-full gap-2">
                  <FileText className="size-4" />
                  Documento formal
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      <TransitionDialog
        transition={pending}
        submitting={submitting}
        serverError={noteError}
        onClose={() => setPending(null)}
        onConfirm={runTransition}
      />
    </AppShell>
  )
}
