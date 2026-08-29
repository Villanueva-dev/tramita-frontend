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

/** Elige trámite y llena los dos campos. Los valores se pasan crudos a propósito. */
function fill({
  definition = 'ADICION_CREDITOS',
  name = 'Ana Pérez',
  document = '1000000001',
}: { definition?: string | null; name?: string; document?: string } = {}) {
  if (definition !== null) {
    fireEvent.change(screen.getByLabelText(/tipo de trámite/i), { target: { value: definition } })
  }
  fireEvent.change(screen.getByLabelText(/nombre completo/i), { target: { value: name } })
  fireEvent.change(screen.getByLabelText(/cédula/i), { target: { value: document } })
}

function submit() {
  fireEvent.click(screen.getByRole('button', { name: /registrar solicitud/i }))
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
    // Exactamente las definiciones del servidor, sin contar el placeholder:
    // ningún trámite hardcodeado.
    const real = screen
      .getAllByRole<HTMLOptionElement>('option')
      .filter((o) => o.value !== '')
    expect(real.map((o) => o.value)).toEqual(DEFINITIONS.map((d) => d.code))
    // No se preselecciona ninguno: elegir el trámite es un acto deliberado.
    expect(screen.getByLabelText<HTMLSelectElement>(/tipo de trámite/i).value).toBe('')
  })

  it('rechaza un nombre de solo espacios sin llamar al backend', async () => {
    const spy = stubFetch()
    await renderLoaded()

    fill({ name: '   ' })
    submit()

    await waitFor(() => {
      expect(screen.getByLabelText(/nombre completo/i).getAttribute('aria-invalid')).toBe('true')
    })
    expect(postCalls(spy)).toHaveLength(0)
  })

  it('rechaza un nombre de 121 caracteres sin llamar al backend', async () => {
    const spy = stubFetch()
    await renderLoaded()

    fill({ name: 'a'.repeat(121) })
    submit()

    await waitFor(() => {
      expect(screen.getByLabelText(/nombre completo/i).getAttribute('aria-invalid')).toBe('true')
    })
    expect(postCalls(spy)).toHaveLength(0)
  })

  it('envía los valores recortados', async () => {
    const spy = stubFetch()
    await renderLoaded()

    fill({ name: '  Ana Pérez  ', document: '  1000000001  ' })
    submit()

    await waitFor(() => expect(postCalls(spy)).toHaveLength(1))
    const [, init] = postCalls(spy)[0]
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({
      definitionCode: 'ADICION_CREDITOS',
      studentName: 'Ana Pérez',
      studentDocument: '1000000001',
    })
    // La spec US1 manda navegar al detalle de la solicitud creada, y el
    // `created=1` lo consume `[id]/page.tsx` para el aviso de alta.
    await waitFor(() => expect(push).toHaveBeenCalledWith('/requests/req-1?created=1'))
  })

  it('rechaza una cédula de solo espacios sin llamar al backend', async () => {
    const spy = stubFetch()
    await renderLoaded()

    fill({ document: '   ' })
    submit()

    await waitFor(() => {
      expect(screen.getByLabelText(/cédula/i).getAttribute('aria-invalid')).toBe('true')
    })
    expect(postCalls(spy)).toHaveLength(0)
  })

  it('rechaza una cédula de 21 caracteres sin llamar al backend', async () => {
    const spy = stubFetch()
    await renderLoaded()

    fill({ document: '9'.repeat(21) })
    submit()

    await waitFor(() => {
      expect(screen.getByLabelText(/cédula/i).getAttribute('aria-invalid')).toBe('true')
    })
    expect(postCalls(spy)).toHaveLength(0)
  })

  it('exige elegir el trámite: sin selección no se emite el POST', async () => {
    const spy = stubFetch()
    await renderLoaded()

    fill({ definition: null })
    submit()

    await waitFor(() => {
      expect(screen.getByLabelText(/tipo de trámite/i).getAttribute('aria-invalid')).toBe('true')
    })
    expect(postCalls(spy)).toHaveLength(0)
  })

  it('ata el 422 al campo del selector, no a un banner genérico', async () => {
    stubFetch(() =>
      problemResponse(422, 'Regla de negocio incumplida', "El tipo de trámite 'X' no existe en la configuración"),
    )
    await renderLoaded()

    fill()
    submit()

    await waitFor(() => {
      expect(screen.getByLabelText(/tipo de trámite/i).getAttribute('aria-invalid')).toBe('true')
    })
    expect(push).not.toHaveBeenCalled()
  })
})
