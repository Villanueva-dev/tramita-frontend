import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { CoordinationInbox } from './coordination-inbox'
import type { InboxState } from '@/lib/use-coordination-inbox'
import type { InboxEntry } from '@/lib/types'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

const NOW = Date.now()

/** Fecha relativa a NOW, sin offset — como el backend. Con al menos una hora de margen. */
function daysAgo(days: number): string {
  return new Date(NOW - days * 86400000 - 3600000).toISOString().slice(0, 19)
}

function entry(overrides: Partial<InboxEntry> = {}): InboxEntry {
  return {
    id: 'entry-1',
    definition: { code: 'ADICION_CREDITOS', name: 'Adición de créditos', version: 1 },
    studentName: 'Estudiante de prueba 1',
    currentState: { code: 'EN_COORDINACION', name: 'En coordinación (revisión)', isFinal: false, isInitial: true },
    createdAt: daysAgo(5),
    waitingSince: daysAgo(5),
    pendingResponsible: 'COORDINACION',
    origin: 'COORDINATION',
    ...overrides,
  }
}

function region() {
  return screen.getByRole('region', { name: /bandeja de trabajo/i })
}

describe('CoordinationInbox', () => {
  it('cargando: no muestra filas ni error', () => {
    const inbox: InboxState = { status: 'loading' }
    render(<CoordinationInbox inbox={inbox} now={NOW} />)

    expect(within(region()).queryByRole('table')).toBeNull()
    expect(within(region()).queryByRole('alert')).toBeNull()
  })

  it('bandeja vacía: muestra un mensaje explicado, no un error', () => {
    const inbox: InboxState = { status: 'ready', entries: [], mayHaveMore: false }
    render(<CoordinationInbox inbox={inbox} now={NOW} />)

    expect(within(region()).getByText(/no hay solicitudes pendientes/i)).toBeDefined()
    expect(within(region()).queryByRole('alert')).toBeNull()
  })

  it('error: los mensajes se muestran dentro de role="alert"', () => {
    const inbox: InboxState = { status: 'error', messages: ['No se pudo consultar la bandeja'] }
    render(<CoordinationInbox inbox={inbox} now={NOW} />)

    expect(within(screen.getByRole('alert')).getByText('No se pudo consultar la bandeja')).toBeDefined()
  })

  it('una fila muestra sus cinco datos: definición, estudiante, estado, espera y origen', () => {
    const inbox: InboxState = {
      status: 'ready',
      entries: [
        entry({
          definition: { code: 'NOVEDAD_NOTAS', name: 'Novedad de notas', version: 1 },
          studentName: 'Estudiante de prueba 7',
          currentState: { code: 'REGISTRADA', name: 'Registrada', isFinal: false, isInitial: true },
          waitingSince: daysAgo(3),
          origin: 'COORDINATION',
        }),
      ],
      mayHaveMore: false,
    }
    render(<CoordinationInbox inbox={inbox} now={NOW} />)

    const row = within(region())
    expect(row.getByText('Novedad de notas')).toBeDefined()
    expect(row.getByText('Estudiante de prueba 7')).toBeDefined()
    expect(row.getByText('Registrada')).toBeDefined()
    expect(row.getByText(/esperando desde hace 3 días/i)).toBeDefined()
    expect(row.getByText('Coordinación')).toBeDefined()
  })

  // Regla del fixture (design.md): el orden no coincide con lo que produciría ordenar por
  // ninguna clave candidata, así que un .sort() sobre cualquiera de ellas se detecta.
  it('las filas aparecen en el orden exacto del fixture, sin recalcular', () => {
    const entries = [
      entry({ id: 'entry-a', studentName: 'Estudiante de prueba 2', waitingSince: daysAgo(5), createdAt: daysAgo(40) }),
      entry({ id: 'entry-b', studentName: 'Estudiante de prueba 3', waitingSince: daysAgo(20), createdAt: daysAgo(10) }),
      entry({ id: 'entry-c', studentName: 'Estudiante de prueba 1', waitingSince: daysAgo(1), createdAt: daysAgo(60) }),
    ]
    const inbox: InboxState = { status: 'ready', entries, mayHaveMore: false }
    render(<CoordinationInbox inbox={inbox} now={NOW} />)

    const rows = within(region()).getAllByRole('row').slice(1) // sin el encabezado
    expect(rows.map((r) => within(r).getByRole('link').textContent)).toEqual([
      'Estudiante de prueba 2',
      'Estudiante de prueba 3',
      'Estudiante de prueba 1',
    ])
  })

  it('la espera sale de waitingSince, no de createdAt', () => {
    const inbox: InboxState = {
      status: 'ready',
      entries: [entry({ createdAt: daysAgo(60), waitingSince: daysAgo(1) })],
      mayHaveMore: false,
    }
    render(<CoordinationInbox inbox={inbox} now={NOW} />)

    expect(within(region()).getByText(/esperando desde hace 1 día\b/i)).toBeDefined()
    expect(within(region()).queryByText(/esperando desde hace 60 días/i)).toBeNull()
  })

  it('origen por enlace público muestra "Enlace público"', () => {
    const inbox: InboxState = { status: 'ready', entries: [entry({ origin: 'PUBLIC_LINK' })], mayHaveMore: false }
    render(<CoordinationInbox inbox={inbox} now={NOW} />)

    expect(within(region()).getByText('Enlace público')).toBeDefined()
  })

  it('origen por Coordinación muestra "Coordinación"', () => {
    const inbox: InboxState = { status: 'ready', entries: [entry({ origin: 'COORDINATION' })], mayHaveMore: false }
    render(<CoordinationInbox inbox={inbox} now={NOW} />)

    expect(within(region()).getByText('Coordinación')).toBeDefined()
  })

  it('origen nulo se presenta como "Origen no registrado", con el mismo estilo que los otros dos', () => {
    const inbox: InboxState = { status: 'ready', entries: [entry({ origin: null })], mayHaveMore: false }
    render(<CoordinationInbox inbox={inbox} now={NOW} />)

    const cell = within(region()).getByText('Origen no registrado')
    expect(cell).toBeDefined()
    // Estilo neutro: ninguna clase de alerta/error, igual que las celdas de origen conocido.
    expect(cell.className).not.toMatch(/destructive|warning|alert/i)
  })

  it('aviso presente cuando la bandeja llega al límite (mayHaveMore)', () => {
    const inbox: InboxState = { status: 'ready', entries: [entry()], mayHaveMore: true }
    render(<CoordinationInbox inbox={inbox} now={NOW} />)

    expect(within(region()).getByText(/puede haber más solicitudes/i)).toBeDefined()
  })

  it('sin aviso un elemento por debajo del límite', () => {
    const inbox: InboxState = { status: 'ready', entries: [entry()], mayHaveMore: false }
    render(<CoordinationInbox inbox={inbox} now={NOW} />)

    expect(within(region()).queryByText(/puede haber más solicitudes/i)).toBeNull()
  })

  it('el nombre del estudiante es un enlace a /requests/{id}', () => {
    const inbox: InboxState = { status: 'ready', entries: [entry({ id: 'entry-42' })], mayHaveMore: false }
    render(<CoordinationInbox inbox={inbox} now={NOW} />)

    const link = within(region()).getByRole('link', { name: 'Estudiante de prueba 1' })
    expect(link.getAttribute('href')).toBe('/requests/entry-42')
  })

  it('ninguna fila expone número de documento', () => {
    const inbox: InboxState = { status: 'ready', entries: [entry()], mayHaveMore: false }
    render(<CoordinationInbox inbox={inbox} now={NOW} />)

    expect(within(region()).queryByText(/C\.C\./i)).toBeNull()
  })

  it('ningún texto de la bandeja menciona vencimiento', () => {
    const inbox: InboxState = { status: 'ready', entries: [entry()], mayHaveMore: true }
    render(<CoordinationInbox inbox={inbox} now={NOW} />)

    expect(region().textContent).not.toMatch(/venc/i)
  })
})
