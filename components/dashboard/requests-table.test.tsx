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
    currentState: { code, name, isFinal },
    // Fecha antigua: su plazo ya venció, así que un trámite abierto se muestra vencido.
    createdAt: '2020-01-01T10:00:00',
  })

describe('RequestsTable', () => {
  // Un trámite cerrado no tiene plazo que correr: mostrar un vencimiento sobre algo que
  // ya terminó invita a gestionar lo que no requiere gestión.
  it('no muestra vencimiento de un trámite cerrado, aunque su plazo haya pasado', () => {
    render(<RequestsTable requests={[conEstado('FINALIZADA', 'Finalizada', true)]} />)

    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
    expect(screen.queryByText(/Vencida/)).toBeNull()
  })

  // Un rechazo también está cerrado, y el contrato lo marca con el mismo `isFinal`.
  it('tampoco lo muestra para un rechazo definitivo', () => {
    render(<RequestsTable requests={[conEstado('RECHAZADA', 'Rechazada', true)]} />)

    expect(screen.queryByText(/Vencida/)).toBeNull()
  })

  it('muestra el vencimiento de un trámite abierto cuyo plazo pasó', () => {
    render(<RequestsTable requests={[conEstado('EN_FACULTAD', 'En facultad', false)]} />)

    expect(screen.getAllByText(/Vencida/).length).toBeGreaterThan(0)
  })
})
