import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import NewRequestPage from './page'

const useTramita = vi.hoisted(() => vi.fn())

vi.mock('@/components/app-shell', () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))
vi.mock('@/lib/store', () => ({ useTramita }))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

const workflowConfig = [
  {
    id: 'adicion_creditos',
    label: 'Adición de Créditos',
    description: 'Solicitud de créditos adicionales.',
    enabled: true,
    stages: [],
  },
]

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('NewRequestPage', () => {
  it('renderiza el formulario usando el catálogo del store', () => {
    useTramita.mockReturnValue({
      createRequest: vi.fn(),
      workflowConfig,
    })

    render(<NewRequestPage />)

    expect(screen.getByText('Radicar nueva solicitud')).toBeDefined()
    expect(screen.getByText('Adición de Créditos')).toBeDefined()
    expect(screen.getByPlaceholderText('Ej. 1090234')).toBeDefined()
    expect(screen.getByPlaceholderText('Ej. 1017234567')).toBeDefined()
  })

  it('mantiene el formulario sin depender de datos mock de solicitudes', () => {
    useTramita.mockReturnValue({ createRequest: vi.fn(), workflowConfig: [] })

    render(<NewRequestPage />)

    expect(screen.getByText('Tipo de trámite')).toBeDefined()
    expect(screen.getByRole('button', { name: /radicar solicitud/i })).toBeDefined()
  })
})
