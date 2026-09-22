import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import DashboardPage from './page'
import { baseRequest } from '@/lib/store'
import type { AcademicRequest } from '@/lib/types'

const useTramita = vi.hoisted(() => vi.fn())

vi.mock('@/components/app-shell', () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))
// `importOriginal` conserva `baseRequest`, que el test del filtro de tipo (#9 b) usa para
// construir una solicitud cuya coherencia entre `definition` y `type` no puede escribirse
// mal: mockear el módulo entero se llevaría por delante esa garantía.
vi.mock('@/lib/store', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/store')>()),
  useTramita,
}))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/dashboard',
}))

const request: AcademicRequest = {
  id: 'request-1',
  radicado: 'request-1',
  type: 'adicion_creditos',
  status: 'pendiente',
  stateName: 'En coordinación (revisión)',
  currentState: { code: 'EN_COORDINACION', name: 'En coordinación (revisión)', isFinal: false, isInitial: true },
  priority: 'normal',
  createdAt: '2026-09-01T12:00:00',
  updatedAt: '2026-09-01T12:00:00',
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
  definition: { code: 'ADICION_CREDITOS', name: 'Adición de créditos', version: 1 },
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

/**
 * El backend no expone un listado completo: `GET /api/requests` exige un término
 * de búsqueda porque devolver todo sería volcar el nombre y la cédula de cada
 * estudiante (minimización de datos personales, Ley 1581 de 2012). La bandeja se
 * llena localizando, no listando.
 */
describe('DashboardPage — localización de solicitudes', () => {
  it('invita a buscar en lugar de mostrar una bandeja vacía sin explicación', () => {
    useTramita.mockReturnValue({
      requests: [],
      metrics: null,
      coordinatorName: 'coord@example.com',
      searchRequests: vi.fn(),
      searched: false,
      searchErrors: [],
    })

    render(<DashboardPage />)

    expect(screen.getByLabelText(/cédula o nombre/i)).toBeDefined()
    expect(screen.getByText(/busque por cédula o nombre/i)).toBeDefined()
  })

  it('pide al servidor únicamente el término buscado', () => {
    const searchRequests = vi.fn().mockResolvedValue(undefined)
    useTramita.mockReturnValue({
      requests: [],
      metrics: null,
      coordinatorName: 'coord@example.com',
      searchRequests,
      searched: false,
      searchErrors: [],
    })

    render(<DashboardPage />)
    fireEvent.change(screen.getByLabelText(/cédula o nombre/i), { target: { value: '1090234' } })
    fireEvent.click(screen.getByRole('button', { name: /buscar/i }))

    expect(searchRequests).toHaveBeenCalledWith('1090234')
  })

  it('avisa cuando la búsqueda no encuentra coincidencias', () => {
    useTramita.mockReturnValue({
      requests: [],
      metrics: null,
      coordinatorName: 'coord@example.com',
      searchRequests: vi.fn(),
      searched: true,
      searchErrors: [],
    })

    render(<DashboardPage />)

    expect(screen.getByText(/sin coincidencias/i)).toBeDefined()
  })

  it('la ayuda inicial deja el lugar al aviso cuando la búsqueda no se pudo hacer', () => {
    useTramita.mockReturnValue({
      requests: [],
      metrics: null,
      coordinatorName: 'coord@example.com',
      searchRequests: vi.fn(),
      searched: false,
      searchErrors: ['Escriba al menos 2 caracteres para buscar.'],
    })

    render(<DashboardPage />)

    // Dos textos compitiendo por el mismo hueco se leen como contradicción:
    // el aviso dice que algo falta y la ayuda invita a empezar de cero.
    expect(screen.getByText(/escriba al menos 2 caracteres/i)).toBeDefined()
    expect(screen.queryByText(/busque por cédula o nombre/i)).toBeNull()
  })
})

describe('DashboardPage', () => {
  it('excluye los rechazos al filtrar por Completadas', () => {
    const rejected: AcademicRequest = {
      ...request,
      id: 'request-rejected',
      radicado: 'RAD-REJECTED',
      studentName: 'Solicitud Rechazada',
      status: 'finalizado',
      stateName: 'Rechazada',
      currentState: { code: 'RECHAZADA', name: 'Rechazada', isFinal: true, isInitial: false },
    }
    const finalized: AcademicRequest = {
      ...request,
      id: 'request-finalized',
      radicado: 'RAD-FINALIZED',
      studentName: 'Solicitud Finalizada',
      status: 'finalizado',
      stateName: 'Finalizada',
      currentState: { code: 'FINALIZADA', name: 'Finalizada', isFinal: true, isInitial: false },
    }
    useTramita.mockReturnValue({
      requests: [rejected, finalized],
      metrics: null,
      coordinatorName: 'coord@example.com',
      searchRequests: vi.fn(),
      searched: true,
      searchErrors: [],
    })

    render(<DashboardPage />)
    fireEvent.click(screen.getByRole('button', { name: /completadas/i }))

    expect(screen.getAllByText('Solicitud Finalizada').length).toBeGreaterThan(0)
    expect(screen.queryAllByText('Solicitud Rechazada')).toHaveLength(0)
  })

  it('renderiza la bandeja con datos provenientes del store', () => {
    useTramita.mockReturnValue({
      requests: [request],
      metrics: null,
      coordinatorName: 'coordinacion.cali@uniremington.edu.co',
      searchRequests: vi.fn(),
      searched: true,
      searchErrors: [],
    })

    render(<DashboardPage />)

    expect(screen.getByText(/Buenos días/)).toBeDefined()
    expect(screen.getAllByText('Ana Pérez').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Adición de Créditos').length).toBeGreaterThan(0)
  })

  it('permite abrir la ruta de nueva solicitud', () => {
    useTramita.mockReturnValue({ requests: [], metrics: null, coordinatorName: 'coord@example.com', searchRequests: vi.fn(), searched: true, searchErrors: [] })

    render(<DashboardPage />)

    expect(screen.getAllByRole('link', { name: /nueva solicitud/i })
      .some((link) => link.getAttribute('href') === '/requests/new')).toBe(true)
  })

  // #9(b): filtrar por un tipo concreto no puede incluir una solicitud cuya definición el
  // cliente no reconoce — `baseRequest` la clasifica con `type: null`, así que un filtro
  // por `type === 'adicion_creditos'` la excluye igual que excluiría una de novedad.
  it('filtrar por Adición de Créditos excluye una solicitud de definición desconocida (#9b)', () => {
    const desconocida = baseRequest({
      id: 'request-unknown',
      definition: { code: 'CODIGO_QUE_NO_EXISTE', name: 'Trámite piloto', version: 1 },
      studentName: 'Solicitud Piloto',
      studentDocument: '9999999999',
      currentState: { code: 'ESTADO_INICIAL', name: 'Estado inicial', isFinal: false, isInitial: true },
      createdAt: '2026-09-01T12:00:00',
    })
    useTramita.mockReturnValue({
      requests: [request, desconocida],
      metrics: null,
      coordinatorName: 'coord@example.com',
      searchRequests: vi.fn(),
      searched: true,
      searchErrors: [],
    })

    render(<DashboardPage />)
    fireEvent.change(screen.getByLabelText(/tipo de trámite/i), {
      target: { value: 'adicion_creditos' },
    })

    expect(screen.getAllByText('Ana Pérez').length).toBeGreaterThan(0)
    expect(screen.queryByText('Solicitud Piloto')).toBeNull()
  })

  // No hay ventana institucional citable para estos trámites (Tramita#42, abierto): el
  // tablero no puede afirmar un vencimiento ni un "por vencer".
  it('sin indicadores de Vencidas ni Por vencer', () => {
    useTramita.mockReturnValue({
      requests: [request],
      metrics: null,
      coordinatorName: 'coord@example.com',
      searchRequests: vi.fn(),
      searched: true,
      searchErrors: [],
    })

    render(<DashboardPage />)

    expect(screen.queryByText('Vencidas')).toBeNull()
    expect(screen.queryByText('Por vencer')).toBeNull()
  })
})
