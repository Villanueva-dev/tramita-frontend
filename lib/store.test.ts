import { describe, expect, it } from 'vitest'

import { baseRequest } from './store'

/**
 * Resumen tal como lo devuelve `GET /api/requests` (RequestSummaryResponse):
 * el backend ya envía el nombre legible del estado en `currentState.name`.
 */
const summary = {
  id: '11111111-1111-1111-1111-111111111111',
  definition: { code: 'ADICION_CREDITOS', name: 'Adición de créditos', version: 1 },
  studentName: 'Estudiante De Prueba',
  studentDocument: '1090234',
  currentState: { code: 'REGISTRADA', name: 'Registrada', isFinal: false },
  createdAt: '2026-09-01T10:00:00',
}

const withState = (code: string, name: string, isFinal: boolean) => ({
  ...summary,
  currentState: { code, name, isFinal },
})

describe('baseRequest', () => {
  it('conserva el nombre del estado que envía el backend', () => {
    expect(baseRequest(withState('RECHAZADA', 'Rechazada', true)).stateName).toBe('Rechazada')
  })

  // RECHAZADA y FINALIZADA son ambos estados finales del motor (is_final = true).
  // Sin el nombre del backend, la pantalla rotula «Finalizado» un trámite negado.
  it('distingue un trámite rechazado de uno finalizado', () => {
    const rechazada = baseRequest(withState('RECHAZADA', 'Rechazada', true))
    const finalizada = baseRequest(withState('FINALIZADA', 'Finalizada', true))

    expect(rechazada.stateName).not.toBe(finalizada.stateName)
  })

  // Los seis estados intermedios del motor se colapsan a 'en_revision' en `status`;
  // el nombre real es el único dato que dice de quién depende ahora el trámite.
  it('conserva los estados intermedios sin aplanarlos', () => {
    const enRegistro = baseRequest(
      withState('EN_REGISTRO_CALI', 'En registro Cali (carga en QF)', false),
    )

    expect(enRegistro.stateName).toBe('En registro Cali (carga en QF)')
  })
})
