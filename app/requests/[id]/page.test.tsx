import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import RequestDetailPage from './page'
import type { AcademicRequest } from '@/lib/types'

const useTramita = vi.hoisted(() => vi.fn())

vi.mock('@/components/app-shell', () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))
vi.mock('@/lib/store', () => ({ useTramita }))
vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'request-1' }),
  useSearchParams: () => ({ get: () => null }),
}))

const request: AcademicRequest = {
  id: 'request-1',
  radicado: 'request-1',
  type: 'adicion_creditos',
  status: 'pendiente',
  stateName: 'En coordinación (revisión)',
  currentState: { code: 'EN_COORDINACION', name: 'En coordinación (revisión)', isFinal: false },
  priority: 'normal',
  createdAt: '2026-09-01T12:00:00',
  updatedAt: '2026-09-01T12:00:00',
  dueDate: '2026-09-10T12:00:00',
  studentCode: '123456',
  studentCedula: '1000000000',
  studentName: 'Ana Pérez',
  studentEmail: 'ana@example.com',
  program: 'Ingeniería de Sistemas',
  semester: '7',
  subjects: [],
  reason: 'Solicitud académica',
  attachments: [],
  timeline: [],
  currentStage: 'radicacion',
  assignedTo: 'FACULTAD',
  availableTransitions: [
    {
      targetState: { code: 'EN_FACULTAD', name: 'En facultad', isFinal: false },
      responsible: 'FACULTAD',
      requiresNote: false,
    },
  ],
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

function setup() {
  const transition = vi.fn().mockResolvedValue(undefined)
  useTramita.mockReturnValue({
    getRequest: () => request,
    refreshRequest: vi.fn().mockResolvedValue(undefined),
    transition,
    registerDocumentApproval: vi.fn(),
    workflowConfig: [],
  })
  render(<RequestDetailPage />)
  return transition
}

describe('RequestDetailPage', () => {
  it('muestra el enlace al documento para ADICION_CREDITOS en EN_COORDINACION', async () => {
    setup()

    await waitFor(() => expect(screen.getByText('Ana Pérez')).toBeDefined())

    const documentLink = screen.getByRole('link', { name: 'Ver documento PDF' })
    expect(documentLink.getAttribute('href')).toBe('/requests/request-1/documento')
  })

  it('carga el detalle desde el store', async () => {
    setup()

    await waitFor(() => expect(screen.getByText('Ana Pérez')).toBeDefined())
    // El estado se muestra con el nombre del motor de workflow, no con la
    // etiqueta genérica de la categoría interna.
    expect(screen.getByText('En coordinación (revisión)')).toBeDefined()
    expect(screen.getByRole('button', { name: 'En facultad' })).toBeDefined()
  })

  it('abre el diálogo para la transición que entrega el backend', async () => {
    setup()

    await waitFor(() => expect(screen.getByRole('button', { name: 'En facultad' })).toBeDefined())
    fireEvent.click(screen.getByRole('button', { name: 'En facultad' }))

    expect(screen.getByRole('dialog')).toBeDefined()
    expect(screen.getByText(/registrar transición a en facultad/i)).toBeDefined()
  })
})
