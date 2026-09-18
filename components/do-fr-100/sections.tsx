import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { ReactNode } from 'react'

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
}

function TextField({
  field,
  label,
  value,
  onChange,
}: {
  field: keyof PublicRequestFormValues
  label: string
  value: string
  onChange: PublicRequestSectionsProps['onChange']
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={field}>{label}</Label>
      <Input
        id={field}
        value={value}
        onChange={(event) => onChange(field, event.target.value)}
      />
    </div>
  )
}

export function PublicRequestSections({ values, onChange, signatureCapture }: PublicRequestSectionsProps) {
  return (
    <div className="flex flex-col gap-6">
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
            />
          </div>
          <TextField field="studentDocument" label="Número de identificación" value={values.studentDocument} onChange={onChange} />
          <TextField field="studentEmail" label="Correo electrónico" value={values.studentEmail} onChange={onChange} />
          <TextField field="studentPhone" label="Número de contacto" value={values.studentPhone} onChange={onChange} />
          <TextField field="program" label="Programa académico en el que se encuentra" value={values.program} onChange={onChange} />
          <TextField field="campus" label="Sede" value={values.campus} onChange={onChange} />
          <TextField field="faculty" label="Facultad" value={values.faculty} onChange={onChange} />
          <TextField field="semester" label="Semestre cursado y aprobado" value={values.semester} onChange={onChange} />
          <TextField field="modality" label="Modalidad" value={values.modality} onChange={onChange} />
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
            className="mt-1.5"
          />
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
        </CardContent>
      </Card>
    </div>
  )
}
