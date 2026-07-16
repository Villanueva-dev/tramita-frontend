import { BookOpen, GraduationCap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { REQUEST_TYPE_LABELS } from '@/lib/mock-data'
import type { RequestType } from '@/lib/types'

export function TypeBadge({ type }: { type: RequestType }) {
  const Icon = type === 'adicion_creditos' ? GraduationCap : BookOpen
  return (
    <Badge variant="info">
      <Icon />
      {REQUEST_TYPE_LABELS[type]}
    </Badge>
  )
}
