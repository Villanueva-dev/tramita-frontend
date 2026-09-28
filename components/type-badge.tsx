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

/**
 * `className` es un passthrough opcional (issue #56, T1): la bandeja paginada lo usa para
 * mostrarlo a 16 px sin duplicar este componente. Sin la prop, el aspecto por defecto no
 * cambia —`Badge` la recibe como `undefined`—, porque este mismo componente es compartido
 * con el detalle del trámite.
 */
export function TypeBadge({ code, name, className }: { code: string; name: string; className?: string }) {
  // `ICON_BY_CODE[code]` resolvería claves heredadas del prototipo (p. ej. "constructor")
  // en vez de `undefined`: `hasOwn` distingue una clave propia de una heredada.
  const { Icon, testId } = Object.hasOwn(ICON_BY_CODE, code) ? ICON_BY_CODE[code] : NEUTRAL_ICON
  return (
    <Badge variant="info" className={className}>
      <Icon data-testid={testId} />
      {name}
    </Badge>
  )
}
