import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { PUBLIC_REQUEST_FIELD_LIMITS } from '@/lib/public-request-limits'
import type { ComponentProps, ReactNode } from 'react'

export interface PublicRequestFormValues {
  studentName: string
  studentDocument: string
  studentEmail: string
  studentPhone: string
  program: string
  campus: string
  faculty: string
  modality: string
  semester: string
  reason: string
}

// `PublicRequestSections`, el componente de una sola página que consumía este contrato, se retiró
// en el corte 3d: `page.tsx` compone estos grupos dentro de su propio `<form>` (design.md,
// decisión 4). `FieldGroupProps` queda autocontenido en vez de derivar de las props de un
// componente que ya no existe.
type FieldChangeHandler = (field: keyof PublicRequestFormValues, value: string) => void
type FieldErrors = Partial<Record<keyof PublicRequestFormValues | 'signature', string>>

/**
 * Fuente única de los rótulos de campo (checklist «TypeScript»/DRY): `review-summary.tsx` los
 * importa en vez de mantener su propia copia, así un rótulo solo cambia en un lugar.
 */
export const FIELD_LABELS: Record<keyof PublicRequestFormValues, string> = {
  studentName: 'Nombres completos del solicitante',
  studentDocument: 'Número de identificación',
  studentEmail: 'Correo electrónico',
  studentPhone: 'Número de contacto',
  program: 'Programa académico en el que se encuentra',
  campus: 'Sede',
  faculty: 'Facultad',
  semester: 'Semestre cursado y aprobado',
  modality: 'Modalidad',
  reason: 'Compromisos adquiridos',
}

/**
 * Letra de 17 px de la propuesta (PR-4) para rótulos y controles: `Label`, `Input` y `Textarea`
 * fijan `text-sm`, así que el tamaño del `<main>` no les llega y se aplica aquí, en el punto de
 * uso, sin tocar las primitivas que comparte la app interna. En rem, no en px: 1.0625rem son
 * 17 px con la raíz por omisión (16 px) y escala con el tamaño de letra que el estudiante haya
 * configurado en su navegador, cosa que un valor en px ignoraría.
 */
const READING_TEXT_SIZE = 'text-[1.0625rem]'

function TextField({
  field,
  label,
  value,
  onChange,
  error,
  maxLength,
  hint,
  inputMode,
}: {
  field: keyof PublicRequestFormValues
  label: string
  value: string
  onChange: FieldChangeHandler
  error?: string
  maxLength?: number
  hint?: string
  inputMode?: ComponentProps<'input'>['inputMode']
}) {
  const describedBy = [hint ? `${field}-hint` : null, error ? `${field}-error` : null]
    .filter(Boolean)
    .join(' ') || undefined

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={field} className={READING_TEXT_SIZE}>{label}</Label>
      {hint ? <p id={`${field}-hint`} className="text-sm text-muted-foreground">{hint}</p> : null}
      <Input
        id={field}
        className={`h-13 ${READING_TEXT_SIZE}`}
        value={value}
        onChange={(event) => onChange(field, event.target.value)}
        maxLength={maxLength}
        inputMode={inputMode}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
      />
      {error ? <p id={`${field}-error`} role="alert" className="text-sm text-destructive">{error}</p> : null}
    </div>
  )
}

/**
 * Grupos de campos del asistente (design.md, decisión 1). Cada grupo renderiza exactamente los
 * campos que `FIELD_STEP` (`steps.ts`) asigna a su paso, en el orden del papel. `values`,
 * `onChange` y `errors` reciben el contrato completo, igual que `PublicRequestSectionsProps`,
 * para que un mismo grupo pueda componerse aquí (todo en una pasada) o, más adelante, dentro de
 * un paso del asistente sin cambiar su firma.
 */
export interface FieldGroupProps {
  values: PublicRequestFormValues
  onChange: FieldChangeHandler
  errors: FieldErrors
}

/**
 * Franja fija de «Lugar y fecha» y «Tipo de solicitud»: no tiene campos propios y, en el
 * asistente, se muestra por encima de la barra de progreso en todos los pasos (spec
 * «Reproducción del formato con repliegue declarado»).
 */
export function PublicRequestFixedStrip() {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Lugar y fecha</CardTitle>
          <CardDescription>La fecha de radicación se registra al enviar la solicitud.</CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tipo de solicitud</CardTitle>
          <CardDescription>Matrícula créditos adicionales</CardDescription>
        </CardHeader>
      </Card>
    </>
  )
}

/**
 * Los cuatro campos del paso «Sus datos» (`FIELD_STEP.applicant`). Sin tarjeta propia: hoy
 * comparte una sola tarjeta «Datos del solicitante» con los campos académicos; quien componga
 * este grupo decide el encabezado que lo envuelve.
 */
