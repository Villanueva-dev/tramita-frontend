import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import DashboardPage from './page'
import type { RequestSummary } from '@/lib/types'

// El shell arrastra useAuth, usePathname y el Logo; nada de eso se prueba acá.
vi.mock('@/components/app-shell', () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))
vi.mock('@/lib/auth-store', () => ({
  useAuth: () => ({ user: { email: 'coord@uniremington.edu.co' } }),
}))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

const MATCH: RequestSummary = {
  id: 'req-1',
  definition: { code: 'ADICION_CREDITOS', name: 'Adición de créditos', version: 1 },
  studentName: 'Ana Pérez',
  studentDocument: '1000000001',
  currentState: { code: 'REGISTRADA', name: 'Registrada', isFinal: false },
  createdAt: '2026-08-28T17:33:15.542189426',
}

function stubFetch(body: unknown = [MATCH], status = 200) {
  const spy = vi.fn((_input: RequestInfo | URL, _init?: RequestInit) =>
    Promise.resolve(
      new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
      }),
    ),
  )
  vi.stubGlobal('fetch', spy)
  return spy
}

function type(value: string) {
  fireEvent.change(screen.getByLabelText(/nombre o cédula/i), { target: { value } })
}

function submit() {
  fireEvent.click(screen.getByRole('button', { name: /^buscar$/i }))
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('bandeja de trabajo (US3)', () => {
  it('arranca invitando a buscar, no diciendo que no hay resultados', () => {
    stubFetch()
    render(<DashboardPage />)

    expect(screen.getByText(/busque una solicitud para empezar/i)).toBeDefined()
    expect(screen.queryByText(/solicitudes encontradas/i)).toBeNull()
  })

  it('la ayuda del estado vacío se lee bien con y sin término suficiente', () => {
    stubFetch()
    render(<DashboardPage />)

    // Sin término: la instrucción tiene que estar completa.
    expect(screen.getByText(/escriba al menos dos caracteres/i)).toBeDefined()

    // Con término suficiente ya se cumplió: la instrucción desaparece en vez de
    // renderizarse mutilada ("Escriba al menos caracteres…").
    type('Pe')
    expect(screen.queryByText(/escriba al menos/i)).toBeNull()
    expect(screen.getByText(/busque una solicitud para empezar/i)).toBeDefined()
  })

  it('distingue "sin coincidencias" del estado inicial', async () => {
    stubFetch([])
    render(<DashboardPage />)

    type('zzz')
    submit()

    await waitFor(() => {
      expect(screen.getByText(/0/)).toBeDefined()
    })
    expect(screen.queryByText(/busque una solicitud para empezar/i)).toBeNull()
    expect(screen.getByText(/no hay solicitudes que coincidan/i)).toBeDefined()
  })

  it('muestra los datos de la solicitud encontrada', async () => {
    stubFetch()
    render(<DashboardPage />)

    type('Pérez')
    submit()

    await waitFor(() => {
      expect(screen.getAllByText('Ana Pérez').length).toBeGreaterThan(0)
    })
    expect(screen.getAllByText(/1000000001/).length).toBeGreaterThan(0)
    expect(screen.getAllByText('Adición de créditos').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Registrada').length).toBeGreaterThan(0)
  })

  it('un error del backend se muestra como alerta y no deja resultados viejos', async () => {
    const spy = stubFetch()
    render(<DashboardPage />)

    type('Pérez')
    submit()
    await waitFor(() => expect(screen.getAllByText('Ana Pérez').length).toBeGreaterThan(0))

    spy.mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify({ title: 'Error interno', status: 500 }), {
          status: 500,
          headers: { 'Content-Type': 'application/problem+json' },
        }),
      ),
    )
    submit()

    await waitFor(() => expect(screen.getByRole('alert')).toBeDefined())
    expect(screen.queryByText('Ana Pérez')).toBeNull()
  })

  it('con menos de 2 caracteres avisa y limpia los resultados anteriores', async () => {
    stubFetch()
    render(<DashboardPage />)

    type('Pérez')
    submit()
    await waitFor(() => expect(screen.getAllByText('Ana Pérez').length).toBeGreaterThan(0))

    type('P')
    submit()

    await waitFor(() => {
      expect(screen.getByText(/al menos 2 caracteres/i)).toBeDefined()
    })
    // Los resultados de "Pérez" no siguen vigentes para "P".
    expect(screen.queryByText('Ana Pérez')).toBeNull()
  })
})
