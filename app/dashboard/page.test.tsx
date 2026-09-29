import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import DashboardPage from './page'
import { baseRequest } from '@/lib/store'
import { INBOX_LIMIT } from '@/lib/use-coordination-inbox'
import type { AcademicRequest, DashboardRequestPage } from '@/lib/types'
import type { InboxState } from '@/lib/use-coordination-inbox'

const useTramita = vi.hoisted(() => vi.fn())
const useCoordinationInbox = vi.hoisted(() => vi.fn())
const fetchDashboardCategory = vi.hoisted(() => vi.fn())

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
// Ídem: `importOriginal` conserva `COORDINATION_RESPONSIBLE`/`INBOX_LIMIT`, que este mismo
// archivo usa para construir los fixtures de "o más" (7.20).
vi.mock('@/lib/use-coordination-inbox', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/use-coordination-inbox')>()),
  useCoordinationInbox,
}))
vi.mock('@/lib/api', () => ({ fetchDashboardCategory }))
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
  origin: null,
  studentPhone: null,
  program: 'Ingeniería de Sistemas',
  semester: '7',
  subjects: [],
  reason: 'Solicitud académica',
  timeline: [],
  assignedTo: 'FACULTAD',
  definition: { code: 'ADICION_CREDITOS', name: 'Adición de créditos', version: 1 },
}

const DEFAULT_INBOX: InboxState = { status: 'ready', entries: [], mayHaveMore: false }

interface TramitaMock {
  requests: AcademicRequest[]
  metrics?: unknown
  coordinatorName?: string
  searchRequests?: (term: string) => void
  searched: boolean
  searchErrors: string[]
}

/**
 * Fija los dos mocks que el tablero necesita en cada test — el store y el hook de la
 * bandeja —, para que ninguno herede el `mockReturnValue` del anterior, cualquiera sea
 * la semántica de `clearAllMocks` (design.md, «Mock del hook en
 * app/dashboard/page.test.tsx»).
 */
function renderDashboard({
  tramita,
  inbox = DEFAULT_INBOX,
  categoryPage = {
    content: [], page: 0, size: 25, totalElements: 0, totalPages: 0,
    hasNext: false, hasPrevious: false,
  },
}: {
  tramita: TramitaMock
  inbox?: InboxState
  categoryPage?: DashboardRequestPage
}) {
  useTramita.mockReturnValue({
    metrics: null,
    coordinatorName: 'coord@example.com',
    searchRequests: vi.fn(),
    ...tramita,
  })
  useCoordinationInbox.mockReturnValue(inbox)
  fetchDashboardCategory.mockResolvedValue(categoryPage)
  return render(<DashboardPage />)
}

afterEach(() => {
  cleanup()
  window.sessionStorage.clear()
  vi.clearAllMocks()
})

/**
 * El backend no expone un listado completo: `GET /api/requests` exige un término
 * de búsqueda porque devolver todo sería volcar el nombre y la cédula de cada
 * estudiante (minimización de datos personales, Ley 1581 de 2012). La tabla de
 * resultados se llena localizando, no listando.
 */
describe('DashboardPage — localización de solicitudes', () => {
  it('invita a buscar en lugar de mostrar resultados vacíos sin explicación', () => {
    renderDashboard({ tramita: { requests: [], searched: false, searchErrors: [] } })

    expect(screen.getByLabelText(/cédula o nombre/i)).toBeDefined()
    expect(screen.getByText(/busque por cédula o nombre/i)).toBeDefined()
  })

  it('pide al servidor únicamente el término buscado', () => {
    const searchRequests = vi.fn().mockResolvedValue(undefined)
    renderDashboard({ tramita: { requests: [], searchRequests, searched: false, searchErrors: [] } })

    fireEvent.change(screen.getByLabelText(/cédula o nombre/i), { target: { value: '1090234' } })
    fireEvent.click(screen.getByRole('button', { name: /buscar/i }))

    expect(searchRequests).toHaveBeenCalledWith('1090234')
  })

  it('avisa cuando la búsqueda no encuentra coincidencias', () => {
    renderDashboard({ tramita: { requests: [], searched: true, searchErrors: [] } })

    expect(screen.getByText(/sin coincidencias/i)).toBeDefined()
  })

  it('la ayuda inicial deja el lugar al aviso cuando la búsqueda no se pudo hacer', () => {
    renderDashboard({
      tramita: {
        requests: [],
        searched: false,
        searchErrors: ['Escriba al menos 2 caracteres para buscar.'],
      },
    })

    // Dos textos compitiendo por el mismo hueco se leen como contradicción:
    // el aviso dice que algo falta y la ayuda invita a empezar de cero.
    expect(screen.getByText(/escriba al menos 2 caracteres/i)).toBeDefined()
    expect(screen.queryByText(/busque por cédula o nombre/i)).toBeNull()
  })
})

