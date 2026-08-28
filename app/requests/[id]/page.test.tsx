import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, waitFor, cleanup, within } from '@testing-library/react'
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
    expect(screen.queryByText('COORDINACION')).toBeNull()
    expect(screen.queryByText('REGISTRO')).toBeNull()
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
    // Sólo la segunda entrada la trae: la de registro (fromState null) no.
    expect(screen.getAllByText(/en nombre de/i)).toHaveLength(1)
    expect(screen.getAllByText(/registrado por/i)).toHaveLength(2)
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
