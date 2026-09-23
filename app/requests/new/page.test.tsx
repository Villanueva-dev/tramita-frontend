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

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('NewRequestPage', () => {
  it('renderiza el formulario usando REQUEST_TYPE_LABELS, no el catálogo del store', () => {
    useTramita.mockReturnValue({
      createRequest: vi.fn(),
    })

    render(<NewRequestPage />)

    expect(screen.getByText('Radicar nueva solicitud')).toBeDefined()
    expect(screen.getByText('Adición de Créditos')).toBeDefined()
    expect(screen.getByPlaceholderText('Ej. 1090234')).toBeDefined()
    expect(screen.getByPlaceholderText('Ej. 1017234567')).toBeDefined()
  })

  it('mantiene el formulario sin depender de datos mock de solicitudes', () => {
    useTramita.mockReturnValue({ createRequest: vi.fn() })

    render(<NewRequestPage />)

    expect(screen.getByText('Tipo de trámite')).toBeDefined()
    expect(screen.getByRole('button', { name: /radicar solicitud/i })).toBeDefined()
  })

  // Issue #12: el backend no recibe archivos adjuntos (Request.java, 006 FR-010). El campo
  // se retira, no se deshabilita: un aviso de «no disponible todavía» prometería algo que
  // el backend ya descartó.
  it('no ofrece adjuntar archivos', () => {
    useTramita.mockReturnValue({ createRequest: vi.fn() })

    render(<NewRequestPage />)

    expect(screen.queryByText('Adjuntar documento de soporte')).toBeNull()
    expect(document.querySelector('input[type="file"]')).toBeNull()
  })
})
