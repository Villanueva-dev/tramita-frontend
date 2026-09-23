import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'

import { RequestsTable } from './requests-table'
import { baseRequest } from '@/lib/store'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

/** Construido con `baseRequest` para que el estado y lo que se deriva de él no puedan
 *  contradecirse dentro del propio caso de prueba. */
const conEstado = (code: string, name: string, isFinal: boolean) =>
  baseRequest({
    id: '11111111-1111-1111-1111-111111111111',
    definition: { code: 'ADICION_CREDITOS', name: 'Adición de créditos', version: 1 },
    studentName: 'Estudiante De Prueba',
    studentDocument: '1090234',
    currentState: { code, name, isFinal, isInitial: false },
    // Fecha antigua: bajo el vencimiento retirado, un trámite abierto se hubiera mostrado
    // vencido. No hay ventana institucional citable (Tramita#42, abierto).
    createdAt: '2020-01-01T10:00:00',
  })

describe('RequestsTable', () => {
  it('no muestra vencimiento de un trámite cerrado', () => {
    render(<RequestsTable requests={[conEstado('FINALIZADA', 'Finalizada', true)]} />)

    expect(screen.queryByText(/Vencida/)).toBeNull()
  })

  // Un rechazo también está cerrado, y el contrato lo marca con el mismo `isFinal`.
  it('tampoco lo muestra para un rechazo definitivo', () => {
    render(<RequestsTable requests={[conEstado('RECHAZADA', 'Rechazada', true)]} />)

    expect(screen.queryByText(/Vencida/)).toBeNull()
  })

  // No hay ventana institucional citable para estos trámites (Tramita#42, abierto). Mata
  // al mutante "badge Vencida" o "columna Vencimiento" si alguien los restaura.
  it('no afirma vencimiento de un trámite abierto antiguo', () => {
    render(<RequestsTable requests={[conEstado('EN_FACULTAD', 'En facultad', false)]} />)

    expect(screen.queryByText(/Vencida/)).toBeNull()
  })

  // La insignia de tipo muestra el nombre que envía el servidor (`definition.name`), no un
  // rótulo fijado en el cliente (D2).
  it('la insignia de tipo muestra definition.name', () => {
    render(<RequestsTable requests={[conEstado('EN_FACULTAD', 'En facultad', false)]} />)

    expect(screen.getAllByText('Adición de créditos').length).toBeGreaterThan(0)
  })

  // B-3: `ICON_BY_CODE[code]` sobre un objeto literal resuelve claves heredadas del
  // prototipo (`constructor`, `toString`, …) en vez de devolver undefined. Un código de
  // definición real nunca vale eso, pero la spec exige que ningún código desconocido
  // rompa la pantalla — y "constructor" es exactamente un código que el mapa no declara.
  it('un código de definición que coincide con una clave del prototipo no rompe la fila', () => {
    const request = baseRequest({
      id: '22222222-2222-2222-2222-222222222222',
      definition: { code: 'constructor', name: 'Trámite de prueba', version: 1 },
      studentName: 'Estudiante De Prueba',
      studentDocument: '1090234',
      currentState: { code: 'EN_FACULTAD', name: 'En facultad', isFinal: false, isInitial: false },
      createdAt: '2020-01-01T10:00:00',
    })

    expect(() => render(<RequestsTable requests={[request]} />)).not.toThrow()
    expect(screen.getAllByText('Trámite de prueba').length).toBeGreaterThan(0)
  })
})
