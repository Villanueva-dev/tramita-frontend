'use client'

import { useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import {
  ApplicantFields,
  AcademicFields,
  FIELD_LABELS,
  PublicRequestFixedStrip,
  ReasonFields,
  SignatureFields,
  type PublicRequestFormValues,
} from '@/components/do-fr-100/sections'
import { StepNavigation, StepPanel, StepProgress } from '@/components/do-fr-100/wizard'
import { ReviewSummary } from '@/components/do-fr-100/review-summary'
import {
  FIELD_STEP,
  STEPS,
  errorsOfStep,
  firstStepWithError,
  isFormField,
  stepsWithErrors,
  type FormErrors,
  type FormField,
  type StepId,
} from '@/components/do-fr-100/steps'
import { CanvasFirma, type SignatureCapture } from '@/components/firma/canvas-firma'
import { Logo } from '@/components/brand'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ApiError, submitPublicRequest } from '@/lib/api'
import { apiErrorMessages } from '@/lib/api-errors'
import { PUBLIC_REQUEST_FIELD_LIMITS } from '@/lib/public-request-limits'
import type { PublicRequestBody } from '@/lib/types'

const HELP_WHATSAPP_NUMBER = '+57 315 2966601'
const HELP_WHATSAPP_LINK = 'https://wa.me/573152966601'

/** Rótulo del campo para el aviso por paso; `FIELD_LABELS` no cubre `signature` (sections.tsx). */
function fieldLabel(field: FormField): string {
  return field === 'signature' ? 'Firma' : FIELD_LABELS[field]
}

/**
 * Aviso de errores del paso activo (design.md, PR-4, Open Question resuelta): complementa el
 * `role="alert"` de cada campo, no lo reemplaza, así que no repite ese rol ni `aria-live` — la
 * única región viva sigue siendo el mensaje de cada campo (decisión 6 ya movía el foco al primer
 * campo inválido). Sin errores en el paso, no renderiza nada.
 */
function StepErrorNotice({ errors }: { errors: FormErrors }) {
  const fields = (Object.keys(errors) as FormField[]).map(fieldLabel)
  if (fields.length === 0) return null

  const count = fields.length
  const verb = count === 1 ? 'Falta' : 'Faltan'
  const noun = count === 1 ? 'campo' : 'campos'
  return (
    <p className="text-sm text-destructive">
      {verb} {count} {noun} por corregir en este paso: {fields.join(', ')}.
    </p>
  )
}

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

/** Aviso del formulario en el paso de revisión (design.md, decisión 5). */
interface FormError {
  message: string
  offerSignatureStep: boolean
}

// Cédula y teléfono son numéricos: descartar todo lo que no sea dígito al tecleo (también al
// pegar, porque pegar dispara el mismo evento de cambio) evita que el usuario tenga que
// corregir separadores a mano y hace inalcanzable por la UI el mensaje defensivo de "solo
// dígitos" de `validate` (D3 en odd/tasks/adopcion-diseno-do-fr-100.md).
const DIGITS_ONLY_FIELDS = new Set<keyof PublicRequestFormValues>(['studentDocument', 'studentPhone'])
const DIGITS_ONLY_PATTERN = /^[0-9]+$/
const PHONE_PATTERN = /^[0-9]{10}$/
// No exige punto en el dominio: coincide con el delta de spec («sin @ o sin dominio después de
// él») y no es más estricta que el backend (`format: email`, design.md decisión 3).
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+$/

function stripNonDigits(value: string): string {
  return value.replace(/\D/g, '')
}

function fieldErrorsFromProblem(error: ApiError): FormErrors {
  const errors: FormErrors = {}
  const invalidFields = error.invalidFields ?? error.fieldNames ?? []

  for (const field of invalidFields) {
    if (isFormField(field)) errors[field] = 'Revise este campo.'
  }
  for (const field of error.missingFields ?? []) {
    if (isFormField(field)) errors[field] = 'Este campo es obligatorio.'
  }

  return errors
}

