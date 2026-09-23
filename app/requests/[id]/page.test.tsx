import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import RequestDetailPage from './page'
import { baseRequest } from '@/lib/store'
import type { AcademicRequest } from '@/lib/types'

const useTramita = vi.hoisted(() => vi.fn())

vi.mock('@/components/app-shell', () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))
// `importOriginal` conserva `baseRequest`: el caso #9(b) lo usa para construir una
// solicitud cuya `definition` y `type` no pueden contradecirse dentro de la prueba.
vi.mock('@/lib/store', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/store')>()),
  useTramita,
}))
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
  assignedTo: 'FACULTAD',
  definition: { code: 'ADICION_CREDITOS', name: 'Adición de créditos', version: 1 },
  availableTransitions: [
    {
      targetState: { code: 'EN_FACULTAD', name: 'En facultad', isFinal: false, isInitial: false },
      responsible: 'FACULTAD',
      requiresNote: false,
    },
  ],
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

// Relativo a `Date.now()`, con una hora de margen extra hacia el pasado (design.md, «Trampas
// de estas pruebas»): el detalle usa `now = useState(() => Date.now())`, no inyectable desde
// el test, así que la antigüedad se ancla al reloj real. Sin offset: como serializa el backend.
function daysAgoIso(days: number): string {
  const then = new Date(Date.now() - days * 24 * 60 * 60 * 1000 - 60 * 60 * 1000)
  return then.toISOString().slice(0, 19)
}

function mockTramita(overrides: { getRequest: () => AcademicRequest }) {
  useTramita.mockReturnValue({
    getRequest: overrides.getRequest,
    refreshRequest: vi.fn().mockResolvedValue(undefined),
    transition: vi.fn(),
    registerDocumentApproval: vi.fn(),
  })
}

