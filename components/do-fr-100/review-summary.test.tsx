import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'

import { ReviewSummary } from './review-summary'
import type { PublicRequestFormValues } from './sections'
import type { FieldStepId } from './steps'

afterEach(() => {
  cleanup()
})

const values: PublicRequestFormValues = {
  studentName: 'Estudiante Sintético',
  studentDocument: '0000000100',
  studentEmail: 'estudiante.sintetico@example.test',
  studentPhone: '0000000000',
  program: 'Programa de Prueba',
  campus: 'Sede Sintética',
  faculty: 'Facultad de Prueba',
  modality: 'Presencial',
  semester: '8',
  reason: 'Solicitud sintética de prueba.',
}

const signature = { dataUrl: 'data:image/png;base64,c2ludGV0aWM=', hayFirma: true }

function findCard(labelText: string): HTMLElement {
  const label = screen.getByText(labelText)
  const card = label.closest('[data-slot="card"]')
  if (!card) throw new Error(`No se encontró la tarjeta del bloque "${labelText}"`)
  return card as HTMLElement
}

describe('ReviewSummary', () => {
  it('muestra el bloque de datos del solicitante con sus cuatro campos diligenciados', () => {
    render(<ReviewSummary values={values} signature={signature} onEdit={vi.fn()} />)

    const card = findCard('Datos del solicitante')
    expect(card.textContent).toContain('Nombres completos del solicitante')
    expect(card.textContent).toContain(values.studentName)
    expect(card.textContent).toContain('Número de identificación')
    expect(card.textContent).toContain(values.studentDocument)
    expect(card.textContent).toContain('Correo electrónico')
    expect(card.textContent).toContain(values.studentEmail)
    expect(card.textContent).toContain('Número de contacto')
    expect(card.textContent).toContain(values.studentPhone)
  })

  it('muestra el bloque de datos académicos con sus cinco campos diligenciados', () => {
    render(<ReviewSummary values={values} signature={signature} onEdit={vi.fn()} />)

    const card = findCard('Datos académicos')
    expect(card.textContent).toContain('Programa académico en el que se encuentra')
    expect(card.textContent).toContain(values.program)
    expect(card.textContent).toContain('Sede')
    expect(card.textContent).toContain(values.campus)
    expect(card.textContent).toContain('Facultad')
    expect(card.textContent).toContain(values.faculty)
    expect(card.textContent).toContain('Semestre cursado y aprobado')
    expect(card.textContent).toContain(values.semester)
    expect(card.textContent).toContain('Modalidad')
    expect(card.textContent).toContain(values.modality)
  })

  it('muestra el motivo de la solicitud con el rótulo oficial de compromisos adquiridos', () => {
    render(<ReviewSummary values={values} signature={signature} onEdit={vi.fn()} />)

    const card = findCard('Motivo de la solicitud')
    expect(card.textContent).toContain('Compromisos adquiridos')
    expect(card.textContent).toContain(values.reason)
  })

  it('distingue un segundo conjunto de valores del primero (no hay texto fijo)', () => {
    const otherValues: PublicRequestFormValues = { ...values, studentName: 'Otra Persona Sintética', campus: 'Otra Sede' }
    render(<ReviewSummary values={otherValues} signature={signature} onEdit={vi.fn()} />)

    expect(findCard('Datos del solicitante').textContent).toContain('Otra Persona Sintética')
    expect(findCard('Datos académicos').textContent).toContain('Otra Sede')
  })

  it('muestra la firma capturada como imagen con un alt significativo', () => {
    render(<ReviewSummary values={values} signature={signature} onEdit={vi.fn()} />)

    const card = findCard('Firma del solicitante')
    const image = card.querySelector('img')
    expect(image).not.toBeNull()
    expect(image!.getAttribute('src')).toBe(signature.dataUrl)
    expect((image!.getAttribute('alt') ?? '').toLowerCase()).toContain('firma')
  })

  it.each([
    ['Datos del solicitante', 'applicant'],
    ['Datos académicos', 'academic'],
    ['Motivo de la solicitud', 'reason'],
    ['Firma del solicitante', 'signature'],
  ] as [string, FieldStepId][])('el botón Cambiar de "%s" llama a onEdit con "%s"', (heading, stepId) => {
    const onEdit = vi.fn()
    render(<ReviewSummary values={values} signature={signature} onEdit={onEdit} />)

    const card = findCard(heading)
    const button = card.querySelector('button')
    expect(button).not.toBeNull()
    expect(button!.getAttribute('aria-label')).toBe(`Cambiar ${heading}`)
    button!.click()
    expect(onEdit).toHaveBeenCalledTimes(1)
    expect(onEdit).toHaveBeenCalledWith(stepId)
  })
})
