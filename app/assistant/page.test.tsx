import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import AssistantPage from './page'

const askAssistant = vi.hoisted(() => vi.fn())

vi.mock('@/components/app-shell', () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))
vi.mock('@/lib/api', () => ({ askAssistant }))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('AssistantPage', () => {
  it('muestra opciones de seguimiento después de una respuesta', async () => {
    askAssistant.mockResolvedValue({
      answer: 'El trámite puede tardar entre una semana y dos meses.',
      grounded: true,
      sources: [],
      disclaimer: 'Orientación informativa.',
    })
    render(<AssistantPage />)

    fireEvent.change(screen.getByLabelText('Pregunta para el asistente'), {
      target: { value: '¿Cuánto tarda un trámite?' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Consultar' }))

    await screen.findByText('El trámite puede tardar entre una semana y dos meses.')

    const followUps = screen.getAllByRole('button', { name: /^¿/ })
    expect(followUps).toHaveLength(3)
    const selectedQuestion = followUps[0].textContent ?? ''
    fireEvent.click(followUps[0])
    expect((screen.getByLabelText('Pregunta para el asistente') as HTMLTextAreaElement).value)
      .toBe(selectedQuestion)
  })

  it('reinicia la conversación local sin consultar el backend', async () => {
    askAssistant.mockResolvedValue({
      answer: 'Respuesta respaldada.',
      grounded: true,
      sources: [],
      disclaimer: 'Orientación informativa.',
    })
    render(<AssistantPage />)

    fireEvent.change(screen.getByLabelText('Pregunta para el asistente'), {
      target: { value: 'Consulta inicial' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Consultar' }))
    await screen.findByText('Respuesta respaldada.')

    fireEvent.click(screen.getByRole('button', { name: 'Reiniciar consulta' }))

    await waitFor(() => expect(screen.getByText('Empieza una consulta')).toBeDefined())
    expect(screen.queryByText('Consulta inicial')).toBeNull()
    expect(askAssistant).toHaveBeenCalledTimes(1)
  })
})