'use client'

import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  CornerUpLeft,
  Download,
  FileText,
  GraduationCap,
  Mail,
  Paperclip,
  Search,
  User,
  X,
} from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { StatusBadge } from '@/components/brand'
import { TypeBadge } from '@/components/type-badge'
import { WorkflowTimeline } from '@/components/workflow-timeline'
import { WorkflowStepper } from '@/components/workflow-stepper'
import { ActionDialog, type ActionConfig } from '@/components/action-dialog'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
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
import { REQUEST_TYPE_LABELS } from '@/lib/mock-data'
import { formatDate, formatDateTime, businessDaysUntil, isOverdue } from '@/lib/format'
import type { DocumentApprovalInput, Request, SignatureType } from '@/lib/types'

const DEFAULT_APPROVAL_DRAFT: DocumentApprovalInput = {
  signerName: '',
  signerRole: '',
  signatureType: 'ESCANEADA',
  signedAt: '',
  note: '',
}

export type Responsibility =
  | { kind: 'closed' }
  | { kind: 'single'; who: string }
  | { kind: 'varies' }

function approvalDateValue() {
  const now = new Date(Date.now() - new Date().getTimezoneOffset() * 60_000)
  return now.toISOString().slice(0, 16)
}

function normalizeApprovalDate(value: string) {
  return value.length === 16 ? `${value}:00` : value
}

export function currentResponsibility(request: Request): Responsibility {
  if (request.currentState.isFinal) return { kind: 'closed' }
  const responsibilities = [...new Set(request.availableTransitions.map((transition) => transition.responsible))]
  return responsibilities.length === 1
    ? { kind: 'single', who: responsibilities[0] }
    : { kind: 'varies' }
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm">{value}</dd>
    </div>
  )
}

