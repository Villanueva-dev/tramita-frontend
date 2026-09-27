import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import NewRequestPage from './page'
import { listPublicPrograms } from '@/lib/api'

const useTramita = vi.hoisted(() => vi.fn())

vi.mock('@/components/app-shell', () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))
vi.mock('@/lib/store', () => ({ useTramita }))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))
// Mismo parcial que la suite pública: conserva el resto de `@/lib/api` y simula solo el
// catálogo, que es lo que cada prueba controla.
vi.mock('@/lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/api')>()),
  listPublicPrograms: vi.fn(),
}))

const defaultCatalog = [{ name: 'Ingeniería de Sistemas' }, { name: 'Contaduría Pública' }]

beforeEach(() => {
  vi.mocked(listPublicPrograms).mockResolvedValue(defaultCatalog)
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  // Descarta las respuestas `Once` que una prueba dejó sin consumir (convención 2 de
  // revisar-frontend-next/SKILL.md); `clearAllMocks` no lo hace por sí solo.
  vi.mocked(listPublicPrograms).mockReset()
})

/** Espera a que el selector deje de estar deshabilitado, con el catálogo ya resuelto. */
async function waitForProgramCatalogReady() {
  await waitFor(() => {
    expect((document.getElementById('program') as HTMLSelectElement).disabled).toBe(false)
  })
}

/**
 * Completa los campos obligatorios del formulario interno (Datos del estudiante, la primera
 * asignatura y la firma de radicación), sin tocar el selector de programa: cada prueba decide
 * qué hacer con «Sin programa» o con una opción del catálogo. Datos sintéticos.
 */
function fillRequiredFields() {
  fireEvent.change(screen.getByPlaceholderText('Ej. 1090234'), { target: { value: 'EST-0001' } })
  fireEvent.change(screen.getByPlaceholderText('Ej. 1017234567'), { target: { value: '1000000001' } })
  fireEvent.change(screen.getByPlaceholderText('Nombres y apellidos'), { target: { value: 'Estudiante Sintético' } })
  fireEvent.change(screen.getByPlaceholderText('nombre@example.com'), { target: { value: 'estudiante.sintetico@example.test' } })
  fireEvent.change(screen.getByPlaceholderText('Ej. Semestre 7'), { target: { value: '8' } })
  fireEvent.change(screen.getByPlaceholderText('IS-704'), { target: { value: 'IS-000' } })
  fireEvent.change(screen.getByPlaceholderText('Nombre de la materia'), { target: { value: 'Materia sintética' } })
  fireEvent.change(screen.getByPlaceholderText('3'), { target: { value: '3' } })
  fireEvent.change(
    screen.getByPlaceholderText('Describa el motivo de la solicitud y su contexto académico…'),
    { target: { value: 'Justificación sintética con longitud suficiente.' } },
  )
  fireEvent.click(screen.getByRole('checkbox'))
}

function submitForm() {
  fireEvent.click(screen.getByRole('button', { name: /radicar solicitud/i }))
}

