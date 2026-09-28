'use client'

import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  CircleAlert,
  CornerUpLeft,
  Download,
  FileText,
  GraduationCap,
  History,
  Mail,
  MessageCircle,
  Paperclip,
  Search,
  User,
  X,
} from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { TypeBadge } from '@/components/type-badge'
import { WorkflowTimeline } from '@/components/workflow-timeline'
import { CurrentStateBlock } from '@/components/current-state-block'
import { AnnexRequirementNotice } from '@/components/annex-requirement-notice'
import { ActionDialog, type ActionConfig } from '@/components/action-dialog'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useTramita } from '@/lib/store'
import { apiFetch, problemMessage } from '@/lib/api'
import { currentResponsibility, isClosed } from '@/lib/request-state'
import { formatDate, formatDateTime } from '@/lib/format'
import type { DocumentApprovalInput, SignatureType } from '@/lib/types'

const DEFAULT_APPROVAL_DRAFT: DocumentApprovalInput = {
  signerName: '',
  signerRole: '',
  signatureType: 'ESCANEADA',
  signedAt: '',
  note: '',
}

function approvalDateValue() {
  const now = new Date(Date.now() - new Date().getTimezoneOffset() * 60_000)
  return now.toISOString().slice(0, 16)
}

function normalizeApprovalDate(value: string) {
  return value.length === 16 ? `${value}:00` : value
}

// T4b (rediseno-detalle-solicitud.md): antes era un `string` y el render siempre usaba el
// ícono y el estilo de éxito, así que un error de descarga se anunciaba como si hubiera
// funcionado. El tipo distingue el caso para elegir rol ARIA, ícono y tono en el render.
type ResultMessage = { kind: 'success' | 'error'; text: string }

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-base text-muted-foreground">{label}</dt>
      <dd className="text-[17px] font-medium">{value}</dd>
    </div>
  )
}

