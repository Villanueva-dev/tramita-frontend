'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
} from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useTramita } from '@/lib/store'
import { apiFetch, filenameFromContentDisposition, problemMessage } from '@/lib/api'
import { formatDateTime } from '@/lib/format'

export default function DocumentoPage() {
  const params = useParams<{ id: string }>()
  const { getRequest, refreshRequest } = useTramita()
  const req = getRequest(params.id)
  const [downloading, setDownloading] = useState(false)
  const [downloadedName, setDownloadedName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    // Permite abrir el documento directamente o después de actualizar la página.
    void refreshRequest(params.id)
      .catch((reason) => setError(reason instanceof Error ? reason.message : 'No se pudo cargar la solicitud.'))
      .finally(() => setLoading(false))
  }, [params.id, refreshRequest])

  useEffect(() => {
    if (!downloadedName) return
    const t = setTimeout(() => setDownloadedName(null), 3500)
    return () => clearTimeout(t)
  }, [downloadedName])

  function handleDownload() {
    setDownloading(true)
    setError('')
    void apiFetch(`/requests/${params.id}/document`)
      .then(async (response) => {
        if (!response.ok) throw new Error(await problemMessage(response, 'No se pudo generar el PDF.'))
        // La respuesta binaria se descarga como archivo real, no como simulación.
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const anchor = document.createElement('a')
        anchor.href = url
        // El nombre lo fija el backend: identifica el formato institucional (DO-FR-100) y
        // omite deliberadamente cédula y nombre. Reescribirlo acá rompía esa correspondencia.
        const filename = filenameFromContentDisposition(
          response.headers?.get('Content-Disposition') ?? null,
          `documento_${params.id}.pdf`,
        )
        anchor.download = filename
        anchor.click()
        URL.revokeObjectURL(url)
        setDownloadedName(filename)
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : 'No se pudo generar el PDF.'))
      .finally(() => {
        setDownloading(false)
      })
  }

  if (loading) {
    return <AppShell title="Documento"><div className="py-20 text-center text-sm text-muted-foreground">Cargando documento...</div></AppShell>
  }

  if (!req) {
    return (
      <AppShell title="Documento">
        <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-20 text-center">
          <span className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
            <FileText className="size-6" />
          </span>
          <h2 className="text-lg font-semibold">Documento no disponible</h2>
          <Link href="/dashboard">
            <Button variant="outline">Volver a la bandeja</Button>
          </Link>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell title="Documento de la solicitud">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <Link
          href={`/requests/${req.id}`}
          className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Volver a la solicitud
        </Link>

        <Card className="border-primary/20 bg-primary/[0.03]">
          <CardContent className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
                <FileText className="size-5" />
              </span>
              <div>
                <h2 className="font-serif text-lg font-bold tracking-tight">
                  Documento de la solicitud
                </h2>
                <p className="text-sm text-muted-foreground">
                  Información registrada para el trámite{' '}
                  <span className="font-medium text-foreground">{req.radicado}</span>{' '}
                  en su estado actual. El pie del PDF lleva el estado al emitir y un código
                  que se consulta en{' '}
                  <Link href="/verificar" className="font-medium text-primary hover:underline">
                    Verificar documento
                  </Link>
                  .
                </p>
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                className="gap-2"
                onClick={handleDownload}
                disabled={downloading}
              >
                {downloading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Generando…
                  </>
                ) : (
                  <>
                    <Download className="size-4" />
                    Descargar PDF
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {downloadedName && (
          <div className="flex items-center gap-3 rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
            <CheckCircle2 className="size-5 shrink-0" />
            <span>
              Documento{' '}
              <span className="font-semibold">{downloadedName}</span>{' '}
              descargado correctamente.
            </span>
          </div>
        )}
        {error && (
          <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ['Radicado', req.radicado],
            ['Estado', req.stateName],
            ['Estudiante', req.studentName],
            ['Última actualización', formatDateTime(req.updatedAt)],
          ].map(([k, v]) => (
            <div
              key={k}
              className="rounded-lg border border-border bg-card px-3 py-2.5"
            >
              <p className="text-xs text-muted-foreground">{k}</p>
              <p className="truncate text-sm font-medium">{v}</p>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
