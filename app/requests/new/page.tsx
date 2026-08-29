'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowLeft, FileText, Info, Loader2, User } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  ApiError,
  CREATE_REQUEST_422_FIELD,
  createRequest,
  listWorkflowDefinitions,
} from '@/lib/api'
import { apiErrorMessages } from '@/lib/api-errors'
import type { WorkflowDefinition } from '@/lib/types'

// Límites del contrato (CreateRequestBody en openapi.yaml). Se validan acá
// porque el backend los declara @NotBlank/@Size: una cadena de solo espacios es
// no-vacía para el cliente y vacía para el servidor, y ese desacuerdo produce un
// 400 de bean validation, que no señala campo (su render llega en la Fase 5).
const MAX_STUDENT_NAME = 120
const MAX_STUDENT_DOCUMENT = 20

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return <p className="text-xs font-medium text-destructive">{msg}</p>
}

export default function NewRequestPage() {
  const router = useRouter()

  const [definitions, setDefinitions] = useState<WorkflowDefinition[]>([])
  const [catalogError, setCatalogError] = useState('')
  const [definitionCode, setDefinitionCode] = useState('')
  const [studentName, setStudentName] = useState('')
  const [studentDocument, setStudentDocument] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [banner, setBanner] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  // El catálogo es la única fuente de trámites (FR-009): sin él no hay registro
  // posible, así que su fallo bloquea el envío en lugar de degradar a un default.
  useEffect(() => {
    let active = true
    listWorkflowDefinitions()
      .then((list) => {
        if (!active) return
        setDefinitions(list)
      })
      .catch((err) => {
        if (!active) return
        setCatalogError(apiErrorMessages(err).join(' '))
      })
    return () => {
      active = false
    }
  }, [])

  function validate() {
    const e: Record<string, string> = {}
    if (!definitionCode) e[CREATE_REQUEST_422_FIELD] = 'Seleccione el tipo de trámite.'

    const name = studentName.trim()
    if (!name) e.studentName = 'Ingrese el nombre completo del estudiante.'
    else if (name.length > MAX_STUDENT_NAME)
      e.studentName = `El nombre no puede superar los ${MAX_STUDENT_NAME} caracteres.`

    const document = studentDocument.trim()
    if (!document) e.studentDocument = 'Ingrese la cédula del estudiante.'
    else if (document.length > MAX_STUDENT_DOCUMENT)
      e.studentDocument = `La cédula no puede superar los ${MAX_STUDENT_DOCUMENT} caracteres.`

    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setBanner([])
    if (!validate()) return

    setSubmitting(true)
    try {
      const created = await createRequest({
        definitionCode,
        studentName: studentName.trim(),
        studentDocument: studentDocument.trim(),
      })
      router.push(`/requests/${created.id}?created=1`)
    } catch (err) {
      // El 422 es "el trámite no existe en la configuración": pertenece al
      // selector, no a un banner suelto. Todo lo demás sí es de nivel formulario.
      if (err instanceof ApiError && err.status === 422) {
        setErrors({ [CREATE_REQUEST_422_FIELD]: apiErrorMessages(err).join(' ') })
      } else {
        setBanner(apiErrorMessages(err))
      }
      setSubmitting(false)
    }
  }

  const blocked = submitting || !!catalogError || definitions.length === 0

  return (
    <AppShell title="Nueva solicitud">
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
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
              Registrar nueva solicitud
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              El trámite queda registrado en el estado inicial que define su
              configuración.
            </p>
          </div>
        </div>

        {(banner.length > 0 || catalogError) && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            <Info className="mt-0.5 size-4 shrink-0" />
            <div className="flex flex-col gap-1">
              {catalogError ? <span>{catalogError}</span> : null}
              {banner.map((msg) => (
                <span key={msg}>{msg}</span>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="size-4 text-primary" />
                Tipo de trámite
              </CardTitle>
              <CardDescription>
                Las opciones provienen de la configuración vigente del motor.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="definitionCode">
                  Tipo de trámite <span className="text-destructive">*</span>
                </Label>
                <Select
                  id="definitionCode"
                  value={definitionCode}
                  onChange={(e) => setDefinitionCode(e.target.value)}
                  disabled={definitions.length === 0}
                  aria-invalid={!!errors[CREATE_REQUEST_422_FIELD]}
                >
                  <option value="">Seleccione un trámite…</option>
                  {definitions.map((d) => (
                    <option key={d.code} value={d.code}>
                      {d.name}
                    </option>
                  ))}
                </Select>
                <FieldError msg={errors[CREATE_REQUEST_422_FIELD]} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="size-4 text-primary" />
                Datos del estudiante
              </CardTitle>
              <CardDescription>
                Nombre y cédula son los datos con los que la Coordinación
                localiza el trámite.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="studentName">
                  Nombre completo <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="studentName"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Nombres y apellidos"
                  aria-invalid={!!errors.studentName}
                />
                <FieldError msg={errors.studentName} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="studentDocument">
                  Cédula <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="studentDocument"
                  inputMode="numeric"
                  value={studentDocument}
                  onChange={(e) => setStudentDocument(e.target.value)}
                  placeholder="Documento de identidad"
                  aria-invalid={!!errors.studentDocument}
                />
                <FieldError msg={errors.studentDocument} />
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link href="/dashboard" className="sm:w-auto">
              <Button type="button" variant="outline" size="lg" className="h-10 w-full">
                Cancelar
              </Button>
            </Link>
            <Button type="submit" size="lg" disabled={blocked} className="h-10 gap-2">
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Registrando…
                </>
              ) : (
                'Registrar solicitud'
              )}
            </Button>
          </div>
        </form>
      </div>
    </AppShell>
  )
}
