import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import NewRequestPage from './page'

// El shell arrastra useAuth, usePathname y el Logo: nada de eso es lo que se
// prueba acá. Se sustituye por un contenedor mínimo.
vi.mock('@/components/app-shell', () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

const push = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}))

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function problemResponse(status: number, title: string, detail?: string): Response {
  return new Response(JSON.stringify({ title, status, detail }), {
    status,
    headers: { 'Content-Type': 'application/problem+json' },
  })
}

const DEFINITIONS = [
  { code: 'ADICION_CREDITOS', name: 'Adición de créditos', version: 1 },
  { code: 'NOVEDAD_NOTAS', name: 'Novedad de notas', version: 1 },
]

/**
 * Enruta por URL: el catálogo siempre responde, y el POST se configura por
 * prueba. Devuelve el espía para poder afirmar que el POST NO se emitió.
 */
function stubFetch(onPost: () => Response = () => jsonResponse(201, { id: 'req-1' })) {
  const spy = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    if (url.includes('/workflow-definitions')) {
      return Promise.resolve(jsonResponse(200, DEFINITIONS))
    }
    if (url.includes('/requests') && init?.method === 'POST') {
      return Promise.resolve(onPost())
    }
    throw new Error(`URL no esperada en la prueba: ${url}`)
  })
  vi.stubGlobal('fetch', spy)
  return spy
}

/** Espera a que el catálogo haya poblado el selector. */
async function renderLoaded() {
  render(<NewRequestPage />)
  await waitFor(() => {
    expect(screen.getByRole('option', { name: 'Adición de créditos' })).toBeDefined()
  })
}

function postCalls(spy: ReturnType<typeof stubFetch>) {
  return spy.mock.calls.filter(([, init]) => (init as RequestInit)?.method === 'POST')
}

beforeEach(() => {
  push.mockClear()
})

afterEach(() => {
  // cleanup() a mano: el auto-cleanup de @testing-library/react se registra vía
  // los hooks globales de la suite, y vitest.config.mts no activa `globals`.
  // Sin esto los renders se acumulan entre pruebas y toda consulta falla con
  // "Found multiple elements".
  cleanup()
  vi.unstubAllGlobals()
})

describe('formulario de registro (US1)', () => {
  it('puebla el selector desde el catálogo del servidor', async () => {
    stubFetch()
    await renderLoaded()

    expect(screen.getByRole('option', { name: 'Novedad de notas' })).toBeDefined()
    // Exactamente las definiciones del servidor: ningún trámite hardcodeado.
    expect(screen.getAllByRole('option')).toHaveLength(DEFINITIONS.length)
  })

  it('rechaza un nombre de solo espacios sin llamar al backend', async () => {
    const spy = stubFetch()
    await renderLoaded()

    fireEvent.change(screen.getByLabelText(/nombre completo/i), {
      target: { value: '   ' },
    })
    fireEvent.change(screen.getByLabelText(/cédula/i), {
      target: { value: '1000000001' },
    })
    fireEvent.click(screen.getByRole('button', { name: /registrar solicitud/i }))

    await waitFor(() => {
      expect(screen.getByLabelText(/nombre completo/i).getAttribute('aria-invalid')).toBe('true')
    })
    expect(postCalls(spy)).toHaveLength(0)
  })

  it('rechaza un nombre de 121 caracteres sin llamar al backend', async () => {
    const spy = stubFetch()
    await renderLoaded()

    fireEvent.change(screen.getByLabelText(/nombre completo/i), {
      target: { value: 'a'.repeat(121) },
    })
    fireEvent.change(screen.getByLabelText(/cédula/i), {
      target: { value: '1000000001' },
    })
    fireEvent.click(screen.getByRole('button', { name: /registrar solicitud/i }))

    await waitFor(() => {
      expect(screen.getByLabelText(/nombre completo/i).getAttribute('aria-invalid')).toBe('true')
    })
    expect(postCalls(spy)).toHaveLength(0)
  })

  it('envía los valores recortados', async () => {
    const spy = stubFetch()
    await renderLoaded()

    fireEvent.change(screen.getByLabelText(/nombre completo/i), {
      target: { value: '  Ana Pérez  ' },
    })
    fireEvent.change(screen.getByLabelText(/cédula/i), {
      target: { value: '  1000000001  ' },
    })
    fireEvent.click(screen.getByRole('button', { name: /registrar solicitud/i }))

    await waitFor(() => expect(postCalls(spy)).toHaveLength(1))
    const [, init] = postCalls(spy)[0]
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({
      definitionCode: 'ADICION_CREDITOS',
      studentName: 'Ana Pérez',
      studentDocument: '1000000001',
    })
  })

  it('ata el 422 al campo del selector, no a un banner genérico', async () => {
    stubFetch(() =>
      problemResponse(422, 'Regla de negocio incumplida', "El tipo de trámite 'X' no existe en la configuración"),
    )
    await renderLoaded()

    fireEvent.change(screen.getByLabelText(/nombre completo/i), {
      target: { value: 'Ana Pérez' },
    })
    fireEvent.change(screen.getByLabelText(/cédula/i), {
      target: { value: '1000000001' },
    })
    fireEvent.click(screen.getByRole('button', { name: /registrar solicitud/i }))

    await waitFor(() => {
      expect(screen.getByLabelText(/tipo de trámite/i).getAttribute('aria-invalid')).toBe('true')
    })
    expect(push).not.toHaveBeenCalled()
  })
})
