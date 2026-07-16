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
import { PdfDocument } from '@/components/pdf-document'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useTramita } from '@/lib/store'
import { formatDateTime } from '@/lib/format'

export default function DocumentoPage() {
  const params = useParams<{ id: string }>()
  const { getRequest } = useTramita()
  const req = getRequest(params.id)
  const [downloading, setDownloading] = useState(false)
  const [downloaded, setDownloaded] = useState(false)

  useEffect(() => {
    if (!downloaded) return
    const t = setTimeout(() => setDownloaded(false), 3500)
    return () => clearTimeout(t)
  }, [downloaded])

  function handleDownload() {
    setDownloading(true)
    setTimeout(() => {
      setDownloading(false)
      setDownloaded(true)
    }, 1400)
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

  if (req.status !== 'finalizado') {
    return (
      <AppShell title="Documento">
        <div className="mx-auto flex max-w-lg flex-col items-center gap-4 py-20 text-center">
          <span className="grid size-14 place-items-center rounded-full bg-warning/15 text-warning">
            <FileText className="size-7" />
          </span>
          <div>
            <h2 className="text-lg font-semibold">
              El documento aún no ha sido generado
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              El documento formal se genera automáticamente cuando el trámite{' '}
              <span className="font-medium">{req.radicado}</span> se finaliza.
              Complete el flujo de trabajo para habilitar la descarga.
            </p>
          </div>
          <Link href={`/requests/${req.id}`}>
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="size-4" />
              Volver a la solicitud
            </Button>
          </Link>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell title="Documento formal">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <Link
          href={`/requests/${req.id}`}
          className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Volver a la solicitud
        </Link>

        {/* Header banner emphasizing formal closure */}
        <Card className="border-primary/20 bg-primary/[0.03]">
          <CardContent className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
                <ShieldCheck className="size-5" />
              </span>
              <div>
                <h2 className="font-serif text-lg font-bold tracking-tight">
                  Documento oficial de cierre
                </h2>
                <p className="text-sm text-muted-foreground">
                  Este documento constituye la constancia formal del trámite{' '}
                  <span className="font-medium text-foreground">
                    {req.radicado}
                  </span>{' '}
                  y fue notificado al estudiante.
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

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ['Radicado', req.radicado],
            ['Estado', 'Finalizado'],
            ['Estudiante', req.studentName],
            ['Generado', formatDateTime(req.updatedAt)],
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
