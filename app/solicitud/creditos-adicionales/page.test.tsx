import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import PublicAdditionalCreditsPage from './page'
import { ApiError, submitPublicRequest } from '@/lib/api'

vi.mock('@/lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/api')>()),
  submitPublicRequest: vi.fn(),
}))

afterEach(() => {
  cleanup()
  vi.mocked(submitPublicRequest).mockReset()
  vi.restoreAllMocks()
})

const completeValues = {
  studentName: 'Estudiante Sintético',
  studentDocument: 'SIN-DATO-REAL-100',
  studentEmail: 'estudiante.sintetico@example.test',
  studentPhone: '000 000 0000',
  program: 'Programa de Prueba',
  campus: 'Sede Sintética',
  faculty: 'Facultad de Prueba',
  modality: 'Presencial',
  semester: '8',
  reason: 'Solicitud sintética de prueba.',
}

function completeForm() {
  for (const [field, value] of Object.entries(completeValues)) {
    fireEvent.change(document.getElementById(field) as HTMLInputElement, { target: { value } })
  }
  const canvas = screen.getByLabelText('Área para dibujar la firma')
  const context = {
    beginPath: vi.fn(), moveTo: vi.fn(), quadraticCurveTo: vi.fn(), stroke: vi.fn(),
    scale: vi.fn(), clearRect: vi.fn(), lineCap: '', lineJoin: '', lineWidth: 0,
  }
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context as unknown as CanvasRenderingContext2D)
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,c2ludGV0aWM=')
  fireEvent.pointerDown(canvas, { pointerId: 1, clientX: 0, clientY: 0 })
  fireEvent.pointerMove(canvas, { pointerId: 1, clientX: 8, clientY: 0 })
  fireEvent.pointerUp(canvas, { pointerId: 1, clientX: 8, clientY: 0 })
}

function publicRequestSourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) return publicRequestSourceFiles(path)
    return entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')
      ? [path]
      : []
  })
}

function publicRequestFeatureSource() {
  const paths = [
    ...publicRequestSourceFiles('app/solicitud/creditos-adicionales'),
    ...publicRequestSourceFiles('components/do-fr-100'),
    ...publicRequestSourceFiles('components/firma'),
  ].filter((path) => !path.includes('.test.'))

  return paths.map((path) => ({ path, source: readFileSync(path, 'utf8') }))
}

