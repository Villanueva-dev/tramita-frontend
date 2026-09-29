import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'

import { SummaryCards } from './summary-cards'
import type { RequestMetrics } from '@/lib/types'

afterEach(cleanup)

const metrics: RequestMetrics = {
  total: 15,
  byDefinition: {},
  byCurrentState: {},
  completed: 5,
  averageCycleHours: 12,
  returnCount: 2,
  pending: 3,
  inProgress: 4,
  completedSuccessfully: 5,
  urgent: 6,
}

/** El rótulo y su número son hermanos inmediatos, así que el contador se lee sin
 *  depender de las clases de maquetación. */
const contador = (etiqueta: string) =>
  screen.getByText(etiqueta).nextElementSibling?.textContent

describe('SummaryCards', () => {
  it('muestra los conteos globales calculados por el backend', () => {
    render(
      <SummaryCards
        metrics={metrics}
        active="todos"
        onSelect={() => {}}
      />,
    )

    expect(contador('Pendientes')).toBe('3')
    expect(contador('En proceso')).toBe('4')
    expect(contador('Completadas')).toBe('5')
    expect(contador('Urgentes')).toBe('6')
  })

  it('no presenta un cero ficticio mientras las métricas aún no cargan', () => {
    render(
      <SummaryCards
        metrics={null}
        active="todos"
        onSelect={() => {}}
      />,
    )

    expect(contador('Pendientes')).toBe('—')
    expect(contador('En proceso')).toBe('—')
    expect(contador('Completadas')).toBe('—')
    expect(contador('Urgentes')).toBe('—')
  })
})