describe('DashboardPage', () => {
  it('muestra conteos globales y carga los trámites al seleccionar una tarjeta', async () => {
    const categoryPage: DashboardRequestPage = {
      content: [
        {
          id: 'request-pending',
          definition: { code: 'ADICION_CREDITOS', name: 'Adición de créditos', version: 1 },
          studentName: 'Solicitud pendiente de prueba',
          currentState: { code: 'EN_COORDINACION', name: 'En coordinación', isFinal: false, isInitial: true },
          createdAt: '2026-09-28T12:00:00',
          priority: 'normal',
        },
      ],
      page: 0,
      size: 25,
      totalElements: 1,
      totalPages: 1,
      hasNext: false,
      hasPrevious: false,
    }

    renderDashboard({
      tramita: {
        requests: [],
        metrics: {
          pending: 4,
          inProgress: 7,
          completedSuccessfully: 2,
          urgent: 1,
        },
        searched: false,
        searchErrors: [],
      },
      categoryPage,
    })

    expect(screen.getByRole('button', { name: /pendientes\s*4/i })).toBeDefined()
    fireEvent.click(screen.getByRole('button', { name: /pendientes\s*4/i }))

    expect(await screen.findByText('Solicitud pendiente de prueba')).toBeDefined()
    expect(fetchDashboardCategory).toHaveBeenCalledWith('PENDING', 0, 25)
    expect(screen.queryByText(/c\.c\./i)).toBeNull()
  })

  it('permite avanzar y retroceder entre páginas de una categoría', async () => {
    const firstPage: DashboardRequestPage = {
      content: [{
        id: 'request-page-0',
        definition: { code: 'ADICION_CREDITOS', name: 'Adición de créditos', version: 1 },
        studentName: 'Solicitud página uno',
        currentState: { code: 'EN_COORDINACION', name: 'En coordinación', isFinal: false, isInitial: true },
        createdAt: '2026-09-28T12:00:00',
        priority: 'normal',
      }],
      page: 0, size: 25, totalElements: 26, totalPages: 2,
      hasNext: true, hasPrevious: false,
    }
    const secondPage: DashboardRequestPage = {
      ...firstPage,
      content: [{ ...firstPage.content[0], id: 'request-page-1', studentName: 'Solicitud página dos' }],
      page: 1,
      hasNext: false,
      hasPrevious: true,
    }
    renderDashboard({ tramita: { requests: [], searched: false, searchErrors: [] }, categoryPage: firstPage })
    fetchDashboardCategory.mockImplementation(async (_category: string, page: number) =>
      page === 0 ? firstPage : secondPage,
    )

    fireEvent.click(screen.getByRole('button', { name: /pendientes/i }))
    expect(await screen.findByText('Solicitud página uno')).toBeDefined()
    fireEvent.click(screen.getByRole('button', { name: 'Página siguiente' }))

    expect(await screen.findByText('Solicitud página dos')).toBeDefined()
    expect(fetchDashboardCategory).toHaveBeenLastCalledWith('PENDING', 1, 25)
    expect(screen.getByText(/página 2 de 2/i)).toBeDefined()
  })

  it('restaura y persiste los filtros operativos al recargar', () => {
    window.sessionStorage.setItem('tramita-dashboard-filters-v1', JSON.stringify({
      typeFilter: 'novedad_notas',
      statusFilter: 'devuelto',
      responsibleFilter: 'FACULTAD',
      dateFilter: '30',
      cardFilter: 'urgente',
    }))

    renderDashboard({ tramita: { requests: [], searched: false, searchErrors: [] } })

    expect(screen.getByLabelText(/tipo de trámite/i)).toHaveProperty('value', 'novedad_notas')
    expect(screen.getByLabelText(/^estado$/i)).toHaveProperty('value', 'devuelto')
    expect(screen.getByLabelText(/responsable/i)).toHaveProperty('value', 'FACULTAD')
    expect(screen.getByLabelText(/fecha de radicación/i)).toHaveProperty('value', '30')
    expect(screen.getByRole('button', { name: /urgentes/i }).className).toContain('ring-2')

    fireEvent.change(screen.getByLabelText(/^estado$/i), { target: { value: 'finalizado' } })

    expect(JSON.parse(window.sessionStorage.getItem('tramita-dashboard-filters-v1')!).statusFilter)
      .toBe('finalizado')
  })

  it('excluye los rechazos al filtrar por Completadas', async () => {
    renderDashboard({
      tramita: { requests: [], searched: false, searchErrors: [] },
      categoryPage: {
        content: [{
          id: 'request-finalized',
          definition: { code: 'ADICION_CREDITOS', name: 'Adición de créditos', version: 1 },
          studentName: 'Solicitud Finalizada',
          currentState: { code: 'FINALIZADA', name: 'Finalizada', isFinal: true, isInitial: false },
          createdAt: '2026-09-01T12:00:00',
          priority: 'normal',
        }],
        page: 0,
        size: 25,
        totalElements: 1,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      },
    })
    fireEvent.click(screen.getByRole('button', { name: /completadas/i }))

    expect(await screen.findByText('Solicitud Finalizada')).toBeDefined()
    expect(screen.queryByText('Solicitud Rechazada')).toBeNull()
    expect(fetchDashboardCategory).toHaveBeenCalledWith('COMPLETED', 0, 25)
  })

  it('renderiza los resultados de búsqueda con datos provenientes del store', () => {
    renderDashboard({
      tramita: {
        requests: [request],
        coordinatorName: 'coordinacion.cali@uniremington.edu.co',
        searched: true,
        searchErrors: [],
      },
    })

    expect(screen.getByText(/Buenos días/)).toBeDefined()
    expect(screen.getAllByText('Ana Pérez').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Adición de créditos').length).toBeGreaterThan(0)
  })

  it('permite abrir la ruta de nueva solicitud', () => {
    renderDashboard({ tramita: { requests: [], searched: true, searchErrors: [] } })

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
    renderDashboard({ tramita: { requests: [request, desconocida], searched: true, searchErrors: [] } })

    fireEvent.change(screen.getByLabelText(/tipo de trámite/i), {
      target: { value: 'adicion_creditos' },
    })

    expect(screen.getAllByText('Ana Pérez').length).toBeGreaterThan(0)
    expect(screen.queryByText('Solicitud Piloto')).toBeNull()
  })

  // No hay ventana institucional citable para estos trámites (Tramita#42, abierto): el
  // tablero no puede afirmar un vencimiento ni un "por vencer".
  it('sin indicadores de Vencidas ni Por vencer', () => {
    renderDashboard({ tramita: { requests: [request], searched: true, searchErrors: [] } })

    expect(screen.queryByText('Vencidas')).toBeNull()
    expect(screen.queryByText('Por vencer')).toBeNull()
  })
})

describe('DashboardPage — bandeja de trabajo de la Coordinación', () => {
  it('la sección de la bandeja aparece al entrar, sin que el usuario busque', () => {
    renderDashboard({
      tramita: { requests: [], searched: false, searchErrors: [] },
      inbox: {
        status: 'ready',
        entries: [
          {
            id: 'entry-1',
            definition: { code: 'ADICION_CREDITOS', name: 'Adición de créditos', version: 1 },
            studentName: 'Estudiante de prueba 9',
            currentState: { code: 'EN_COORDINACION', name: 'En coordinación (revisión)', isFinal: false, isInitial: true },
            createdAt: '2026-09-01T12:00:00-05:00',
            waitingSince: '2026-09-20T12:00:00-05:00',
            pendingResponsible: 'COORDINACION',
            origin: 'COORDINATION',
          },
        ],
        mayHaveMore: false,
      },
    })

    expect(screen.getByRole('region', { name: /bandeja de trabajo/i })).toBeDefined()
    expect(screen.getByText('Estudiante de prueba 9')).toBeDefined()
  })

  it('la frase del encabezado cuenta la bandeja, en plural', () => {
    renderDashboard({
      tramita: { requests: [], searched: false, searchErrors: [] },
      inbox: { status: 'ready', entries: [entry(), entry(), entry()], mayHaveMore: false },
    })

    expect(screen.getByText(/tiene 3 solicitudes esperando su acción/i)).toBeDefined()
  })

  it('la frase del encabezado es singular con exactamente una solicitud', () => {
    renderDashboard({
      tramita: { requests: [], searched: false, searchErrors: [] },
      inbox: { status: 'ready', entries: [entry()], mayHaveMore: false },
    })

    expect(screen.getByText(/tiene 1 solicitud esperando su acción/i)).toBeDefined()
    expect(screen.queryByText(/1 solicitudes/i)).toBeNull()
  })

  it('la frase incluye "o más" cuando la bandeja llega al límite', () => {
    renderDashboard({
      tramita: { requests: [], searched: false, searchErrors: [] },
      inbox: {
        status: 'ready',
        entries: Array.from({ length: INBOX_LIMIT }, () => entry()),
        mayHaveMore: true,
      },
    })

    expect(screen.getByText(/o más/i)).toBeDefined()
  })

  it('la frase no incluye "o más" un elemento por debajo del límite', () => {
    renderDashboard({
      tramita: { requests: [], searched: false, searchErrors: [] },
      inbox: {
        status: 'ready',
        entries: Array.from({ length: INBOX_LIMIT - 1 }, () => entry()),
        mayHaveMore: false,
      },
    })

    expect(screen.queryByText(/o más/i)).toBeNull()
  })

  // El requisito acota "el encabezado" (coordination-inbox/spec.md, «El encabezado cuenta
  // la bandeja, no la búsqueda»): la tarjeta «Urgentes» de SummaryCards sigue mostrando su
  // propio hint «Atención prioritaria» sobre los resultados de búsqueda, y eso es ajeno a
  // esta unidad — por eso la aserción se acota al encabezado, no a toda la pantalla.
  it('el encabezado nunca menciona atención prioritaria ni ningún conteo de prioridad', () => {
    renderDashboard({
      tramita: { requests: [], searched: false, searchErrors: [] },
      inbox: { status: 'ready', entries: [entry()], mayHaveMore: false },
    })

    const header = screen.getByText(/Buenos días/).parentElement!
    expect(within(header).queryByText(/atención prioritaria/i)).toBeNull()
  })

  it('la frase del encabezado está ausente mientras la bandeja carga', () => {
    renderDashboard({
      tramita: { requests: [], searched: false, searchErrors: [] },
      inbox: { status: 'loading' },
    })

    expect(screen.queryByText(/esperando su acción/i)).toBeNull()
  })
})

function entry() {
  return {
    id: `entry-${Math.random()}`,
    definition: { code: 'ADICION_CREDITOS', name: 'Adición de créditos', version: 1 },
    studentName: 'Estudiante de prueba 1',
    currentState: { code: 'EN_COORDINACION', name: 'En coordinación (revisión)', isFinal: false, isInitial: true },
    createdAt: '2026-09-01T12:00:00-05:00',
    waitingSince: '2026-09-20T12:00:00-05:00',
    pendingResponsible: 'COORDINACION',
    origin: 'COORDINATION' as const,
  }
}
