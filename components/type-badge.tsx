import { CircleHelp, BookOpen, GraduationCap, type LucideIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

/**
 * Mapa decorativo por código de definición (D2). Nunca decide el rótulo —ese es siempre
 * `name`, el que envía el servidor—, solo el ícono. Un código que no está acá recibe el
 * ícono neutro: no reabre el #9(b), porque el nombre real sigue mostrándose.
 */
const ICON_BY_CODE: Record<string, { Icon: LucideIcon; testId: string }> = {
  ADICION_CREDITOS: { Icon: GraduationCap, testId: 'type-badge-icon-adicion' },
  NOVEDAD_NOTAS: { Icon: BookOpen, testId: 'type-badge-icon-novedad' },
}
const NEUTRAL_ICON = { Icon: CircleHelp, testId: 'type-badge-icon-neutral' }

export function TypeBadge({ code, name }: { code: string; name: string }) {
  const { Icon, testId } = ICON_BY_CODE[code] ?? NEUTRAL_ICON
  return (
    <Badge variant="info">
      <Icon data-testid={testId} />
      {name}
    </Badge>
  )
}
