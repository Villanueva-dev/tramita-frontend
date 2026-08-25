'use client'

import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  ArrowLeft,
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
import { ActionDialog, type ActionConfig } from '@/components/action-dialog'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useTramita } from '@/lib/store'
import { REQUEST_TYPE_LABELS } from '@/lib/mock-data'
import { formatDate, formatDateTime, daysUntil, isOverdue } from '@/lib/format'

const ACTIONS: Record<string, ActionConfig> = {
  revisar: {
    action: 'revisar',
    title: 'Iniciar revisión',
    description:
      'La solicitud pasará a estado "En Revisión". Puede dejar una observación inicial.',
    confirmLabel: 'Iniciar revisión',
    commentRequired: false,
    variant: 'default',
  },
  aprobar: {
    action: 'aprobar',
    title: 'Aprobar solicitud',
    description:
      'Confirma que la solicitud cumple los requisitos y autoriza el trámite.',
    confirmLabel: 'Aprobar',
    commentRequired: false,
    variant: 'default',
  },
  devolver: {
    action: 'devolver',
    title: 'Devolver solicitud',
    description:
      'La solicitud se marcará como devuelta. Indique el motivo y qué debe corregirse.',
    confirmLabel: 'Devolver',
    commentRequired: true,
    variant: 'destructive',
  },
  finalizar: {
    action: 'finalizar',
    title: 'Finalizar trámite',
    description:
      'Se generará el documento PDF formal y se notificará al estudiante. Esta acción cierra el proceso.',
    confirmLabel: 'Finalizar y notificar',
    commentRequired: false,
    variant: 'default',
  },
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
  const router = useRouter()
  const searchParams = useSearchParams()
  const { getRequest, transition } = useTramita()
  const [dialog, setDialog] = useState<ActionConfig | null>(null)
  const [toast, setToast] = useState<string>('')

  const req = getRequest(params.id)

  const justCreated = searchParams.get('created') === '1'
  const [showCreated, setShowCreated] = useState(justCreated)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 3500)
    return () => clearTimeout(t)
  }, [toast])

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

  function runAction(comment: string) {
    if (!dialog || !req) return
    transition(req.id, dialog.action, comment)
    const labels: Record<string, string> = {
      revisar: 'Revisión iniciada.',
      aprobar: 'Solicitud aprobada.',
      devolver: 'Solicitud devuelta al solicitante.',
      finalizar: 'Trámite finalizado. PDF generado y estudiante notificado.',
    }
    setToast(labels[dialog.action])
    setDialog(null)
  }

  const overdue = isOverdue(req.dueDate, req.status)
  const days = daysUntil(req.dueDate)

  // Available actions per status
  const canReview = req.status === 'pendiente' || req.status === 'devuelto'
  const canApproveOrReturn = req.status === 'en_revision'
  const canFinalize = req.status === 'aprobado'
  const isFinalized = req.status === 'finalizado'

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
              {canReview && (
                <Button onClick={() => setDialog(ACTIONS.revisar)} className="gap-2">
                  <Search className="size-4" />
                  Iniciar revisión
                </Button>
              )}
              {canApproveOrReturn && (
                <>
                  <Button
                    variant="destructive"
                    onClick={() => setDialog(ACTIONS.devolver)}
                    className="gap-2"
                  >
                    <CornerUpLeft className="size-4" />
                    Devolver
                  </Button>
                  <Button
                    onClick={() => setDialog(ACTIONS.aprobar)}
                    className="gap-2"
                  >
                    <CheckCircle2 className="size-4" />
                    Aprobar
                  </Button>
                </>
              )}
              {canFinalize && (
                <Button onClick={() => setDialog(ACTIONS.finalizar)} className="gap-2">
                  <CheckCircle2 className="size-4" />
                  Finalizar trámite
                </Button>
              )}
              {isFinalized && (
                <Link href={`/requests/${req.id}/documento`}>
                  <Button variant="outline" className="gap-2">
                    <FileText className="size-4" />
                    Documento formal
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>

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
                        className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-sm"
                      >
                        <span className="grid size-8 place-items-center rounded bg-destructive/10 text-destructive">
                          <FileText className="size-4" />
                        </span>
                        <span className="flex-1 truncate font-medium">
                          {a.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {a.size}
                        </span>
                        <Button variant="ghost" size="icon-sm" aria-label="Descargar">
                          <Download className="size-4" />
                        </Button>
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
        config={dialog}
        onClose={() => setDialog(null)}
        onConfirm={runAction}
      />
    </AppShell>
  )
}
