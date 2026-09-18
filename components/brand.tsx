import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { STATUS_LABELS } from '@/lib/ui-constants'
import { statusVariant } from '@/lib/format'
import type { RequestStatus } from '@/lib/types'
import Image from 'next/image'

export function Logo({
  className,
  variant = 'default',
}: {
  className?: string
  variant?: 'default' | 'light'
}) {
  return (
    <div
      className={cn(
        'relative h-16 w-52 overflow-hidden rounded-md bg-white sm:h-[4.5rem] sm:w-60',
        className,
      )}
    >
      <Image
        src="/tramita-logo.jpeg"
        alt="Trámita Universidad Remington"
        fill
        priority
        sizes="(min-width: 640px) 240px, 208px"
        className="object-cover object-center"
      />
    </div>
  )
}

/**
 * El color sale de `status` (la categoría con la que se filtra); el texto, del
 * nombre que envía el motor de workflow. Sin `stateName` se cae a la etiqueta
 * genérica, que no distingue «Rechazada» de «Finalizada».
 */
export function StatusBadge({ status, stateName }: { status: RequestStatus; stateName?: string }) {
  return <Badge variant={statusVariant[status]}>{stateName || STATUS_LABELS[status]}</Badge>
}