export function ApplicantFields({ values, onChange, errors }: FieldGroupProps) {
  return (
    <>
      <div className="sm:col-span-2">
        <TextField
          field="studentName"
          label={FIELD_LABELS.studentName}
          value={values.studentName}
          onChange={onChange}
          error={errors.studentName}
          maxLength={PUBLIC_REQUEST_FIELD_LIMITS.studentName}
          hint="Por ejemplo: Nombre Apellido Apellido"
        />
      </div>
      {/*
        Cédula y teléfono no llevan maxLength: el navegador recortaría el texto pegado,
        separadores incluidos, antes de que la página filtre los dígitos. Su tope lo aplica
        la validación de la página.
      */}
      <TextField field="studentDocument" label={FIELD_LABELS.studentDocument} value={values.studentDocument} onChange={onChange} error={errors.studentDocument} hint="Solo números, sin puntos ni espacios." inputMode="numeric" />
      <TextField field="studentEmail" label={FIELD_LABELS.studentEmail} value={values.studentEmail} onChange={onChange} error={errors.studentEmail} maxLength={PUBLIC_REQUEST_FIELD_LIMITS.studentEmail} hint="Por ejemplo: nombre@dominio.com" />
      <TextField field="studentPhone" label={FIELD_LABELS.studentPhone} value={values.studentPhone} onChange={onChange} error={errors.studentPhone} hint="10 dígitos, sin espacios." inputMode="numeric" />
    </>
  )
}

/**
 * Los cinco campos del paso «Datos académicos» (`FIELD_STEP.academic`). Sin tarjeta propia, por
 * la misma razón que `ApplicantFields`.
 */
export function AcademicFields({ values, onChange, errors }: FieldGroupProps) {
  return (
    <>
      <TextField field="program" label={FIELD_LABELS.program} value={values.program} onChange={onChange} error={errors.program} maxLength={PUBLIC_REQUEST_FIELD_LIMITS.program} hint="Por ejemplo: Ingeniería de Sistemas" />
      <TextField field="campus" label={FIELD_LABELS.campus} value={values.campus} onChange={onChange} error={errors.campus} maxLength={PUBLIC_REQUEST_FIELD_LIMITS.campus} hint="Por ejemplo: Cali" />
      <TextField field="faculty" label={FIELD_LABELS.faculty} value={values.faculty} onChange={onChange} error={errors.faculty} maxLength={PUBLIC_REQUEST_FIELD_LIMITS.faculty} hint="Por ejemplo: Ingenierías" />
      <TextField field="semester" label={FIELD_LABELS.semester} value={values.semester} onChange={onChange} error={errors.semester} maxLength={PUBLIC_REQUEST_FIELD_LIMITS.semester} hint="Por ejemplo: Sexto" />
      <TextField field="modality" label={FIELD_LABELS.modality} value={values.modality} onChange={onChange} error={errors.modality} maxLength={PUBLIC_REQUEST_FIELD_LIMITS.modality} hint="Por ejemplo: Distancia" />
    </>
  )
}

/**
 * El único campo del paso «Motivo de la solicitud» (`FIELD_STEP.reason`): «Compromisos
 * adquiridos». Sin tarjeta propia, como `ApplicantFields`/`AcademicFields` — en el asistente
 * (Slice 4), el encabezado del paso lo pone `StepPanel`; una tarjeta con su propio título
 * duplicaría ese encabezado (design.md, decisión 1).
 */
export function ReasonFields({ values, onChange, errors }: FieldGroupProps) {
  // El contador no es una región viva (design.md, decisión 8): se lee al enfocar o revisar el
  // campo, igual que el hint; no interrumpe al estudiante mientras escribe.
  const describedBy = ['reason-hint', 'reason-counter', errors.reason ? 'reason-error' : null]
    .filter(Boolean)
    .join(' ')

  return (
    <>
      <Label htmlFor="reason" className={READING_TEXT_SIZE}>{FIELD_LABELS.reason}</Label>
      <p id="reason-hint" className="text-sm text-muted-foreground">
        Por ejemplo: Presentar los trabajos pendientes antes de finalizar el semestre.
      </p>
      <Textarea
        id="reason"
        value={values.reason}
        onChange={(event) => onChange('reason', event.target.value)}
        maxLength={PUBLIC_REQUEST_FIELD_LIMITS.reason}
        aria-invalid={Boolean(errors.reason)}
        aria-describedby={describedBy}
        className={`mt-1.5 ${READING_TEXT_SIZE}`}
      />
      <p id="reason-counter" className="text-sm text-muted-foreground">
        {values.reason.length} de {PUBLIC_REQUEST_FIELD_LIMITS.reason} caracteres
      </p>
      {errors.reason ? <p id="reason-error" role="alert" className="text-sm text-destructive">{errors.reason}</p> : null}
    </>
  )
}

/**
 * El único campo del paso «Firma» (`FIELD_STEP.signature`). Sin tarjeta propia, por la misma
 * razón que `ReasonFields`. `signatureCapture` sigue siendo un `ReactNode` inyectado por
 * `page.tsx` (hoy `<CanvasFirma>`); este grupo no conoce el lienzo, solo lo aloja.
 */
export function SignatureFields({ signatureCapture, error }: { signatureCapture: ReactNode; error?: string }) {
  return (
    <>
      <figure aria-labelledby="signature-label">
        {signatureCapture}
        <figcaption id="signature-label" className="sr-only">
          Firma del solicitante
        </figcaption>
      </figure>
      {error ? <p id="signature-error" role="alert" className="mt-2 text-sm text-destructive">{error}</p> : null}
    </>
  )
}

