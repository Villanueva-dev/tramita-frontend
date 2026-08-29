import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, waitFor, cleanup, within, fireEvent } from '@testing-library/react'
import RequestDetailPage, { currentResponsibility } from './page'
import type { Request, TimelineEntry } from '@/lib/types'

vi.mock('@/components/app-shell', () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))
vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'req-1' }),
  useSearchParams: () => new URLSearchParams(''),
  useRouter: () => ({ push: vi.fn() }),
}))

const sessionExpired = vi.fn()
vi.mock('@/lib/auth-store', () => ({
  useAuth: () => ({ sessionExpired }),
}))

const EN_FACULTAD = { code: 'EN_FACULTAD', name: 'En facultad', isFinal: false }
const REGISTRADA = { code: 'REGISTRADA', name: 'Registrada', isFinal: false }
const FINALIZADA = { code: 'FINALIZADA', name: 'Finalizada', isFinal: true }

const BASE: Request = {
  id: 'req-1',
  definition: { code: 'ADICION_CREDITOS', name: 'Adición de créditos', version: 1 },
  studentName: 'Ana Pérez',
  studentDocument: '1000000001',
  currentState: REGISTRADA,
  availableTransitions: [
    { targetState: EN_FACULTAD, responsible: 'COORDINACION', requiresNote: false },
  ],
  createdAt: '2026-08-20T15:00:00',
}

const REGISTRO: TimelineEntry = {
  id: 1,
  fromState: null,
  toState: REGISTRADA,
  actorEmail: 'coord@uniremington.edu.co',
  responsible: null,
  note: null,
  occurredAt: '2026-08-20T15:00:00',
}

function json(status: number, body: unknown, problem = false): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': problem ? 'application/problem+json' : 'application/json',
    },
  })
}

function stubFetch(request: Request | null = BASE, timeline: TimelineEntry[] = [REGISTRO]) {
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL, _init?: RequestInit) => {
      if (String(input).includes('/timeline')) return Promise.resolve(json(200, timeline))
      return Promise.resolve(
        request
          ? json(200, request)
          : json(404, { title: 'Recurso no encontrado', status: 404 }, true),
      )
    }),
  )
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  // Sin esto el spy acumula las llamadas de los tests anteriores y cualquier
  // aserción `toHaveBeenCalled()` pasa sin que este test la haya provocado.
  sessionExpired.mockClear()
})

