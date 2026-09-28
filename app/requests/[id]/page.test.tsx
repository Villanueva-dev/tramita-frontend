import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
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
  origin: null,
  studentPhone: null,
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
  vi.useRealTimers()
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
    // de la categoría interna. Desde T2 aparece una sola vez, en el banner de estado
    // (`CurrentStateBlock`): el encabezado ya no repite el nombre vía `StatusBadge`.
    expect(screen.getAllByText('En coordinación (revisión)').length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: 'En facultad' })).toBeDefined()
  })

  // T2 (rediseno-detalle-solicitud.md): el nombre del estudiante pasa a ser el encabezado
  // visual del detalle. Es `h2` y no `h1` porque `AppShell` ya renderiza el `h1` con el
  // título de la página (`components/app-shell.tsx:185-187`), fuera de alcance de esta tarea.
  it('el nombre del estudiante es el encabezado h2 del detalle', async () => {
    setup()

    await waitFor(() => expect(screen.getByText('Ana Pérez')).toBeDefined())

    expect(screen.getByRole('heading', { level: 2, name: 'Ana Pérez' })).toBeDefined()
  })

  // Guarda, no RED propio: hoy la fila «Nombre» de «Datos del estudiante» ya es la única
  // aparición visible de `studentName` (los usos en `mailto:`/`wa.me` van dentro de atributos
  // `href`, no como texto del DOM). Tras T2 sigue habiendo una sola aparición: la fila
  // «Nombre» se retira y el nombre pasa al `h2`.
  it('el nombre del estudiante aparece una sola vez en el detalle (guarda)', async () => {
    setup()

    await waitFor(() => expect(screen.getByText('Ana Pérez')).toBeDefined())

    expect(screen.getAllByText('Ana Pérez')).toHaveLength(1)
  })

  // T2: el radicado y las fechas de creación/actualización se muestran en una sola línea bajo
  // el nombre del estudiante. Regex robusta al formato local de `formatDate` (es-CO): solo se
  // afirma el texto fijo alrededor de las fechas, no su formato exacto.
  it('muestra el radicado y las fechas de creación y actualización bajo el nombre', async () => {
    setup()

    await waitFor(() => expect(screen.getByText('Ana Pérez')).toBeDefined())

    expect(
      screen.getByText(/^Solicitud request-1 · radicada el .+ · última actualización .+$/),
    ).toBeDefined()
  })

  // T2: con datos reales, `stateName` sale de `currentState.name` (`lib/store.tsx:188`), así
  // que ambos coinciden — a diferencia del fixture de #9a, que conserva un `stateName`
  // desactualizado y por eso no detectaba la duplicación. El encabezado ya no debe repetir el
  // nombre del estado que muestra el banner (`CurrentStateBlock`): se retira `StatusBadge`.
  it('el encabezado no repite el nombre del estado que ya muestra el banner', async () => {
    setup()

    await waitFor(() => expect(screen.getByText('Ana Pérez')).toBeDefined())

    expect(screen.getAllByText('En coordinación (revisión)')).toHaveLength(1)
  })

  // T2: el detalle cuelga del `h1` de `AppShell` (mockeado en estas pruebas), así que ningún
  // encabezado puede saltar un nivel respecto del anterior. El banner de estado va antes del
  // nombre del estudiante (`h2`): si su rótulo fuera `h3`, la jerarquía quedaría invertida.
  it('los encabezados del detalle no saltan niveles', async () => {
    setup()

    await waitFor(() => expect(screen.getByText('Ana Pérez')).toBeDefined())

    const levels = screen
      .getAllByRole('heading')
      .map((heading) => Number(heading.getAttribute('aria-level') ?? heading.tagName.slice(1)))
    let previous = 1
    for (const level of levels) {
      expect(level).toBeLessThanOrEqual(previous + 1)
      previous = level
    }
  })

  it('abre el diálogo para la transición que entrega el backend', async () => {
    setup()

    await waitFor(() => expect(screen.getByRole('button', { name: 'En facultad' })).toBeDefined())
    // T1: el botón de transición vive en el panel lateral «Acciones», ya no en el encabezado.
    const actionsPanel = screen.getByRole('region', { name: 'Acciones' })
    expect(within(actionsPanel).getByRole('button', { name: 'En facultad' })).toBeDefined()

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

  it('ofrece correo y WhatsApp para un cierre público con datos de contacto válidos', async () => {
    const cerradaPublica: AcademicRequest = {
      ...request,
      origin: 'PUBLIC_LINK',
      studentPhone: '3001234567',
      currentState: { code: 'FINALIZADA', name: 'Finalizada', isFinal: true, isInitial: false },
      availableTransitions: [],
    }
    mockTramita({ getRequest: () => cerradaPublica })

    render(<RequestDetailPage />)

    await waitFor(() => expect(screen.getByText('Ana Pérez')).toBeDefined())

    const message = 'Hola Ana Pérez.\r\nSu trámite «Adición de créditos» quedó en estado: Finalizada.'
    const emailLink = screen.getByRole('link', { name: 'Enviar correo al estudiante' })
    const whatsappLink = screen.getByRole('link', { name: 'Enviar WhatsApp al estudiante' })

    // T1: los avisos manuales viven en el panel lateral «Acciones», junto a las transiciones.
    const actionsPanel = screen.getByRole('region', { name: 'Acciones' })
    expect(within(actionsPanel).getByRole('link', { name: 'Enviar correo al estudiante' })).toBeDefined()
    expect(within(actionsPanel).getByRole('link', { name: 'Enviar WhatsApp al estudiante' })).toBeDefined()

    expect(emailLink.getAttribute('href')).toBe(
      `mailto:ana@example.com?subject=${encodeURIComponent('Su proceso ha sido completado')}&body=${encodeURIComponent(message)}`,
    )
    expect(emailLink.getAttribute('href')).toContain('%0D%0A')
    expect(whatsappLink.getAttribute('href')).toBe(
      `https://wa.me/573001234567?text=${encodeURIComponent(message)}`,
    )
    // WhatsApp Web abre en otra pestaña para no reemplazar el detalle; `mailto:` no lo necesita.
    expect(whatsappLink.getAttribute('target')).toBe('_blank')
    expect(whatsappLink.getAttribute('rel')).toBe('noopener noreferrer')
    expect(emailLink.getAttribute('target')).toBeNull()
    // SC-003: ninguno de los dos enlaces expone el documento, el programa ni el motivo.
    for (const link of [emailLink, whatsappLink]) {
      for (const privateValue of [cerradaPublica.studentCedula, cerradaPublica.program, cerradaPublica.reason]) {
        expect(link.getAttribute('href')).not.toContain(encodeURIComponent(privateValue))
      }
    }
  })

  it('ofrece el aviso manual también para un rechazo final', async () => {
    const rechazadaPublica: AcademicRequest = {
      ...request,
      origin: 'PUBLIC_LINK',
      studentPhone: '3001234567',
      currentState: { code: 'RECHAZADA', name: 'Rechazada', isFinal: true, isInitial: false },
      availableTransitions: [],
    }
    mockTramita({ getRequest: () => rechazadaPublica })

    render(<RequestDetailPage />)

    await waitFor(() => expect(screen.getByRole('link', { name: 'Enviar correo al estudiante' })).toBeDefined())

    expect(screen.getByRole('link', { name: 'Enviar correo al estudiante' }).getAttribute('href')).toContain(
      encodeURIComponent('quedó en estado: Rechazada.'),
    )
    expect(screen.getByRole('link', { name: 'Enviar WhatsApp al estudiante' })).toBeDefined()
  })

  it('no ofrece el aviso para estados intermedios, coordinación ni origen desconocido', async () => {
    const cases: AcademicRequest[] = [
      {
        ...request,
        origin: 'PUBLIC_LINK',
        studentPhone: '3001234567',
      },
      {
        ...request,
        origin: 'COORDINATION',
        studentPhone: '3001234567',
        currentState: { code: 'FINALIZADA', name: 'Finalizada', isFinal: true, isInitial: false },
        availableTransitions: [],
        definition: { code: 'NOVEDAD_NOTAS', name: 'Novedad de notas', version: 1 },
      },
      {
        ...request,
        origin: null,
        studentPhone: '3001234567',
        currentState: { code: 'FINALIZADA', name: 'Finalizada', isFinal: true, isInitial: false },
        availableTransitions: [],
      },
    ]

    for (const candidate of cases) {
      mockTramita({ getRequest: () => candidate })
      const { unmount } = render(<RequestDetailPage />)
      await waitFor(() => expect(screen.getByText('Ana Pérez')).toBeDefined())
      expect(screen.queryByRole('link', { name: 'Enviar correo al estudiante' })).toBeNull()
      expect(screen.queryByRole('link', { name: 'Enviar WhatsApp al estudiante' })).toBeNull()
      unmount()
      cleanup()
      vi.clearAllMocks()
    }
  })

  it('solo ofrece cada canal cuando su dato de contacto es válido', async () => {
    const conTelefonoFijo: AcademicRequest = {
      ...request,
      origin: 'PUBLIC_LINK',
      studentPhone: '6012345678',
      currentState: { code: 'FINALIZADA', name: 'Finalizada', isFinal: true, isInitial: false },
      availableTransitions: [],
    }
    mockTramita({ getRequest: () => conTelefonoFijo })
    const { unmount } = render(<RequestDetailPage />)
    await waitFor(() => expect(screen.getByRole('link', { name: 'Enviar correo al estudiante' })).toBeDefined())
    expect(screen.queryByRole('link', { name: 'Enviar WhatsApp al estudiante' })).toBeNull()
    unmount()
    cleanup()
    vi.clearAllMocks()

    const sinCorreo: AcademicRequest = { ...conTelefonoFijo, studentEmail: '', studentPhone: '3001234567' }
    mockTramita({ getRequest: () => sinCorreo })
    render(<RequestDetailPage />)
    await waitFor(() => expect(screen.getByText('Ana Pérez')).toBeDefined())
    expect(screen.queryByRole('link', { name: 'Enviar correo al estudiante' })).toBeNull()
    expect(screen.getByRole('link', { name: 'Enviar WhatsApp al estudiante' })).toBeDefined()
  })

  it('muestra el aviso sin recargar tras una transición a estado final', async () => {
    let currentRequest: AcademicRequest = {
      ...request,
      origin: 'PUBLIC_LINK',
      studentPhone: '3001234567',
      availableTransitions: [
        {
          targetState: { code: 'FINALIZADA', name: 'Finalizada', isFinal: true, isInitial: false },
          responsible: 'REGISTRO',
          requiresNote: false,
        },
      ],
    }
    const transition = vi.fn().mockImplementation(async (): Promise<void> => {
      currentRequest = {
        ...currentRequest,
        status: 'finalizado',
        stateName: 'Finalizada',
        currentState: { code: 'FINALIZADA', name: 'Finalizada', isFinal: true, isInitial: false },
        availableTransitions: [],
      }
    })
    useTramita.mockReturnValue({
      getRequest: () => currentRequest,
      refreshRequest: vi.fn().mockResolvedValue(undefined),
      transition,
      registerDocumentApproval: vi.fn(),
    })

    render(<RequestDetailPage />)

    await screen.findByRole('button', { name: 'Finalizada' })
    vi.useFakeTimers()
    fireEvent.click(screen.getByRole('button', { name: 'Finalizada' }))
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Finalizada' }))
    await vi.advanceTimersByTimeAsync(700)

    expect(transition).toHaveBeenCalledWith('request-1', 'FINALIZADA', '')
    expect(screen.getByRole('link', { name: 'Enviar correo al estudiante' })).toBeDefined()
    expect(screen.getByRole('link', { name: 'Enviar WhatsApp al estudiante' })).toBeDefined()
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

  // El sistema nunca sabe si el anexo se adjuntó (FR-012): el aviso solo recuerda qué llevar
  // y de dónde sale. D1 (odd/tasks/rediseno-detalle-solicitud.md): el requisito canónico es
  // «cerca de las acciones de transición» (spec.md:292, escenario :355-359); el orden relativo
  // al enlace del PDF era la forma de cumplirlo con el layout viejo (un solo encabezado). Con
  // el panel lateral, «cerca» significa dentro de la misma región «Acciones» — se abandona la
  // aproximación por posición de DOM y se afirma directamente la contención.
  it('muestra el requisito de anexo dentro del panel de acciones, sin afirmar que se adjuntó', async () => {
    const conAnexo: AcademicRequest = {
      ...request,
      annexRequirement: {
        documentName: 'Documento de prueba',
        sourceHint: 'Lo entrega el estudiante',
      },
    }
    mockTramita({ getRequest: () => conAnexo })

    render(<RequestDetailPage />)

    await waitFor(() => expect(screen.getByText('Ana Pérez')).toBeDefined())

    const actionsPanel = screen.getByRole('region', { name: 'Acciones' })
    const annexNotice = within(actionsPanel).getByRole('region', { name: 'Anexo requerido' })

    expect(annexNotice.textContent).toContain('Documento de prueba')
    expect(annexNotice.textContent).toContain('Lo entrega el estudiante')
    expect(annexNotice.textContent).not.toMatch(/adjuntad[oa]|se adjuntó|recibid[oa]/i)

    expect(annexNotice.matches('[role="alert"]')).toBe(false)
    expect(annexNotice.hasAttribute('aria-live')).toBe(false)
    expect(annexNotice.querySelector('[role="alert"], [aria-live]')).toBeNull()
  })

  // El backend omite la clave cuando el trámite no exige anexo.
  it('sin la clave annexRequirement, no hay aviso ni contenedor vacío', async () => {
    setup()

    await waitFor(() => expect(screen.getByText('Ana Pérez')).toBeDefined())

    expect(screen.queryByRole('region', { name: 'Anexo requerido' })).toBeNull()
  })

  // T1 (rediseno-detalle-solicitud.md): un estado final no tiene transiciones (:233), pero el
  // aviso de anexo sigue siendo obligatorio en cualquier estado (spec.md:292-294). La región
  // «Acciones» debe existir solo por el aviso, sin ofrecer ningún botón de transición.
  it('en un estado final con anexo, la región Acciones existe con el aviso y sin botones de transición', async () => {
    const cerradoConAnexo: AcademicRequest = {
      ...request,
      currentState: { code: 'FINALIZADA', name: 'Finalizada', isFinal: true, isInitial: false },
      availableTransitions: [],
      annexRequirement: {
        documentName: 'Documento de prueba',
        sourceHint: 'Lo entrega el estudiante',
      },
    }
    mockTramita({ getRequest: () => cerradoConAnexo })

    render(<RequestDetailPage />)

    await waitFor(() => expect(screen.getByText('Ana Pérez')).toBeDefined())

    const actionsPanel = screen.getByRole('region', { name: 'Acciones' })
    expect(within(actionsPanel).getByRole('region', { name: 'Anexo requerido' })).toBeDefined()
    expect(within(actionsPanel).queryAllByRole('button')).toHaveLength(0)
  })

  // T1: sin transiciones, sin anexo y sin enlaces de aviso (origin: null, como en el fixture
  // base), no queda ningún contenedor vacío en el panel lateral: la región no se renderiza.
  it('sin transiciones, anexo ni enlaces de aviso, la región Acciones no se renderiza', async () => {
    const cerradoSinAvisos: AcademicRequest = {
      ...request,
      currentState: { code: 'FINALIZADA', name: 'Finalizada', isFinal: true, isInitial: false },
      availableTransitions: [],
    }
    mockTramita({ getRequest: () => cerradoSinAvisos })

    render(<RequestDetailPage />)

    await waitFor(() => expect(screen.getByText('Ana Pérez')).toBeDefined())

    expect(screen.queryByRole('region', { name: 'Acciones' })).toBeNull()
  })
})
