import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import VerifySealPage from './page'
import { ApiError, getPublicSeal } from '@/lib/api'
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
    expect(input.getAttribute('aria-describedby')).toBe(screen.getByRole('alert').id)

    fillCode('ABCDEFGHIJKLMN') // 14 caracteres
    submit()
    expect(within(screen.getByRole('alert')).getByText(/Escriba solo letras y números/)).toBeDefined()

    fillCode('   ') // solo espacios: tras normalizar queda vacío
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
      // Sin una región viva montada desde el inicio, el lector de pantalla no anuncia el hallazgo.
      expect(
        within(screen.getByRole('status')).getByText('Trámita emitió un documento con este código.'),
      ).toBeDefined()
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

  it('si la consulta falla muestra el error de la API y no afirma que el documento no existe', async () => {
    vi.mocked(getPublicSeal).mockRejectedValue(new ApiError(500, 'Error interno del servidor'))
    render(<VerifySealPage />)

    fillCode('ABC123')
    submit()

    await waitFor(() => {
      expect(screen.getByText('Error interno del servidor')).toBeDefined()
    })
    expect(screen.queryByText(/No hay ningún documento emitido/)).toBeNull()
  })

  it('mientras consulta bloquea el campo y el botón, y editar después borra el resultado anterior', async () => {
    // Un resultado junto a un código distinto del consultado induciría a error.
    let resolveLookup!: (seal: PublicSeal | null) => void
    vi.mocked(getPublicSeal).mockReturnValue(
      new Promise((resolve) => {
        resolveLookup = resolve
      }),
    )
    render(<VerifySealPage />)
    const input = screen.getByLabelText('Código de verificación') as HTMLInputElement

    fillCode('ABC123')
    submit()
    expect(input.readOnly).toBe(true)
    expect(
      (screen.getByRole('button', { name: 'Verificando…' }) as HTMLButtonElement).disabled,
    ).toBe(true)

    resolveLookup(null)
    await waitFor(() => {
      expect(screen.getByText(/No hay ningún documento emitido/)).toBeDefined()
    })
    expect(input.readOnly).toBe(false)

    fillCode('ABC124')
    expect(screen.queryByText(/No hay ningún documento emitido/)).toBeNull()
  })
})
