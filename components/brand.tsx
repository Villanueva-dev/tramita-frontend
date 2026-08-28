import { cn } from '@/lib/utils'

export function Logo({
  className,
  variant = 'default',
}: {
  className?: string
  variant?: 'default' | 'light'
}) {
  const isLight = variant === 'light'
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <span
        aria-hidden
        className={cn(
          'grid size-9 place-items-center rounded-lg font-serif text-lg font-bold',
          isLight
            ? 'bg-primary-foreground text-primary'
            : 'bg-primary text-primary-foreground',
        )}
      >
        T
      </span>
      <div className="flex flex-col leading-none">
        <span
          className={cn(
            'font-serif text-lg font-bold tracking-tight',
            isLight ? 'text-primary-foreground' : 'text-foreground',
          )}
        >
          Trámita
        </span>
        <span
          className={cn(
            'text-[11px] font-medium',
            isLight ? 'text-primary-foreground/70' : 'text-muted-foreground',
          )}
        >
          U. Remington · Sede Cali
        </span>
      </div>
    </div>
  )
}
