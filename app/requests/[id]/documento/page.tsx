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
  Printer,
  ShieldCheck,
} from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { isClosed } from '@/lib/request-state'
import { PdfDocument } from '@/components/pdf-document'
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
  const [downloaded, setDownloaded] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    // Permite abrir el documento directamente o después de actualizar la página.
    void refreshRequest(params.id)
      .catch((reason) => setError(reason instanceof Error ? reason.message : 'No se pudo cargar la solicitud.'))
      .finally(() => setLoading(false))
  }, [params.id, refreshRequest])

  useEffect(() => {
    if (!downloaded) return
    const t = setTimeout(() => setDownloaded(false), 3500)
    return () => clearTimeout(t)
  }, [downloaded])

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
        anchor.download = filenameFromContentDisposition(
          response.headers?.get('Content-Disposition') ?? null,
          `documento_${params.id}.pdf`,
        )
        anchor.click()
        URL.revokeObjectURL(url)
        setDownloaded(true)
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

  const closed = isClosed(req)

  return (
    <AppShell title={closed ? 'Documento formal' : 'Documento de la solicitud'}>
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
                {closed ? <ShieldCheck className="size-5" /> : <FileText className="size-5" />}
              </span>
              <div>
                <h2 className="font-serif text-lg font-bold tracking-tight">
                  {closed ? 'Documento oficial de cierre' : 'Documento de la solicitud'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {closed ? (
                    <>
                      Este documento constituye la constancia formal del trámite{' '}
                      <span className="font-medium text-foreground">{req.radicado}</span>{' '}
                      y fue notificado al estudiante.
                    </>
                  ) : (
                    <>
                      Información registrada para el trámite{' '}
                      <span className="font-medium text-foreground">{req.radicado}</span>{' '}
                      en su estado actual.
                    </>
                  )}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => window.print()}
              >
                <Printer className="size-4" />
                Imprimir
              </Button>
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

        {downloaded && (
          <div className="flex items-center gap-3 rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
            <CheckCircle2 className="size-5 shrink-0" />
            <span>
              Documento{' '}
              <span className="font-semibold">
                constancia_{req.radicado}.pdf
              </span>{' '}
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

        {/* Document preview */}
        <div className="rounded-xl border border-border bg-muted/40 p-3 sm:p-8">
          <PdfDocument request={req} />
        </div>
      </div>
    </AppShell>
  )
}
