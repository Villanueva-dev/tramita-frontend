import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { STATUS_LABELS } from '@/lib/mock-data'
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

export function StatusBadge({ status }: { status: RequestStatus }) {
  return <Badge variant={statusVariant[status]}>{STATUS_LABELS[status]}</Badge>
}