describe('detalle de solicitud', () => {
  it('muestra los datos que el motor produce', async () => {
    stubFetch()
    render(<RequestDetailPage />)

    await waitFor(() => expect(screen.getAllByText('Ana Pérez').length).toBeGreaterThan(0))
    expect(screen.getByText('1000000001')).toBeDefined()
    expect(screen.getByText('Adición de créditos')).toBeDefined()
    expect(screen.getAllByText('Registrada').length).toBeGreaterThan(0)
  })

  it('un 404 muestra la pantalla de no encontrada, no un banner de error', async () => {
    stubFetch(null)
    render(<RequestDetailPage />)

    await waitFor(() => expect(screen.getByText(/solicitud no encontrada/i)).toBeDefined())
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('deriva el responsable cuando todas las salientes coinciden', async () => {
    stubFetch()
    render(<RequestDetailPage />)

    await waitFor(() => expect(screen.getByText('COORDINACION')).toBeDefined())
  })

  it('no elige un responsable cuando las salientes difieren', async () => {
    stubFetch({
      ...BASE,
      availableTransitions: [
        { targetState: EN_FACULTAD, responsible: 'COORDINACION', requiresNote: false },
        { targetState: FINALIZADA, responsible: 'REGISTRO', requiresNote: false },
      ],
    })
    render(<RequestDetailPage />)

    await waitFor(() => expect(screen.getByText(/depende de la acción/i)).toBeDefined())

    // La spec exige que cada acción muestre SU responsable: la aserción
    // anterior decía que no estaban en pantalla, que es lo contrario.
    expect(screen.getByText(/en nombre de COORDINACION/i)).toBeDefined()
    expect(screen.getByText(/en nombre de REGISTRO/i)).toBeDefined()
  })

  it('un trámite cerrado no muestra responsable ni antigüedad', async () => {
    stubFetch({ ...BASE, currentState: FINALIZADA, availableTransitions: [] })
    render(<RequestDetailPage />)

    await waitFor(() => expect(screen.getByText(/trámite cerrado/i)).toBeDefined())
    expect(screen.queryByText(/lleva \d+ día/i)).toBeNull()
  })

  it('calcula la antigüedad desde la última entrada del timeline', async () => {
    const tresDiasAtras = new Date(Date.now() - 3 * 86400000).toISOString().replace('Z', '')
    stubFetch(BASE, [
      REGISTRO,
      { ...REGISTRO, id: 2, fromState: REGISTRADA, toState: EN_FACULTAD, occurredAt: tresDiasAtras },
    ])
    render(<RequestDetailPage />)

    await waitFor(() => expect(screen.getByText(/lleva 3 días/i)).toBeDefined())
  })

  it('la entrada de registro no muestra "en nombre de"', async () => {
    stubFetch(BASE, [
      REGISTRO,
      {
        ...REGISTRO,
        id: 2,
        fromState: REGISTRADA,
        toState: EN_FACULTAD,
        responsible: 'FACULTAD',
        occurredAt: '2026-08-21T10:00:00',
      },
    ])
    render(<RequestDetailPage />)

    await waitFor(() => expect(screen.getByText(/en nombre de FACULTAD/i)).toBeDefined())
    // Se mira dentro de la bitácora: las acciones disponibles también declaran
    // "en nombre de", y esta prueba es sobre las entradas del historial.
    const bitacora = within(screen.getByRole('list'))
    expect(bitacora.getAllByText(/en nombre de/i)).toHaveLength(1)
    expect(bitacora.getAllByText(/registrado por/i)).toHaveLength(2)
  })

  it('muestra la nota cuando la entrada la trae', async () => {
    stubFetch(BASE, [{ ...REGISTRO, note: 'Falta la firma del decano' }])
    render(<RequestDetailPage />)

    await waitFor(() => expect(screen.getByText(/falta la firma del decano/i)).toBeDefined())
  })

  it('renderiza el timeline en el orden que llega, sin reordenar', async () => {
    stubFetch(BASE, [
      REGISTRO,
      {
        ...REGISTRO,
        id: 2,
        fromState: REGISTRADA,
        toState: EN_FACULTAD,
        occurredAt: '2026-08-21T10:00:00',
      },
    ])
    render(<RequestDetailPage />)

    await waitFor(() => expect(screen.getByText('En facultad')).toBeDefined())

    // El backend ya entrega ascendente (más antigua primero) y el cliente lo
    // respeta: invertirlo rompería la lectura de auditoría. Se mira dentro de
    // la bitácora: los nombres de estado también salen en el encabezado.
    const bitacora = within(screen.getByRole('list'))
    const estados = bitacora
      .getAllByText(/^(Registrada|En facultad)$/)
      .map((n) => n.textContent)
    expect(estados).toEqual(['Registrada', 'En facultad'])
  })
})

describe('currentResponsibility', () => {
  it('un trámite cerrado no depende de nadie', () => {
    expect(
      currentResponsibility({ ...BASE, currentState: FINALIZADA, availableTransitions: [] }),
    ).toEqual({ kind: 'closed' })
  })

  it('con salientes que coinciden, ese es el responsable', () => {
    expect(currentResponsibility(BASE)).toEqual({ kind: 'single', who: 'COORDINACION' })
  })

  it('con salientes que difieren no hay responsable único', () => {
    expect(
      currentResponsibility({
        ...BASE,
        availableTransitions: [
          { targetState: EN_FACULTAD, responsible: 'COORDINACION', requiresNote: false },
          { targetState: FINALIZADA, responsible: 'REGISTRO', requiresNote: false },
        ],
      }),
    ).toEqual({ kind: 'varies' })
  })

  it('varias salientes con el mismo responsable siguen dando uno solo', () => {
    expect(
      currentResponsibility({
        ...BASE,
        availableTransitions: [
          { targetState: EN_FACULTAD, responsible: 'FACULTAD', requiresNote: false },
          { targetState: FINALIZADA, responsible: 'FACULTAD', requiresNote: true },
        ],
      }),
    ).toEqual({ kind: 'single', who: 'FACULTAD' })
  })
})

describe('registrar una transición (US2/US5)', () => {
  /** Responde al detalle y al timeline; el POST se configura por prueba. */
  function stubWithPost(onPost: () => Response, request: Request = BASE) {
    const spy = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (init?.method === 'POST') return Promise.resolve(onPost())
      if (url.includes('/timeline')) return Promise.resolve(json(200, [REGISTRO]))
      return Promise.resolve(json(200, request))
    })
    vi.stubGlobal('fetch', spy)
    return spy
  }

  function postCalls(spy: ReturnType<typeof stubWithPost>) {
    return spy.mock.calls.filter(([, init]) => (init as RequestInit)?.method === 'POST')
  }

  async function abrirDialogo() {
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /registrar: en facultad/i })).toBeDefined(),
    )
    fireEvent.click(screen.getByRole('button', { name: /registrar: en facultad/i }))
    await waitFor(() => expect(screen.getByRole('dialog')).toBeDefined())
  }

  it('lista una acción por transición disponible, con el verbo de registro', async () => {
    stubWithPost(() => json(200, BASE))
    render(<RequestDetailPage />)

    // El verbo es del sistema; el nombre del estado se cita como el hecho que
    // se asienta. El sistema no aprueba: registra que alguien aprobó.
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /registrar: en facultad/i })).toBeDefined(),
    )
  })

  it('un trámite cerrado no ofrece ninguna acción', async () => {
    stubWithPost(() => json(200, BASE), {
      ...BASE,
      currentState: FINALIZADA,
      availableTransitions: [],
    })
    render(<RequestDetailPage />)

    await waitFor(() => expect(screen.getByText(/trámite cerrado/i)).toBeDefined())
    expect(screen.queryByRole('button', { name: /^registrar:/i })).toBeNull()
  })

  it('envía targetStateCode y refresca el detalle al confirmar', async () => {
    const spy = stubWithPost(() => json(200, BASE))
    render(<RequestDetailPage />)
    await abrirDialogo()

    fireEvent.click(screen.getByRole('button', { name: /^registrar$/i }))

    await waitFor(() => expect(postCalls(spy)).toHaveLength(1))
    const [url, init] = postCalls(spy)[0]
    expect(String(url)).toContain('/requests/req-1/transitions')
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({
      targetStateCode: 'EN_FACULTAD',
    })
  })

  it('exige la nota antes de enviar cuando la transición la requiere', async () => {
    const spy = stubWithPost(() => json(200, BASE), {
      ...BASE,
      availableTransitions: [
        { targetState: EN_FACULTAD, responsible: 'COORDINACION', requiresNote: true },
      ],
    })
    render(<RequestDetailPage />)
    await abrirDialogo()

    fireEvent.click(screen.getByRole('button', { name: /^registrar$/i }))

    await waitFor(() =>
      expect(screen.getByLabelText(/observación/i).getAttribute('aria-invalid')).toBe('true'),
    )
    expect(postCalls(spy)).toHaveLength(0)
  })

  it('una nota de solo espacios no cuenta como nota', async () => {
    const spy = stubWithPost(() => json(200, BASE), {
      ...BASE,
      availableTransitions: [
        { targetState: EN_FACULTAD, responsible: 'COORDINACION', requiresNote: true },
      ],
    })
    render(<RequestDetailPage />)
    await abrirDialogo()

    fireEvent.change(screen.getByLabelText(/observación/i), { target: { value: '   ' } })
    fireEvent.click(screen.getByRole('button', { name: /^registrar$/i }))

    await waitFor(() =>
      expect(screen.getByLabelText(/observación/i).getAttribute('aria-invalid')).toBe('true'),
    )
    expect(postCalls(spy)).toHaveLength(0)
  })

  it('no manda note cuando la transición no la exige y el campo quedó vacío', async () => {
    const spy = stubWithPost(() => json(200, BASE))
    render(<RequestDetailPage />)
    await abrirDialogo()

    fireEvent.click(screen.getByRole('button', { name: /^registrar$/i }))

    await waitFor(() => expect(postCalls(spy)).toHaveLength(1))
    const body = JSON.parse((postCalls(spy)[0][1] as RequestInit).body as string)
    expect('note' in body).toBe(false)
  })

  it('un 422 marca el campo de nota, no un banner suelto', async () => {
    stubWithPost(() =>
      json(422, { title: 'Regla de negocio incumplida', status: 422, detail: 'La transición exige observación' }, true),
    )
    render(<RequestDetailPage />)
    await abrirDialogo()

    fireEvent.click(screen.getByRole('button', { name: /^registrar$/i }))

    await waitFor(() =>
      expect(screen.getByLabelText(/observación/i).getAttribute('aria-invalid')).toBe('true'),
    )
  })

  it('un 409 ofrece releer el estado vigente y no da la transición por aplicada', async () => {
    const spy = stubWithPost(() =>
      json(409, { title: 'Transición no permitida', status: 409 }, true),
    )
    render(<RequestDetailPage />)
    await abrirDialogo()

    fireEvent.click(screen.getByRole('button', { name: /^registrar$/i }))

    const refrescar = await screen.findByRole('button', { name: /actualizar estado vigente/i })
    const antes = spy.mock.calls.length
    fireEvent.click(refrescar)

    // reload() vuelve a pedir detalle y timeline: dos peticiones más.
    await waitFor(() => expect(spy.mock.calls.length).toBe(antes + 2))
  })

  it('un 400 se muestra en español, sin el literal del framework', async () => {
    // Éste es el 400 que el backend produce de verdad: Spring devuelve
    // "Invalid request content." desde MethodArgumentNotValidException:57 y no
    // hay messages.properties que lo traduzca ni que nombre el campo.
    stubWithPost(() =>
      json(400, { title: 'Bad Request', status: 400, detail: 'Invalid request content.' }, true),
    )
    render(<RequestDetailPage />)
    await abrirDialogo()

    fireEvent.click(screen.getByRole('button', { name: /^registrar$/i }))

    await waitFor(() => expect(screen.getByText(/solicitud inválida/i)).toBeDefined())
    expect(screen.queryByText(/Invalid request content/i)).toBeNull()
  })

  it('un 401 marca la sesión como expirada para que el guard redirija', async () => {
    stubWithPost(() => json(401, { title: 'Unauthorized', status: 401 }, true))
    render(<RequestDetailPage />)
    await abrirDialogo()

    fireEvent.click(screen.getByRole('button', { name: /^registrar$/i }))

    await waitFor(() => expect(sessionExpired).toHaveBeenCalled())
  })
})

