'use client'

import {
  Clock,
  Loader,
  CheckCircle2,
  AlertTriangle,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import type { AcademicRequest } from '@/lib/types'
import { isClosed, isReturnedForCorrection, isSuccessfullyClosed } from '@/lib/request-state'

interface CardDef {
  key: string
  label: string
  value: number
  hint: string
  icon: LucideIcon
  accent: string
  iconBg: string
}

export function SummaryCards({
  requests,
  active,
  onSelect,
}: {
  requests: AcademicRequest[]
  active: string
  onSelect: (key: string) => void
}) {
  const pending = requests.filter((r) => r.status === 'pendiente').length
  const inProgress = requests.filter(
    (r) => r.status === 'en_revision' || isReturnedForCorrection(r),
  ).length
  // Un rechazo es final, así que contarlo por el cierre lo presentaba como trabajo
  // cumplido (#35). `isSuccessfullyClosed` separa el cierre exitoso del negado, que el
  // contrato colapsa en un mismo `isFinal`. El 'aprobado' se conserva tal cual: nace de
  // APROBADA_FACULTAD, que NO es un estado final, y sacarlo cambiaría lo que la tarjeta
  // cuenta hoy — es otra decisión, no la que esta corrección viene a hacer.
  const completed = requests.filter(
    (r) => isSuccessfullyClosed(r) || r.status === 'aprobado',
  ).length
  const urgent = requests.filter(
    (r) => r.priority === 'urgente' && !isClosed(r),
  ).length

  const cards: CardDef[] = [
    {
      key: 'pendiente',
      label: 'Pendientes',
      value: pending,
      hint: 'Requieren primer contacto',
      icon: Clock,
      accent: 'text-warning-foreground',
      iconBg: 'bg-warning/20 text-warning-foreground',
    },
    {
      key: 'en_proceso',
      label: 'En proceso',
      value: inProgress,
      hint: 'En revisión o devueltas',
      icon: Loader,
      accent: 'text-primary',
      iconBg: 'bg-primary/10 text-primary',
    },
    {
      key: 'completado',
      label: 'Completadas',
      value: completed,
      hint: 'Aprobadas o finalizadas',
      icon: CheckCircle2,
      accent: 'text-success',
      iconBg: 'bg-success/12 text-success',
    },
    {
      key: 'urgente',
      label: 'Urgentes',
      value: urgent,
      hint: 'Atención prioritaria',
      icon: AlertTriangle,
      accent: 'text-destructive',
      iconBg: 'bg-destructive/12 text-destructive',
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((c) => {
        const Icon = c.icon
        const selected = active === c.key
        return (
          <Card
            key={c.key}
            role="button"
            tabIndex={0}
            onClick={() => onSelect(selected ? 'todos' : c.key)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onSelect(selected ? 'todos' : c.key)
              }
            }}
            className={cn(
              'cursor-pointer p-5 transition-all hover:shadow-md',
              selected && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
            )}
          >
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-muted-foreground">
                  {c.label}
                </span>
                <span className={cn('text-3xl font-bold tracking-tight', c.accent)}>
                  {c.value}
                </span>
              </div>
              <span
                className={cn(
                  'grid size-10 place-items-center rounded-lg',
                  c.iconBg,
                )}
              >
                <Icon className="size-5" />
              </span>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">{c.hint}</p>
          </Card>
        )
      })}
    </div>
  )
}
