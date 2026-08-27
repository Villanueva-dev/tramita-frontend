# Tasks: Fase B — integración con el motor de workflow

## Review Workload Forecast

Presupuesto de proyecto cacheado en preflight: **800 líneas** (no el default de 400 del skill).
Clasificación Low/Medium/High de abajo se evalúa contra esos 800.

| Field | Value |
|---|---|
| Estimated changed lines | ~2.700 (S1 ~200 · S2 ~550 · S3 ~800 · S4 ~1.120) |
| 800-line budget risk | High — S3 al borde, S4 lo duplica |
| Chained PRs recommended | Yes |
| Suggested split | PR1 → PR2 → PR3 → **PR4a → PR4b** (S4 partido). S3 queda como *watch-item*: se parte en 3a/3b **solo si al implementarlo supera 800** |
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
          └── PR1 → PR2 → PR3 → PR4a → PR4b

⚠️ **Profundidad 5**: un cambio en PR1 obliga a rebasear las cuatro siguientes. Es el costo
aceptado del Parallel Change, no un descuido del plan.

### Suggested Work Units

Runtime harness común (sin runner e2e, `project.md:64`): `pnpm dev` + flujo manual en navegador.

| Unit | Goal | PR | Focused test | Rollback boundary |
|---|---|---|---|---|
| 1 | Fundación: tipos aditivos, funciones de dominio, `parseServerDateTime`/`daysSince` | PR1 (base `feature/fase-b`) | `pnpm test lib/format.test.ts lib/api.test.ts` | Revert PR1: nada más lo usa aún |
| 2 | Poda: borra stepper/settings, stub documento, badge app-shell | PR2 | `pnpm test` | Revert PR2 restaura las 3 pantallas |
| 3 | Registro + buscador puro | PR3 (split 3a form / 3b dashboard si supera 800) | `pnpm test` (incl. `use-request-search`) | Revert PR3: new/dashboard vuelven a mocks |
| 4a | Detalle solo-lectura: hook, timeline, responsable, antigüedad | PR4a | `pnpm test` + `tsc --noEmit` | Revert 4a: detalle vuelve a mocks (store aún vive) |
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

## Fase 3: Registro y búsqueda (Slice 3, PR3 — evaluar split 3a/3b si supera 800 líneas)

- [ ] 3.1 RED+GREEN crear `lib/use-request-search.ts`: sin fetch con <2 caracteres. [WR — Localización, US3/FR-011]
- [ ] 3.2 Reescribir `app/requests/new/page.tsx`: solo `definitionCode`+`studentName`+`studentDocument`; selector desde `listWorkflowDefinitions()`; 422 → error en el selector; sin `priority`/adjuntos/asignaturas/programa/semestre. [WR — Registro US1]
- [ ] 3.3 Reescribir `app/dashboard/page.tsx` como buscador puro: input con guardia de 2 caracteres, estado vacío antes de buscar, "sin resultados" en 200 vacío; quitar filtros tipo/estado/fecha y `cardFilter`.
- [ ] 3.4 Borrar `components/dashboard/summary-cards.tsx` (conteos exigen listar todo, diferido a SP5) y su import en `dashboard/page.tsx`.
- [ ] 3.5 Reescribir `components/dashboard/requests-table.tsx` para `RequestSummary[]`: `definition.name`/`currentState.name` en `Badge` genérico (no `TypeBadge`/`StatusBadge`, migran en Fase 4); quitar columna de vencimiento y punto de urgente.
- [ ] 3.6 Verificar `rg -l "from '@/lib/types'"` y `"from '@/lib/mock-data'"` bajan a 3 archivos cada uno.

## Fase 4: Detalle — solo lectura (Slice 4a, PR4a, base PR3)

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

Cada fase (1 a 5) cierra en verde con `pnpm test` y `pnpm exec tsc --noEmit`. `pnpm lint` está roto
(`eslint .` sin ESLint instalado) — **no es criterio de verificación de ninguna tarea**.
