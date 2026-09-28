import type { ReactNode, RefObject } from 'react'
import { Button } from '@/components/ui/button'
import { STEPS, type StepId } from './steps'

/**
 * Módulos presentacionales del asistente (design.md, decisión 1). `page.tsx` sigue siendo el
 * único dueño del estado; estos tres componentes solo reciben props y disparan los callbacks
 * que el container les pasa.
 */

interface StepPanelProps {
  step: StepId
  active: boolean
  headingRef: RefObject<HTMLHeadingElement | null>
  panelRef: RefObject<HTMLElement | null>
  children: ReactNode
}

/**
 * Un paso del asistente, siempre montado (D2): el inactivo queda oculto con `hidden`, que
 * Tailwind fuerza a `display: none` (design.md, decisión 7) — `CanvasFirma` no se desmonta al
 * cambiar de paso. El encabezado usa el nombre del bloque del papel (`STEPS[].heading`) y es
 * enfocable (`tabIndex={-1}`) para que `goToStep` pueda moverle el foco (decisión 6); solo el
 * panel activo recibe `headingRef`/`panelRef`, así `focusFirstInvalid()` nunca consulta un panel
 * oculto ni una ref apunta a un nodo que ya no es el activo.
 */
export function StepPanel({ step, active, headingRef, panelRef, children }: StepPanelProps) {
  const heading = STEPS.find((candidate) => candidate.id === step)?.heading ?? ''

  return (
    <section hidden={!active} ref={active ? panelRef : undefined}>
      <h2 tabIndex={-1} ref={active ? headingRef : undefined}>
        {heading}
      </h2>
      {children}
    </section>
  )
}

interface StepProgressProps {
  current: StepId
  stepsWithErrors: ReadonlySet<StepId>
}

/**
 * Barra de progreso de solo lectura (spec «Diligenciamiento por pasos»): indica el paso activo
 * y marca los pasos con error de dos formas — `data-error` (para pruebas y para quien integre un
 * estilo propio) y la clase `text-destructive` (visible para quien ve la pantalla, no solo para
 * quien usa lector de pantalla; el 422 de la spec exige que la barra "marque" el paso, no solo
 * que lo anuncie). Sin ningún elemento interactivo: la spec exige que sus elementos no respondan
 * a una interacción del estudiante, así que no puede usarse para saltar de paso.
 */
export function StepProgress({ current, stepsWithErrors }: StepProgressProps) {
  return (
    <ol aria-label="Progreso del asistente" className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
      {STEPS.map((step) => {
        const isCurrent = step.id === current
        const hasError = stepsWithErrors.has(step.id)
        const weightClass = isCurrent ? 'font-semibold' : 'font-normal'
        // El color de error pisa al del paso activo (en vez de combinarse) para que la marca de
        // error sea igual de visible esté o no el paso activo, conservando el peso de fuente que
        // distingue al paso activo.
        const colorClass = hasError ? 'text-destructive' : isCurrent ? 'text-foreground' : 'text-muted-foreground'
        return (
          <li
            key={step.id}
            aria-current={isCurrent ? 'step' : undefined}
            data-error={hasError ? 'true' : undefined}
            className={`${weightClass} ${colorClass}`}
          >
            {step.label}
            {hasError ? <span className="sr-only"> (con errores)</span> : null}
          </li>
        )
      })}
    </ol>
  )
}

interface StepNavigationProps {
  step: StepId
  isSubmitting: boolean
  onBack: () => void
}

/**
 * Un único botón de envío por paso (design.md, decisión 4): «Continuar» valida y avanza; en la
 * revisión, el mismo botón dispara la petición («Enviar solicitud»). El despacho según el paso
 * vive en el `onSubmit` del `<form>` de `page.tsx`, no aquí. «Volver» es `type="button"` (para
 * no disparar el envío implícito) y no aparece en el primer paso.
 */
export function StepNavigation({ step, isSubmitting, onBack }: StepNavigationProps) {
  const isFirstStep = step === STEPS[0]?.id
  const isReview = step === 'review'

  return (
    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
      {isFirstStep ? null : (
        <Button type="button" variant="outline" size="lg" className="h-13 w-full sm:w-auto" onClick={onBack}>
          Volver
        </Button>
      )}
      <Button type="submit" size="lg" disabled={isSubmitting} className="h-13 w-full sm:w-auto sm:self-end">
        {isReview ? (isSubmitting ? 'Enviando solicitud...' : 'Enviar solicitud') : 'Continuar'}
      </Button>
    </div>
  )
}
