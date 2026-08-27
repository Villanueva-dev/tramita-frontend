# Tasks: Fase B — integración con el motor de workflow

## Review Workload Forecast

Presupuesto de proyecto cacheado en preflight: **800 líneas** (no el default de 400 del skill).
Clasificación Low/Medium/High de abajo se evalúa contra esos 800.

| Field | Value |
|---|---|
| Estimated changed lines | ~2.700 (S1 ~200 · S2 ~550 · S3 ~1.660 medido · S4 ~1.120) |
| 800-line budget risk | High — S3 duplicaba el presupuesto, S4 también |
| Chained PRs recommended | Yes |
| Suggested split | PR1 → PR2 → **PR3a → PR3b** → **PR4a → PR4b** (S3 y S4 partidos) |

#### El watch-item de S3 se disparó (medido 2026-08-27)

La estimación original de ~800 se hizo sin medir los archivos. Medición re-ejecutable con
`wc -l app/requests/new/page.tsx app/dashboard/page.tsx components/dashboard/summary-cards.tsx components/dashboard/requests-table.tsx`:

| Tarea | Archivo | Hoy | Tras la tarea | Diff |
|---|---|---|---|---|
| 3.2 → **3a.1** | `app/requests/new/page.tsx` | **660** | ~150 | ~810 |
| 3.1 → 3b.1 | `lib/use-request-search.ts` | — | nuevo | ~120 |
| 3.3 → 3b.2 | `app/dashboard/page.tsx` | 239 | ~120 | ~360 |
| 3.4 → 3b.3 | `components/dashboard/summary-cards.tsx` | 132 | borrado | ~132 |
| 3.5 → 3b.4 | `components/dashboard/requests-table.tsx` | 161 | ~90 | ~250 |
| | | | | **~1.660** |

El criterio de conteo es **borrados + inserciones**, igual que se midió la Fase 2 (727 + 56 = 783,
dentro del presupuesto). `new/page.tsx` sola consume el presupuesto entero, así que el corte
natural la deja sola en 3a.
| Delivery strategy | ask-on-risk |
| Chain strategy | **`feature-branch-chain`** — decidido 2026-08-23 |

```text
Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High
```

### Estrategia de cadena (decidida 2026-08-23)

**`feature-branch-chain`**: PR1 apunta a la rama tracker `feature/fase-b`; cada PR hija apunta a
la PR anterior; **solo la tracker mergea a `main`**. Así `main` nunca ve el modelo a medio migrar
— que es el estado intermedio inevitable del Parallel Change.

    main
     └── feature/fase-b        (tracker, única que mergea a main)
          └── PR1 → PR2 → PR3a → PR3b → PR4a → PR4b

⚠️ **Profundidad 6** (era 5 antes del split de S3 del 2026-08-27): un cambio en PR1 obliga a
rebasear las cinco siguientes. Es el costo aceptado del Parallel Change, no un descuido del plan.
Por eso el review corre al cerrar **cada** PR, antes de abrir la siguiente.

### Suggested Work Units

Runtime harness común (sin runner e2e, `project.md:64`): `pnpm dev` + flujo manual en navegador.

| Unit | Goal | PR | Focused test | Rollback boundary |
|---|---|---|---|---|
| 1 | Fundación: tipos aditivos, funciones de dominio, `parseServerDateTime`/`daysSince` | PR1 (base `feature/fase-b`) | `pnpm test lib/format.test.ts lib/api.test.ts` | Revert PR1: nada más lo usa aún |
| 2 | Poda: borra stepper/settings, stub documento, badge app-shell | PR2 | `pnpm test` | Revert PR2 restaura las 3 pantallas |
| 3a | Registro: formulario de 3 campos contra `POST /requests` | PR3a (base PR2) | `pnpm test` + `tsc --noEmit` | Revert 3a: el formulario vuelve a mocks |
| 3b | Buscador puro: hook de búsqueda, dashboard y tabla | PR3b (base PR3a) | `pnpm test` (incl. `use-request-search`) | Revert 3b: dashboard vuelve a mocks |
| 4a | Detalle solo-lectura: hook, timeline, responsable, antigüedad | PR4a (base PR3b) | `pnpm test` + `tsc --noEmit` | Revert 4a: detalle vuelve a mocks (store aún vive) |
| 4b | Transiciones + errores 422/409/400/404 + borra store/mock-data/tipos viejos | PR4b (base PR4a) | `pnpm test` completo + `tsc --noEmit`; runtime: forzar 409 con dos pestañas | Revert 4b exige revertir también 4a |