describe('lo que los tests afirmaban y no verificaban', () => {
  function stubWithPost(onPost: () => Response, request: Request = BASE) {
    const spy = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (init?.method === 'POST') return Promise.resolve(onPost())
      if (url.includes('/timeline')) return Promise.resolve(json(200, [REGISTRO]))
      return Promise.resolve(json(200, request))
    })
    vi.stubGlobal('fetch', spy)
    return spy
  }

  async function abrirYConfirmar() {
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /registrar: en facultad/i })).toBeDefined(),
    )
    fireEvent.click(screen.getByRole('button', { name: /registrar: en facultad/i }))
    await waitFor(() => expect(screen.getByRole('dialog')).toBeDefined())
    fireEvent.click(screen.getByRole('button', { name: /^registrar$/i }))
  }

  it('A3 — tras registrar, la pantalla muestra el estado nuevo', async () => {
    let vigente = BASE
    stubWithPost(() => {
      vigente = { ...BASE, currentState: EN_FACULTAD, availableTransitions: [] }
      return json(200, vigente)
    })
    // El stub lee `vigente` en cada GET, así que el reload trae el estado nuevo.
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input)
        if (init?.method === 'POST') {
          vigente = { ...BASE, currentState: EN_FACULTAD, availableTransitions: [] }
          return Promise.resolve(json(200, vigente))
        }
        if (url.includes('/timeline')) return Promise.resolve(json(200, [REGISTRO]))
        return Promise.resolve(json(200, vigente))
      }),
    )
    render(<RequestDetailPage />)
    await abrirYConfirmar()

    // Sin reload(), la pantalla seguiría mostrando "Registrada".
    await waitFor(() => expect(screen.getAllByText('En facultad').length).toBeGreaterThan(0))
  })

  it('A4 — la observación escrita viaja en el body del POST', async () => {
    const spy = stubWithPost(() => json(200, BASE), {
      ...BASE,
      availableTransitions: [
        { targetState: EN_FACULTAD, responsible: 'COORDINACION', requiresNote: true },
      ],
    })
    render(<RequestDetailPage />)
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /registrar: en facultad/i })).toBeDefined(),
    )
    fireEvent.click(screen.getByRole('button', { name: /registrar: en facultad/i }))
    await waitFor(() => expect(screen.getByRole('dialog')).toBeDefined())
    fireEvent.change(screen.getByLabelText(/observación/i), {
      target: { value: 'Falta la firma del decano' },
    })
    fireEvent.click(screen.getByRole('button', { name: /^registrar$/i }))

    await waitFor(() => {
      const posts = spy.mock.calls.filter(([, i]) => (i as RequestInit)?.method === 'POST')
      expect(posts).toHaveLength(1)
      expect(JSON.parse((posts[0][1] as RequestInit).body as string)).toEqual({
        targetStateCode: 'EN_FACULTAD',
        note: 'Falta la firma del decano',
      })
    })
  })

  it('A1 — el campo de observación topa en el mismo largo que el backend', async () => {
    stubWithPost(() => json(200, BASE))
    render(<RequestDetailPage />)
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /registrar: en facultad/i })).toBeDefined(),
    )
    fireEvent.click(screen.getByRole('button', { name: /registrar: en facultad/i }))
    await waitFor(() => expect(screen.getByRole('dialog')).toBeDefined())

    // @Size(max = 2000) en AdvanceRequestBody. Sin tope en el cliente, el POST
    // sale y vuelve un 400 en inglés que además borra lo escrito.
    expect(screen.getByLabelText(/observación/i).getAttribute('maxlength')).toBe('2000')
  })

  it('A2 — un 401 en la lectura reconcilia la sesión y no pinta una alerta vacía', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(json(401, { title: 'Unauthorized', status: 401 }, true))),
    )
    render(<RequestDetailPage />)

    await waitFor(() => expect(sessionExpired).toHaveBeenCalled())
    // Una caja de error sin texto adentro es peor que no mostrarla: mientras
    // el gate redirige, la pantalla dice qué está pasando.
    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.getByText(/sesión expiró/i)).toBeDefined()
  })

  it('M1 — el banner de conflicto desaparece al actualizar el estado vigente', async () => {
    stubWithPost(() => json(409, { title: 'Transición no permitida', status: 409 }, true))
    render(<RequestDetailPage />)
    await abrirYConfirmar()

    const refrescar = await screen.findByRole('button', { name: /actualizar estado vigente/i })
    fireEvent.click(refrescar)

    // Hay que esperar a que la recarga TERMINE: mientras carga, la página
    // muestra el spinner y el banner no está en el DOM por un instante. Sin
    // esta espera el test da verde por la ventana de carga, no por el arreglo.
    await waitFor(() => expect(screen.getAllByText('Ana Pérez').length).toBeGreaterThan(0))

    // Tras releer, el conflicto quedó resuelto: sostener el banner afirma algo falso.
    expect(screen.queryByRole('button', { name: /actualizar estado vigente/i })).toBeNull()
  })

  it('M4 — tras un 409 el diálogo cierra y el estado sigue siendo el viejo', async () => {
    stubWithPost(() => json(409, { title: 'Transición no permitida', status: 409 }, true))
    render(<RequestDetailPage />)
    await abrirYConfirmar()

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(screen.getAllByText('Registrada').length).toBeGreaterThan(0)
  })

  it('M2 — el 409 muestra el motivo que manda el backend, no sólo el título', async () => {
    stubWithPost(() =>
      json(
        409,
        {
          title: 'Transición no permitida',
          status: 409,
          detail: 'La transición REGISTRADA → RECHAZADA no está definida para este trámite',
        },
        true,
      ),
    )
    render(<RequestDetailPage />)
    await abrirYConfirmar()

    await waitFor(() => expect(screen.getByText(/no está definida para este trámite/i)).toBeDefined())
  })
})
