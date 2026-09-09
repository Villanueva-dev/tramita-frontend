# Archive Report — fase-b-integracion-motor-workflow

**Fecha de archivado**: 2026-09-08
**Artifact store**: openspec
**Archivado en**: `openspec/changes/archive/2026-09-08-fase-b-integracion-motor-workflow/`

## Resultado

Ciclo SDD completo. La change integró el frontend con el motor de workflow del backend (002),
retirando el modelo mockeado y trasladando trámites, estados y acciones al servidor.

| Artefacto | Estado |
|---|---|
| `proposal.md` | ✅ |
| `design.md` | ✅ |
| `specs/` (3 capabilities) | ✅ consolidadas |
| `tasks.md` | ✅ 25/25 |
| `apply-progress.md` | ✅ |
| `verify-report.md` | ✅ `pass_with_warnings` |

## Capabilities consolidadas

Primer archivado del proyecto: `openspec/specs/` **no existía** y se creó con este cierre. Las
tres specs eran completas (no deltas), así que se copiaron mecánicamente y se verificaron con
`diff -r`:

| Capability | Destino | Líneas |
|---|---|---|
| `request-timeline` | `openspec/specs/request-timeline/spec.md` | 68 |
| `request-transitions` | `openspec/specs/request-transitions/spec.md` | 112 |
| `workflow-requests` | `openspec/specs/workflow-requests/spec.md` | 185 |

## Verificación al cierre

- `gentle-ai sdd-verify-validate --requirements 11 --scenarios 35` → `valid: true`,
  `verdict: pass_with_warnings`
- **35/35 escenarios**, **11/11 requisitos**
- `pnpm test` → 114/114 · `pnpm exec tsc --noEmit` → exit 0 · `pnpm build` limpio
- 0 CRITICAL · 2 WARNING no bloqueantes

## Recorrido de verificación — tres rondas

El cierre no fue directo y conviene que quede registrado:

1. **Ronda 1** → `partial`, 1 CRITICAL: faltaba `apply-progress` con tabla de TDD Cycle Evidence,
   exigida por `strict_tdd: true`. **Remediado** reconstruyéndolo desde el historial de git.
2. **Ronda 2** → `fail`: cerró el CRITICAL anterior (auditado con topología del merge,
   `git patch-id --stable` y reproducción de conteos de test en un worktree temporal), pero
   elevó 3 WARNING a CRITICAL — 3 escenarios de spec sin test, conteo 32/35. **Remediado**
   escribiendo los tres tests.
3. **Ronda 3** → `pass_with_warnings`, 35/35. Archive desbloqueado.

## Salvedades que el cierre conserva

- **Los 3 tests de la ronda 2 nacieron verdes.** Cubren comportamiento ya implementado: no hubo
  fase RED y **no constituyen TDD en sentido estricto**. Su poder de detección se comprobó con
  tres mutaciones dirigidas, cada una revertida tras confirmar que hacía fallar exactamente un
  test. Es **evidencia RED sustituta**, no un ciclo TDD completo.
- **Reparto de evidencia TDD de las 25 tareas**: 8 completas · 5 parciales (RED no separable,
  test e implementación en el mismo commit atómico) · 12 sin ciclo aplicable (borrados de código
  muerto y gates sin comportamiento nuevo que probar).
- **Un `evidence_revision` fabricado** por el verify de la ronda 1 se propagó a `apply-progress.md`
  y se corrigió antes del cierre, dejando nota de trazabilidad. Ver §5 de ese artefacto.
- **WARNING vigente**: la aserción de `className` del test de antigüedad acopla a un detalle de
  implementación. Defendible porque el escenario es literalmente sobre estilo, pero limitado: no
  protegería contra una insignia agregada como elemento hermano.

## Deuda que sobrevive al archivado

- Rama local **`backup-fase-b-pre-rebase`** con una cédula real sin anonimizar en `39bdf6e`.
  **No está expuesta**: no es ancestro de `main` y nunca se pusheó. Decidir si se purga.
- `CLAUDE.md:78-79` afirma que `openspec/` está gitignorado; es falso desde `8ca0de9`.
