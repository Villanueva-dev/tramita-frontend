import type { SignatureCapture } from '@/components/firma/canvas-firma'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FIELD_LABELS, type PublicRequestFormValues } from './sections'
import { FIELD_STEP, STEPS, type FieldStepId } from './steps'

// Los cuatro pasos con campos propios, en el orden fijo de STEPS; la revisión no tiene bloque.
// El type guard, no un `as`, es lo que le dice al compilador que `step.id` ya es `FieldStepId`
// (checklist «TypeScript»): un `as` ocultaría que la revisión quedó descartada.
const REVIEW_BLOCK_STEPS = STEPS.filter(
  (step): step is (typeof STEPS)[number] & { id: FieldStepId } => step.id !== 'review',
)

function fieldsOfStep(step: FieldStepId): (keyof PublicRequestFormValues)[] {
  return (Object.keys(FIELD_STEP) as (keyof PublicRequestFormValues | 'signature')[]).filter(
    (field): field is keyof PublicRequestFormValues => field !== 'signature' && FIELD_STEP[field] === step,
  )
}

export interface ReviewSummaryProps {
  values: PublicRequestFormValues
  signature: SignatureCapture
  onEdit: (step: FieldStepId) => void
}

/**
 * Resumen del paso «Revisar y enviar» (spec «Diligenciamiento por pasos»): un bloque por paso
 * con campos, con un botón «Cambiar» que lleva de vuelta a ese paso (`onEdit`). Desde ahí,
 * `page.tsx` recorre los pasos siguientes con «Continuar», validando cada uno, hasta volver aquí
 * (design.md, decisión 1). No dispara ningún envío: el botón de la revisión vive en
 * `StepNavigation` (`wizard.tsx`).
 */
export function ReviewSummary({ values, signature, onEdit }: ReviewSummaryProps) {
  return (
    <div className="flex flex-col gap-4">
      {REVIEW_BLOCK_STEPS.map((step) => (
        <Card key={step.id}>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle>{step.heading}</CardTitle>
            <Button
              type="button"
              variant="outline"
              onClick={() => onEdit(step.id)}
              aria-label={`Cambiar ${step.heading}`}
            >
              Cambiar
            </Button>
          </CardHeader>
          <CardContent>
            {step.id === 'signature' ? (
              signature.hayFirma ? (
                // `next/image` optimiza recursos remotos o estáticos; esta imagen es un `data:`
                // URL generado en el navegador por CanvasFirma, sin URL que optimizar.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={signature.dataUrl}
                  alt="Firma capturada del solicitante"
                  className="max-w-xs rounded-md border border-border"
                />
              ) : null
            ) : (
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {fieldsOfStep(step.id).map((field) => (
                  <div key={field}>
                    <dt className="text-sm text-muted-foreground">{FIELD_LABELS[field]}</dt>
                    <dd className="text-sm font-medium">{values[field]}</dd>
                  </div>
                ))}
              </dl>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
