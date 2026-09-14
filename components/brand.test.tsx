import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'

import { StatusBadge } from './brand'

afterEach(cleanup)

describe('StatusBadge', () => {
  // El motor tiene ocho estados para adición de créditos y seis para novedad de
  // notas; `status` los agrupa en cinco categorías para filtrar y colorear. La
  // etiqueta visible debe ser la del motor, no la de la categoría.
  it('muestra el nombre del estado que envía el backend', () => {
    render(<StatusBadge status="finalizado" stateName="Rechazada" />)

    expect(screen.getByText('Rechazada')).toBeDefined()
    expect(screen.queryByText('Finalizado')).toBeNull()
  })

  it('muestra los estados intermedios sin aplanarlos a «En Revisión»', () => {
    render(<StatusBadge status="en_revision" stateName="En registro Cali (carga en QF)" />)

    expect(screen.getByText('En registro Cali (carga en QF)')).toBeDefined()
  })
})