function setup() {
  const transition = vi.fn().mockResolvedValue(undefined)
  useTramita.mockReturnValue({
    getRequest: () => request,
    refreshRequest: vi.fn().mockResolvedValue(undefined),
    transition,
    registerDocumentApproval: vi.fn(),
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
    // El estado se muestra con el nombre del motor de workflow, no con la etiqueta genérica
    // de la categoría interna. Aparece dos veces: la insignia del encabezado y el bloque de
    // estado actual (`CurrentStateBlock`).
    expect(screen.getAllByText('En coordinación (revisión)').length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: 'En facultad' })).toBeDefined()
  })

  it('abre el diálogo para la transición que entrega el backend', async () => {
    setup()

    await waitFor(() => expect(screen.getByRole('button', { name: 'En facultad' })).toBeDefined())
    fireEvent.click(screen.getByRole('button', { name: 'En facultad' }))

    expect(screen.getByRole('dialog')).toBeDefined()
    expect(screen.getByText(/registrar transición a en facultad/i)).toBeDefined()
  })

  // No hay ventana institucional citable para estos trámites (Tramita#42, abierto). El
  // sistema solo puede afirmar cuánto lleva esperando un trámite, nunca si ese tiempo es
  // excesivo. Mata al mutante "badge Vencida" si alguien lo restaura.
  it('no muestra vencimiento en un trámite abierto con radicación antigua', async () => {
    setup()

    await waitFor(() => expect(screen.getByText('Ana Pérez')).toBeDefined())

    expect(screen.queryByText(/Vencida/i)).toBeNull()
    expect(screen.queryByText('Vencimiento')).toBeNull()
  })

  // #9(b): una definición que el cliente no reconoce no se presenta como adición de
  // créditos en ningún lugar del detalle: ni el rótulo, ni la columna de asignaturas, ni
  // el ícono decorativo del badge.
  it('un código de definición desconocido no se presenta como adición de créditos (#9b)', async () => {
    const desconocida = baseRequest({
      id: 'request-2',
      definition: { code: 'CODIGO_QUE_NO_EXISTE', name: 'Trámite piloto', version: 1 },
      studentName: 'Estudiante Piloto',
      studentDocument: '9999999999',
      currentState: { code: 'ESTADO_INICIAL', name: 'Estado inicial', isFinal: false, isInitial: true },
      subjects: [{ code: 'PL-100', name: 'Materia piloto', credits: 3, group: null, currentGrade: null, proposedGrade: null }],
      createdAt: '2026-09-01T12:00:00',
      availableTransitions: [],
    })
    useTramita.mockReturnValue({
      getRequest: () => desconocida,
      refreshRequest: vi.fn().mockResolvedValue(undefined),
      transition: vi.fn(),
      registerDocumentApproval: vi.fn(),
    })

    render(<RequestDetailPage />)

    await waitFor(() => expect(screen.getByText('Estudiante Piloto')).toBeDefined())

    expect(screen.getAllByText('Trámite piloto').length).toBeGreaterThan(0)
    expect(screen.queryByText(/adición de créditos/i)).toBeNull()
    expect(screen.queryByText('Créditos')).toBeNull()
    expect(screen.queryByTestId('type-badge-icon-adicion')).toBeNull()
    expect(screen.getByTestId('type-badge-icon-neutral')).toBeDefined()
  })

  // Mutante P1/P2: la antigüedad del estado sale de la ÚLTIMA entrada del timeline, nunca de
  // `createdAt`. `createdAt` hace 60 días y la última transición hace 1 día deben mostrar
  // «Lleva 1 día», no «Lleva 60 días».
  it('la antigüedad del estado sale de la última entrada del timeline, no de createdAt (mutante P1/P2)', async () => {
    const antiguaConTransicionReciente: AcademicRequest = {
      ...request,
      id: 'request-3',
      createdAt: daysAgoIso(60),
      currentState: { code: 'EN_FACULTAD', name: 'En facultad', isFinal: false, isInitial: false },
      availableTransitions: [
        {
          targetState: { code: 'APROBADA_FACULTAD', name: 'Aprobada por facultad', isFinal: false, isInitial: false },
          responsible: 'FACULTAD',
          requiresNote: false,
        },
      ],
      timeline: [
        { id: 't1', date: daysAgoIso(60), actor: 'Sistema Trámita', action: 'Solicitud radicada', toStatus: 'pendiente' },
        { id: 't2', date: daysAgoIso(1), actor: 'Coordinación de prueba', action: 'Transición a En facultad', fromStatus: 'pendiente', toStatus: 'en_revision' },
      ],
    }
    mockTramita({ getRequest: () => antiguaConTransicionReciente })

    render(<RequestDetailPage />)

    await waitFor(() => expect(screen.getByText('Ana Pérez')).toBeDefined())

    expect(screen.getByText('Lleva 1 día')).toBeDefined()
    expect(screen.queryByText('Lleva 60 días')).toBeNull()
  })

  it('un estado final muestra «Trámite cerrado» y sin fila de antigüedad', async () => {
    const cerrado: AcademicRequest = {
      ...request,
      id: 'request-4',
      currentState: { code: 'FINALIZADA', name: 'Finalizada', isFinal: true, isInitial: false },
      availableTransitions: [],
      timeline: [
        { id: 't1', date: daysAgoIso(10), actor: 'Sistema Trámita', action: 'Solicitud radicada', toStatus: 'pendiente' },
      ],
    }
    mockTramita({ getRequest: () => cerrado })

    render(<RequestDetailPage />)

    await waitFor(() => expect(screen.getByText('Ana Pérez')).toBeDefined())

    expect(screen.getByText('Trámite cerrado')).toBeDefined()
    expect(screen.queryByText(/Lleva/)).toBeNull()
  })

  // «Ahora depende de» es el único punto que responde a quién depende el trámite: la fila
  // «Asignado a» de la tarjeta «Resumen» daba una segunda respuesta, que podía contradecir la
  // primera cuando los responsables divergían.
  it('no muestra una fila «Asignado a»: el bloque de estado es la única respuesta a quién depende', async () => {
    mockTramita({ getRequest: () => request })

    render(<RequestDetailPage />)

    await waitFor(() => expect(screen.getByText('Ana Pérez')).toBeDefined())

    expect(screen.queryByText('Asignado a')).toBeNull()
  })

  // #9(a): dos estados intermedios de la misma definición se distinguen en pantalla, cada uno
  // con su propio `currentState.name` y su propio responsable, sin agruparlos bajo una etapa
  // compartida (el stepper, que sí los agrupaba, se retira en esta unidad).
  it('dos estados intermedios se distinguen: cada uno con su propio nombre y responsable (#9a)', async () => {
    const enFacultad: AcademicRequest = {
      ...request,
      currentState: { code: 'EN_FACULTAD', name: 'En facultad', isFinal: false, isInitial: false },
      availableTransitions: [
        {
          targetState: { code: 'APROBADA_FACULTAD', name: 'Aprobada por facultad', isFinal: false, isInitial: false },
          responsible: 'FACULTAD',
          requiresNote: false,
        },
      ],
    }
    mockTramita({ getRequest: () => enFacultad })
    const { unmount } = render(<RequestDetailPage />)
    await waitFor(() => expect(screen.getByText('Ana Pérez')).toBeDefined())
    expect(screen.getByText('En facultad')).toBeDefined()
    expect(screen.getByText('FACULTAD')).toBeDefined()
    unmount()
    cleanup()
    vi.clearAllMocks()

    const enRegistroNacional: AcademicRequest = {
      ...request,
      currentState: { code: 'EN_REGISTRO_NACIONAL', name: 'En registro nacional', isFinal: false, isInitial: false },
      availableTransitions: [
        {
          targetState: { code: 'FINALIZADA', name: 'Finalizada', isFinal: true, isInitial: false },
          responsible: 'REGISTRO',
          requiresNote: false,
        },
      ],
    }
    mockTramita({ getRequest: () => enRegistroNacional })
    render(<RequestDetailPage />)
    await waitFor(() => expect(screen.getByText('Ana Pérez')).toBeDefined())
    expect(screen.getByText('En registro nacional')).toBeDefined()
    expect(screen.getByText('REGISTRO')).toBeDefined()
    expect(screen.queryByText('En facultad')).toBeNull()
  })
})