describe('NewRequestPage', () => {
  it('renderiza el formulario usando REQUEST_TYPE_LABELS, no el catálogo del store', () => {
    useTramita.mockReturnValue({
      createRequest: vi.fn(),
    })

    render(<NewRequestPage />)

    expect(screen.getByText('Radicar nueva solicitud')).toBeDefined()
    expect(screen.getByText('Adición de Créditos')).toBeDefined()
    expect(screen.getByPlaceholderText('Ej. 1090234')).toBeDefined()
    expect(screen.getByPlaceholderText('Ej. 1017234567')).toBeDefined()
  })

  it('mantiene el formulario sin depender de datos mock de solicitudes', () => {
    useTramita.mockReturnValue({ createRequest: vi.fn() })

    render(<NewRequestPage />)

    expect(screen.getByText('Tipo de trámite')).toBeDefined()
    expect(screen.getByRole('button', { name: /radicar solicitud/i })).toBeDefined()
  })

  // Issue #12: el backend no recibe archivos adjuntos (Request.java, 006 FR-010). El campo
  // se retira, no se deshabilita: un aviso de «no disponible todavía» prometería algo que
  // el backend ya descartó.
  it('no ofrece adjuntar archivos', () => {
    useTramita.mockReturnValue({ createRequest: vi.fn() })

    render(<NewRequestPage />)

    expect(screen.queryByText('Adjuntar documento de soporte')).toBeNull()
    expect(document.querySelector('input[type="file"]')).toBeNull()
  })

  it('arranca con «Sin programa» seleccionado y los nombres del catálogo en el orden recibido', async () => {
    useTramita.mockReturnValue({ createRequest: vi.fn() })

    render(<NewRequestPage />)
    await waitForProgramCatalogReady()

    const select = document.getElementById('program') as HTMLSelectElement
    expect(select.value).toBe('')
    expect(Array.from(select.options).map((option) => option.value)).toEqual([
      '',
      'Ingeniería de Sistemas',
      'Contaduría Pública',
    ])
    expect(select.options[0].text).toBe('Sin programa')
  })

  it('sin elegir programa, pasa program undefined al store, nunca una cadena vacía', async () => {
    const createRequest = vi.fn().mockResolvedValue({ id: 'created-1' })
    useTramita.mockReturnValue({ createRequest, coordinatorName: 'coordinacion@uniremington.edu.co' })

    render(<NewRequestPage />)
    await waitForProgramCatalogReady()
    fillRequiredFields()
    submitForm()

    await waitFor(() => expect(createRequest).toHaveBeenCalled())
    expect(createRequest.mock.calls[0][0].program).toBeUndefined()
  })

  it('un nombre del catálogo con tilde descompuesta y doble espacio llega idéntico al store', async () => {
    const catalogValue = 'Ingeniería  de Sistemas'.normalize('NFD')
    vi.mocked(listPublicPrograms).mockResolvedValueOnce([{ name: catalogValue }])
    const createRequest = vi.fn().mockResolvedValue({ id: 'created-1' })
    useTramita.mockReturnValue({ createRequest, coordinatorName: 'coordinacion@uniremington.edu.co' })

    render(<NewRequestPage />)
    await waitForProgramCatalogReady()
    fireEvent.change(document.getElementById('program') as HTMLSelectElement, { target: { value: catalogValue } })
    fillRequiredFields()
    submitForm()

    await waitFor(() => expect(createRequest).toHaveBeenCalledWith(expect.objectContaining({ program: catalogValue })))
  })

  it.each([
    ['cargando', () => new Promise<{ name: string }[]>(() => {}), 'Cargando el catálogo de programas.'],
    ['en error', () => Promise.reject(new Error('network')), 'El catálogo de programas no está disponible. Puede radicar la solicitud sin programa.'],
    ['con una lista vacía', () => Promise.resolve([]), 'El catálogo de programas no está disponible. Puede radicar la solicitud sin programa.'],
  ])('explica el catálogo %s y permite radicar sin programa', async (_label, catalogImpl, expectedText) => {
    vi.mocked(listPublicPrograms).mockImplementationOnce(catalogImpl)
    const createRequest = vi.fn().mockResolvedValue({ id: 'created-1' })
    useTramita.mockReturnValue({ createRequest, coordinatorName: 'coordinacion@uniremington.edu.co' })

    render(<NewRequestPage />)
    await waitFor(() => expect(document.getElementById('program-catalog-status')?.textContent).toContain(expectedText))
    fillRequiredFields()
    submitForm()

    await waitFor(() => expect(createRequest).toHaveBeenCalled())
    expect(createRequest.mock.calls[0][0].program).toBeUndefined()
  })

  it('«Reintentar» vuelve a pedir el catálogo y muestra sus opciones', async () => {
    vi.mocked(listPublicPrograms)
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce([{ name: 'Ingeniería de Sistemas' }])
    useTramita.mockReturnValue({ createRequest: vi.fn() })

    render(<NewRequestPage />)
    await waitFor(() => expect(document.getElementById('program-catalog-status')?.textContent).toContain('no está disponible'))

    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))

    await waitForProgramCatalogReady()
    expect(Array.from((document.getElementById('program') as HTMLSelectElement).options).map((option) => option.value)).toContain('Ingeniería de Sistemas')
  })
})