function validate(values: PublicRequestFormValues, signature: SignatureCapture): FormErrors {
  const errors: FormErrors = {}
  for (const [field, value] of Object.entries(values) as [keyof PublicRequestFormValues, string][]) {
    if (!value.trim()) {
      errors[field] = 'Este campo es obligatorio.'
    } else if (field === 'studentPhone') {
      // El teléfono exige exactamente diez dígitos: este mensaje reemplaza al genérico de
      // longitud, tanto por debajo como por encima de diez (D3).
      if (!PHONE_PATTERN.test(value)) {
        errors[field] = 'El número debe tener 10 dígitos, sin espacios. Por ejemplo: 3001234567'
      }
    } else if (field === 'studentEmail' && !EMAIL_PATTERN.test(value)) {
      errors[field] = 'Escriba un correo con arroba y dominio. Por ejemplo: nombre@dominio.com'
    } else if (value.length > PUBLIC_REQUEST_FIELD_LIMITS[field]) {
      errors[field] = `Este campo supera el máximo de ${PUBLIC_REQUEST_FIELD_LIMITS[field]} caracteres.`
    } else if (field === 'studentDocument' && !DIGITS_ONLY_PATTERN.test(value)) {
      // Defensivo: el filtro de tecleo ya descarta lo que no sea dígito, así que este mensaje
      // no debería ser alcanzable desde la UI.
      errors[field] = 'Escriba solo números, sin puntos ni espacios. Por ejemplo: 1234567890'
    }
  }
  if (!signature.hayFirma || !signature.dataUrl) errors.signature = 'La firma es obligatoria.'
  return errors
}

/**
 * Reemplaza solo los errores del paso `step`, conservando los de los demás (design.md, decisión
 * 3): las marcas de un 422 en pasos posteriores sobreviven hasta que el estudiante los recorre.
 */
function replaceErrorsOfStep(current: FormErrors, step: StepId, next: FormErrors): FormErrors {
  const others = Object.fromEntries(
    (Object.entries(current) as [FormField, string][]).filter(([field]) => FIELD_STEP[field] !== step),
  ) as FormErrors
  return { ...others, ...next }
}

