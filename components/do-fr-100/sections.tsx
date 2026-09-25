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

export function PublicRequestSections({ values, onChange, signatureCapture, errors, onSubmit, isSubmitting }: PublicRequestSectionsProps) {
  return (
    <form className="flex flex-col gap-6" onSubmit={(event) => { event.preventDefault(); onSubmit() }} noValidate>
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

      <Card>
        <CardHeader>
          <CardTitle>Datos del solicitante</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <TextField
              field="studentName"
              label="Nombres completos del solicitante"
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
          <TextField field="studentDocument" label="Número de identificación" value={values.studentDocument} onChange={onChange} error={errors.studentDocument} hint="Solo números, sin puntos ni espacios." inputMode="numeric" />
          <TextField field="studentEmail" label="Correo electrónico" value={values.studentEmail} onChange={onChange} error={errors.studentEmail} maxLength={PUBLIC_REQUEST_FIELD_LIMITS.studentEmail} />
          <TextField field="studentPhone" label="Número de contacto" value={values.studentPhone} onChange={onChange} error={errors.studentPhone} hint="10 dígitos, sin espacios." inputMode="numeric" />
          <TextField field="program" label="Programa académico en el que se encuentra" value={values.program} onChange={onChange} error={errors.program} maxLength={PUBLIC_REQUEST_FIELD_LIMITS.program} />
          <TextField field="campus" label="Sede" value={values.campus} onChange={onChange} error={errors.campus} maxLength={PUBLIC_REQUEST_FIELD_LIMITS.campus} />
          <TextField field="faculty" label="Facultad" value={values.faculty} onChange={onChange} error={errors.faculty} maxLength={PUBLIC_REQUEST_FIELD_LIMITS.faculty} />
          <TextField field="semester" label="Semestre cursado y aprobado" value={values.semester} onChange={onChange} error={errors.semester} maxLength={PUBLIC_REQUEST_FIELD_LIMITS.semester} />
          <TextField field="modality" label="Modalidad" value={values.modality} onChange={onChange} error={errors.modality} maxLength={PUBLIC_REQUEST_FIELD_LIMITS.modality} />
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
          <Label htmlFor="reason">Compromisos adquiridos</Label>
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Firma del solicitante</CardTitle>
          <CardDescription>Trace su firma en el recuadro o cargue una imagen como alternativa accesible.</CardDescription>
        </CardHeader>
        <CardContent>
          <figure aria-labelledby="signature-label">
            {signatureCapture}
            <figcaption id="signature-label" className="sr-only">
              Firma del solicitante
            </figcaption>
          </figure>
          {errors.signature ? <p id="signature-error" role="alert" className="mt-2 text-sm text-destructive">{errors.signature}</p> : null}
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
