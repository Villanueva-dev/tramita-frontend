import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { CurrentStateBlock } from './current-state-block'
import type { Responsibility } from '@/lib/request-state'
import type { State } from '@/lib/types'

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

// `now` fijo, sin `Date.now()`: el bloque lo recibe como prop, así que el test no necesita
// temporizadores falsos (design.md, «Trampas de estas pruebas»).
const NOW = new Date('2026-09-22T12:00:00Z').getTime()

function daysAgoIso(days: number): string {
  const then = new Date(NOW - days * 24 * 60 * 60 * 1000)
  // Sin offset: el backend serializa así (lib/format.ts, HAS_OFFSET) y se interpreta como UTC.
  return then.toISOString().slice(0, 19)
}

const state = (overrides: Partial<State> = {}): State => ({
  code: 'EN_FACULTAD',
  name: 'En facultad',
  isInitial: false,
  isFinal: false,
  ...overrides,
})

const single: Responsibility = { kind: 'single', who: 'FACULTAD' }
const varies: Responsibility = { kind: 'varies' }
const closed: Responsibility = { kind: 'closed' }

function region() {
  return screen.getByRole('region', { name: /estado actual/i })
}

describe('CurrentStateBlock', () => {
  it('muestra el nombre del estado dentro de la región «Estado actual»', () => {
    render(
      <CurrentStateBlock
        state={state({ name: 'En registro nacional' })}
        responsibility={single}
        waitingSince={daysAgoIso(1)}
        now={NOW}
      />,
    )

    expect(within(region()).getByText('En registro nacional')).toBeDefined()
  })

  it('muestra una insignia para isInitial y otra, independiente, para isFinal', () => {
    render(
      <CurrentStateBlock
        state={state({ isInitial: true, isFinal: false })}
        responsibility={single}
        waitingSince={daysAgoIso(1)}
        now={NOW}
      />,
    )

    expect(within(region()).getByText(/inicial/i)).toBeDefined()
    expect(within(region()).queryByText(/cerrado/i)).toBeNull()
  })

  it('muestra la insignia de cierre cuando isFinal es true, sin la de inicial', () => {
    render(
      <CurrentStateBlock
        state={state({ isInitial: false, isFinal: true })}
        responsibility={closed}
        waitingSince={null}
        now={NOW}
      />,
    )

    expect(within(region()).getByText('Cerrado')).toBeDefined()
    expect(within(region()).queryByText(/inicial/i)).toBeNull()
  })

  it('no muestra ninguna insignia cuando ni isInitial ni isFinal son verdaderos', () => {
    render(
      <CurrentStateBlock
        state={state({ isInitial: false, isFinal: false })}
        responsibility={single}
        waitingSince={daysAgoIso(1)}
        now={NOW}
      />,
    )

    expect(within(region()).queryByText(/inicial/i)).toBeNull()
    expect(within(region()).queryByText(/cerrado/i)).toBeNull()
  })

  it('«Ahora depende de» muestra el responsable cuando es único', () => {
    render(
      <CurrentStateBlock state={state()} responsibility={single} waitingSince={daysAgoIso(1)} now={NOW} />,
    )

    expect(within(region()).getByText('FACULTAD')).toBeDefined()
  })

  it('«Ahora depende de» muestra el texto de divergencia sin elegir un responsable', () => {
    render(
      <CurrentStateBlock state={state()} responsibility={varies} waitingSince={daysAgoIso(1)} now={NOW} />,
    )

    expect(within(region()).getByText('Depende de la acción que se registre')).toBeDefined()
  })

  it('«Ahora depende de» muestra «Trámite cerrado» para un estado final', () => {
    render(
      <CurrentStateBlock
        state={state({ isFinal: true })}
        responsibility={closed}
        waitingSince={null}
        now={NOW}
      />,
    )

    expect(within(region()).getByText('Trámite cerrado')).toBeDefined()
  })

  it('«Lleva 1 día» en singular', () => {
    render(
      <CurrentStateBlock state={state()} responsibility={single} waitingSince={daysAgoIso(1)} now={NOW} />,
    )

    expect(within(region()).getByText('Lleva 1 día')).toBeDefined()
  })

  it('«Lleva N días» en plural para N > 1', () => {
    render(
      <CurrentStateBlock state={state()} responsibility={single} waitingSince={daysAgoIso(5)} now={NOW} />,
    )

    expect(within(region()).getByText('Lleva 5 días')).toBeDefined()
  })

  // Sin insignia de urgencia aunque N sea alto (request-timeline/spec.md): el estilo del
  // valor no puede depender de qué tan grande sea N.
  it('«Lleva 30 días» se presenta con el mismo estilo que cualquier otro valor de N', () => {
    const { unmount } = render(
      <CurrentStateBlock state={state()} responsibility={single} waitingSince={daysAgoIso(1)} now={NOW} />,
    )
    const low = within(region()).getByText('Lleva 1 día')
    const lowClassName = low.className
    unmount()
    cleanup()

    render(
      <CurrentStateBlock state={state()} responsibility={single} waitingSince={daysAgoIso(30)} now={NOW} />,
    )
    const high = within(region()).getByText('Lleva 30 días')

    expect(high.className).toBe(lowClassName)
  })

  it('oculta la antigüedad del estado cuando el estado es final', () => {
    render(
      <CurrentStateBlock
        state={state({ isFinal: true })}
        responsibility={closed}
        waitingSince={daysAgoIso(1)}
        now={NOW}
      />,
    )

    expect(within(region()).queryByText(/Lleva/)).toBeNull()
  })

  it('oculta la antigüedad del estado cuando waitingSince es null', () => {
    render(<CurrentStateBlock state={state()} responsibility={single} waitingSince={null} now={NOW} />)

    expect(within(region()).queryByText(/Lleva/)).toBeNull()
  })

  it('nunca renderiza «paso», un número de paso ni una lista de estados', () => {
    render(
      <CurrentStateBlock state={state()} responsibility={single} waitingSince={daysAgoIso(1)} now={NOW} />,
    )

    expect(within(region()).queryByText(/paso/i)).toBeNull()
    expect(within(region()).queryAllByRole('listitem')).toHaveLength(0)
    expect(within(region()).queryByRole('list')).toBeNull()
  })
})
