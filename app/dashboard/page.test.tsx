import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import DashboardPage from './page'
import type { AcademicRequest } from '@/lib/types'

const useTramita = vi.hoisted(() => vi.fn())

vi.mock('@/components/app-shell', () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))
vi.mock('@/lib/store', () => ({ useTramita }))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/dashboard',
}))

const request: AcademicRequest = {
  id: 'request-1',
  radicado: 'request-1',
  type: 'adicion_creditos',
  status: 'pendiente',
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
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('DashboardPage', () => {
  it('renderiza la bandeja con datos provenientes del store', () => {
    useTramita.mockReturnValue({
      requests: [request],
      metrics: null,
      coordinatorName: 'coordinacion.cali@uniremington.edu.co',
    })

    render(<DashboardPage />)

    expect(screen.getByText(/Buenos días/)).toBeDefined()
    expect(screen.getAllByText('Ana Pérez').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Adición de Créditos').length).toBeGreaterThan(0)
  })

  it('permite abrir la ruta de nueva solicitud', () => {
    useTramita.mockReturnValue({ requests: [], metrics: null, coordinatorName: 'coord@example.com' })

    render(<DashboardPage />)

    expect(screen.getAllByRole('link', { name: /nueva solicitud/i })
      .some((link) => link.getAttribute('href') === '/requests/new')).toBe(true)
  })
})
