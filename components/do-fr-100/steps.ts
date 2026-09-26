import type { PublicRequestFormValues } from './sections'

/**
 * Estructura pura del asistente de cinco pasos (D1, `odd/tasks/adopcion-diseno-do-fr-100.md`).
 * Sin JSX ni estado: `page.tsx` es el único dueño del estado (design.md, decisión 1).
 */
export type StepId = 'applicant' | 'academic' | 'reason' | 'signature' | 'review'

/** Los pasos que reciben campos del formulario; la revisión no valida campos propios. */
export type FieldStepId = Exclude<StepId, 'review'>

/** Los diez campos del papel más la firma: once en total (mismo dominio que `page.tsx:26`). */
export type FormField = keyof PublicRequestFormValues | 'signature'

export type FormErrors = Partial<Record<FormField, string>>

/**
 * Cinco pasos, en el orden fijo del papel y de la spec («Diligenciamiento por pasos»).
 * `label` alimenta la barra de progreso con los nombres del delta de spec; `heading` alimenta
 * el encabezado del panel activo con el nombre oficial del bloque del papel cuando existe
 * («Datos del solicitante», «Motivo de la solicitud», «Firma del solicitante»). «Datos
 * académicos» y «Revisar y enviar» no tienen un bloque propio en el formato de papel, así que
 * su encabezado repite la etiqueta (design.md, decisión 6).
 */
export const STEPS: readonly { id: StepId; label: string; heading: string }[] = [
  { id: 'applicant', label: 'Sus datos', heading: 'Datos del solicitante' },
  { id: 'academic', label: 'Datos académicos', heading: 'Datos académicos' },
  { id: 'reason', label: 'Motivo de la solicitud', heading: 'Motivo de la solicitud' },
  { id: 'signature', label: 'Firma', heading: 'Firma del solicitante' },
  { id: 'review', label: 'Revisar y enviar', heading: 'Revisar y enviar' },
]

/**
 * Mapa campo → paso, en el orden del papel (nombre, identificación, correo y teléfono; luego
 * programa, sede, facultad, semestre y modalidad). Tipar contra `Record<FormField, FieldStepId>`
 * hace que el compilador rechace un campo sin paso o un paso inexistente (design.md, decisión 3).
 */
export const FIELD_STEP: Record<FormField, FieldStepId> = {
  studentName: 'applicant',
  studentDocument: 'applicant',
  studentEmail: 'applicant',
  studentPhone: 'applicant',
  program: 'academic',
  campus: 'academic',
  faculty: 'academic',
  semester: 'academic',
  modality: 'academic',
  reason: 'reason',
  signature: 'signature',
}

// El conjunto de campos válidos sale de FIELD_STEP, no de una lista aparte: un campo nuevo que
// no se agregue aquí no tiene paso, así que tampoco puede pasar isFormField.
const FORM_FIELDS = new Set<string>(Object.keys(FIELD_STEP))

export function isFormField(name: string): name is FormField {
  return FORM_FIELDS.has(name)
}

/** Filtra `errors` a los campos del paso pedido. La revisión no tiene campos propios. */
export function errorsOfStep(errors: FormErrors, step: StepId): FormErrors {
  if (step === 'review') return {}

  const result: FormErrors = {}
  for (const [field, message] of Object.entries(errors) as [FormField, string][]) {
    if (FIELD_STEP[field] === step) result[field] = message
  }
  return result
}

/** Primer paso con error en el orden de STEPS (no en el orden en que aparecen en `errors`). */
export function firstStepWithError(errors: FormErrors): FieldStepId | null {
  for (const step of STEPS) {
    if (step.id === 'review') continue
    if (Object.keys(errorsOfStep(errors, step.id)).length > 0) return step.id
  }
  return null
}

/** Pasos con al menos un campo con error, para que la barra de progreso los marque. */
export function stepsWithErrors(errors: FormErrors): ReadonlySet<StepId> {
  const result = new Set<StepId>()
  for (const field of Object.keys(errors) as FormField[]) {
    result.add(FIELD_STEP[field])
  }
  return result
}
