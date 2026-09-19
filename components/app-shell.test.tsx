import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'

import { AppShell } from './app-shell'
import { baseRequest } from '@/lib/store'

const useTramita = vi.hoisted(() => vi.fn())
const useAuth = vi.hoisted(() => vi.fn())

// `importOriginal` conserva `baseRequest`, que los casos usan para construir los trámites:
// mockear el módulo entero se llevaría por delante la función que garantiza su coherencia.
vi.mock('@/lib/store', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/store')>()),
  useTramita,
}))
vi.mock('@/lib/auth-store', () => ({ useAuth }))
vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

const urgente = (code: string, name: string, isFinal: boolean) =>
  baseRequest({
    id: '11111111-1111-1111-1111-111111111111',
    definition: { code: 'ADICION_CREDITOS', name: 'Adición de créditos', version: 1 },
    studentName: 'Estudiante De Prueba',
    studentDocument: '1090234',
    currentState: { code, name, isFinal },
    createdAt: '2026-09-01T10:00:00',
    priority: 'urgente' as const,
  })

function renderShell(requests: ReturnType<typeof urgente>[]) {
  useAuth.mockReturnValue({ status: 'authenticated' })
  useTramita.mockReturnValue({
    isAuthenticated: true,
    coordinatorName: 'Coord. De Prueba',
    logout: vi.fn(),
    requests,
  })
  render(<AppShell title="Bandeja"><p>contenido</p></AppShell>)
}

/**
 * El contador de urgentes no tiene nombre accesible —es un punto rojo con un número—, así
 * que se consulta por su clase. Que no pueda consultarse de otra forma es en sí una deuda
 * de accesibilidad de la campana, ajena a esta migración.
 */
const badge = () => document.querySelector('.bg-brand-red')?.textContent ?? null

describe('AppShell', () => {
  it('cuenta en la campana un trámite urgente que sigue abierto', () => {
    renderShell([urgente('EN_FACULTAD', 'En facultad', false)])

    expect(badge()).toBe('1')
  })

  // Un trámite cerrado ya no requiere gestión, por urgente que fuera: seguir avisando
  // sobre él manda a la Coordinación a mirar algo que no puede atender.
  it('deja de contar un trámite urgente una vez cerrado', () => {
    renderShell([urgente('FINALIZADA', 'Finalizada', true)])

    expect(badge()).toBeNull()
  })

  // RECHAZADA es final igual que FINALIZADA, aunque el trámite haya terminado mal.
  it('tampoco cuenta un rechazo definitivo', () => {
    renderShell([urgente('RECHAZADA', 'Rechazada', true)])

    expect(badge()).toBeNull()
  })
})