Códigos de spec: **[WR]** workflow-requests · **[RT]** request-transitions · **[TL]** request-timeline.

## Fase 1: Fundación (Slice 1, PR1)

- [x] 1.1 RED+GREEN `lib/format.ts`: `parseServerDateTime` (respeta offset/`Z`; sin offset = UTC) y `daysSince(iso, now?)` — test con `TZ=America/Bogota` fija, con y sin offset. Bug obligatorio del slice 1.
- [x] 1.2 `lib/types.ts`: agregar `WorkflowDefinition`, `State`, `AvailableTransition`, `Request`, `RequestSummary`, `TimelineEntry` (aditivo, tipos viejos intactos). [WR]
- [x] 1.3 RED+GREEN `lib/api.ts`: `listWorkflowDefinitions`, `createRequest`, `searchRequests`, `getRequest`, `getRequestTimeline`, `advanceRequest` (reusan `apiFetch`/`parseProblem`) + mapa 422→campo (`createRequest`→`definitionCode`, `advanceRequest`→`note`), sin inspeccionar `detail` (D-E).

## Fase 2: Poda (Slice 2, PR2)

- [x] 2.1 Borrar `components/workflow-stepper.tsx` **y su uso**: el componente se renderizaba en `[id]/page.tsx:259`, no era un import huérfano — borrar solo el archivo rompía `tsc`, contra el criterio de esta misma fase. Sale la cadena completa: `useMemo` (5), import (23), `workflowConfig` del destructuring (89), el `useMemo` de `stages` (104-106) y el `<Card>` del stepper (253-265). Todo supresión. → `a5dc211`
- [x] 2.2 Borrar `app/settings/page.tsx`; quitar `/settings` de `NAV` y el icono `Settings` en `components/app-shell.tsx`. → `fdd8cf9`
- [x] 2.3 `app/requests/[id]/documento/page.tsx` + `components/pdf-document.tsx` → stub autosuficiente: declara SP3/Sprint2, `git show 9d9c53c:components/pdf-document.tsx`, faltantes de backend (`radicado`, `program`, `semester`, `subjects`, `reason`, firma, sello); actualizar botón "Ver documento PDF" en `app/requests/[id]/page.tsx:242-248`. **Los dos archivos se consolidaron en uno**: `pdf-document.tsx` se borró (vive en `9d9c53c`), el stub no importa `store`/`types`/`mock-data`. → `8c0d966`
- [x] 2.4 `components/app-shell.tsx`: quitar badge `urgentCount` e import de `useTramita` (depende de `priority`, diferido a SP5). → `e82b87f`

> **Corrección de citas (2026-08-24)**: la 2.1 decía «queda import huérfano … hasta Fase 4» — falso,
> el componente se renderizaba. La 2.3 citaba el botón como `242-245`; el rango real era `242-248`.
> Ninguna de las dos se había re-ejecutado cuando se escribió este archivo.
>
> **Gotcha de verificación**: borrar una ruta del App Router deja tipos stale en `.next/types/` y
> `.next/dev/types/`, que el `tsconfig.json:31-37` incluye. `tsc --noEmit` da un `TS2307` falso hasta
> limpiar. Verificar siempre con `rm -rf .next && pnpm exec tsc --noEmit && pnpm test`.

## Fase 3a: Formulario de registro (Slice 3a, PR3a, base PR2)

