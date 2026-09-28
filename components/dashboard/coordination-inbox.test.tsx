import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
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

/**
 * Fecha relativa a NOW, con offset `-05:00` — como serializa el backend `waitingSince` y
 * `createdAt` de la bandeja (`CampusTime`, B-2). Con al menos una hora de margen. Escribe
 * el mismo instante en hora de Bogotá (`UTC − 5 h`) y declara el offset explícito: no es
 * la hora UTC con una etiqueta pegada, es el mismo instante en otra notación.
 */
function daysAgo(days: number): string {
  const instant = NOW - days * 86400000 - 3600000
  return new Date(instant - 5 * 60 * 60 * 1000).toISOString().slice(0, 19) + '-05:00'
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

/** N entradas distinguibles por nombre e id, en orden ascendente — no es el fixture de orden. */
function manyEntries(n: number): InboxEntry[] {
  return Array.from({ length: n }, (_, i) => entry({ id: `entry-${i}`, studentName: `Estudiante de prueba ${i}` }))
}

function region() {
  return screen.getByRole('region', { name: /bandeja de trabajo/i })
}

describe('CoordinationInbox', () => {
  it('cargando: no muestra filas ni error', () => {
    const inbox: InboxState = { status: 'loading' }
    render(<CoordinationInbox inbox={inbox} now={NOW} />)

    expect(within(region()).queryAllByRole('link')).toHaveLength(0)
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

  it('una fila muestra sus datos: trámite, estudiante, estado, espera y origen', () => {
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
    expect(row.getByText('Origen: Coordinación')).toBeDefined()
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

    const links = within(region()).getAllByRole('link')
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/requests/entry-a',
      '/requests/entry-b',
      '/requests/entry-c',
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

  it('origen por enlace público muestra "Origen: Enlace público"', () => {
    const inbox: InboxState = { status: 'ready', entries: [entry({ origin: 'PUBLIC_LINK' })], mayHaveMore: false }
    render(<CoordinationInbox inbox={inbox} now={NOW} />)

    expect(within(region()).getByText('Origen: Enlace público')).toBeDefined()
  })

  it('origen por Coordinación muestra "Origen: Coordinación"', () => {
    const inbox: InboxState = { status: 'ready', entries: [entry({ origin: 'COORDINATION' })], mayHaveMore: false }
    render(<CoordinationInbox inbox={inbox} now={NOW} />)

    expect(within(region()).getByText('Origen: Coordinación')).toBeDefined()
  })

  it('origen nulo se presenta como "Origen no registrado", sin duplicar el prefijo', () => {
    const inbox: InboxState = { status: 'ready', entries: [entry({ origin: null })], mayHaveMore: false }
    render(<CoordinationInbox inbox={inbox} now={NOW} />)

    const cell = within(region()).getByText('Origen no registrado')
    expect(cell).toBeDefined()
    expect(within(region()).queryByText(/^Origen: Origen/)).toBeNull()
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

  it('cada fila es un único enlace a /requests/{id}, sin un segundo enlace', () => {
    const inbox: InboxState = { status: 'ready', entries: [entry({ id: 'entry-42' })], mayHaveMore: false }
    render(<CoordinationInbox inbox={inbox} now={NOW} />)

    const links = within(region()).getAllByRole('link')
    expect(links).toHaveLength(1)
    expect(links[0].getAttribute('href')).toBe('/requests/entry-42')
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

  describe('marca de devuelta', () => {
    it('una adición de créditos devuelta (DEVUELTA) muestra el ícono de la marca', () => {
      const inbox: InboxState = {
        status: 'ready',
        entries: [
          entry({
            definition: { code: 'ADICION_CREDITOS', name: 'Adición de créditos', version: 1 },
            currentState: { code: 'DEVUELTA', name: 'Devuelta para corrección', isFinal: false, isInitial: false },
          }),
        ],
        mayHaveMore: false,
      }
      render(<CoordinationInbox inbox={inbox} now={NOW} />)

      expect(within(region()).getByTestId('coordination-inbox-returned-icon')).toBeDefined()
      // La ficha siempre muestra el dato del servidor, marca incluida: no se inventa texto.
      expect(within(region()).getByText('Devuelta para corrección')).toBeDefined()
    })

    it('una adición de créditos en coordinación (EN_COORDINACION) no muestra la marca', () => {
      const inbox: InboxState = { status: 'ready', entries: [entry()], mayHaveMore: false }
      render(<CoordinationInbox inbox={inbox} now={NOW} />)

      expect(within(region()).queryByTestId('coordination-inbox-returned-icon')).toBeNull()
    })
  })

  describe('paginación de vista', () => {
    it('con 11 entradas, la página 1 muestra las primeras 10 y no la 11.ª', () => {
      const inbox: InboxState = { status: 'ready', entries: manyEntries(11), mayHaveMore: false }
      render(<CoordinationInbox inbox={inbox} now={NOW} />)

      expect(within(region()).getByText('Estudiante de prueba 0')).toBeDefined()
      expect(within(region()).getByText('Estudiante de prueba 9')).toBeDefined()
      expect(within(region()).queryByText('Estudiante de prueba 10')).toBeNull()
    })

    it('al hacer clic en «Siguiente» aparece la 11.ª entrada y desaparece la primera', () => {
      const inbox: InboxState = { status: 'ready', entries: manyEntries(11), mayHaveMore: false }
      render(<CoordinationInbox inbox={inbox} now={NOW} />)

      fireEvent.click(within(region()).getByRole('button', { name: /siguiente/i }))

      expect(within(region()).getByText('Estudiante de prueba 10')).toBeDefined()
      expect(within(region()).queryByText('Estudiante de prueba 0')).toBeNull()
    })

    it('con 10 entradas o menos no aparece ningún control de paginación', () => {
      const inbox: InboxState = { status: 'ready', entries: manyEntries(10), mayHaveMore: false }
      render(<CoordinationInbox inbox={inbox} now={NOW} />)

      expect(within(region()).queryByRole('button', { name: /anterior/i })).toBeNull()
      expect(within(region()).queryByRole('button', { name: /siguiente/i })).toBeNull()
      expect(within(region()).queryByText(/página \d+ de \d+/i)).toBeNull()
    })

    it('los controles son botones reales, con type="button", deshabilitados en los extremos', () => {
      const inbox: InboxState = { status: 'ready', entries: manyEntries(25), mayHaveMore: false }
      render(<CoordinationInbox inbox={inbox} now={NOW} />)

      const scope = within(region())
      const prev = scope.getByRole('button', { name: /anterior/i })
      const next = scope.getByRole('button', { name: /siguiente/i })
      expect(prev.tagName).toBe('BUTTON')
      expect(prev.getAttribute('type')).toBe('button')
      expect(next.tagName).toBe('BUTTON')
      expect(next.getAttribute('type')).toBe('button')

      expect((prev as HTMLButtonElement).disabled).toBe(true)
      expect((next as HTMLButtonElement).disabled).toBe(false)

      fireEvent.click(next)
      fireEvent.click(next)
      expect((next as HTMLButtonElement).disabled).toBe(true)
      expect((prev as HTMLButtonElement).disabled).toBe(false)
    })

    it('muestra «Página X de Y» y «Mostrando a–b de n», y avanzan juntos', () => {
      const inbox: InboxState = { status: 'ready', entries: manyEntries(25), mayHaveMore: false }
      render(<CoordinationInbox inbox={inbox} now={NOW} />)

      const scope = within(region())
      expect(scope.getByText('Página 1 de 3')).toBeDefined()
      expect(scope.getByText('Mostrando 1–10 de 25')).toBeDefined()

      fireEvent.click(scope.getByRole('button', { name: /siguiente/i }))
      expect(scope.getByText('Página 2 de 3')).toBeDefined()
      expect(scope.getByText('Mostrando 11–20 de 25')).toBeDefined()

      fireEvent.click(scope.getByRole('button', { name: /siguiente/i }))
      expect(scope.getByText('Página 3 de 3')).toBeDefined()
      expect(scope.getByText('Mostrando 21–25 de 25')).toBeDefined()
    })
  })
})
