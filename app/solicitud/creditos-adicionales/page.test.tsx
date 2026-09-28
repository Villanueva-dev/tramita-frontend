import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { StrictMode } from 'react'
import PublicAdditionalCreditsPage from './page'
import type { PublicRequestFormValues } from '@/components/do-fr-100/sections'
import { FIELD_STEP, STEPS, type StepId } from '@/components/do-fr-100/steps'
import { ApiError, listPublicPrograms, submitPublicRequest } from '@/lib/api'
import { ACADEMIC_FIELD_OPTIONS, type AcademicListField } from '@/lib/public-request-options'

vi.mock('@/lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/api')>()),
  listPublicPrograms: vi.fn(),
  submitPublicRequest: vi.fn(),
}))

beforeEach(() => {
  vi.mocked(listPublicPrograms).mockResolvedValue([
    { name: 'Programa de Prueba' },
    { name: 'Ingeniería de Sistemas' },
    { name: 'Administración de Empresas' },
  ])
})

afterEach(() => {
  cleanup()
  vi.mocked(listPublicPrograms).mockReset()
  vi.mocked(submitPublicRequest).mockReset()
  vi.restoreAllMocks()
})

const ACADEMIC_LIST_FIELDS: AcademicListField[] = ['campus', 'faculty', 'semester', 'modality']

const completeValues: PublicRequestFormValues = {
  studentName: 'Estudiante Sintético',
  studentDocument: '0000000100',
  studentEmail: 'estudiante.sintetico@example.test',
  studentPhone: '0000000000',
  program: 'Programa de Prueba',
  campus: 'Cali',
  faculty: 'Ingenierías',
  modality: 'Presencial',
  semester: '8',
  reason: 'Solicitud sintética de prueba.',
}

// Encabezado (StepPanel h2) por paso, derivado de la misma fuente que el asistente en vez de
// repetir los rótulos a mano: si `steps.ts` cambia un heading, esta suite lo hereda.
const HEADING_OF = Object.fromEntries(STEPS.map((step) => [step.id, step.heading])) as Record<StepId, string>

/**
 * Escritura a nivel de campo que reproduce lo que un estudiante puede hacer: falla si el campo
 * vive bajo un ancestro `[hidden]`, porque `*ByLabelText`/`getElementById` no filtran por
 * accesibilidad (design.md, Testing Strategy) y una prueba podría escribir en un paso que el
 * estudiante no ve.
 */
function fillField(id: string, value: string) {
  const field = document.getElementById(id)
  if (!field) throw new Error(`No existe el campo #${id}.`)
  if (field.closest('[hidden]')) {
    throw new Error(`El campo #${id} está oculto: el paso visible no lo incluye.`)
  }
  fireEvent.change(field, { target: { value } })
}

function typeFieldCharacterByCharacter(id: string, value: string) {
  const field = document.getElementById(id) as HTMLInputElement | null
  if (!field) throw new Error(`No existe el campo #${id}.`)
  for (const character of value) {
    fireEvent.change(field, { target: { value: field.value + character } })
  }
}

function fillFieldsOfStep(step: 'applicant' | 'academic' | 'reason', values: PublicRequestFormValues) {
  for (const field of Object.keys(values) as (keyof PublicRequestFormValues)[]) {
    if (FIELD_STEP[field] === step) fillField(field, values[field])
  }
}

/** Espera el catálogo real simulado; nunca habilita el selector ni fabrica opciones en la prueba. */
async function waitForProgramCatalog(expectedProgram = completeValues.program) {
  await waitFor(() => {
    const program = document.getElementById('program') as HTMLSelectElement
    expect(program.disabled).toBe(false)
    expect(Array.from(program.options).map((option) => option.value)).toContain(expectedProgram)
  })
}

async function fillAcademicFields(values: PublicRequestFormValues, expectedProgram = completeValues.program) {
  await waitForProgramCatalog(expectedProgram)
  fillFieldsOfStep('academic', values)
}

/** Asevera que el paso visible es el que titula `headingName`; excluye ancestros `hidden`. */
function expectStep(headingName: string) {
  expect(screen.getByRole('heading', { level: 2, name: headingName })).toBeDefined()
}

function clickContinue() {
  fireEvent.click(screen.getByRole('button', { name: 'Continuar' }))
}

/** Pulsa «Continuar» y confirma que el paso siguiente, titulado `headingName`, quedó visible. */
function continueTo(headingName: string) {
  clickContinue()
  expectStep(headingName)
}

