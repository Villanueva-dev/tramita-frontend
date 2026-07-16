'use client'

import { useState } from 'react'
import {
  Building2,
  CheckCircle2,
  GitBranch,
  Plus,
  Save,
  Settings2,
  ShieldCheck,
  Trash2,
} from 'lucide-react'
import { AppShell } from '@/components/app-shell'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useTramita } from '@/lib/store'
import type { RequestTypeConfig } from '@/lib/types'

export default function SettingsPage() {
  const { workflowConfig, updateWorkflowConfig } = useTramita()
  const [config, setConfig] = useState<RequestTypeConfig[]>(() =>
    JSON.parse(JSON.stringify(workflowConfig)),
  )
  const [saved, setSaved] = useState(false)
  const [validateCedula, setValidateCedula] = useState(true)
  const [validateEmail, setValidateEmail] = useState(true)
  const [requireAttachment, setRequireAttachment] = useState(false)
  const [slaDays, setSlaDays] = useState('3')

  function updateType(id: string, patch: Partial<RequestTypeConfig>) {
    setConfig((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    )
  }

  function updateStageLabel(typeId: string, stageId: string, label: string) {
    setConfig((prev) =>
      prev.map((t) =>
        t.id === typeId
          ? {
              ...t,
              stages: t.stages.map((s) =>
                s.id === stageId ? { ...s, label } : s,
              ),
            }
          : t,
      ),
    )
  }

  function handleSave() {
    updateWorkflowConfig(config)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <AppShell title="Configuración">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h2 className="font-serif text-2xl font-bold tracking-tight">
            Configuración del flujo de trabajo
          </h2>
          <p className="text-sm text-muted-foreground">
            Personalice los tipos de trámite, las etapas del flujo y las reglas
            de validación. Trámita está diseñado como un motor de flujos
            configurable.
          </p>
        </div>

        {/* Institution info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="size-4 text-primary" />
              Institución
            </CardTitle>
            <CardDescription>
              Datos institucionales de la instancia actual (MVP: una sede).
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label>Institución</Label>
              <Input defaultValue="Universidad Remington" disabled />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Sede</Label>
              <Input defaultValue="Sede Cali" disabled />
            </div>
          </CardContent>
        </Card>

        {/* Request types + stages */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <GitBranch className="size-4 text-primary" />
              Tipos de trámite y etapas
            </CardTitle>
            <CardDescription>
              Active o desactive tipos de trámite y ajuste las etiquetas de cada
              etapa del flujo.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            {config.map((type) => (
              <div
                key={type.id}
                className="rounded-lg border border-border bg-muted/20 p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex flex-col gap-2">
                    <Input
                      value={type.label}
                      onChange={(e) =>
                        updateType(type.id, { label: e.target.value })
                      }
                      className="max-w-xs font-medium"
                    />
                    <p className="max-w-md text-xs text-muted-foreground">
                      {type.description}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      updateType(type.id, { enabled: !type.enabled })
                    }
                    className="inline-flex items-center gap-2 text-sm"
                    aria-pressed={type.enabled}
                  >
                    <span
                      className={`relative h-5 w-9 rounded-full transition-colors ${
                        type.enabled ? 'bg-primary' : 'bg-muted-foreground/30'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 size-4 rounded-full bg-white transition-transform ${
                          type.enabled ? 'translate-x-4' : 'translate-x-0.5'
                        }`}
                      />
                    </span>
                    <Badge variant={type.enabled ? 'success' : 'outline'}>
                      {type.enabled ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </button>
                </div>

                <div className="mt-4 flex flex-col gap-2">
                  <Label className="text-xs uppercase text-muted-foreground">
                    Etapas del flujo
                  </Label>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {type.stages.map((stage, i) => (
                      <div
                        key={stage.id}
                        className="flex items-center gap-2 rounded-md border border-border bg-card px-2.5 py-1.5"
                      >
                        <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {i + 1}
                        </span>
                        <Input
                          value={stage.label}
                          onChange={(e) =>
                            updateStageLabel(type.id, stage.id, e.target.value)
                          }
                          className="h-8 border-0 bg-transparent px-1 shadow-none focus-visible:ring-0"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            <Button variant="outline" className="w-fit gap-2" disabled>
              <Plus className="size-4" />
              Agregar tipo de trámite
              <span className="text-xs text-muted-foreground">(próximamente)</span>
            </Button>
          </CardContent>
        </Card>

        {/* Validation metadata */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="size-4 text-primary" />
              Reglas de validación
            </CardTitle>
            <CardDescription>
              Validación de datos en el origen para reducir errores y
              devoluciones.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {[
              {
                label: 'Validar formato de cédula',
                desc: 'Solo dígitos, entre 6 y 11 caracteres.',
                value: validateCedula,
                set: setValidateCedula,
              },
              {
                label: 'Validar correo institucional',
                desc: 'Debe pertenecer al dominio remington.edu.co.',
                value: validateEmail,
                set: setValidateEmail,
              },
              {
                label: 'Exigir al menos un adjunto',
                desc: 'La solicitud no puede radicarse sin soportes.',
                value: requireAttachment,
                set: setRequireAttachment,
              },
            ].map((rule) => (
              <div
                key={rule.label}
                className="flex items-center justify-between gap-4 border-b border-border/60 py-3 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium">{rule.label}</p>
                  <p className="text-xs text-muted-foreground">{rule.desc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => rule.set((v) => !v)}
                  aria-pressed={rule.value}
                  className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
                    rule.value ? 'bg-primary' : 'bg-muted-foreground/30'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 size-4 rounded-full bg-white transition-transform ${
                      rule.value ? 'translate-x-4' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            ))}
            <div className="flex items-center justify-between gap-4 pt-3">
              <div>
                <p className="text-sm font-medium">
                  Tiempo objetivo de atención (SLA)
                </p>
                <p className="text-xs text-muted-foreground">
                  Días hábiles antes de marcar una solicitud como vencida.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  value={slaDays}
                  onChange={(e) => setSlaDays(e.target.value)}
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">días</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save bar */}
        <div className="sticky bottom-4 flex items-center justify-between gap-3 rounded-xl border border-border bg-card/95 px-4 py-3 shadow-sm backdrop-blur">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Settings2 className="size-4" />
            Los cambios se aplican de forma local en esta demostración.
          </div>
          <div className="flex items-center gap-3">
            {saved && (
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-success">
                <CheckCircle2 className="size-4" />
                Guardado
              </span>
            )}
            <Button onClick={handleSave} className="gap-2">
              <Save className="size-4" />
              Guardar cambios
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
