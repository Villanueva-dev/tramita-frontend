'use client'

/**
 * Deferred to SP3 / Sprint 2 — formal document generation.
 *
 * This page used to render a full constancia from the V0 mock model, with a
 * simulated download and print action. The workflow engine (002) does not
 * expose the data that document needs, so the screen is reduced to a stub
 * rather than kept alive against fields that no longer exist.
 *
 * Recover the original implementation with:
 *   git show 9d9c53c:app/requests/[id]/documento/page.tsx
 *   git show 9d9c53c:components/pdf-document.tsx
 *
 * Missing from the 002 contract, required before this can be rebuilt:
 *   radicado       formal filing number
 *   program        academic program
 *   semester       academic term
 *   subjects[]     subject list with credit counts
 *   reason         free-text justification
 *   studentCedula, studentCode, studentEmail
 *   signature      approver's signature image
 *   seal           institutional seal
 *
 * The engine currently serves only the request, its current state, its
 * available transitions and its timeline.
 */

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, FileClock } from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function DocumentoPage() {
  const params = useParams<{ id: string }>()

  return (
    <AppShell title="Documento formal">
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <Link
          href={`/requests/${params.id}`}
          className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Volver a la solicitud
        </Link>

        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-14 text-center">
            <span className="grid size-14 place-items-center rounded-full bg-muted text-muted-foreground">
              <FileClock className="size-7" />
            </span>
            <div className="flex flex-col gap-1.5">
              <h2 className="text-lg font-semibold tracking-tight">
                La generación del documento aún no está disponible
              </h2>
              <p className="text-sm text-muted-foreground">
                La constancia formal se implementa en el Sprint 2. El motor de
                trámites todavía no registra los datos que el documento exige
                —radicado, programa, semestre, asignaturas, motivo, firma y
                sello—, de modo que esta pantalla queda como marcador de
                posición en lugar de mostrar un documento incompleto.
              </p>
            </div>
            <Link href={`/requests/${params.id}`}>
              <Button variant="outline">Volver a la solicitud</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