describe('PublicAdditionalCreditsPage', () => {
  it('renders for a visitor without a session', () => {
    render(<PublicAdditionalCreditsPage />)

    expect(screen.getByRole('heading', { name: /solicitud de matrícula de créditos adicionales/i })).toBeDefined()
  })

  it('guards the complete public-request boundary from AppShell and request-store dependencies', () => {
    const sources = publicRequestFeatureSource()

    expect(sources.map(({ path }) => path).sort()).toEqual([
      'app/solicitud/creditos-adicionales/page.tsx',
      'components/do-fr-100/sections.tsx',
      'components/firma/canvas-firma.tsx',
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
      screen.getByText('Firma del solicitante', { selector: '[data-slot="card-title"]' }),
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
      'signature-upload',
      '',
      '',
    ])
    expect(controls.filter((control) => /asignatura|subject|credit/i.test(control.id || control.getAttribute('name') || ''))).toHaveLength(0)
    expect(document.querySelectorAll('textarea')).toHaveLength(1)
    expect(document.querySelector('textarea')?.id).toBe('reason')
  })

  it('integrates the canvas and keyboard-operable image alternative inside an accurately named figure', () => {
    render(<PublicAdditionalCreditsPage />)

    const signatureFigure = screen.getByRole('figure', { name: 'Firma del solicitante' })
    expect(screen.queryByRole('figure', { name: 'Espacio para firma' })).toBeNull()
    expect(screen.getByLabelText('Área para dibujar la firma')).toBe(signatureFigure.querySelector('canvas'))
    expect(screen.getByLabelText('Cargar una imagen de firma')).toBe(signatureFigure.querySelector('input[type="file"]'))
    expect(screen.getByRole('button', { name: 'Limpiar firma' })).toBeDefined()
  })

  it('renders the submit control with the design-system button and a 44 px touch target', () => {
    render(<PublicAdditionalCreditsPage />)

    const submit = screen.getByRole('button', { name: 'Enviar solicitud' })
    // `data-slot` lo pone components/ui/button.tsx: distingue el componente del proyecto
    // de un <button> crudo. jsdom no calcula layout, así que la altura se verifica sobre
    // la clase declarada (h-11 = 44 px, el mínimo que invoca design.md:75), no medida.
    expect(submit.getAttribute('data-slot')).toBe('button')
    expect(submit.className).toContain('h-11')
  })

  it.each(Object.keys(completeValues))('blocks submission and marks %s invalid when it is blank after trim', async (field) => {
    render(<PublicAdditionalCreditsPage />)
    completeForm()
    fireEvent.change(document.getElementById(field) as HTMLInputElement, { target: { value: '   ' } })

    fireEvent.click(screen.getByRole('button', { name: 'Enviar solicitud' }))

    expect(document.getElementById(field)?.getAttribute('aria-invalid')).toBe('true')
    expect(vi.mocked(submitPublicRequest)).not.toHaveBeenCalled()
  })

  it('blocks submission when the signature has not been captured', () => {
    render(<PublicAdditionalCreditsPage />)
    for (const [field, value] of Object.entries(completeValues)) {
      fireEvent.change(document.getElementById(field) as HTMLInputElement, { target: { value } })
    }

    fireEvent.click(screen.getByRole('button', { name: 'Enviar solicitud' }))

    expect(screen.getByText('La firma es obligatoria.')).toBeDefined()
    expect(vi.mocked(submitPublicRequest)).not.toHaveBeenCalled()
  })

  it.each([
    ['studentName', 121], ['studentDocument', 21], ['studentEmail', 256], ['studentPhone', 31],
    ['program', 121], ['campus', 121], ['faculty', 121], ['modality', 51], ['semester', 51], ['reason', 2001],
  ])('blocks %s over its contract limit', (field, length) => {
    render(<PublicAdditionalCreditsPage />)
    completeForm()
    fireEvent.change(document.getElementById(field) as HTMLInputElement, { target: { value: 'a'.repeat(length) } })

    fireEvent.click(screen.getByRole('button', { name: 'Enviar solicitud' }))

    expect(document.getElementById(field)?.getAttribute('aria-invalid')).toBe('true')
    expect(vi.mocked(submitPublicRequest)).not.toHaveBeenCalled()
  })

  it('sends the unchanged semester and replaces the form with an in-place receipt on 201', async () => {
    vi.mocked(submitPublicRequest).mockResolvedValue({ message: 'Tu solicitud llegó a la Coordinación.' })
    render(<PublicAdditionalCreditsPage />)
    completeForm()

    fireEvent.click(screen.getByRole('button', { name: 'Enviar solicitud' }))

    await waitFor(() => expect(submitPublicRequest).toHaveBeenCalledWith(
      'ADICION_CREDITOS', expect.objectContaining({ semester: '8' }),
    ))
    expect(screen.queryByRole('button', { name: 'Enviar solicitud' })).toBeNull()
    expect(screen.getByText(/coordinación responderá al correo/i)).toBeDefined()
    expect(screen.queryByText(/estado|radicado|identificador/i)).toBeNull()
  })

  it.each([
    [404, 'Este enlace no está disponible'],
    [413, 'La firma es demasiado pesada'],
  ])('keeps entered data and gives the specified message for %s', async (status, message) => {
    vi.mocked(submitPublicRequest).mockRejectedValue(new ApiError(status, 'Problema'))
    render(<PublicAdditionalCreditsPage />)
    completeForm()

    fireEvent.click(screen.getByRole('button', { name: 'Enviar solicitud' }))

    expect(await screen.findByText(message, { exact: false })).toBeDefined()
    expect((document.getElementById('studentName') as HTMLInputElement).value).toBe(completeValues.studentName)
  })

  it('maps missing and invalid 422 fields separately, with missing-field precedence, and reuses Retry-After messaging for 429', async () => {
    vi.mocked(submitPublicRequest)
      .mockRejectedValueOnce(new ApiError(
        422,
        'Formato inválido',
        undefined,
        undefined,
        undefined,
        ['studentName', 'studentEmail', 'unknownField'],
        ['studentEmail', 'semester', 'anotherUnknownField'],
      ))
      .mockRejectedValueOnce(new ApiError(429, 'Demasiados intentos', undefined, 17))
    render(<PublicAdditionalCreditsPage />)
    completeForm()

    fireEvent.click(screen.getByRole('button', { name: 'Enviar solicitud' }))
    expect(await screen.findAllByText('Este campo es obligatorio.')).toHaveLength(2)
    expect(screen.getAllByText('Revise este campo.')).toHaveLength(1)
    expect(document.getElementById('studentName')?.getAttribute('aria-invalid')).toBe('true')
    expect(document.getElementById('studentEmail')?.getAttribute('aria-invalid')).toBe('true')
    expect(document.getElementById('semester')?.getAttribute('aria-invalid')).toBe('true')
    expect(document.getElementById('unknownField')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Enviar solicitud' }))
    expect(await screen.findByText('Demasiados intentos. Reintente en 17 segundos.')).toBeDefined()
  })

  it('shows a form-level error when a 422 names only unknown fields', async () => {
    vi.mocked(submitPublicRequest).mockRejectedValue(new ApiError(
      422,
      'Formato inválido',
      undefined,
      undefined,
      undefined,
      ['unknownMissing'],
      ['unknownInvalid'],
    ))
    render(<PublicAdditionalCreditsPage />)
    completeForm()

    fireEvent.click(screen.getByRole('button', { name: 'Enviar solicitud' }))

    expect((await screen.findByRole('alert')).textContent).toMatch(/no pudimos identificar los campos/i)
    expect(document.querySelectorAll('[aria-invalid="true"]')).toHaveLength(0)
  })
})
