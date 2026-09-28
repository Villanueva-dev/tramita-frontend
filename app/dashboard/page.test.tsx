import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import DashboardPage from './page'
import { baseRequest } from '@/lib/store'
import { INBOX_LIMIT } from '@/lib/use-coordination-inbox'
import type { AcademicRequest } from '@/lib/types'
import type { InboxState } from '@/lib/use-coordination-inbox'

const useTramita = vi.hoisted(() => vi.fn())
const useCoordinationInbox = vi.hoisted(() => vi.fn())

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
}: {
  tramita: TramitaMock
  inbox?: InboxState
}) {
  useTramita.mockReturnValue({
    metrics: null,
    coordinatorName: 'coord@example.com',
    searchRequests: vi.fn(),
    ...tramita,
  })
  useCoordinationInbox.mockReturnValue(inbox)
  return render(<DashboardPage />)
}

afterEach(() => {
  cleanup()
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

// El buscador sube al primer bloque tras el encabezado (#56): localizar por nombre o
// cédula es la tarea diaria de la Coordinación y antes vivía al final, debajo de la
// bandeja, las tarjetas y los indicadores — que este mismo cambio retira.
describe('DashboardPage — buscador primero, sin tarjetas (#56)', () => {
  it('el buscador precede a la bandeja en el orden del documento', () => {
    renderDashboard({
      tramita: { requests: [], searched: false, searchErrors: [] },
      inbox: { status: 'ready', entries: [entry()], mayHaveMore: false },
    })

    const searchInput = screen.getByLabelText(/cédula o nombre/i)
    const inboxRegion = screen.getByRole('region', { name: /bandeja de trabajo/i })

    expect(
      searchInput.compareDocumentPosition(inboxRegion) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })

  it('no hay tarjetas de resumen ni indicadores operativos', () => {
    renderDashboard({ tramita: { requests: [request], searched: true, searchErrors: [] } })

    expect(screen.queryByText('Pendientes')).toBeNull()
    expect(screen.queryByText('Completadas')).toBeNull()
    expect(screen.queryByText('Urgentes')).toBeNull()
    expect(screen.queryByText('Ciclo promedio')).toBeNull()
    expect(screen.queryByText('Devoluciones')).toBeNull()
  })

  it('el panel de filtros no aparece antes de buscar', () => {
    renderDashboard({ tramita: { requests: [], searched: false, searchErrors: [] } })

    expect(screen.queryByText(/filtros y búsqueda/i)).toBeNull()
  })

  it('el panel de filtros aparece después de buscar', () => {
    renderDashboard({ tramita: { requests: [], searched: true, searchErrors: [] } })

    expect(screen.getByText(/filtros y búsqueda/i)).toBeDefined()
  })

  // Había dos cajas «Buscar»: la principal, que consulta al backend, y otra dentro del
  // panel de filtros que filtraba en el cliente. Confunde a una usuaria no técnica; se
  // retira la del panel y sus cuatro controles restantes quedan solos (#56).
  it('tras buscar, el panel de filtros no tiene una segunda caja de búsqueda', () => {
    renderDashboard({ tramita: { requests: [], searched: true, searchErrors: [] } })

    expect(screen.queryByRole('textbox', { name: 'Buscar' })).toBeNull()
    expect(screen.getByLabelText('Cédula o nombre del estudiante')).toBeDefined()
    expect(screen.getByLabelText(/tipo de trámite/i)).toBeDefined()
    expect(screen.getByLabelText(/responsable/i)).toBeDefined()
    expect(screen.getByLabelText(/estado/i)).toBeDefined()
    expect(screen.getByLabelText(/fecha de radicación/i)).toBeDefined()
  })
})

describe('DashboardPage', () => {
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
  // la bandeja, no la búsqueda»). Ya no hay tarjetas de resumen ni indicadores por
  // prioridad (#56): esta prueba queda como resguardo para que el encabezado nunca absorba
  // ese texto.
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