function signCanvas() {
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

/** Llena y avanza «Sus datos» → «Datos académicos» → «Motivo de la solicitud», y llega a «Firma». */
async function reachSignatureStep(values: PublicRequestFormValues = completeValues) {
  fillFieldsOfStep('applicant', values)
  continueTo(HEADING_OF.academic)
  await fillAcademicFields(values, values.program)
  continueTo(HEADING_OF.reason)
  fillFieldsOfStep('reason', values)
  continueTo(HEADING_OF.signature)
}

// Nivel estudiante: recorre los cinco pasos con navegación real («Continuar» valida cada uno) y
// llega a la revisión. Reemplaza el helper de una sola página de la Slice 2 (tarea 4.5).
async function fillPublicRequestForm(values: PublicRequestFormValues) {
  await reachSignatureStep(values)
  signCanvas()
  continueTo(HEADING_OF.review)
}

async function reachReview(values: PublicRequestFormValues = completeValues) {
  await fillPublicRequestForm(values)
}

function submitForm() {
  fireEvent.click(screen.getByRole('button', { name: 'Enviar solicitud' }))
}

/**
 * Llena hasta (sin incluir) el paso de `field`, con `value` en ese campo y el resto de
 * `completeValues`; deja al estudiante parado en el paso de `field`, sin pulsar «Continuar» ahí
 * todavía, para que la prueba decida qué aserta tras el intento fallido.
 */
async function reachStepWithOverride(field: keyof PublicRequestFormValues, value: string) {
  const values: PublicRequestFormValues = { ...completeValues, [field]: value }
  const step = FIELD_STEP[field]

  fillFieldsOfStep('applicant', values)
  if (step === 'applicant') return
  continueTo(HEADING_OF.academic)

  await fillAcademicFields(values, field === 'program' && value.trim() ? value : completeValues.program)
  if (step === 'academic') return
  continueTo(HEADING_OF.reason)

  fillFieldsOfStep('reason', values)
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

  it('explains loading and keeps the required program selector disabled until the public catalog arrives', () => {
    vi.mocked(listPublicPrograms).mockImplementationOnce(() => new Promise(() => {}))
    render(<PublicAdditionalCreditsPage />)

    expect(screen.getByText('Cargando el catálogo de programas.')).toBeDefined()
    expect((document.getElementById('program') as HTMLSelectElement).disabled).toBe(true)
  })

  it('renders public catalog options without choosing one from the response order', async () => {
    vi.mocked(listPublicPrograms).mockResolvedValueOnce([
      { name: 'Zoología' },
      { name: 'Administración de Empresas' },
    ])
    render(<PublicAdditionalCreditsPage />)

    await waitFor(() => expect(
      Array.from((document.getElementById('program') as HTMLSelectElement).options).map((option) => option.text),
    ).toContain('Zoología'))
    const program = document.getElementById('program') as HTMLSelectElement
    expect(program.value).toBe('')
    expect(program.disabled).toBe(false)
  })

  it('keeps the selected catalog value byte-for-byte through review and submission', async () => {
    const catalogValue = 'Programa  con espacios'
    vi.mocked(listPublicPrograms).mockResolvedValueOnce([{ name: catalogValue }])
    vi.mocked(submitPublicRequest).mockResolvedValue({ message: 'Tu solicitud llegó a la Coordinación.' })
    const values = { ...completeValues, program: catalogValue }
    render(<PublicAdditionalCreditsPage />)
    await reachReview(values)
    expect((document.getElementById('program') as HTMLSelectElement).value).toBe(catalogValue)
    expect(Array.from(document.querySelectorAll('dd')).map((value) => value.textContent)).toContain(catalogValue)

    submitForm()

    await waitFor(() => expect(submitPublicRequest).toHaveBeenCalledWith(
      'ADICION_CREDITOS', expect.objectContaining({ program: catalogValue }),
    ))
  })

  it('blocks program selection after a catalog failure and retries without losing entered values', async () => {
    vi.mocked(listPublicPrograms)
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce([{ name: 'Ingeniería de Sistemas' }])
    render(<PublicAdditionalCreditsPage />)
    fillField('studentName', completeValues.studentName)

    await waitFor(() => expect(document.getElementById('program-catalog-status')?.textContent).toContain('No pudimos cargar el catálogo de programas'))
    expect((document.getElementById('program') as HTMLSelectElement).disabled).toBe(true)
    fireEvent.click(Array.from(document.querySelectorAll('button')).find((button) => button.textContent === 'Reintentar')!)

    await waitFor(() => expect(
      Array.from((document.getElementById('program') as HTMLSelectElement).options).map((option) => option.text),
    ).toContain('Ingeniería de Sistemas'))
    expect((document.getElementById('studentName') as HTMLInputElement).value).toBe(completeValues.studentName)
  })

  it('ignores an older catalog response after StrictMode replays the loading effect', async () => {
    let resolveOlderCatalog!: (programs: { name: string }[]) => void
    let resolveNewerCatalog!: (programs: { name: string }[]) => void
    vi.mocked(listPublicPrograms)
      .mockImplementationOnce(() => new Promise((resolve) => { resolveOlderCatalog = resolve }))
      .mockImplementationOnce(() => new Promise((resolve) => { resolveNewerCatalog = resolve }))

    render(<StrictMode><PublicAdditionalCreditsPage /></StrictMode>)
    await waitFor(() => expect(listPublicPrograms).toHaveBeenCalledTimes(2))
    resolveNewerCatalog([{ name: 'Programa vigente' }])

    await waitFor(() => expect(Array.from((document.getElementById('program') as HTMLSelectElement).options).map((option) => option.value)).toContain('Programa vigente'))
    resolveOlderCatalog([{ name: 'Programa obsoleto' }])
    await new Promise((resolve) => setTimeout(resolve, 0))

    await waitFor(() => {
      const options = Array.from((document.getElementById('program') as HTMLSelectElement).options).map((option) => option.value)
      expect(options).toContain('Programa vigente')
      expect(options).not.toContain('Programa obsoleto')
      expect(screen.queryByText('No pudimos cargar el catálogo de programas. Inténtelo de nuevo.')).toBeNull()
    })
  })

  it('shows the brand logo and the official form code in the header', () => {
    render(<PublicAdditionalCreditsPage />)

    expect(screen.getByAltText('Trámita Universidad Remington')).toBeDefined()
    expect(screen.getByText('Formato DO-FR-100')).toBeDefined()
  })

  it('offers the institutional WhatsApp contact as text and as a new-tab link inside a native Ayuda disclosure', () => {
    render(<PublicAdditionalCreditsPage />)

    expect(document.querySelector('details > summary')?.textContent).toBe('Ayuda')
    expect(screen.getByText('+57 315 2966601')).toBeDefined()
    const link = document.querySelector('a[href="https://wa.me/573152966601"]')
    expect(link).not.toBeNull()
    expect(link?.getAttribute('target')).toBe('_blank')
    expect(link?.getAttribute('rel')).toBe('noopener noreferrer')
  })

  it('does not show a per-step error notice when the visible step has no errors', () => {
    render(<PublicAdditionalCreditsPage />)

    expect(screen.queryByText(/faltan?\s+\d+\s+campos?\s+por\s+corregir/i)).toBeNull()
  })

  it('shows a per-step notice listing the missing fields when Continuar fails, without duplicating the field alerts as a live region', () => {
    render(<PublicAdditionalCreditsPage />)

    clickContinue()

    const notice = screen.getByText(/Faltan 4 campos por corregir en este paso/i)
    expect(notice.getAttribute('role')).toBeNull()
    expect(notice.getAttribute('aria-live')).toBeNull()
    expect(notice.textContent).toContain('Nombres completos del solicitante')
    expect(notice.textContent).toContain('Correo electrónico')
    // Los avisos de campo (role="alert") no se duplican ni se reemplazan por el aviso del paso.
    expect(screen.getAllByRole('alert')).toHaveLength(4)
  })

  it('guards the complete public-request boundary from AppShell and request-store dependencies', () => {
    const sources = publicRequestFeatureSource()

    expect(sources.map(({ path }) => path).sort()).toEqual([
      'app/solicitud/creditos-adicionales/page.tsx',
      'components/do-fr-100/review-summary.tsx',
      'components/do-fr-100/sections.tsx',
      'components/do-fr-100/steps.ts',
      'components/do-fr-100/wizard.tsx',
      'components/firma/canvas-firma.tsx',
    ])

    for (const { source } of sources) {
      expect(source).not.toMatch(/app-shell|useTramita|['"]@\/lib\/store['"]/i)
    }
  })

  it('keeps the official blocks and field labels in form order across the wizard steps', async () => {
    render(<PublicAdditionalCreditsPage />)

    const placeAndDate = screen.getByText('Lugar y fecha')
    const requestType = screen.getByText('Tipo de solicitud')
    expect(placeAndDate.compareDocumentPosition(requestType) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()

    expectStep('Datos del solicitante')
    expect(screen.getByLabelText('Nombres completos del solicitante').id).toBe('studentName')
    expect(screen.getByLabelText('Número de identificación').id).toBe('studentDocument')
    expect(screen.getByLabelText('Correo electrónico').id).toBe('studentEmail')
    expect(screen.getByLabelText('Número de contacto').id).toBe('studentPhone')
    fillFieldsOfStep('applicant', completeValues)

    continueTo('Datos académicos')
    expect(screen.getByLabelText('Programa académico en el que se encuentra').id).toBe('program')
    expect(screen.getByLabelText('Sede').id).toBe('campus')
    expect(screen.getByLabelText('Facultad').id).toBe('faculty')
    expect(screen.getByLabelText('Semestre cursado y aprobado').id).toBe('semester')
    expect(screen.getByLabelText('Modalidad').id).toBe('modality')
    const semester = screen.getByLabelText('Semestre cursado y aprobado')
    const modality = screen.getByLabelText('Modalidad')
    expect(semester.compareDocumentPosition(modality) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    await fillAcademicFields(completeValues)

    continueTo('Motivo de la solicitud')
    expect(screen.getByText('Compromisos adquiridos', { selector: '[data-slot="card-title"]' })).toBeDefined()
    expect(screen.getByLabelText('Compromisos adquiridos').id).toBe('reason')
    fillFieldsOfStep('reason', completeValues)

    continueTo('Firma del solicitante')
  })

  it('guards the request type against checkboxes and keeps program as the only selector fed by the catalog', async () => {
    render(<PublicAdditionalCreditsPage />)

    expect(screen.getByText('Matrícula créditos adicionales')).toBeDefined()
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0)
    fillFieldsOfStep('applicant', completeValues)
    continueTo(HEADING_OF.academic)
    await waitForProgramCatalog()
    // Programa (catálogo) más sede, facultad, semestre y modalidad (listas cerradas propias).
    expect(screen.getAllByRole('combobox')).toHaveLength(5)
    expect(screen.getByRole('combobox', { name: 'Programa académico en el que se encuentra' }).id).toBe('program')
    const program = document.getElementById('program') as HTMLSelectElement
    expect(Array.from(program.options).map((option) => option.value)).toContain('Ingeniería de Sistemas')
    for (const field of ACADEMIC_LIST_FIELDS) {
      const select = document.getElementById(field) as HTMLSelectElement
      expect(Array.from(select.options).map((option) => option.value)).not.toContain('Ingeniería de Sistemas')
    }
  })

  it('guards the exact contract fields and one extensive textarea, across all mounted steps', () => {
    // Los cinco pasos están siempre montados (D2): esta consulta cruda no filtra por `hidden`, así
    // que ve los campos de los cinco a la vez. Se acota a `input, textarea, select` — no a
    // `button` — porque el asistente agrega controles de navegación (Continuar, Volver, Cambiar)
    // legítimos que no son parte del contrato de once campos que esta prueba vigila.
    render(<PublicAdditionalCreditsPage />)

    const controls = Array.from(document.querySelectorAll('input, textarea, select'))
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
    ])
    expect(controls.filter((control) => /asignatura|subject|credit/i.test(control.id || control.getAttribute('name') || ''))).toHaveLength(0)
    expect(document.querySelectorAll('textarea')).toHaveLength(1)
    expect(document.querySelector('textarea')?.id).toBe('reason')
  })

  it('integrates the canvas and keyboard-operable image alternative inside an accurately named figure', async () => {
    render(<PublicAdditionalCreditsPage />)
    await reachSignatureStep()

    const signatureFigure = screen.getByRole('figure', { name: 'Firma del solicitante' })
    expect(screen.queryByRole('figure', { name: 'Espacio para firma' })).toBeNull()
    expect(screen.getByLabelText('Área para dibujar la firma')).toBe(signatureFigure.querySelector('canvas'))
    expect(screen.getByLabelText('Cargar una imagen de firma')).toBe(signatureFigure.querySelector('input[type="file"]'))
    expect(screen.getByRole('button', { name: 'Borrar y firmar de nuevo' })).toBeDefined()
  })

  it('renders the submit control with the design-system button and a 52 px touch target on review', async () => {
    render(<PublicAdditionalCreditsPage />)
    await reachReview()

    const submit = screen.getByRole('button', { name: 'Enviar solicitud' })
    // `data-slot` lo pone components/ui/button.tsx: distingue el componente del proyecto
    // de un <button> crudo. jsdom no calcula layout, así que la altura se verifica sobre
    // la clase declarada (h-13 = 52 px, el mínimo que invoca design.md, decisión 8), no medida.
    expect(submit.getAttribute('data-slot')).toBe('button')
    expect(submit.className).toContain('h-13')
  })

  it('advances to the next step when Continuar is pressed on a valid step', () => {
    render(<PublicAdditionalCreditsPage />)
    fillFieldsOfStep('applicant', completeValues)

    continueTo('Datos académicos')
  })

  it('preserves spaces while a single-line value is typed character by character', () => {
    render(<PublicAdditionalCreditsPage />)

    typeFieldCharacterByCharacter('studentName', 'Estudiante Sintético')

    expect((document.getElementById('studentName') as HTMLInputElement).value).toBe('Estudiante Sintético')
  })

  it('keeps typed values when Volver is pressed and the student returns to the step', () => {
    render(<PublicAdditionalCreditsPage />)
    fillFieldsOfStep('applicant', { ...completeValues, studentName: 'Nombre Provisional' })
    continueTo('Datos académicos')

    fireEvent.click(screen.getByRole('button', { name: 'Volver' }))
    expectStep('Datos del solicitante')

    expect((document.getElementById('studentName') as HTMLInputElement).value).toBe('Nombre Provisional')
  })

  it('does not change the step when a progress-bar item is clicked', () => {
    render(<PublicAdditionalCreditsPage />)
    fillFieldsOfStep('applicant', completeValues)
    continueTo('Datos académicos')

    fireEvent.click(screen.getByText('Sus datos'))

    expectStep('Datos académicos')
  })

  it('walks the following steps with Continuar after Cambiar, keeps the signature, and reaches review again', async () => {
    vi.mocked(submitPublicRequest).mockResolvedValue({ message: 'Tu solicitud llegó a la Coordinación.' })
    render(<PublicAdditionalCreditsPage />)
    await reachReview()

    fireEvent.click(screen.getByRole('button', { name: 'Cambiar Datos académicos' }))
    expectStep('Datos académicos')
    expect(document.activeElement).toBe(screen.getByRole('heading', { level: 2, name: 'Datos académicos' }))

    continueTo('Motivo de la solicitud')
    continueTo('Firma del solicitante')
    expect(screen.getByLabelText('Área para dibujar la firma')).toBeDefined()
    continueTo('Revisar y enviar')

    submitForm()

    await waitFor(() => expect(submitPublicRequest).toHaveBeenCalledWith(
      'ADICION_CREDITOS',
      expect.objectContaining({ signature: 'data:image/png;base64,c2ludGV0aWM=' }),
    ))
  })

  it('keeps the drawn signature after Volver and forward again to the signature step', async () => {
    render(<PublicAdditionalCreditsPage />)
    await reachSignatureStep()
    signCanvas()

    fireEvent.click(screen.getByRole('button', { name: 'Volver' }))
    expectStep('Motivo de la solicitud')

    continueTo('Firma del solicitante')
    // Si CanvasFirma se hubiera desmontado, quedaría sin firma y este Continuar no avanzaría.
    continueTo('Revisar y enviar')
  })

  it('does not move focus on load, then moves it to the new heading on Continuar and Volver', () => {
    render(<PublicAdditionalCreditsPage />)
    expect(document.activeElement).toBe(document.body)

    fillFieldsOfStep('applicant', completeValues)
    continueTo('Datos académicos')
    expect(document.activeElement).toBe(screen.getByRole('heading', { level: 2, name: 'Datos académicos' }))

    fireEvent.click(screen.getByRole('button', { name: 'Volver' }))
    expect(document.activeElement).toBe(screen.getByRole('heading', { level: 2, name: 'Datos del solicitante' }))
  })

  it('advances on the implicit submission of a step-1 field without sending the request', () => {
    render(<PublicAdditionalCreditsPage />)
    fillFieldsOfStep('applicant', completeValues)

    const form = document.getElementById('studentName')?.closest('form') as HTMLFormElement
    fireEvent.submit(form)

    expectStep('Datos académicos')
    expect(vi.mocked(submitPublicRequest)).not.toHaveBeenCalled()
  })

  it.each(Object.keys(completeValues).filter((field) => !ACADEMIC_LIST_FIELDS.includes(field as AcademicListField)))('blocks Continuar and marks %s invalid when it is blank after trim', async (field) => {
    render(<PublicAdditionalCreditsPage />)
    await reachStepWithOverride(field as keyof PublicRequestFormValues, '   ')

    clickContinue()

    expect(document.getElementById(field)?.getAttribute('aria-invalid')).toBe('true')
    expect(vi.mocked(submitPublicRequest)).not.toHaveBeenCalled()
  })

  it('does not advance and focuses the first invalid field when Continuar fails on a step', () => {
    render(<PublicAdditionalCreditsPage />)
    fillFieldsOfStep('applicant', { ...completeValues, studentName: '   ' })

    clickContinue()

    expectStep('Datos del solicitante')
    expect(document.activeElement).toBe(document.getElementById('studentName'))
  })

  it('keeps the signature step and moves focus to its heading when Continuar is pressed without a signature', async () => {
    render(<PublicAdditionalCreditsPage />)
    await reachSignatureStep()

    clickContinue()

    expectStep('Firma del solicitante')
    expect(screen.getByText('La firma es obligatoria.')).toBeDefined()
    expect(document.activeElement).toBe(screen.getByRole('heading', { level: 2, name: 'Firma del solicitante' }))
    expect(vi.mocked(submitPublicRequest)).not.toHaveBeenCalled()
  })

  it.each([
    ['sin arroba', 'nombresinarroba.test'],
    ['sin dominio', 'nombre@'],
    ['sin sufijo de dominio', 'nombre@dominio'],
  ])('blocks Continuar when studentEmail is %s', (_label, email) => {
    render(<PublicAdditionalCreditsPage />)
    fillFieldsOfStep('applicant', { ...completeValues, studentEmail: email })

    clickContinue()

    expectStep('Datos del solicitante')
    expect(document.getElementById('studentEmail')?.getAttribute('aria-invalid')).toBe('true')
    expect(vi.mocked(submitPublicRequest)).not.toHaveBeenCalled()
  })

  it.each([
    ['personal', 'nombre@gmail.com'],
    ['institucional', 'nombre@uniremington.edu.co'],
  ])('accepts a well-formed %s email address', (_label, studentEmail) => {
    render(<PublicAdditionalCreditsPage />)
    fillFieldsOfStep('applicant', { ...completeValues, studentEmail })

    continueTo(HEADING_OF.academic)
  })

  it('normalizes single-line values before review and submission while preserving reason byte-for-byte', async () => {
    vi.mocked(submitPublicRequest).mockResolvedValue({ message: 'Tu solicitud llegó a la Coordinación.' })
    const values: PublicRequestFormValues = {
      ...completeValues,
      studentName: '  Estudiante   Sintético  ',
      studentEmail: '  estudiante.sintetico@example.test  ',
      program: completeValues.program,
      reason: '  Conserva   todos los espacios\n  y saltos.  ',
    }
    render(<PublicAdditionalCreditsPage />)
    await fillPublicRequestForm(values)

    expect((document.getElementById('studentName') as HTMLInputElement).value).toBe('Estudiante Sintético')
    expect((document.getElementById('reason') as HTMLTextAreaElement).value).toBe(values.reason)

    submitForm()

    await waitFor(() => expect(submitPublicRequest).toHaveBeenCalledWith(
      'ADICION_CREDITOS',
      expect.objectContaining({
        studentName: 'Estudiante Sintético',
        studentEmail: 'estudiante.sintetico@example.test',
        program: completeValues.program,
        reason: values.reason,
      }),
    ))
  })

  it.each([
    ['studentName', 121], ['studentDocument', 21], ['studentEmail', 256], ['studentPhone', 11],
    ['program', 121], ['reason', 2001],
  ])('blocks Continuar for %s over its contract limit', async (field, length) => {
    const overLimitValue = field === 'studentDocument' || field === 'studentPhone'
      ? '1'.repeat(length)
      : 'a'.repeat(length)
    if (field === 'program') vi.mocked(listPublicPrograms).mockResolvedValueOnce([{ name: overLimitValue }])
    render(<PublicAdditionalCreditsPage />)
    // La cédula y el teléfono son numéricos: con dígitos, el caso falla por longitud (lo que
    // se quiere probar) y no por formato, que el filtro de tecleo ya vuelve inalcanzable.
    await reachStepWithOverride(field as keyof PublicRequestFormValues, overLimitValue)

    clickContinue()

    expect(document.getElementById(field)?.getAttribute('aria-invalid')).toBe('true')
    expect(vi.mocked(submitPublicRequest)).not.toHaveBeenCalled()
  })

  describe('academic fields from closed lists', () => {
    async function reachAcademicStep() {
      render(<PublicAdditionalCreditsPage />)
      fillFieldsOfStep('applicant', completeValues)
      continueTo(HEADING_OF.academic)
      await waitForProgramCatalog()
    }

    it.each(ACADEMIC_LIST_FIELDS)('renders %s as a required select offering exactly its list after a disabled placeholder', async (field) => {
      await reachAcademicStep()

      const select = document.getElementById(field) as HTMLSelectElement
      expect(select.tagName).toBe('SELECT')
      expect(select.required).toBe(true)
      const [placeholder, ...options] = Array.from(select.options)
      expect(placeholder.value).toBe('')
      expect(placeholder.disabled).toBe(true)
      expect(options.map((option) => option.value)).toEqual([...ACADEMIC_FIELD_OPTIONS[field]])
      expect(options.map((option) => option.textContent)).toEqual([...ACADEMIC_FIELD_OPTIONS[field]])
    })

    it('preselects the campus only because its list has a single option and leaves the rest unselected', async () => {
      await reachAcademicStep()

      expect(ACADEMIC_FIELD_OPTIONS.campus).toHaveLength(1)
      expect((document.getElementById('campus') as HTMLSelectElement).value).toBe('Cali')
      for (const field of ['faculty', 'semester', 'modality'] as const) {
        expect((document.getElementById(field) as HTMLSelectElement).value).toBe('')
      }
    })

    it.each(['faculty', 'semester', 'modality'] as const)('blocks Continuar and marks %s invalid when it is left unselected', async (field) => {
      render(<PublicAdditionalCreditsPage />)
      await reachStepWithOverride(field, '')

      clickContinue()

      expectStep(HEADING_OF.academic)
      expect(document.getElementById(field)?.getAttribute('aria-invalid')).toBe('true')
      expect(document.getElementById(`${field}-error`)).not.toBeNull()
      expect(vi.mocked(submitPublicRequest)).not.toHaveBeenCalled()
    })

    it('sends the chosen values exactly as listed', async () => {
      vi.mocked(submitPublicRequest).mockResolvedValue({ message: 'Tu solicitud llegó a la Coordinación.' })
      render(<PublicAdditionalCreditsPage />)
      await reachReview({
        ...completeValues,
        faculty: 'Ciencias de la Salud',
        semester: '12',
        modality: 'Virtual',
      })

      submitForm()

      await waitFor(() => expect(submitPublicRequest).toHaveBeenCalledWith(
        'ADICION_CREDITOS',
        expect.objectContaining({
          campus: 'Cali',
          faculty: 'Ciencias de la Salud',
          semester: '12',
          modality: 'Virtual',
        }),
      ))
    })

    it('gives the four selects the same reading height and text size as the program selector', async () => {
      await reachAcademicStep()

      for (const field of ACADEMIC_LIST_FIELDS) {
        const select = document.getElementById(field) as HTMLSelectElement
        expect(select.className).toContain('h-13')
        expect(select.className).toContain('text-[1.0625rem]')
      }
    })
  })

  it('sends the unchanged semester and replaces the form with an in-place receipt on 201', async () => {
    vi.mocked(submitPublicRequest).mockResolvedValue({ message: 'Tu solicitud llegó a la Coordinación.' })
    render(<PublicAdditionalCreditsPage />)
    await reachReview()

    submitForm()

    await waitFor(() => expect(submitPublicRequest).toHaveBeenCalledWith(
      'ADICION_CREDITOS', expect.objectContaining({ semester: '8' }),
    ))
    expect(screen.queryByRole('button', { name: 'Enviar solicitud' })).toBeNull()
    expect(screen.getByText(/coordinación responderá al correo/i)).toBeDefined()
    expect(screen.queryByText(/estado|radicado|identificador/i)).toBeNull()
    // El acuse destaca el correo diligenciado, sin reiniciar el estado (design.md, decisión 8).
    const highlightedEmail = screen.getByText(completeValues.studentEmail)
    expect(highlightedEmail.tagName).toBe('STRONG')
  })

  it('gives the exact 413 wording pointing to redo the signature, replacing the retired "Límpiela" phrasing', async () => {
    vi.mocked(submitPublicRequest).mockRejectedValue(new ApiError(413, 'Payload Too Large'))
    render(<PublicAdditionalCreditsPage />)
    await reachReview()

    submitForm()

    expect(await screen.findByText('La firma es demasiado pesada. Bórrela y fírmela de nuevo.')).toBeDefined()
  })

  it.each([
    [404, 'Este enlace no está disponible'],
    [413, 'La firma es demasiado pesada'],
  ])('keeps entered data and gives the specified message for %s, without leaving the review step', async (status, message) => {
    vi.mocked(submitPublicRequest).mockRejectedValue(new ApiError(status, 'Problema'))
    render(<PublicAdditionalCreditsPage />)
    await reachReview()

    submitForm()

    expect(await screen.findByText(message, { exact: false })).toBeDefined()
    expectStep('Revisar y enviar')
    // El nombre accesible de «Cambiar» usa el encabezado del bloque (`heading`), no el rótulo
    // corto de la barra (`label`): para el primer paso son textos distintos («Datos del
    // solicitante» frente a «Sus datos», design.md decisión 6).
    fireEvent.click(screen.getByRole('button', { name: 'Cambiar Datos del solicitante' }))
    expect((document.getElementById('studentName') as HTMLInputElement).value).toBe(completeValues.studentName)
  })

  it('offers Ir a la firma on a 413 and it navigates to the signature step', async () => {
    vi.mocked(submitPublicRequest).mockRejectedValue(new ApiError(413, 'Payload Too Large'))
    render(<PublicAdditionalCreditsPage />)
    await reachReview()

    submitForm()

    const shortcut = await screen.findByRole('button', { name: 'Ir a la firma' })
    fireEvent.click(shortcut)

    expectStep('Firma del solicitante')
  })

  it('maps missing and invalid 422 fields separately, jumps to the first step with errors, focuses its first invalid field, marks the bar, and reuses Retry-After messaging for 429', async () => {
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
    await reachReview()

    submitForm()
    expect(await screen.findAllByText('Este campo es obligatorio.')).toHaveLength(2)
    expect(screen.getAllByText('Revise este campo.')).toHaveLength(1)
    expectStep('Datos del solicitante')
    expect(document.activeElement).toBe(document.getElementById('studentName'))
    expect(document.getElementById('studentName')?.getAttribute('aria-invalid')).toBe('true')
    expect(document.getElementById('studentEmail')?.getAttribute('aria-invalid')).toBe('true')
    expect(document.getElementById('unknownField')).toBeNull()

    const progressItems = screen.getAllByRole('listitem')
    expect(progressItems.find((item) => item.textContent?.includes('Sus datos'))?.getAttribute('data-error')).toBe('true')
    expect(progressItems.find((item) => item.textContent?.includes('Datos académicos'))?.getAttribute('data-error')).toBe('true')
    expect(progressItems.find((item) => item.textContent?.includes('Motivo de la solicitud'))?.getAttribute('data-error')).toBeNull()
    expect(progressItems.find((item) => item.textContent?.includes('Firma'))?.getAttribute('data-error')).toBeNull()

    fillField('studentName', completeValues.studentName)
    fillField('studentEmail', completeValues.studentEmail)
    continueTo('Datos académicos')
    expect(document.getElementById('semester')?.getAttribute('aria-invalid')).toBe('true')
    fillField('semester', completeValues.semester)
    continueTo('Motivo de la solicitud')
    continueTo('Firma del solicitante')
    continueTo('Revisar y enviar')

    submitForm()
    expect(await screen.findByText('Demasiados intentos. Reintente en 17 segundos.')).toBeDefined()
    expectStep('Revisar y enviar')
  })

  it('shows a form-level error when a 422 names only unknown fields, without leaving the review step', async () => {
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
    await reachReview()

    submitForm()

    expect((await screen.findByRole('alert')).textContent).toMatch(/no pudimos identificar los campos/i)
    expectStep('Revisar y enviar')
    expect(document.querySelectorAll('[aria-invalid="true"]')).toHaveLength(0)
  })

  it('strips every non-digit character from studentDocument and studentPhone, even when pasted', () => {
    render(<PublicAdditionalCreditsPage />)

    fireEvent.change(document.getElementById('studentDocument') as HTMLInputElement, { target: { value: '12.345-678 90' } })
    fireEvent.change(document.getElementById('studentPhone') as HTMLInputElement, { target: { value: '12.345-678 90' } })

    expect((document.getElementById('studentDocument') as HTMLInputElement).value).toBe('1234567890')
    expect((document.getElementById('studentPhone') as HTMLInputElement).value).toBe('1234567890')
  })

  it.each([
    ['nine digits, one short', '1'.repeat(9)],
    ['eleven digits, one over', '1'.repeat(11)],
  ])('blocks Continuar when studentPhone has %s and shows the ten-digit message', async (_label, phone) => {
    render(<PublicAdditionalCreditsPage />)
    await reachStepWithOverride('studentPhone', phone)

    clickContinue()

    expect(document.getElementById('studentPhone')?.getAttribute('aria-invalid')).toBe('true')
    expect(vi.mocked(submitPublicRequest)).not.toHaveBeenCalled()
    expect(screen.getByText('El número debe tener 10 dígitos, sin espacios. Por ejemplo: 3001234567')).toBeDefined()
  })

  it('marks studentDocument and studentPhone as numeric inputs with a linked hint', () => {
    render(<PublicAdditionalCreditsPage />)

    const documentInput = document.getElementById('studentDocument') as HTMLInputElement
    const phoneInput = document.getElementById('studentPhone') as HTMLInputElement

    expect(documentInput.getAttribute('inputmode')).toBe('numeric')
    expect(phoneInput.getAttribute('inputmode')).toBe('numeric')
    expect(documentInput.getAttribute('aria-describedby')).toContain('studentDocument-hint')
    expect(phoneInput.getAttribute('aria-describedby')).toContain('studentPhone-hint')
    expect(document.getElementById('studentDocument-hint')?.textContent).toBe('Solo números, sin puntos ni espacios.')
    expect(document.getElementById('studentPhone-hint')?.textContent).toBe('10 dígitos, sin espacios.')
  })

  it.each([
    ['studentName', 'applicant'],
    ['studentEmail', 'applicant'],
    ['program', 'academic'],
    ['reason', 'reason'],
  ] as [keyof PublicRequestFormValues, 'applicant' | 'academic' | 'reason'][])(
    'links a synthetic example hint to %s via aria-describedby',
    async (field, step) => {
      render(<PublicAdditionalCreditsPage />)
      if (step !== 'applicant') {
        fillFieldsOfStep('applicant', completeValues)
        continueTo(HEADING_OF.academic)
      }
      if (step === 'reason') {
        await fillAcademicFields(completeValues)
        continueTo(HEADING_OF.reason)
      }

      const input = document.getElementById(field)
      const hintId = `${field}-hint`
      expect(input?.getAttribute('aria-describedby')).toContain(hintId)
      const hint = document.getElementById(hintId)
      expect(hint?.textContent).toMatch(field === 'program' ? /^Seleccione un programa del catálogo\.$/ : /^Por ejemplo:/)
    },
  )

  it('gives text inputs a 52 px minimum touch height, matching the wizard navigation buttons', () => {
    // Mismo patrón ya aceptado para los botones (h-11/h-13, jsdom no calcula layout): se lee la
    // clase declarada porque no hay otra forma de comprobar la altura mínima táctil en jsdom.
    render(<PublicAdditionalCreditsPage />)

    expect((document.getElementById('studentName') as HTMLInputElement).className).toContain('h-13')
  })

  it('renders labels, inputs and the textarea at the 17 px reading size, in rem so the browser font preference still scales it', async () => {
    // La propuesta pide letra de 17 px; `Input`, `Label` y `Textarea` fijan `text-sm` (14 px), así
    // que el tamaño del `<main>` no les llega. Se aplica en los puntos de uso y en rem
    // (1.0625rem = 17 px con la raíz por omisión de 16 px): un valor en px ignoraría el tamaño
    // de letra que el estudiante configure en su navegador. jsdom no calcula layout: se lee la
    // clase declarada, como en las pruebas de altura táctil.
    render(<PublicAdditionalCreditsPage />)

    expect(document.querySelector('main')?.className).toContain('text-[1.0625rem]')
    expect(document.getElementById('studentName')?.className).toContain('text-[1.0625rem]')
    expect(document.querySelector('label[for="studentName"]')?.className).toContain('text-[1.0625rem]')

    fillFieldsOfStep('applicant', completeValues)
    continueTo('Datos académicos')
    await fillAcademicFields(completeValues)
    continueTo('Motivo de la solicitud')

    expect(document.getElementById('reason')?.className).toContain('text-[1.0625rem]')
    expect(document.querySelector('label[for="reason"]')?.className).toContain('text-[1.0625rem]')
  })

  it('shows a character counter for Compromisos adquiridos that reflects what was typed, not a fixed count', async () => {
    render(<PublicAdditionalCreditsPage />)
    fillFieldsOfStep('applicant', completeValues)
    continueTo('Datos académicos')
    await fillAcademicFields(completeValues)
    continueTo('Motivo de la solicitud')

    expect(screen.getByText('0 de 2000 caracteres')).toBeDefined()

    fillField('reason', 'Compromiso sintético de prueba.')

    expect(screen.getByText('31 de 2000 caracteres')).toBeDefined()
    expect(screen.queryByText('0 de 2000 caracteres')).toBeNull()
  })

  it('leaves studentDocument and studentPhone without a raw maxLength, so a pasted value keeps all its digits', () => {
    // El navegador recorta al maxLength el texto crudo, separadores incluidos, antes del filtro:
    // con maxLength=10, pegar «300 123 4567» dejaba 8 dígitos (observado en Chrome). jsdom no
    // aplica ese recorte, así que se fija la ausencia del atributo.
    render(<PublicAdditionalCreditsPage />)

    expect(document.getElementById('studentDocument')?.hasAttribute('maxlength')).toBe(false)
    expect(document.getElementById('studentPhone')?.hasAttribute('maxlength')).toBe(false)
  })

  it('sends studentDocument and studentPhone as digit-only strings in the request body', async () => {
    vi.mocked(submitPublicRequest).mockResolvedValue({ message: 'Tu solicitud llegó a la Coordinación.' })
    render(<PublicAdditionalCreditsPage />)
    await fillPublicRequestForm({ ...completeValues, studentDocument: '00.000.010-0', studentPhone: '000 000-0100' })

    submitForm()

    await waitFor(() => expect(submitPublicRequest).toHaveBeenCalledWith(
      'ADICION_CREDITOS',
      expect.objectContaining({ studentDocument: '000000100', studentPhone: '0000000100' }),
    ))
  })
})
