'use client'

import { FormEvent, useState } from 'react'
import { Bot, BookOpen, LoaderCircle, RotateCcw, Send, ShieldAlert, UserRound } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { askAssistant, type AssistantResponse } from '@/lib/api'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  response?: AssistantResponse
}

const SUGGESTIONS = [
  '¿Qué documentos necesito para una novedad de notas?',
  '¿Cuáles son los pasos generales de una adición de créditos?',
]

const FOLLOW_UP_SUGGESTIONS = [
  '¿Qué actor interviene después?',
  '¿Cuánto tiempo puede tardar el trámite?',
  '¿Qué debo hacer si no tengo todos los documentos?',
]

export default function AssistantPage() {
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedQuestion = question.trim()
    if (!trimmedQuestion || loading) return

    setError('')
    setQuestion('')
    setMessages((current) => [...current, { role: 'user', content: trimmedQuestion }])
    setLoading(true)
    try {
      const assistantResponse = await askAssistant(trimmedQuestion)
      // La conversación vive solo en memoria para no retener preguntas potencialmente personales.
      setMessages((current) => [...current, {
        role: 'assistant',
        content: assistantResponse.answer,
        response: assistantResponse,
      }])
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo consultar el asistente.')
    } finally {
      setLoading(false)
    }
  }

  function resetConversation() {
    setQuestion('')
    setMessages([])
    setError('')
  }

  return (
    <AppShell title="Asistente académico">
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <Card className="flex min-h-[600px] flex-col">
          <CardHeader className="border-b border-border">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Bot className="size-5" />
                </span>
                <div>
                  <CardTitle>Consulta documental</CardTitle>
                  <CardDescription className="mt-1">
                    Pregunta sobre los trámites académicos de la Sede Cali.
                  </CardDescription>
                </div>
              </div>
              {messages.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={resetConversation}
                  disabled={loading}
                  aria-label="Reiniciar consulta"
                  title="Reiniciar consulta"
                >
                  <RotateCcw className="size-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-4 p-4 sm:p-6">
            <div className="flex-1 space-y-4" aria-live="polite">
              {messages.length === 0 && (
                <div className="flex min-h-64 flex-col items-center justify-center text-center">
                  <BookOpen className="size-8 text-muted-foreground" />
                  <p className="mt-3 font-medium">Empieza una consulta</p>
                  <p className="mt-1 max-w-md text-sm text-muted-foreground">
                    El asistente solo responderá con información respaldada por fuentes institucionales validadas.
                  </p>
                  <div className="mt-5 flex flex-wrap justify-center gap-2">
                    {SUGGESTIONS.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => setQuestion(suggestion)}
                        className="rounded-lg border border-border px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((message, index) => (
                <div key={`${message.role}-${index}`} className={message.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                  <div className={message.role === 'user' ? 'max-w-[85%] rounded-xl bg-primary px-4 py-3 text-sm text-primary-foreground' : 'max-w-[92%] rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm'}>
                    <div className="flex items-start gap-2">
                      {message.role === 'user' ? <UserRound className="mt-0.5 size-4 shrink-0" /> : <Bot className="mt-0.5 size-4 shrink-0 text-primary" />}
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                    {message.response && (
                      <div className="mt-3 border-t border-border/70 pt-3">
                        <div className="text-xs text-muted-foreground">
                          <p>{message.response.disclaimer}</p>
                          {message.response.sources.length > 0 && (
                            <div className="mt-2 space-y-1">
                              <p className="font-semibold text-foreground">Fuentes consultadas</p>
                              {message.response.sources.map((source) => (
                                <p key={`${source.sourceId}-${source.version}`}>
                                  {source.title} · versión {source.version}{source.locator ? ` · ${source.locator}` : ''}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                        {index === messages.length - 1 && !loading && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {FOLLOW_UP_SUGGESTIONS.map((suggestion) => (
                              <Button
                                key={suggestion}
                                type="button"
                                variant="outline"
                                size="xs"
                                onClick={() => setQuestion(suggestion)}
                              >
                                {suggestion}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <LoaderCircle className="size-4 animate-spin" /> Consultando fuentes validadas...
                </div>
              )}
            </div>
            {error && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
            <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <Textarea
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="Escribe tu pregunta..."
                maxLength={2000}
                disabled={loading}
                aria-label="Pregunta para el asistente"
                className="min-h-20 resize-none sm:min-h-11"
              />
              <Button type="submit" disabled={loading || !question.trim()} className="h-11 gap-2 sm:w-auto">
                <Send className="size-4" />
                Consultar
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><ShieldAlert className="size-4 text-primary" /> Uso responsable</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>No incluyas contraseñas, tokens, números de documento ni datos de otros estudiantes.</p>
            <p>La respuesta es informativa y no aprueba, rechaza ni modifica solicitudes.</p>
            <p>Si no existe respaldo validado, el asistente derivará la consulta a la Coordinación.</p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}