export default function RequestDetailPage() {
  const params = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const { getRequest, refreshRequest, transition, registerDocumentApproval, workflowConfig } = useTramita()
  const [dialog, setDialog] = useState<ActionConfig | null>(null)
  const [toast, setToast] = useState<string>('')
  const [loading, setLoading] = useState(true)
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
    if (!toast) return
    const t = setTimeout(() => setToast(''), 3500)
    return () => clearTimeout(t)
  }, [toast])

  const stages = useMemo(
    () => workflowConfig.find((w) => w.id === req?.type)?.stages ?? [],
    [workflowConfig, req?.type],
  )

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
      setToast(error instanceof Error ? error.message : 'No se pudo descargar el archivo.')
    }
  }

  async function runAction(comment: string) {
    if (!dialog) return
    try {
      // El éxito se informa después de confirmar la persistencia en PostgreSQL.
      await transition(requestId, dialog.targetStateCode, comment)
      setToast(`Solicitud registrada en estado ${dialog.confirmLabel}.`)
      setDialog(null)
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'No se pudo aplicar la transición.')
    }
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
      setToast('Aprobación documental registrada.')
    } catch (error) {
      setApprovalError(error instanceof Error ? error.message : 'No se pudo registrar la aprobación documental.')
    } finally {
      setApprovalSavingId(null)
    }
  }

  const overdue = isOverdue(req.dueDate, req.status)
  const days = businessDaysUntil(req.dueDate)

  const isFinalized = req.status === 'finalizado'
  const transitionActions = (req.availableTransitions ?? []).map((availableTransition): ActionConfig => ({
    action: availableTransition.targetState.code,
    targetStateCode: availableTransition.targetState.code,
    title: `Registrar transición a ${availableTransition.targetState.name}`,
    description: `La solicitud pasará a ${availableTransition.targetState.name}.`,
    confirmLabel: availableTransition.targetState.name,
    commentRequired: availableTransition.requiresNote,
    variant: availableTransition.requiresNote ? 'destructive' : 'default',
  }))

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
        {toast && (
          <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background shadow-lg">
            <CheckCircle2 className="size-4" />
            {toast}
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col gap-4">
          <Link
            href="/dashboard"
            className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Volver a la bandeja
          </Link>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-serif text-2xl font-bold tracking-tight">
                  {req.radicado}
                </h2>
                <StatusBadge status={req.status} />
                {req.priority === 'urgente' && !isFinalized && (
                  <Badge variant="destructive">Urgente</Badge>
                )}
                {overdue && (
                  <Badge variant="destructive">
                    Vencida hace {Math.abs(days)}d
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                <TypeBadge type={req.type} />
                <span>Radicado el {formatDate(req.createdAt)}</span>
                <span aria-hidden>·</span>
                <span>Última actualización {formatDate(req.updatedAt)}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2">
              {transitionActions.map((action) => (
                <Button
                  key={action.targetStateCode}
                  variant={action.variant}
                  onClick={() => setDialog(action)}
                  className="gap-2"
                >
                  <CheckCircle2 className="size-4" />
                  {action.confirmLabel}
                </Button>
              ))}
              {isFinalized && (
                <Link href={`/requests/${req.id}/documento`}>
                  <Button className="gap-2">
                    <Download className="size-4" />
                    Ver documento PDF
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Workflow stepper */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Etapa del flujo de trabajo</CardTitle>
          </CardHeader>
          <CardContent>
            <WorkflowStepper
              stages={stages}
              currentStageId={req.currentStage}
              returned={req.status === 'devuelto'}
            />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left column */}
          <div className="flex flex-col gap-6 lg:col-span-2">
            {/* Student data */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <User className="size-4 text-primary" />
                  Datos del estudiante
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <InfoRow label="Nombre" value={req.studentName} />
                  <InfoRow label="Código" value={req.studentCode} />
                  <InfoRow label="Cédula" value={req.studentCedula} />
                  <InfoRow label="Programa" value={req.program} />
                  <InfoRow label="Semestre" value={req.semester} />
                  <InfoRow
                    label="Correo"
                    value={
                      <span className="inline-flex items-center gap-1 text-primary">
                        <Mail className="size-3.5" />
                        <span className="truncate">{req.studentEmail}</span>
                      </span>
                    }
                  />
                </dl>
              </CardContent>
            </Card>

            {/* Request info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <GraduationCap className="size-4 text-primary" />
                  Información del trámite
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="overflow-hidden rounded-lg border border-border">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50 text-xs uppercase text-muted-foreground">
                        <th className="px-3 py-2 font-semibold">Código</th>
                        <th className="px-3 py-2 font-semibold">Asignatura</th>
                        {req.type === 'novedad_notas' ? (
                          <>
                            <th className="px-3 py-2 font-semibold">Actual</th>
                            <th className="px-3 py-2 font-semibold">Propuesta</th>
                          </>
                        ) : (
                          <>
                            <th className="px-3 py-2 font-semibold">Créditos</th>
                            <th className="px-3 py-2 font-semibold">Grupo</th>
                          </>
                        )}
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
                          ) : (
                            <>
                              <td className="px-3 py-2">{s.credits}</td>
                              <td className="px-3 py-2">{s.group || '—'}</td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-col gap-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    Motivo / justificación
                  </p>
                  <p className="text-pretty text-sm leading-relaxed">
                    {req.reason}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Attachments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Paperclip className="size-4 text-primary" />
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

          {/* Right column: timeline */}
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Resumen</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="flex flex-col gap-3">
                  <InfoRow
                    label="Tipo de trámite"
                    value={REQUEST_TYPE_LABELS[req.type]}
                  />
                  <InfoRow
                    label="Vencimiento"
                    value={
                      isFinalized
                        ? 'Trámite cerrado'
                        : `${formatDate(req.dueDate)} (${
                            overdue
                              ? `vencida ${Math.abs(days)}d`
                              : `${days} día${days === 1 ? '' : 's'}`
                          })`
                    }
                  />
                  <InfoRow label="Asignado a" value={req.assignedTo} />
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Historial y auditoría</CardTitle>
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
