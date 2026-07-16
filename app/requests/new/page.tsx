'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  FileText,
  GraduationCap,
  Info,
  Loader2,
  Paperclip,
  PenLine,
  Plus,
  Trash2,
  Upload,
  User,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { AppShell } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useTramita } from '@/lib/store'
import { PROGRAMS, REQUEST_TYPE_LABELS } from '@/lib/mock-data'
import type { RequestType, SubjectInfo } from '@/lib/types'

interface SubjectRow extends SubjectInfo {
  key: string
}

const emptySubject = (): SubjectRow => ({
  key: crypto.randomUUID(),
  code: '',
  name: '',
  credits: 0,
  group: '',
  currentGrade: '',
  proposedGrade: '',
})

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return <p className="text-xs font-medium text-destructive">{msg}</p>
}

export default function NewRequestPage() {
  const router = useRouter()
  const { createRequest } = useTramita()

  const [type, setType] = useState<RequestType>('adicion_creditos')
  const [priority, setPriority] = useState<'normal' | 'urgente'>('normal')
  const [studentCode, setStudentCode] = useState('')
  const [studentCedula, setStudentCedula] = useState('')
  const [studentName, setStudentName] = useState('')
  const [studentEmail, setStudentEmail] = useState('')
  const [program, setProgram] = useState(PROGRAMS[0])
  const [semester, setSemester] = useState('')
  const [subjects, setSubjects] = useState<SubjectRow[]>([emptySubject()])
  const [reason, setReason] = useState('')
  const [attachments, setAttachments] = useState<
    { id: string; name: string; size: string; type: string }[]
  >([])
  const [signed, setSigned] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const isNotas = type === 'novedad_notas'

  function updateSubject(key: string, patch: Partial<SubjectRow>) {
    setSubjects((prev) =>
      prev.map((s) => (s.key === key ? { ...s, ...patch } : s)),
    )
  }

  function addAttachment() {
    const names = [
      'historial_academico.pdf',
      'carta_solicitud.pdf',
      'acta_calificaciones.pdf',
      'soporte_docente.pdf',
    ]
    const name = names[attachments.length % names.length]
    setAttachments((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name,
        size: `${Math.floor(Math.random() * 400 + 80)} KB`,
        type: 'application/pdf',
      },
    ])
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!studentCode.trim()) e.studentCode = 'Ingrese el código del estudiante.'
    if (!/^\d{6,12}$/.test(studentCedula.trim()))
      e.studentCedula = 'La cédula debe tener entre 6 y 12 dígitos.'
    if (!studentName.trim()) e.studentName = 'Ingrese el nombre completo.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(studentEmail.trim()))
      e.studentEmail = 'Ingrese un correo institucional válido.'
    if (!semester.trim()) e.semester = 'Indique el semestre.'
    if (reason.trim().length < 15)
      e.reason = 'La justificación debe tener al menos 15 caracteres.'

    subjects.forEach((s, i) => {
      if (!s.code.trim()) e[`subj_${i}_code`] = 'Requerido'
      if (!s.name.trim()) e[`subj_${i}_name`] = 'Requerido'
      if (isNotas) {
        if (!s.currentGrade?.trim()) e[`subj_${i}_cg`] = 'Requerido'
        if (!s.proposedGrade?.trim()) e[`subj_${i}_pg`] = 'Requerido'
      } else if (!s.credits) {
        e[`subj_${i}_credits`] = 'Requerido'
      }
    })

    if (!signed) e.signed = 'Debe confirmar la firma de radicación.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    setSubmitting(true)
    setTimeout(() => {
      const created = createRequest({
        type,
        priority,
        studentCode,
        studentCedula,
        studentName,
        studentEmail,
        program,
        semester,
        subjects: subjects.map(({ key, ...rest }) => rest),
        reason,
        attachments,
      })
      router.push(`/requests/${created.id}?created=1`)
    }, 900)
  }

  const typeCards: { id: RequestType; icon: typeof GraduationCap; desc: string }[] = [
    {
      id: 'adicion_creditos',
      icon: GraduationCap,
      desc: 'Inscribir créditos adicionales por encima del límite del semestre.',
    },
    {
      id: 'novedad_notas',
      icon: BookOpen,
      desc: 'Corregir o modificar una calificación ya registrada.',
    },
  ]

  return (
    <AppShell title="Nueva solicitud">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <div className="flex flex-col gap-3">
          <Link
            href="/dashboard"
            className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Volver a la bandeja
          </Link>
          <div>
            <h2 className="font-serif text-2xl font-bold tracking-tight">
              Radicar nueva solicitud
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Complete la información. Los datos se validan en el origen antes
              de iniciar el flujo de trabajo.
            </p>
          </div>
        </div>

        {Object.keys(errors).length > 0 && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            <Info className="mt-0.5 size-4 shrink-0" />
            <span>
              Hay campos que requieren su atención. Revise los mensajes
              resaltados a continuación.
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
          {/* Type selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="size-4 text-primary" />
                Tipo de trámite
              </CardTitle>
              <CardDescription>
                Seleccione el flujo de trabajo aplicable a esta solicitud.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {typeCards.map(({ id, icon: Icon, desc }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setType(id)}
                  className={cn(
                    'flex flex-col gap-2 rounded-lg border p-4 text-left transition-all',
                    type === id
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border hover:border-primary/40 hover:bg-muted/40',
                  )}
                >
                  <span
                    className={cn(
                      'grid size-9 place-items-center rounded-lg',
                      type === id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground',
                    )}
                  >
                    <Icon className="size-5" />
                  </span>
                  <span className="font-medium">{REQUEST_TYPE_LABELS[id]}</span>
                  <span className="text-xs text-muted-foreground">{desc}</span>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Student data */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="size-4 text-primary" />
                Datos del estudiante
              </CardTitle>
              <CardDescription>
                El estudiante no accede al sistema; será notificado al finalizar
                el trámite.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="code">
                  Código del estudiante <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="code"
                  value={studentCode}
                  onChange={(e) => setStudentCode(e.target.value)}
                  placeholder="Ej. 1090234"
                  aria-invalid={!!errors.studentCode}
                />
                <FieldError msg={errors.studentCode} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="cedula">
                  Cédula <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="cedula"
                  inputMode="numeric"
                  value={studentCedula}
                  onChange={(e) => setStudentCedula(e.target.value)}
                  placeholder="Ej. 1017234567"
                  aria-invalid={!!errors.studentCedula}
                />
                <FieldError msg={errors.studentCedula} />
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label htmlFor="name">
                  Nombre completo <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Nombres y apellidos"
                  aria-invalid={!!errors.studentName}
                />
                <FieldError msg={errors.studentName} />
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label htmlFor="email">
                  Correo institucional <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  placeholder="nombre@estudiante.remington.edu.co"
                  aria-invalid={!!errors.studentEmail}
                />
                <FieldError msg={errors.studentEmail} />
                <p className="text-xs text-muted-foreground">
                  A este correo se enviará la notificación de cierre.
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="program">Programa académico</Label>
                <Select
                  id="program"
                  value={program}
                  onChange={(e) => setProgram(e.target.value)}
                >
                  {PROGRAMS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="semester">
                  Semestre <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="semester"
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  placeholder="Ej. Semestre 7"
                  aria-invalid={!!errors.semester}
                />
                <FieldError msg={errors.semester} />
              </div>
            </CardContent>
          </Card>

          {/* Subjects */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="size-4 text-primary" />
                Información de asignaturas
              </CardTitle>
              <CardDescription>
                {isNotas
                  ? 'Indique la nota actual y la nota propuesta para cada asignatura.'
                  : 'Indique las asignaturas y los créditos a adicionar.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {subjects.map((s, i) => (
                <div
                  key={s.key}
                  className="grid grid-cols-1 gap-3 rounded-lg border border-border bg-muted/30 p-4 sm:grid-cols-12"
                >
                  <div className="flex flex-col gap-1.5 sm:col-span-3">
                    <Label className="text-xs text-muted-foreground">
                      Código
                    </Label>
                    <Input
                      value={s.code}
                      onChange={(e) =>
                        updateSubject(s.key, { code: e.target.value })
                      }
                      placeholder="IS-704"
                      aria-invalid={!!errors[`subj_${i}_code`]}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 sm:col-span-5">
                    <Label className="text-xs text-muted-foreground">
                      Asignatura
                    </Label>
                    <Input
                      value={s.name}
                      onChange={(e) =>
                        updateSubject(s.key, { name: e.target.value })
                      }
                      placeholder="Nombre de la materia"
                      aria-invalid={!!errors[`subj_${i}_name`]}
                    />
                  </div>

                  {isNotas ? (
                    <>
                      <div className="flex flex-col gap-1.5 sm:col-span-2">
                        <Label className="text-xs text-muted-foreground">
                          Nota actual
                        </Label>
                        <Input
                          value={s.currentGrade}
                          onChange={(e) =>
                            updateSubject(s.key, { currentGrade: e.target.value })
                          }
                          placeholder="2.9"
                          aria-invalid={!!errors[`subj_${i}_cg`]}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5 sm:col-span-2">
                        <Label className="text-xs text-muted-foreground">
                          Nota propuesta
                        </Label>
                        <Input
                          value={s.proposedGrade}
                          onChange={(e) =>
                            updateSubject(s.key, {
                              proposedGrade: e.target.value,
                            })
                          }
                          placeholder="3.6"
                          aria-invalid={!!errors[`subj_${i}_pg`]}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex flex-col gap-1.5 sm:col-span-2">
                        <Label className="text-xs text-muted-foreground">
                          Créditos
                        </Label>
                        <Input
                          type="number"
                          min={0}
                          value={s.credits || ''}
                          onChange={(e) =>
                            updateSubject(s.key, {
                              credits: Number(e.target.value),
                            })
                          }
                          placeholder="3"
                          aria-invalid={!!errors[`subj_${i}_credits`]}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5 sm:col-span-2">
                        <Label className="text-xs text-muted-foreground">
                          Grupo
                        </Label>
                        <Input
                          value={s.group}
                          onChange={(e) =>
                            updateSubject(s.key, { group: e.target.value })
                          }
                          placeholder="A1"
                        />
                      </div>
                    </>
                  )}

                  {subjects.length > 1 && (
                    <div className="flex items-end sm:col-span-12">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setSubjects((prev) =>
                            prev.filter((x) => x.key !== s.key),
                          )
                        }
                        className="gap-1 text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                        Quitar asignatura
                      </Button>
                    </div>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSubjects((prev) => [...prev, emptySubject()])}
                className="w-fit gap-1.5"
              >
                <Plus className="size-4" />
                Agregar asignatura
              </Button>
            </CardContent>
          </Card>

          {/* Reason + attachments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <PenLine className="size-4 text-primary" />
                Justificación y soportes
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="reason">
                  Motivo / justificación <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="reason"
                  rows={4}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Describa el motivo de la solicitud y su contexto académico…"
                  aria-invalid={!!errors.reason}
                />
                <div className="flex items-center justify-between">
                  <FieldError msg={errors.reason} />
                  <span className="ml-auto text-xs text-muted-foreground">
                    {reason.length} caracteres
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label>Archivos adjuntos</Label>
                <button
                  type="button"
                  onClick={addAttachment}
                  className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 px-4 py-6 text-center transition-colors hover:border-primary/40 hover:bg-muted/50"
                >
                  <span className="grid size-10 place-items-center rounded-full bg-primary/10 text-primary">
                    <Upload className="size-5" />
                  </span>
                  <span className="text-sm font-medium">
                    Adjuntar documento de soporte
                  </span>
                  <span className="text-xs text-muted-foreground">
                    PDF hasta 5 MB (simulado en esta demostración)
                  </span>
                </button>
                {attachments.length > 0 && (
                  <ul className="flex flex-col gap-2">
                    {attachments.map((a) => (
                      <li
                        key={a.id}
                        className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2 text-sm"
                      >
                        <Paperclip className="size-4 text-muted-foreground" />
                        <span className="flex-1 truncate">{a.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {a.size}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setAttachments((prev) =>
                              prev.filter((x) => x.id !== a.id),
                            )
                          }
                          className="text-muted-foreground hover:text-destructive"
                          aria-label="Eliminar adjunto"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Signature + priority */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckCircle2 className="size-4 text-primary" />
                Radicación
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="priority">Prioridad</Label>
                <Select
                  id="priority"
                  value={priority}
                  onChange={(e) =>
                    setPriority(e.target.value as 'normal' | 'urgente')
                  }
                  className="sm:max-w-xs"
                >
                  <option value="normal">Normal</option>
                  <option value="urgente">Urgente</option>
                </Select>
              </div>

              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">Firma de radicación</p>
                    <p className="text-xs text-muted-foreground">
                      Confirma que la información fue verificada por la
                      coordinación.
                    </p>
                  </div>
                  <div
                    className={cn(
                      'grid h-16 w-40 place-items-center rounded-md border-2 border-dashed text-center text-xs',
                      signed
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border text-muted-foreground',
                    )}
                  >
                    {signed ? (
                      <span className="font-serif text-base italic">
                        A. Restrepo
                      </span>
                    ) : (
                      'Espacio para firma'
                    )}
                  </div>
                </div>
                <label className="mt-3 flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={signed}
                    onChange={(e) => setSigned(e.target.checked)}
                    className="size-4 rounded border-input accent-[var(--primary)]"
                  />
                  Firmo y radico esta solicitud como coordinadora académica.
                </label>
                <FieldError msg={errors.signed} />
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link href="/dashboard" className="sm:w-auto">
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="h-10 w-full"
              >
                Cancelar
              </Button>
            </Link>
            <Button
              type="submit"
              size="lg"
              disabled={submitting}
              className="h-10 gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Radicando…
                </>
              ) : (
                'Radicar solicitud'
              )}
            </Button>
          </div>
        </form>
      </div>
    </AppShell>
  )
}
