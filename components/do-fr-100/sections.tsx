import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
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

interface PublicRequestSectionsProps {
  values: PublicRequestFormValues
  onChange: (field: keyof PublicRequestFormValues, value: string) => void
  signatureCapture: ReactNode
  errors: Partial<Record<keyof PublicRequestFormValues | 'signature', string>>
  onSubmit: () => void
  isSubmitting: boolean
}

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
  onChange: PublicRequestSectionsProps['onChange']
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
      <Label htmlFor={field}>{label}</Label>
      {hint ? <p id={`${field}-hint`} className="text-sm text-muted-foreground">{hint}</p> : null}
      <Input
        id={field}
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
  onChange: PublicRequestSectionsProps['onChange']
  errors: PublicRequestSectionsProps['errors']
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
        />
      </div>
      {/*
        Cédula y teléfono no llevan maxLength: el navegador recortaría el texto pegado,
        separadores incluidos, antes de que la página filtre los dígitos. Su tope lo aplica
        la validación de la página.
      */}
      <TextField field="studentDocument" label={FIELD_LABELS.studentDocument} value={values.studentDocument} onChange={onChange} error={errors.studentDocument} hint="Solo números, sin puntos ni espacios." inputMode="numeric" />
      <TextField field="studentEmail" label={FIELD_LABELS.studentEmail} value={values.studentEmail} onChange={onChange} error={errors.studentEmail} maxLength={PUBLIC_REQUEST_FIELD_LIMITS.studentEmail} />
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
      <TextField field="program" label={FIELD_LABELS.program} value={values.program} onChange={onChange} error={errors.program} maxLength={PUBLIC_REQUEST_FIELD_LIMITS.program} />
      <TextField field="campus" label={FIELD_LABELS.campus} value={values.campus} onChange={onChange} error={errors.campus} maxLength={PUBLIC_REQUEST_FIELD_LIMITS.campus} />
      <TextField field="faculty" label={FIELD_LABELS.faculty} value={values.faculty} onChange={onChange} error={errors.faculty} maxLength={PUBLIC_REQUEST_FIELD_LIMITS.faculty} />
      <TextField field="semester" label={FIELD_LABELS.semester} value={values.semester} onChange={onChange} error={errors.semester} maxLength={PUBLIC_REQUEST_FIELD_LIMITS.semester} />
      <TextField field="modality" label={FIELD_LABELS.modality} value={values.modality} onChange={onChange} error={errors.modality} maxLength={PUBLIC_REQUEST_FIELD_LIMITS.modality} />
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
  return (
    <>
      <Label htmlFor="reason">{FIELD_LABELS.reason}</Label>
      <Textarea
        id="reason"
        value={values.reason}
        onChange={(event) => onChange('reason', event.target.value)}
        maxLength={PUBLIC_REQUEST_FIELD_LIMITS.reason}
        aria-invalid={Boolean(errors.reason)}
        aria-describedby={errors.reason ? 'reason-error' : undefined}
        className="mt-1.5"
      />
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

export function PublicRequestSections({ values, onChange, signatureCapture, errors, onSubmit, isSubmitting }: PublicRequestSectionsProps) {
  return (
    <form className="flex flex-col gap-6" onSubmit={(event) => { event.preventDefault(); onSubmit() }} noValidate>
      <PublicRequestFixedStrip />

      <Card>
        <CardHeader>
          <CardTitle>Datos del solicitante</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ApplicantFields values={values} onChange={onChange} errors={errors} />
          <AcademicFields values={values} onChange={onChange} errors={errors} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Motivo de la solicitud</CardTitle>
          <CardDescription>Describa el motivo en los compromisos adquiridos.</CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Compromisos adquiridos</CardTitle>
        </CardHeader>
        <CardContent>
          <ReasonFields values={values} onChange={onChange} errors={errors} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Firma del solicitante</CardTitle>
          <CardDescription>Trace su firma en el recuadro o cargue una imagen como alternativa accesible.</CardDescription>
        </CardHeader>
        <CardContent>
          <SignatureFields signatureCapture={signatureCapture} error={errors.signature} />
        </CardContent>
      </Card>
      {/*
        h-11 son los 44 px de objetivo táctil que invoca design.md:75, por encima de los 36 px
        que trae la variante `lg`: esta pantalla se diligencia desde el teléfono. En móvil ocupa
        el ancho completo y desde `sm` se ajusta al contenido.
      */}
      <Button
        type="submit"
        size="lg"
        disabled={isSubmitting}
        className="h-11 w-full sm:w-auto sm:self-end"
      >
        {isSubmitting ? 'Enviando solicitud...' : 'Enviar solicitud'}
      </Button>
    </form>
  )
}