- [ ] 3a.1 Reescribir `app/requests/new/page.tsx`: solo `definitionCode`+`studentName`(≤120)+`studentDocument`(≤20); selector desde `listWorkflowDefinitions()`; `POST /requests` real vía `createRequest` **de `lib/api.ts`**; 422 → error en el campo del selector (`CREATE_REQUEST_422_FIELD`); sin `priority`/adjuntos/asignaturas/programa/semestre/email/código. [WR — Registro US1]
- [ ] 3a.2 Gate de 3a — medido el 2026-08-27, antes de empezar: `rg -l "from '@/lib/types'" app components lib` baja de **7 a 6**; `rg -l "from '@/lib/mock-data'" app components lib` baja de **5 a 4**. (El gate de «3 y 3» es de 3b, no de aquí.)

### Estado intermedio deliberado de 3a — declararlo en la PR

Tras 3a el formulario escribe en el **backend real**, pero `app/requests/[id]/page.tsx:88-92`
sigue leyendo del **store en memoria** hasta la tarea 4.1. Crear una solicitud navegará a
**"Solicitud no encontrada"**.

**No es un bug y no rompe la app**: `[id]/page.tsx:103` maneja el caso con una pantalla
controlada, verificado. Y la spec US1 (`workflow-requests/spec.md:50-52`) **manda** navegar al
detalle, así que cumplirla produce exactamente este estado. Es el medio inconsistente del
Parallel Change, y lo cierra la Fase 4. Sin esta nota, el revisor lo reporta como defecto.

### Dos gotchas de 3a

1. **Colisión de nombres `createRequest`**: hoy la línea 29 importa el del **store**
   (`@/lib/store`); la Fase 1 creó otro en `lib/api.ts`. Uno escribe en memoria, el otro va al
   backend. Con el import mal, `tsc` **no se queja** y el formulario sigue corriendo contra mocks
   sin que nadie lo note. Verificar el import explícitamente.
2. **Las `typeCards` con iconos se van**: `WorkflowDefinition` es `{code, name, version}`
   (`lib/types.ts:83-87`) — sin icono ni descripción. El motor es configurable: un trámite nuevo
   no tendría icono. Queda un `<Select>` alimentado por `listWorkflowDefinitions()`. Es una
   pérdida visual deliberada; la UI no puede conocer más trámites que el motor.

## Fase 3b: Buscador (Slice 3b, PR3b, base PR3a)

- [ ] 3b.1 RED+GREEN crear `lib/use-request-search.ts`: sin fetch con <2 caracteres. [WR — Localización, US3/FR-011]
- [ ] 3b.2 Reescribir `app/dashboard/page.tsx` como buscador puro: input con guardia de 2 caracteres, estado vacío antes de buscar, "sin resultados" en 200 vacío; quitar filtros tipo/estado/fecha y `cardFilter`.
- [ ] 3b.3 Borrar `components/dashboard/summary-cards.tsx` (conteos exigen listar todo, diferido a SP5) y su import en `dashboard/page.tsx`.
- [ ] 3b.4 Reescribir `components/dashboard/requests-table.tsx` para `RequestSummary[]`: `definition.name`/`currentState.name` en `Badge` genérico (no `TypeBadge`/`StatusBadge`, migran en Fase 4); quitar columna de vencimiento y punto de urgente.
- [ ] 3b.5 Verificar `rg -l "from '@/lib/types'"` y `"from '@/lib/mock-data'"` bajan a 3 archivos cada uno. **Verificado alcanzable el 2026-08-27**: con el patrón literal hay 7 consumidores de `types` y 5 de `mock-data`; entre 3a y 3b salen 4 y 2 respectivamente. Los 3 que sobran en cada caso (`brand.tsx`, `type-badge.tsx`, `workflow-timeline.tsx` / `[id]/page.tsx`) migran en Fase 4.

