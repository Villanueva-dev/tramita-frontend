import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import VerifySealPage from './page'
import { getPublicSeal } from '@/lib/api'
import type { PublicSeal } from '@/lib/types'

vi.mock('@/lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/api')>()),
  getPublicSeal: vi.fn(),
}))

afterEach(() => {
  cleanup()
  vi.mocked(getPublicSeal).mockReset()
  vi.restoreAllMocks()
})

function fillCode(value: string) {
  fireEvent.change(screen.getByLabelText('Código de verificación'), { target: { value } })
}

function submit() {
  fireEvent.click(screen.getByRole('button', { name: 'Verificar' }))
}

describe('VerifySealPage', () => {
  it('quita espacios y pasa a mayúsculas antes de consultar', async () => {
    vi.mocked(getPublicSeal).mockResolvedValue(null)
    render(<VerifySealPage />)

    fillCode(' abc 12 ')
    submit()

    await waitFor(() => {
      expect(getPublicSeal).toHaveBeenCalledWith('ABC12')
    })
  })

  it('un código con caracteres fuera de [0-9A-Z] o de más de 13 muestra error de campo y nunca llama al backend', () => {
    render(<VerifySealPage />)
    const input = screen.getByLabelText('Código de verificación')

    fillCode('RC-000123')
    submit()
    expect(within(screen.getByRole('alert')).getByText(/Escriba solo letras y números/)).toBeDefined()
    expect(input.getAttribute('aria-invalid')).toBe('true')

    fillCode('ABCDEFGHIJKLMN') // 14 caracteres
    submit()
    expect(within(screen.getByRole('alert')).getByText(/Escriba solo letras y números/)).toBeDefined()

    expect(getPublicSeal).not.toHaveBeenCalled()
  })

  it('con 200 muestra fecha (en la zona de la sede aun corriendo en UTC), estado, revisión y la limitación declarada, sin palabras de integridad', async () => {
    vi.stubEnv('TZ', 'UTC')
    try {
      const seal: PublicSeal = {
        status: 'ISSUED',
        issuedAt: '2026-09-17T23:30:00-05:00',
        stateName: 'En revisión de Coordinación',
        revision: 3,
      }
      vi.mocked(getPublicSeal).mockResolvedValue(seal)
      render(<VerifySealPage />)

      fillCode('ABC123')
      submit()

      await waitFor(() => {
        expect(screen.getByText(/17\/09\/2026/)).toBeDefined()
      })
      expect(screen.getByText(/En revisión de Coordinación/)).toBeDefined()
      expect(screen.getByText(/Revisión: 3/)).toBeDefined()
      expect(screen.getByText(/no detecta si su contenido se modificó/)).toBeDefined()
      expect(document.body.textContent).not.toMatch(/íntegro|auténtico|válido|alterado/i)
    } finally {
      vi.unstubAllEnvs()
    }
  })

  it('con 404 (null) dice que no hay documento emitido, sin palabras de falsedad', async () => {
    vi.mocked(getPublicSeal).mockResolvedValue(null)
    render(<VerifySealPage />)

    fillCode('ZZZZZZZZZZZZZ')
    submit()

    await waitFor(() => {
      expect(screen.getByText(/No hay ningún documento emitido con este código/)).toBeDefined()
    })
    expect(document.body.textContent).not.toMatch(/falso|alterado|inválido/i)
  })
})
