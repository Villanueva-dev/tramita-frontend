import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import DocumentoPage from './page'
import type { AcademicRequest } from '@/lib/types'

const useTramita = vi.hoisted(() => vi.fn())
const apiFetch = vi.hoisted(() => vi.fn())
const problemMessage = vi.hoisted(() => vi.fn())

vi.mock('@/components/app-shell', () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))
vi.mock('@/lib/store', () => ({ useTramita }))
// Se conserva el módulo real y solo se finge lo que el test necesita controlar. Un mock que
// lo reemplaza entero deja en `undefined` cualquier import nuevo, y el fallo aparece lejos:
// aquí se manifestó como «click no se llamó», no como «la función no existe».
vi.mock('@/lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/api')>()),
  apiFetch,
  problemMessage,
}))
vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'request-1' }),
}))

const request: AcademicRequest = {
  id: 'request-1',
  radicado: 'RAD-2026-001',
  type: 'adicion_creditos',
  status: 'pendiente',
  stateName: 'En coordinación (revisión)',
  currentState: { code: 'EN_COORDINACION', name: 'En coordinación (revisión)', isFinal: false },
  priority: 'normal',
  createdAt: '2026-09-01T12:00:00',
  updatedAt: '2026-09-02T12:00:00',
  dueDate: '2026-09-10T12:00:00',
  studentCode: '123456',
  studentCedula: '1000000000',
  studentName: 'Ana Pérez',
  studentEmail: 'ana@example.com',
  program: 'Ingeniería de Sistemas',
  semester: '7',
  subjects: [{ code: 'MAT-101', name: 'Matemáticas', credits: 3, group: 'A' }],
  reason: 'Solicitud académica',
  attachments: [],
  timeline: [],
  currentStage: 'radicacion',
  assignedTo: 'COORDINACION',
  availableTransitions: [],
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  vi.restoreAllMocks()
})

function setup() {
  useTramita.mockReturnValue({
    getRequest: () => request,
    refreshRequest: vi.fn().mockResolvedValue(undefined),
  })
  render(<DocumentoPage />)
}

describe('DocumentoPage', () => {
  it('muestra el documento de ADICION_CREDITOS en EN_COORDINACION sin afirmar cierre', async () => {
    setup()

    await waitFor(() => expect(screen.getByRole('button', { name: 'Descargar PDF' })).toBeDefined())

    expect(screen.getAllByText('En coordinación (revisión)').length).toBeGreaterThan(0)
    expect(screen.getByText('Solicitud de Adición de Créditos')).toBeDefined()
    expect(screen.queryByText(/documento oficial de cierre/i)).toBeNull()
    expect(screen.queryByText(/constancia formal/i)).toBeNull()
    expect(screen.queryByText(/notificado al estudiante/i)).toBeNull()
    expect(screen.queryByText(/finalizado/i)).toBeNull()
    expect(screen.queryByText(/tramitado y resuelto/i)).toBeNull()
    expect(screen.queryByText(/se autoriza/i)).toBeNull()
    expect(screen.queryByText(/observación de cierre/i)).toBeNull()
    expect(screen.queryByText(/coordinador\(a\) académico/i)).toBeNull()
  })

  it('descarga el documento de ADICION_CREDITOS en EN_COORDINACION desde el endpoint existente', async () => {
    apiFetch.mockResolvedValue({
      ok: true,
      blob: vi.fn().mockResolvedValue(new Blob(['pdf'], { type: 'application/pdf' })),
      headers: new Headers({
        'Content-Disposition': 'attachment; filename="DO-FR-100-request-1.pdf"',
      }),
    } as unknown as Response)
    const createObjectURL = vi.fn(() => 'blob:document')
    const revokeObjectURL = vi.fn()
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectURL })
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectURL })
    // El nombre se lee del anchor en el momento del clic: es el que llega al disco.
    let downloadedAs = ''
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(function (this: HTMLAnchorElement) { downloadedAs = this.download })
    setup()

    fireEvent.click(await screen.findByRole('button', { name: 'Descargar PDF' }))

    await waitFor(() => expect(apiFetch).toHaveBeenCalledWith('/requests/request-1/document'))
    expect(createObjectURL).toHaveBeenCalledOnce()
    expect(click).toHaveBeenCalledOnce()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:document')
    // El nombre lo fija el backend: identifica el formato oficial y omite datos personales.
    expect(downloadedAs).toBe('DO-FR-100-request-1.pdf')
  })
})
