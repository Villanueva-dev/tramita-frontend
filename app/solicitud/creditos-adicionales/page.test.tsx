import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import PublicAdditionalCreditsPage from './page'

afterEach(() => {
  cleanup()
})

function phaseOneSourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) return phaseOneSourceFiles(path)
    return entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')
      ? [path]
      : []
  })
}

function phaseOneFeatureSource() {
  const paths = [
    ...phaseOneSourceFiles('app/solicitud/creditos-adicionales'),
    ...phaseOneSourceFiles('components/do-fr-100'),
  ].filter((path) => !path.includes('.test.'))

  return paths.map((path) => ({ path, source: readFileSync(path, 'utf8') }))
}

describe('PublicAdditionalCreditsPage', () => {
  it('renders for a visitor without a session', () => {
    render(<PublicAdditionalCreditsPage />)

    expect(screen.getByRole('heading', { name: /solicitud de matrícula de créditos adicionales/i })).toBeDefined()
  })

  it('guards the complete Phase 1 feature boundary from AppShell and request-store dependencies', () => {
    const sources = phaseOneFeatureSource()

    expect(sources.map(({ path }) => path).sort()).toEqual([
      'app/solicitud/creditos-adicionales/page.tsx',
      'components/do-fr-100/sections.tsx',
    ])

    for (const { source } of sources) {
      expect(source).not.toMatch(/app-shell|useTramita|['"]@\/lib\/store['"]/i)
    }
  })

  it('keeps the official blocks and field labels in form order', () => {
    render(<PublicAdditionalCreditsPage />)

    const blocks = [
      screen.getByText('Lugar y fecha'),
      screen.getByText('Tipo de solicitud'),
      screen.getByText('Datos del solicitante'),
      screen.getByText('Motivo de la solicitud'),
      screen.getByText('Compromisos adquiridos', { selector: '[data-slot="card-title"]' }),
      screen.getByText('Firma del solicitante'),
    ]

    for (let index = 1; index < blocks.length; index += 1) {
      expect(blocks[index - 1].compareDocumentPosition(blocks[index]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    }

    expect(screen.getByLabelText('Nombres completos del solicitante').id).toBe('studentName')
    expect(screen.getByLabelText('Número de identificación').id).toBe('studentDocument')
    expect(screen.getByLabelText('Correo electrónico').id).toBe('studentEmail')
    expect(screen.getByLabelText('Número de contacto').id).toBe('studentPhone')
    expect(screen.getByLabelText('Programa académico en el que se encuentra').id).toBe('program')
    expect(screen.getByLabelText('Sede').id).toBe('campus')
    expect(screen.getByLabelText('Facultad').id).toBe('faculty')
    expect(screen.getByLabelText('Semestre cursado y aprobado').id).toBe('semester')
    expect(screen.getByLabelText('Modalidad').id).toBe('modality')
    expect(screen.getByLabelText('Compromisos adquiridos').id).toBe('reason')

    const semester = screen.getByLabelText('Semestre cursado y aprobado')
    const modality = screen.getByLabelText('Modalidad')
    expect(semester.compareDocumentPosition(modality) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('guards the request type against checkboxes and selectors in the rendered tree', () => {
    render(<PublicAdditionalCreditsPage />)

    expect(screen.getByText('Matrícula créditos adicionales')).toBeDefined()
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0)
    expect(screen.queryAllByRole('combobox')).toHaveLength(0)
  })

  it('guards the exact contract controls and one extensive textarea', () => {
    render(<PublicAdditionalCreditsPage />)

    const controls = Array.from(document.querySelectorAll('input, textarea, select, button'))
    expect(controls.map((control) => control.id)).toEqual([
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
    ])
    expect(controls.filter((control) => /asignatura|subject|credit/i.test(control.id || control.getAttribute('name') || ''))).toHaveLength(0)
    expect(document.querySelectorAll('textarea')).toHaveLength(1)
    expect(document.querySelector('textarea')?.id).toBe('reason')
  })

  it('exposes the empty signature placeholder through a named figure', () => {
    render(<PublicAdditionalCreditsPage />)

    const signaturePlaceholder = screen.getByRole('figure', { name: 'Espacio para firma' })
    expect(signaturePlaceholder.querySelector('div')?.getAttribute('contenteditable')).toBeNull()
    expect(signaturePlaceholder.querySelector('div')?.getAttribute('aria-label')).toBeNull()
  })
})
