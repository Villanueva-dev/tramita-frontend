import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'

import { SummaryCards } from './summary-cards'
import { baseRequest } from '@/lib/store'

afterEach(cleanup)

/**
 * Los trámites se construyen con `baseRequest`, no como literales: así el `status` y los
 * predicados se derivan del estado que envía el motor y no puede escribirse un caso
 * imposible —por ejemplo, uno «cerrado» sobre un estado que el motor no marca como final.
 */
const summary = {
  id: '11111111-1111-1111-1111-111111111111',
  definition: { code: 'ADICION_CREDITOS', name: 'Adición de créditos', version: 1 },
  studentName: 'Estudiante De Prueba',
  studentDocument: '1090234',
  currentState: { code: 'EN_COORDINACION', name: 'En coordinación (revisión)', isFinal: false, isInitial: true },
  createdAt: '2026-09-01T10:00:00',
}

const conEstado = (code: string, name: string, isFinal: boolean) =>
  baseRequest({ ...summary, currentState: { code, name, isFinal, isInitial: false } })

/** El rótulo y su número son hermanos inmediatos, así que el contador se lee sin
 *  depender de las clases de maquetación. */
const contador = (etiqueta: string) =>
  screen.getByText(etiqueta).nextElementSibling?.textContent

describe('SummaryCards', () => {
  // RECHAZADA es un estado final del motor (V2.1.0: is_final = TRUE), igual que
  // FINALIZADA. El contrato no los distingue, así que contar «completadas» por el
  // cierre presenta como trabajo cumplido un trámite que se le negó al estudiante.
  it('no cuenta como completada una solicitud rechazada', () => {
    render(
      <SummaryCards
        requests={[conEstado('RECHAZADA', 'Rechazada', true)]}
        active="todos"
        onSelect={() => {}}
      />,
    )

    expect(contador('Completadas')).toBe('0')
  })

  it('cuenta como completada una solicitud finalizada', () => {
    render(
      <SummaryCards
        requests={[conEstado('FINALIZADA', 'Finalizada', true)]}
        active="todos"
        onSelect={() => {}}
      />,
    )

    expect(contador('Completadas')).toBe('1')
  })

  // El rechazo está cerrado: no debe volver a la bandeja como trabajo en curso.
  it('tampoco cuenta el rechazo como trámite en proceso', () => {
    render(
      <SummaryCards
        requests={[conEstado('RECHAZADA', 'Rechazada', true)]}
        active="todos"
        onSelect={() => {}}
      />,
    )

    expect(contador('En proceso')).toBe('0')
  })

  it('cuenta como en proceso una devolución, que sí espera corrección', () => {
    render(
      <SummaryCards
        requests={[conEstado('DEVUELTA', 'Devuelta para corrección', false)]}
        active="todos"
        onSelect={() => {}}
      />,
    )

    expect(contador('En proceso')).toBe('1')
  })

  // La tarjeta contaba también el vencimiento inventado: una solicitud abierta, antigua
  // y sin prioridad urgente daba 1. El vencimiento se retira de toda la aplicación; la
  // tarjeta cuenta exclusivamente la prioridad declarada por el motor.
  it('la tarjeta "Urgentes" cuenta solo la prioridad: una solicitud abierta y antigua sin prioridad urgente da 0', () => {
    render(
      <SummaryCards
        requests={[conEstado('EN_COORDINACION', 'En coordinación (revisión)', false)]}
        active="todos"
        onSelect={() => {}}
      />,
    )

    const label = screen.getByText(/^Urgentes/)
    expect(label.nextElementSibling?.textContent).toBe('0')
  })
})