export default function RequestDetailPage() {
  const params = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const { getRequest, refreshRequest, transition, registerDocumentApproval } = useTramita()
  const [dialog, setDialog] = useState<ActionConfig | null>(null)
  const [resultMessage, setResultMessage] = useState<ResultMessage | null>(null)
  const [loading, setLoading] = useState(true)
  const [now] = useState(() => Date.now())
  const [approvalDrafts, setApprovalDrafts] = useState<Record<string, DocumentApprovalInput>>({})
  const [approvalError, setApprovalError] = useState<string>('')
  const [approvalSavingId, setApprovalSavingId] = useState<string | null>(null)
  const [openApprovalId, setOpenApprovalId] = useState<string | null>(null)

  const req = getRequest(params.id)

  useEffect(() => {
    // La consulta explícita permite abrir una solicitud directamente o después de F5.
    // El detalle espera la respuesta para no mostrar una solicitud inexistente durante la carga.
    void refreshRequest(params.id)
      .catch(() => undefined)
      .finally(() => setLoading(false))
  }, [params.id, refreshRequest])

  const justCreated = searchParams.get('created') === '1'
  const [showCreated, setShowCreated] = useState(justCreated)

  useEffect(() => {
    if (!resultMessage) return
    const t = setTimeout(() => setResultMessage(null), 3500)
    return () => clearTimeout(t)
  }, [resultMessage])

  if (loading) {
    return (
      <AppShell title="Solicitud">
        <div className="py-20 text-center text-sm text-muted-foreground">
          Cargando solicitud...
        </div>
      </AppShell>
    )
  }

  if (!req) {
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

  const requestId = req.id

  async function downloadAttachment(id: string, name: string) {
    try {
      // El archivo se obtiene del almacenamiento del backend, no de un mock local.
      const response = await apiFetch(`/requests/${requestId}/documents/${id}`)
      if (!response.ok) throw new Error(await problemMessage(response, 'No se pudo descargar el archivo.'))
      const url = URL.createObjectURL(await response.blob())
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = name
      anchor.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      setResultMessage({
        kind: 'error',
        text: error instanceof Error ? error.message : 'No se pudo descargar el archivo.',
      })
    }
  }

  async function runAction(comment: string) {
    if (!dialog) return
    // El éxito se informa después de confirmar la persistencia en PostgreSQL. El error ya no
    // se captura acá: se propaga a `ActionDialog` (contrato de `onConfirm`), que lo muestra
    // dentro de sí mismo y mantiene sus botones activos para reintentar (T4a,
    // odd/tasks/rediseno-detalle-solicitud.md).
    await transition(requestId, dialog.targetStateCode, comment)
    setResultMessage({ kind: 'success', text: `Solicitud registrada en estado ${dialog.confirmLabel}.` })
    setDialog(null)
  }

  function getApprovalDraft(documentId: string): DocumentApprovalInput {
    return approvalDrafts[documentId] ?? {
      ...DEFAULT_APPROVAL_DRAFT,
      signedAt: approvalDateValue(),
    }
  }

  function updateApprovalDraft(documentId: string, patch: Partial<DocumentApprovalInput>) {
    setApprovalDrafts((current) => ({
      ...current,
      [documentId]: { ...getApprovalDraft(documentId), ...patch },
    }))
  }

  async function submitApproval(documentId: string) {
    const draft = getApprovalDraft(documentId)
    if (!draft.signerName.trim() || !draft.signerRole.trim() || !draft.signedAt.trim()) {
      setApprovalError('Complete nombre, rol y fecha de firma para registrar la aprobación.')
      return
    }
    try {
      setApprovalError('')
      setApprovalSavingId(documentId)
      // La firma se registra como evidencia del documento persistido, no como ejecución criptográfica local.
      await registerDocumentApproval(requestId, documentId, {
        signerName: draft.signerName.trim(),
        signerRole: draft.signerRole.trim(),
        signatureType: draft.signatureType as SignatureType,
        signedAt: normalizeApprovalDate(draft.signedAt),
        note: draft.note?.trim(),
      })
      setApprovalDrafts((current) => ({
        ...current,
        [documentId]: { ...DEFAULT_APPROVAL_DRAFT, signedAt: approvalDateValue() },
      }))
      setOpenApprovalId(null)
      setResultMessage({ kind: 'success', text: 'Aprobación documental registrada.' })
    } catch (error) {
      setApprovalError(error instanceof Error ? error.message : 'No se pudo registrar la aprobación documental.')
    } finally {
      setApprovalSavingId(null)
    }
  }

  const isFinalized = isClosed(req)
  const responsibility = currentResponsibility(req)
  const canNotifyStudent = req.origin === 'PUBLIC_LINK' && isFinalized
  const notificationMessage = `Hola ${req.studentName}.\r\nSu trámite «${req.definition.name}» quedó en estado: ${req.currentState.name}.`
  const notificationSubject = 'Su proceso ha sido completado'
  const emailHref = canNotifyStudent && req.studentEmail
    ? `mailto:${req.studentEmail}?subject=${encodeURIComponent(notificationSubject)}&body=${encodeURIComponent(notificationMessage)}`
    : null
  const whatsappHref = canNotifyStudent && req.studentPhone && /^3\d{9}$/.test(req.studentPhone)
    ? `https://wa.me/57${req.studentPhone}?text=${encodeURIComponent(notificationMessage)}`
    : null
  // Última entrada del timeline (índice `length − 1`), nunca `createdAt` — mutante P1/P2
  // (design.md D4): con el timeline vacío no se cae a `createdAt`, se muestra `null`.
  const waitingSince = req.timeline.length > 0 ? req.timeline[req.timeline.length - 1].date : null
  const transitionActions = (req.availableTransitions ?? []).map((availableTransition): ActionConfig => ({
    action: availableTransition.targetState.code,
    targetStateCode: availableTransition.targetState.code,
    title: `Registrar transición a ${availableTransition.targetState.name}`,
    description: `La solicitud pasará a ${availableTransition.targetState.name}.`,
    confirmLabel: availableTransition.targetState.name,
    commentRequired: availableTransition.requiresNote,
    variant: availableTransition.requiresNote ? 'destructive' : 'default',
  }))
  // Sin transiciones, sin anexo y sin enlaces de aviso, el panel no tiene nada que mostrar:
  // la región no se renderiza, tampoco como contenedor vacío.
  const hasActionsPanel =
    transitionActions.length > 0 ||
    Boolean(req.annexRequirement) ||
    Boolean(emailHref) ||
    Boolean(whatsappHref)
  const totalCredits = req.subjects.reduce((sum, subject) => sum + subject.credits, 0)
  // «Créditos solicitados» solo tiene sentido en adición de créditos y solo cuando hay
  // asignaturas que sumar: una definición desconocida (`type: null`, #9b) o una solicitud sin
  // asignaturas no debe insinuar un total.
  const showCreditsSummary = req.type === 'adicion_creditos' && req.subjects.length > 0

  return (
    <AppShell title="Detalle de solicitud">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        {/* Toasts / banners */}
        {showCreated && (
          <div className="flex items-center gap-3 rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
            <CheckCircle2 className="size-5 shrink-0" />
            <span className="flex-1">
              Solicitud radicada correctamente con número{' '}
              <span className="font-semibold">{req.radicado}</span>.
            </span>
            <button onClick={() => setShowCreated(false)} aria-label="Cerrar">
              <X className="size-4" />
            </button>
          </div>
        )}
        {/* D5 (rediseno-detalle-solicitud.md): posición flotante conservada; se corrige la
            semántica — antes todo mensaje llevaba el ícono de éxito y ningún rol ARIA, así que
            un error de descarga parecía un éxito. Éxito: `role="status"`. Error: `role="alert"`,
            tono destructivo e ícono de alerta. */}
        {resultMessage && resultMessage.kind === 'success' && (
          <div
            role="status"
            className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-lg bg-foreground px-4 py-2.5 text-base font-medium text-background shadow-lg"
          >
            <CheckCircle2 className="size-4 shrink-0" />
            {resultMessage.text}
          </div>
        )}
        {resultMessage && resultMessage.kind === 'error' && (
          <div
            role="alert"
            className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-lg bg-destructive px-4 py-2.5 text-base font-medium text-destructive-foreground shadow-lg"
          >
            <CircleAlert className="size-4 shrink-0" />
            {resultMessage.text}
          </div>
        )}

        {/* Enlace de regreso → banner de estado → encabezado: el banner va primero porque el
            dato central del producto es de quién depende ahora el trámite (CLAUDE.md, «Qué se
            está construyendo»), y ese dato vive en `CurrentStateBlock`. */}
        <Link
          href="/dashboard"
          className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Volver a la bandeja
        </Link>

        <CurrentStateBlock
          state={req.currentState}
          responsibility={responsibility}
          waitingSince={waitingSince}
          now={now}
        />

        {/* Header: el nombre del estudiante identifica la solicitud; es `h2` porque `AppShell`
            ya renderiza el `h1` con el título de la página
            (`components/app-shell.tsx:185-187`). Sin `StatusBadge`: con datos
            reales `stateName` sale de `currentState.name` (`lib/store.tsx:188`) y repetiría el
            nombre del estado que ya muestra el banner de arriba. */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <TypeBadge code={req.definition.code} name={req.definition.name} />
              {req.priority === 'urgente' && !isFinalized && (
                <Badge variant="destructive">Urgente</Badge>
              )}
            </div>
            <h2 className="font-serif text-[34px] font-bold leading-tight tracking-tight">
              {req.studentName}
            </h2>
            {/* Sin «última actualización»: el contrato no trae `updatedAt` y el store lo rellena
                con `createdAt` (lib/store.tsx:191). La fecha del último cambio está en el
                historial. */}
            <p className="text-[17px] text-muted-foreground">
              {`Solicitud ${req.radicado} · radicada el ${formatDate(req.createdAt)}`}
            </p>
          </div>

          {/* Los botones de transición y los avisos al estudiante viven en el panel lateral
              «Acciones» (T1, odd/tasks/rediseno-detalle-solicitud.md); el enlace al PDF se
              queda en el encabezado. */}
          <div className="flex flex-wrap gap-2">
            <Link href={`/requests/${req.id}/documento`}>
              <Button variant="outline" className="h-12 gap-2 px-5 text-base font-semibold">
                <Download className="size-4" />
                Ver documento PDF
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left column */}
          <div className="flex flex-col gap-6 lg:col-span-2">
            {/* Student data */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl font-bold">
                  <User className="size-5 text-primary" />
                  Datos del estudiante
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
                  <InfoRow label="Código" value={req.studentCode} />
                  <InfoRow label="Cédula" value={req.studentCedula} />
                  <InfoRow label="Programa" value={req.program} />
                  <InfoRow label="Semestre" value={req.semester} />
                  <InfoRow
                    label="Correo"
                    value={
                      <span className="inline-flex items-start gap-1 text-primary">
                        <Mail className="mt-0.5 size-3.5 shrink-0" />
                        {/* Un correo no tiene espacios donde partirse: sin
                            `overflow-wrap:anywhere` desborda la columna, y elidirlo con puntos
                            suspensivos ocultaría parte del dato. */}
                        <span className="break-words [overflow-wrap:anywhere]">
                          {req.studentEmail}
                        </span>
                      </span>
                    }
                  />
                  {/* `studentPhone` es opcional en el contrato: una clave ausente llega como
                      `null` (lib/store.tsx:210). El chequeo de verdad descarta además una cadena
                      vacía, así que la fila solo aparece cuando hay un número que mostrar. */}
                  {req.studentPhone && <InfoRow label="Teléfono" value={req.studentPhone} />}
                </dl>
              </CardContent>
            </Card>

            {/* Request info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl font-bold">
                  <GraduationCap className="size-5 text-primary" />
                  Lo que se solicita
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {showCreditsSummary && (
                  <dl className="rounded-xl bg-primary/5 px-4 py-3">
                    <dt className="text-base text-muted-foreground">Créditos solicitados</dt>
                    <dd className="text-[26px] font-bold text-primary">{totalCredits}</dd>
                  </dl>
                )}

                {/* `overflow-x-auto`, no `overflow-hidden`: a 17px la tabla no cabe en un
                    celular (~390px) y ocultar el desborde escondía la última columna; así se
                    desplaza dentro de su recuadro sin perder datos. */}
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-left text-[17px]">
                    <thead>
                      <tr className="border-b border-border bg-muted/50 text-base text-muted-foreground">
                        <th className="px-3 py-2 font-semibold">Código</th>
                        <th className="px-3 py-2 font-semibold">Asignatura</th>
                        {/* Tres vías, no un ternario binario (D2): `type: null` es una
                            definición que el cliente no reconoce y no tiene columnas propias
                            que mostrar — ni «Créditos», que reabriría el #9(b). */}
                        {req.type === 'novedad_notas' ? (
                          <>
                            <th className="px-3 py-2 font-semibold">Actual</th>
                            <th className="px-3 py-2 font-semibold">Propuesta</th>
                          </>
                        ) : req.type === 'adicion_creditos' ? (
                          <>
                            <th className="px-3 py-2 font-semibold">Créditos</th>
                            <th className="px-3 py-2 font-semibold">Grupo</th>
                          </>
                        ) : null}
                      </tr>
                    </thead>
                    <tbody>
                      {req.subjects.map((s, i) => (
                        <tr
                          key={i}
                          className="border-b border-border/60 last:border-0"
                        >
                          <td className="px-3 py-2 font-medium">{s.code}</td>
                          <td className="px-3 py-2">{s.name}</td>
                          {req.type === 'novedad_notas' ? (
                            <>
                              <td className="px-3 py-2 text-destructive">
                                {s.currentGrade}
                              </td>
                              <td className="px-3 py-2 font-medium text-success">
                                {s.proposedGrade}
                              </td>
                            </>
                          ) : req.type === 'adicion_creditos' ? (
                            <>
                              <td className="px-3 py-2">{s.credits}</td>
                              <td className="px-3 py-2">{s.group || '—'}</td>
                            </>
                          ) : null}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-col gap-1">
                  <p className="text-base font-medium text-muted-foreground">
                    Motivo / justificación
                  </p>
                  <p className="text-pretty text-[17px] leading-relaxed">
                    {req.reason}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Attachments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl font-bold">
                  <Paperclip className="size-5 text-primary" />
                  Documentos adjuntos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {req.attachments.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
                    No hay documentos adjuntos en esta solicitud.
                  </div>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {req.attachments.map((a) => (
                      <li
                        key={a.id}
                        className="rounded-lg border border-border bg-muted/30 px-3 py-3 text-sm"
                      >
                        <div className="flex items-center gap-3">
                          <span className="grid size-8 place-items-center rounded bg-destructive/10 text-destructive">
                            <FileText className="size-4" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="truncate font-medium">{a.name}</div>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                              <span>{a.size}</span>
                              <span aria-hidden>·</span>
                              <span>{a.approvals.length === 0 ? 'Sin firmas registradas' : `${a.approvals.length} firma${a.approvals.length === 1 ? '' : 's'} registrada${a.approvals.length === 1 ? '' : 's'}`}</span>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon-sm" aria-label="Descargar" onClick={() => void downloadAttachment(a.id, a.name)}>
                            <Download className="size-4" />
                          </Button>
                        </div>

                        <div className="mt-3 grid gap-2 rounded-lg border border-border/70 bg-card/70 p-3 text-xs sm:grid-cols-2">
                          <div>
                            <span className="font-medium text-foreground">Hash SHA-256:</span>{' '}
                            <span className="break-all text-muted-foreground">{a.sha256 ?? 'No disponible'}</span>
                          </div>
                          <div>
                            <span className="font-medium text-foreground">Último sello:</span>{' '}
                            <span className="text-muted-foreground">{a.approvals[0] ? formatDateTime(a.approvals[a.approvals.length - 1].timestampedAt) : 'Sin registrar'}</span>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-3">
                          <p className="text-xs text-muted-foreground">
                            La firma se conserva como evidencia trazable del documento aprobado.
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setApprovalError('')
                              setOpenApprovalId((current) => current === a.id ? null : a.id)
                            }}
                          >
                            Registrar firma
                          </Button>
                        </div>

                        {a.approvals.length > 0 && (
                          <div className="mt-3 flex flex-col gap-2">
                            {a.approvals.map((approval) => (
                              <div key={approval.id} className="rounded-lg border border-success/20 bg-success/5 px-3 py-2 text-xs">
                                <div className="flex flex-wrap items-center gap-2 font-medium text-foreground">
                                  <Check className="size-3.5 text-success" />
                                  <span>{approval.signerName}</span>
                                  <Badge variant="outline">{approval.signerRole}</Badge>
                                  <Badge variant="outline">{approval.signatureType}</Badge>
                                </div>
                                <div className="mt-1 grid gap-1 text-muted-foreground sm:grid-cols-2">
                                  <span>Firma declarada: {formatDateTime(approval.signedAt)}</span>
                                  <span>Sello UTC: {formatDateTime(approval.timestampedAt)}</span>
                                  <span className="sm:col-span-2 break-all">Hash aprobado: {approval.documentSha256}</span>
                                  <span className="sm:col-span-2">Registrado por: {approval.recordedByEmail}</span>
                                  {approval.note && <span className="sm:col-span-2">Observación: {approval.note}</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {openApprovalId === a.id && (
                          <div className="mt-3 rounded-lg border border-border bg-card p-4">
                            <div className="grid gap-4 md:grid-cols-2">
                              <div className="space-y-1.5">
                                <Label htmlFor={`signer-name-${a.id}`}>Quién firmó</Label>
                                <Input
                                  id={`signer-name-${a.id}`}
                                  value={getApprovalDraft(a.id).signerName}
                                  onChange={(event) => updateApprovalDraft(a.id, { signerName: event.target.value })}
                                  placeholder="Decanatura de Facultad"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label htmlFor={`signer-role-${a.id}`}>Rol</Label>
                                <Input
                                  id={`signer-role-${a.id}`}
                                  value={getApprovalDraft(a.id).signerRole}
                                  onChange={(event) => updateApprovalDraft(a.id, { signerRole: event.target.value })}
                                  placeholder="FACULTAD"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label htmlFor={`signature-type-${a.id}`}>Tipo de firma</Label>
                                <Select
                                  id={`signature-type-${a.id}`}
                                  value={getApprovalDraft(a.id).signatureType}
                                  onChange={(event) => updateApprovalDraft(a.id, { signatureType: event.target.value as SignatureType })}
                                >
                                  <option value="ESCANEADA">Escaneada</option>
                                  <option value="DIGITAL">Digital</option>
                                </Select>
                              </div>
                              <div className="space-y-1.5">
                                <Label htmlFor={`signed-at-${a.id}`}>Fecha y hora de firma</Label>
                                <Input
                                  id={`signed-at-${a.id}`}
                                  type="datetime-local"
                                  value={getApprovalDraft(a.id).signedAt}
                                  onChange={(event) => updateApprovalDraft(a.id, { signedAt: event.target.value })}
                                />
                              </div>
                              <div className="space-y-1.5 md:col-span-2">
                                <Label htmlFor={`approval-note-${a.id}`}>Observación</Label>
                                <Textarea
                                  id={`approval-note-${a.id}`}
                                  rows={3}
                                  value={getApprovalDraft(a.id).note ?? ''}
                                  onChange={(event) => updateApprovalDraft(a.id, { note: event.target.value })}
                                  placeholder="Detalle cómo llegó la firma o cualquier verificación relevante."
                                />
                              </div>
                            </div>
                            {approvalError && (
                              <p className="mt-3 text-xs font-medium text-destructive">{approvalError}</p>
                            )}
                            <div className="mt-4 flex justify-end gap-2">
                              <Button variant="outline" size="sm" onClick={() => setOpenApprovalId(null)}>
                                Cancelar
                              </Button>
                              <Button size="sm" onClick={() => void submitApproval(a.id)} disabled={approvalSavingId === a.id}>
                                {approvalSavingId === a.id ? 'Guardando…' : 'Guardar firma'}
                              </Button>
                            </div>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right column: acciones + timeline. Fija al hacer scroll, como en el mockup: el panel
              de acciones y el historial acompañan mientras se revisa la columna principal.
              `top-20` = la barra sticky de `AppShell` (`h-16`) más 1rem de aire: con menos, el
              panel se pega debajo de la barra y su título queda oculto. */}
          <div className="flex flex-col gap-6 lg:sticky lg:top-20 lg:self-start">
            {hasActionsPanel && (
              <section
                aria-label="Acciones"
                className="overflow-hidden rounded-2xl border-2 border-primary"
              >
                <div className="bg-primary/10 px-5 py-3">
                  <h3 className="text-[17px] font-bold text-primary">Acciones</h3>
                </div>
                <div className="flex flex-col gap-3 p-5">
                  {transitionActions.length > 0 && (
                    <>
                      <p className="text-[17px]">
                        Registre el estado al que pasa la solicitud.
                      </p>
                      {transitionActions.map((action) => (
                        <Button
                          key={action.targetStateCode}
                          variant={action.variant}
                          onClick={() => setDialog(action)}
                          className="h-[52px] w-full gap-2 text-[17px] font-semibold"
                        >
                          <CheckCircle2 className="size-4" />
                          {action.confirmLabel}
                        </Button>
                      ))}
                    </>
                  )}

                  {req.annexRequirement ? (
                    <AnnexRequirementNotice
                      documentName={req.annexRequirement.documentName}
                      sourceHint={req.annexRequirement.sourceHint}
                    />
                  ) : null}

                  {emailHref && (
                    <a
                      href={emailHref}
                      className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-border px-3 text-base font-medium hover:bg-muted"
                    >
                      <Mail className="size-4" />
                      Enviar correo al estudiante
                    </a>
                  )}
                  {whatsappHref && (
                    <a
                      href={whatsappHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-border px-3 text-base font-medium hover:bg-muted"
                    >
                      <MessageCircle className="size-4" />
                      Enviar WhatsApp al estudiante
                    </a>
                  )}
                </div>
              </section>
            )}

            {/* «Resumen» se retira (T4b): solo repetía el tipo de trámite, que el encabezado ya
                muestra con `TypeBadge` (T2). */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl font-bold">
                  <History className="size-5 text-primary" />
                  Historial
                </CardTitle>
                <CardDescription className="text-base">
                  Lo registrado en este trámite, del más reciente al más antiguo.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WorkflowTimeline events={req.timeline} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <ActionDialog
        key={dialog?.targetStateCode ?? 'closed'}
        config={dialog}
        onClose={() => setDialog(null)}
        onConfirm={runAction}
      />
    </AppShell>
  )
}
