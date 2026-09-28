import { describe, expect, it } from 'vitest'

import { errorsOfStep, FIELD_STEP, firstStepWithError, isFormField, STEPS, stepsWithErrors, type FormErrors } from './steps'

describe('STEPS', () => {
  it('define los cinco pasos del asistente, en el orden fijo de la spec', () => {
    expect(STEPS.map((step) => step.id)).toEqual(['applicant', 'academic', 'reason', 'signature', 'review'])
  })

  it('usa las etiquetas de la barra de progreso que fija la spec (Diligenciamiento por pasos)', () => {
    expect(STEPS.map((step) => step.label)).toEqual([
      'Sus datos',
      'Datos académicos',
      'Motivo de la solicitud',
      'Firma',
      'Revisar y enviar',
    ])
  })

  it('usa el nombre del bloque del papel como encabezado cuando existe', () => {
    const headingOf = (id: string) => STEPS.find((step) => step.id === id)?.heading
    expect(headingOf('applicant')).toBe('Datos del solicitante')
    expect(headingOf('reason')).toBe('Motivo de la solicitud')
    expect(headingOf('signature')).toBe('Firma del solicitante')
  })

  it('usa la misma etiqueta como encabezado cuando el papel no tiene un bloque propio', () => {
    const headingOf = (id: string) => STEPS.find((step) => step.id === id)?.heading
    expect(headingOf('academic')).toBe('Datos académicos')
    expect(headingOf('review')).toBe('Revisar y enviar')
  })
})

describe('FIELD_STEP', () => {
  it('asigna cada uno de los once campos a exactamente un paso, en el orden del papel', () => {
    expect(Object.keys(FIELD_STEP)).toEqual([
      'studentName',
      'studentDocument',
      'studentEmail',
      'studentPhone',
      'program',
      'campus',
      'faculty',
      'semester',
      'modality',
      'reason',
      'signature',
    ])
  })

  it('agrupa nombre, identificación, correo y teléfono en el paso "Sus datos"', () => {
    expect(FIELD_STEP.studentName).toBe('applicant')
    expect(FIELD_STEP.studentDocument).toBe('applicant')
    expect(FIELD_STEP.studentEmail).toBe('applicant')
    expect(FIELD_STEP.studentPhone).toBe('applicant')
  })

  it('agrupa programa, sede, facultad, semestre y modalidad en "Datos académicos"', () => {
    expect(FIELD_STEP.program).toBe('academic')
    expect(FIELD_STEP.campus).toBe('academic')
    expect(FIELD_STEP.faculty).toBe('academic')
    expect(FIELD_STEP.semester).toBe('academic')
    expect(FIELD_STEP.modality).toBe('academic')
  })

  it('asigna reason a "Motivo de la solicitud" y signature a "Firma"', () => {
    expect(FIELD_STEP.reason).toBe('reason')
    expect(FIELD_STEP.signature).toBe('signature')
  })
})

describe('isFormField', () => {
  it('acepta cada uno de los once campos del formulario', () => {
    for (const field of Object.keys(FIELD_STEP)) {
      expect(isFormField(field)).toBe(true)
    }
  })

  it('rechaza un nombre que no es un campo del formulario', () => {
    expect(isFormField('signatureUrl')).toBe(false)
    expect(isFormField('')).toBe(false)
  })
})

describe('errorsOfStep', () => {
  const errors: FormErrors = {
    studentName: 'Este campo es obligatorio.',
    program: 'Este campo es obligatorio.',
    reason: 'Este campo es obligatorio.',
  }

  it('devuelve solo los errores del paso pedido', () => {
    expect(errorsOfStep(errors, 'applicant')).toEqual({ studentName: 'Este campo es obligatorio.' })
    expect(errorsOfStep(errors, 'academic')).toEqual({ program: 'Este campo es obligatorio.' })
  })

  it('devuelve un objeto vacío para un paso sin campos con error', () => {
    expect(errorsOfStep(errors, 'signature')).toEqual({})
  })

  it('siempre devuelve vacío para la revisión, que no valida campos propios', () => {
    expect(errorsOfStep(errors, 'review')).toEqual({})
  })
})

describe('firstStepWithError', () => {
  it('devuelve el primer paso con error en el orden de STEPS, no en el orden de los campos', () => {
    // "reason" aparece primero en el objeto de errores, pero "applicant" es anterior en STEPS.
    const errors: FormErrors = { reason: 'Este campo es obligatorio.', studentName: 'Este campo es obligatorio.' }
    expect(firstStepWithError(errors)).toBe('applicant')
  })

  it('devuelve el paso "signature" cuando solo la firma tiene error', () => {
    expect(firstStepWithError({ signature: 'La firma es obligatoria.' })).toBe('signature')
  })

  it('devuelve null cuando no hay errores', () => {
    expect(firstStepWithError({})).toBeNull()
  })
})

describe('stepsWithErrors', () => {
  it('marca cada paso que tiene al menos un campo con error', () => {
    const errors: FormErrors = { studentName: 'x', reason: 'x' }
    expect(stepsWithErrors(errors)).toEqual(new Set(['applicant', 'reason']))
  })

  it('devuelve un conjunto vacío sin errores', () => {
    expect(stepsWithErrors({})).toEqual(new Set())
  })
})
