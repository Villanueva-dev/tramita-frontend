import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { WorkflowStageConfig } from '@/lib/types'

export function WorkflowStepper({
  stages,
  currentStageId,
  returned,
}: {
  stages: WorkflowStageConfig[]
  currentStageId: string
  returned?: boolean
}) {
  const currentIndex = stages.findIndex((s) => s.id === currentStageId)

  return (
    <ol className="flex flex-col gap-0 sm:flex-row sm:items-start sm:gap-0">
      {stages.map((stage, i) => {
        const done = i < currentIndex
        const active = i === currentIndex
        const isLast = i === stages.length - 1
        return (
          <li
            key={stage.id}
            className="flex flex-1 gap-3 sm:flex-col sm:gap-2"
          >
            <div className="flex flex-col items-center sm:w-full sm:flex-row">
              <span
                className={cn(
                  'grid size-8 shrink-0 place-items-center rounded-full border-2 text-xs font-semibold transition-colors',
                  done && 'border-primary bg-primary text-primary-foreground',
                  active &&
                    (returned
                      ? 'border-destructive bg-destructive/10 text-destructive'
                      : 'border-primary bg-primary/10 text-primary'),
                  !done && !active && 'border-border bg-card text-muted-foreground',
                )}
              >
                {done ? <Check className="size-4" /> : i + 1}
              </span>
              {!isLast && (
                <span
                  className={cn(
                    'my-1 h-6 w-px sm:mx-2 sm:my-0 sm:h-px sm:flex-1',
                    done ? 'bg-primary' : 'bg-border',
                  )}
                />
              )}
            </div>
            <div className="pb-4 sm:pb-0 sm:pr-4">
              <p
                className={cn(
                  'text-sm font-medium',
                  active ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                {stage.label}
              </p>
              <p className="text-xs text-muted-foreground">
                {stage.description}
              </p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
