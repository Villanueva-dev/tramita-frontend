'use client'

import { useState } from 'react'
import { PublicRequestSections, type PublicRequestFormValues } from '@/components/do-fr-100/sections'
import { CanvasFirma, type SignatureCapture } from '@/components/firma/canvas-firma'
import { ApiError, submitPublicRequest } from '@/lib/api'
import { apiErrorMessages } from '@/lib/api-errors'
import { PUBLIC_REQUEST_FIELD_LIMITS } from '@/lib/public-request-limits'
import type { PublicRequestBody } from '@/lib/types'

export const PUBLIC_REQUEST_DEFINITION_CODE = 'ADICION_CREDITOS'

const INITIAL_VALUES: PublicRequestFormValues = {
  studentName: '',
  studentDocument: '',
  studentEmail: '',
  studentPhone: '',
  program: '',
  campus: '',
  faculty: '',
  modality: '',
  semester: '',
  reason: '',
}

type FormField = keyof PublicRequestFormValues | 'signature'
type FormErrors = Partial<Record<FormField, string>>
const FORM_FIELDS = new Set<FormField>([...Object.keys(INITIAL_VALUES), 'signature'] as FormField[])

function fieldErrorsFromProblem(error: ApiError): FormErrors {
  const errors: FormErrors = {}
  const invalidFields = error.invalidFields ?? error.fieldNames ?? []

  for (const field of invalidFields) {
    if (FORM_FIELDS.has(field as FormField)) errors[field as FormField] = 'Revise este campo.'
  }
  for (const field of error.missingFields ?? []) {
    if (FORM_FIELDS.has(field as FormField)) errors[field as FormField] = 'Este campo es obligatorio.'
  }

  return errors
}

function validate(values: PublicRequestFormValues, signature: SignatureCapture): FormErrors {
  const errors: FormErrors = {}
  for (const [field, value] of Object.entries(values) as [keyof PublicRequestFormValues, string][]) {
    if (!value.trim()) errors[field] = 'Este campo es obligatorio.'
    else if (value.length > PUBLIC_REQUEST_FIELD_LIMITS[field])
      errors[field] = `Este campo supera el máximo de ${PUBLIC_REQUEST_FIELD_LIMITS[field]} caracteres.`
  }
  if (!signature.hayFirma || !signature.dataUrl) errors.signature = 'La firma es obligatoria.'
  return errors
}

export default function PublicAdditionalCreditsPage() {
  const [values, setValues] = useState(INITIAL_VALUES)
  const [signature, setSignature] = useState<SignatureCapture>({ dataUrl: '', hayFirma: false })
  const [errors, setErrors] = useState<FormErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  function handleChange(field: keyof PublicRequestFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit() {
    const validationErrors = validate(values, signature)
    setErrors(validationErrors)
    setFormError(null)
    if (Object.keys(validationErrors).length > 0) return

    const body: PublicRequestBody = { ...values, signature: signature.dataUrl }
    setIsSubmitting(true)
    try {
      await submitPublicRequest(PUBLIC_REQUEST_DEFINITION_CODE, body)
      setSubmitted(true)
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 422) {
          const problemErrors = fieldErrorsFromProblem(error)
          if (Object.keys(problemErrors).length > 0) setErrors(problemErrors)
          else setFormError('No pudimos identificar los campos que requieren corrección. Revise la información e inténtelo de nuevo.')
        } else if (error.status === 404) {
          setFormError('Este enlace no está disponible. Escríbale a la Coordinación.')
        } else if (error.status === 413) {
          setFormError('La firma es demasiado pesada. Límpiela y fírmela de nuevo.')
        } else {
          setFormError(apiErrorMessages(error).join(' '))
        }
      } else {
        setFormError(apiErrorMessages(error).join(' '))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:py-12">
        <div className="mx-auto max-w-3xl">
          <h1 className="font-serif text-3xl font-bold tracking-tight">Solicitud recibida</h1>
          <p className="mt-2">La Coordinación responderá al correo que diligenció.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:py-12">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <header>
          <h1 className="font-serif text-3xl font-bold tracking-tight">
            Solicitud de matrícula de créditos adicionales
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Complete la información solicitada para radicar su solicitud.
          </p>
        </header>
        <PublicRequestSections
          values={values}
          onChange={handleChange}
          signatureCapture={<CanvasFirma onChange={setSignature} />}
          errors={errors}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
        {formError ? <p role="alert" className="text-sm text-destructive">{formError}</p> : null}
      </div>
    </main>
  )
}