> ⚠️ **El alias no alcanza para contar consumidores reales** (misma trampa que documenta la 5.5):
> los módulos de `lib/` se importan entre sí con la forma relativa (`from './types'`), invisible
> para `rg "from '@/lib/types'"`. Con el patrón completo `"from '(@/lib|\.)/types'"` hay **12**
> consumidores, no 7. El gate de «3 y 3» mide `app/` y `components/`, que es su objetivo — pero
> **no significa que queden solo 3 en el repo**.

## Fase 4: Detalle — solo lectura (Slice 4a, PR4a, base PR3b)

- [ ] 4.1 RED+GREEN crear `lib/use-request-detail.ts`: `request`, `timeline`, `loading`, `error`, `reload()` — dos GET en paralelo (D-C), incluye caso 404.
- [ ] 4.2 Reescribir `components/workflow-timeline.tsx` para `TimelineEntry[]`: orden ascendente, "registrado por {actorEmail}" + "· en nombre de {responsible}" si presente, nota visible, sin badge de urgencia por antigüedad. [TL]
- [ ] 4.3 Reescribir `components/brand.tsx` (`StatusBadge`→`State`) y `components/type-badge.tsx` (`TypeBadge`→`WorkflowDefinition`), sin `Record` por union type.
- [ ] 4.4 `app/requests/[id]/page.tsx`: responsable único si coincide en todas las transiciones salientes, por-acción si difieren, ninguno si `currentState.isFinal`; "lleva N días" con `daysSince` sobre la última entrada del timeline. [WR — Responsable del estado actual; TL — Antigüedad]

## Fase 5: Transiciones y contrato (Slice 4b, PR4b, base PR4a)

- [ ] 5.1 Acciones desde `availableTransitions`: texto "Registrar: {targetState.name}"; nota obligatoria en UX si `requiresNote`. [RT — Composición de acciones]
- [ ] 5.2 RED+GREEN manejo de errores: 422 nota faltante → campo nota inválido; 409 → banner + botón "Actualizar estado vigente" (`reload()`, sin optimismo); 400 → error de formulario con `detail`; 404 → "no encontrado". [RT — Nota obligatoria, Conflicto 409]
- [ ] 5.3 Borrar `lib/store.tsx`, `lib/mock-data.ts` y los tipos viejos de `lib/types.ts` (`RequestType`, `RequestStatus`, `Priority`, `Attachment`, `TimelineEvent`, `SubjectInfo`, `AcademicRequest`, `WorkflowStageConfig`, `RequestTypeConfig`). **Ejecuta también lo que `design.md:75` decidió y nunca bajó a esta lista**: borrar de `lib/format.ts` las funciones `daysUntil`, `isOverdue` y `statusVariant` (más el tipo `StatusVariant`) junto con su `import type { RequestStatus }` de la línea 1 — son los últimos consumidores del modelo viejo, y sin este borrado la 5.3 rompe `tsc`.
- [ ] 5.4 `app/layout.tsx`: quitar `TramitaProvider` (`AuthProvider` se queda) — cierra D4.
- [ ] 5.5 Verificar 0 ocurrencias fuera de fixtures: `rg -n "from '(@/lib|\.)/types'" app components lib`, `rg -n "from '(@/lib|\.)/mock-data'" app components lib`, y códigos de trámite/estado hardcodeados en `app/`, `components/`, `lib/`. **El alias no alcanza**: los módulos de `lib/` se importan entre sí con la forma relativa (`from './types'`), invisible para `rg "from '@/lib/types'"` — con ese patrón el gate daba 0 con `lib/format.ts:1` todavía anclado al modelo viejo, que es justo el riesgo que `proposal.md:74` dice mitigar.

## Verificación por fase

Cada fase (1, 2, 3a, 3b, 4 y 5) cierra en verde con `pnpm test` y `pnpm exec tsc --noEmit`. `pnpm lint` está roto
(`eslint .` sin ESLint instalado) — **no es criterio de verificación de ninguna tarea**.