export default function PublicAdditionalCreditsPage() {
  const [values, setValues] = useState(INITIAL_VALUES)
  const [signature, setSignature] = useState<SignatureCapture>({ dataUrl: '', hayFirma: false })
  const [errors, setErrors] = useState<FormErrors>({})
  const [formError, setFormError] = useState<FormError | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [step, setStep] = useState<StepId>('applicant')

  const activeHeadingRef = useRef<HTMLHeadingElement>(null)
  const activePanelRef = useRef<HTMLElement>(null)

  function handleChange(field: keyof PublicRequestFormValues, value: string) {
    const nextValue = DIGITS_ONLY_FIELDS.has(field) ? stripNonDigits(value) : value
    setValues((current) => ({ ...current, [field]: nextValue }))
  }

  /** Primer `[aria-invalid="true"]` del panel activo en orden del DOM; si no hay, su encabezado. */
  function focusFirstInvalid() {
    const invalid = activePanelRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')
    if (invalid) invalid.focus()
    else activeHeadingRef.current?.focus()
  }

  function goToStep(target: StepId, focus: 'heading' | 'firstInvalid' = 'heading') {
    // El destino sigue con `hidden` (no enfocable) antes de este render; `flushSync` lo aplica
    // de forma síncrona para que `focus()` encuentre el encabezado o el campo ya visibles
    // (design.md, decisión 6).
    flushSync(() => {
      setStep(target)
      setFormError(null)
    })
    if (focus === 'firstInvalid') focusFirstInvalid()
    else activeHeadingRef.current?.focus()
  }

  function handleContinue() {
    const stepErrors = errorsOfStep(validate(values, signature), step)
    if (Object.keys(stepErrors).length > 0) {
      flushSync(() => setErrors((current) => replaceErrorsOfStep(current, step, stepErrors)))
      focusFirstInvalid()
      return
    }

    setErrors((current) => replaceErrorsOfStep(current, step, {}))
    const next = STEPS[STEPS.findIndex((candidate) => candidate.id === step) + 1]?.id
    if (next) goToStep(next)
  }

  function handleBack() {
    const previous = STEPS[STEPS.findIndex((candidate) => candidate.id === step) - 1]?.id
    if (previous) goToStep(previous)
  }

  async function handleSubmit() {
    const validationErrors = validate(values, signature)
    if (Object.keys(validationErrors).length > 0) {
      // Defensa: cada paso ya se validó al recorrerlo con «Continuar», así que este caso no
      // debería alcanzarse desde la UI expuesta; se conserva para no confiar ciegamente en eso.
      flushSync(() => setErrors(validationErrors))
      const target = firstStepWithError(validationErrors)
      if (target) goToStep(target, 'firstInvalid')
      return
    }

    setErrors({})
    const body: PublicRequestBody = { ...values, signature: signature.dataUrl }
    setIsSubmitting(true)
    try {
      await submitPublicRequest(PUBLIC_REQUEST_DEFINITION_CODE, body)
      setSubmitted(true)
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 422) {
          const problemErrors = fieldErrorsFromProblem(error)
          if (Object.keys(problemErrors).length > 0) {
            flushSync(() => setErrors(problemErrors))
            const target = firstStepWithError(problemErrors)
            if (target) goToStep(target, 'firstInvalid')
          } else {
            setFormError({
              message: 'No pudimos identificar los campos que requieren corrección. Revise la información e inténtelo de nuevo.',
              offerSignatureStep: false,
            })
          }
        } else if (error.status === 404) {
          setFormError({ message: 'Este enlace no está disponible. Escríbale a la Coordinación.', offerSignatureStep: false })
        } else if (error.status === 413) {
          setFormError({ message: 'La firma es demasiado pesada. Bórrela y fírmela de nuevo.', offerSignatureStep: true })
        } else {
          setFormError({ message: apiErrorMessages(error).join(' '), offerSignatureStep: false })
        }
      } else {
        setFormError({ message: apiErrorMessages(error).join(' '), offerSignatureStep: false })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <main className="min-h-screen bg-background px-4 py-8 text-[1.0625rem] sm:px-6 lg:py-12">
        <div className="mx-auto max-w-3xl">
          <h1 className="font-serif text-3xl font-bold tracking-tight">Solicitud recibida</h1>
          <p className="mt-2">
            La Coordinación responderá al correo que diligenció: <strong>{values.studentEmail}</strong>.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-[1.0625rem] sm:px-6 lg:py-12">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <header className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <Logo />
            <span className="text-sm font-medium text-muted-foreground">Formato DO-FR-100</span>
          </div>
          <div>
            <h1 className="font-serif text-3xl font-bold tracking-tight">
              Solicitud de matrícula de créditos adicionales
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Complete la información solicitada para radicar su solicitud.
            </p>
          </div>
        </header>

        <details className="rounded-lg border border-border bg-card p-4 text-sm">
          <summary className="cursor-pointer font-medium">Ayuda</summary>
          <p className="mt-2 text-muted-foreground">
            Si tiene dudas, escríbanos por WhatsApp al{' '}
            <a href={HELP_WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="underline">
              {HELP_WHATSAPP_NUMBER}
            </a>
            .
          </p>
        </details>

        <form
          className="flex flex-col gap-6"
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            if (step === 'review') void handleSubmit()
            else handleContinue()
          }}
        >
          <PublicRequestFixedStrip />
          <StepProgress current={step} stepsWithErrors={stepsWithErrors(errors)} />

          <StepPanel step="applicant" active={step === 'applicant'} headingRef={activeHeadingRef} panelRef={activePanelRef}>
            <StepErrorNotice errors={errorsOfStep(errors, 'applicant')} />
            <Card>
              <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <ApplicantFields values={values} onChange={handleChange} errors={errors} />
              </CardContent>
            </Card>
          </StepPanel>

          <StepPanel step="academic" active={step === 'academic'} headingRef={activeHeadingRef} panelRef={activePanelRef}>
            <StepErrorNotice errors={errorsOfStep(errors, 'academic')} />
            <Card>
              <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <AcademicFields values={values} onChange={handleChange} errors={errors} />
              </CardContent>
            </Card>
          </StepPanel>

          <StepPanel step="reason" active={step === 'reason'} headingRef={activeHeadingRef} panelRef={activePanelRef}>
            <StepErrorNotice errors={errorsOfStep(errors, 'reason')} />
            <p className="text-sm text-muted-foreground">Describa el motivo en los compromisos adquiridos.</p>
            <Card>
              <CardHeader>
                <CardTitle>Compromisos adquiridos</CardTitle>
              </CardHeader>
              <CardContent>
                <ReasonFields values={values} onChange={handleChange} errors={errors} />
              </CardContent>
            </Card>
          </StepPanel>

          <StepPanel step="signature" active={step === 'signature'} headingRef={activeHeadingRef} panelRef={activePanelRef}>
            <StepErrorNotice errors={errorsOfStep(errors, 'signature')} />
            <p className="text-sm text-muted-foreground">
              Trace su firma en el recuadro o cargue una imagen como alternativa accesible.
            </p>
            <SignatureFields signatureCapture={<CanvasFirma onChange={setSignature} />} error={errors.signature} />
          </StepPanel>

          <StepPanel step="review" active={step === 'review'} headingRef={activeHeadingRef} panelRef={activePanelRef}>
            <ReviewSummary values={values} signature={signature} onEdit={(target) => goToStep(target)} />
            {formError ? (
              <div className="flex flex-col items-start gap-2">
                <p role="alert" className="text-sm text-destructive">{formError.message}</p>
                {formError.offerSignatureStep ? (
                  <Button type="button" variant="outline" onClick={() => goToStep('signature')}>
                    Ir a la firma
                  </Button>
                ) : null}
              </div>
            ) : null}
          </StepPanel>

          <StepNavigation step={step} isSubmitting={isSubmitting} onBack={handleBack} />
        </form>
      </div>
    </main>
  )
}
