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

### Estrategia de cadena (decidida 2026-08-23, **corregida el 2026-08-28**)

> ⚠️ **Esta sección describía un proceso que no estaba ocurriendo.** Declaraba
> `feature-branch-chain` con seis pull requests de GitHub, cada una apuntando a la anterior.
> Medido el 2026-08-28 con `gh pr list --state all`: **cero PRs**, abiertas o cerradas, y ninguna
> rama hija — solo `feature/fase-b`, `main` y un backup. Las Fases 1, 2 y 3a se commitearon
> directo sobre la tracker. Se corrige la descripción, no la práctica: lo que da valor ya se está
> cumpliendo, y un documento que afirma un proceso inexistente es la misma clase de defecto que
> este `tasks.md` viene corrigiendo en sus gates y sus citas.

**Cómo se trabaja realmente**: cada slice se commitea agrupado sobre la rama tracker
`feature/fase-b`, en orden, y **solo la tracker mergea a `main`**. Así `main` nunca ve el modelo a
medio migrar — que es el estado intermedio inevitable del Parallel Change.

    main
     └── feature/fase-b        (tracker, única que mergea a main)
          └── S1 → S2 → S3a → S3b → S4a → S4b   (slices, en orden)

**«PR3a» nombra un slice, no un pull request.** El nombre se conserva porque está en todo el
proyecto y en el registro de decisiones; lo que no existe es el objeto de GitHub.

**Lo que sí se cumple, y es lo que sostiene el argumento**:

- **Presupuesto de revisión por slice.** El corte de la Fase 3 en 3a/3b se decidió por medición
  (~1.660 líneas contra 800), y el criterio sigue vigente aunque el diff no viaje en una PR.
- **Review adversarial al cerrar cada slice, antes de empezar el siguiente.** Lo corre un agente
  sin contexto de la sesión, con el contrato y las specs como única autoridad. S2 el 2026-08-24;
  S3a el 2026-08-28 (0 críticos, 5 medios; M1/M2/M4 aplicados en `a07ab1d`).
- **El orden sigue siendo vinculante.** Cada slice asume el anterior aplicado: 3b parte de 3a, 4a
  de 3b. Un defecto encontrado tarde obliga a rehacer trabajo de los cinco siguientes — que es la
  razón real de revisar slice por slice, y no depende de que haya PRs.

Si en algún momento se quiere la traza en GitHub, el camino barato es abrir la PR de la tracker
contra `main` al final y que el historial de commits por slice haga de índice.

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

- [x] 3a.1 Reescribir `app/requests/new/page.tsx`: solo `definitionCode`+`studentName`(≤120)+`studentDocument`(≤20); selector desde `listWorkflowDefinitions()`; `POST /requests` real vía `createRequest` **de `lib/api.ts`**; 422 → error en el campo del selector (`CREATE_REQUEST_422_FIELD`); sin `priority`/adjuntos/asignaturas/programa/semestre/email/código. [WR — Registro US1]
- [x] 3a.1b Validación de cliente antes de enviar, en el mismo archivo: los dos campos de texto se rechazan si `trim()` queda vacío, y se rechazan si exceden 120 / 20. Envía el valor ya recortado. **Cierra el hueco del 400** (ver la nota de abajo) — sin esto, un nombre de solo espacios llega al backend y vuelve como error genérico sin campo asociado. [WR — Registro US1, escenarios «Campo de solo espacios rechazado sin llamar al backend» y «Los valores viajan recortados»]
- [x] 3a.2 Gate de 3a. ⚠️ **La métrica de `types` estaba mal formulada y se corrigió al ejecutarla** (2026-08-28). Decía: `rg -l "from '@/lib/types'" app components lib` baja de **7 a 6**. No bajó, y el slice igual cumplió: `lib/types.ts` aloja los tipos **viejos y los nuevos**, así que un archivo migrado sigue contando — `new/page.tsx` pasó de importar `RequestType`/`SubjectInfo` a importar `WorkflowDefinition`, y el número no se movió. Es la trampa de la 5.5 en otra variante: allá el patrón no ve los imports relativos, acá **el módulo no distingue modelo viejo de modelo nuevo**.
  - **Métrica correcta — consumidores del modelo viejo**: `rg -l "import type \{[^}]*(RequestType|RequestStatus|AcademicRequest|TimelineEvent|SubjectInfo|WorkflowStageConfig|RequestTypeConfig)" app components lib` → **8 antes, 7 después** ✔. Incluye `lib/format.ts`, que el patrón viejo no veía por importarse con forma relativa.
  - **`mock-data`**: `rg -l "from '@/lib/mock-data'" app components lib` → **5 → 4** ✔. Esa medición sí era correcta: `mock-data` no tiene contraparte nueva.
  - **Desacople verificado en el archivo**: `rg -n "RequestType|RequestStatus|AcademicRequest|TimelineEvent|SubjectInfo|useTramita|mock-data" app/requests/new/page.tsx` → **0 ocurrencias**.
  - (El gate de «3 y 3» es de 3b, no de aquí. **Hereda esta corrección**: debe medirse sobre el modelo viejo, no sobre el módulo.)

### Estado intermedio deliberado de 3a — declararlo en la PR

Tras 3a el formulario escribe en el **backend real**, pero `app/requests/[id]/page.tsx:88-92`
sigue leyendo del **store en memoria** hasta la tarea 4.1. Crear una solicitud navegará a
**"Solicitud no encontrada"**.

**No es un bug y no rompe la app**: `[id]/page.tsx:103` maneja el caso con una pantalla
controlada, verificado. Y la spec US1 (`workflow-requests/spec.md:50-52`) **manda** navegar al
detalle, así que cumplirla produce exactamente este estado. Es el medio inconsistente del
Parallel Change, y lo cierra la Fase 4. Sin esta nota, el revisor lo reporta como defecto.

### Por qué 3a valida en cliente aunque el manejo del 400 sea de la Fase 5

Verificado contra el backend el 2026-08-28 (código, no solo el `openapi.yaml`). `POST /requests`
devuelve **dos** errores distintos, y 3a solo tiene mapeo para uno:

| Causa | Status | Origen en el backend |
|---|---|---|
| `definitionCode` inexistente | **422** | `RequestServiceImpl:50-54` lanza `UnprocessableRequestException` → `GlobalExceptionHandler:27-30` → `UNPROCESSABLE_CONTENT` |
| `@NotBlank`/`@Size` violados | **400** | `CreateRequestBody` + `GlobalExceptionHandler extends ResponseEntityExceptionHandler` (su javadoc lo nombra: «el 400 de @Valid») |

La tarea **5.2** planifica el 400 con `detail`; hasta entonces cae en el `ApiError` genérico. El
único camino que lo dispara desde un formulario bien hecho es `@NotBlank` con espacios: `"   "`
no es vacío para el front y sí lo es para el backend. La tarea **3a.1b** lo cierra en el origen,
así el 400 queda como red de seguridad y no como camino esperado. No adelanta trabajo de la 5.2:
sigue sin haber render de campo para el 400.

### Dos gotchas de 3a

1. **Colisión de nombres `createRequest`**: el formulario obtiene hoy el del **store** vía hook —
   `new/page.tsx:29` importa `useTramita` de `@/lib/store`, la línea **54** destructura
   `const { createRequest } = useTramita()` y la **136** lo llama. La Fase 1 creó otro
   `createRequest` en `lib/api.ts`: uno escribe en memoria, el otro va al backend. Lo que se
   elimina no es un import mal escrito sino **el hook completo**. Con el import mal, `tsc` **no se
   queja** y el formulario sigue corriendo contra mocks sin que nadie lo note. *(Cita corregida el
   2026-08-28: la redacción anterior decía que la línea 29 importaba `createRequest`, y lo que
   importa es `useTramita`.)*
2. **Las `typeCards` con iconos se van**: `WorkflowDefinition` es `{code, name, version}`
   (`lib/types.ts:83-87`) — sin icono ni descripción. El motor es configurable: un trámite nuevo
   no tendría icono. Queda un `<Select>` alimentado por `listWorkflowDefinitions()`. Es una
   pérdida visual deliberada; la UI no puede conocer más trámites que el motor.

## Fase 3b: Buscador (Slice 3b, PR3b, base PR3a)

- [x] 3b.1 RED+GREEN crear `lib/use-request-search.ts`: sin fetch con <2 caracteres. [WR — Localización, US3/FR-011]
- [x] 3b.2 Reescribir `app/dashboard/page.tsx` como buscador puro: input con guardia de 2 caracteres, estado vacío antes de buscar, "sin resultados" en 200 vacío; quitar filtros tipo/estado/fecha y `cardFilter`.
- [x] 3b.3 Borrar `components/dashboard/summary-cards.tsx` (conteos exigen listar todo, diferido a SP5) y su import en `dashboard/page.tsx`.
- [x] 3b.4 Reescribir `components/dashboard/requests-table.tsx` para `RequestSummary[]`: `definition.name`/`currentState.name` en `Badge` genérico (no `TypeBadge`/`StatusBadge`, migran en Fase 4); quitar columna de vencimiento y punto de urgente.
- [x] 3b.5 Gate de 3b. **Hereda la corrección de métrica de la 3a**: se mide el modelo viejo, no el módulo — `lib/types.ts` aloja los tipos viejos y los nuevos, así que contar imports de `@/lib/types` cuenta también a los ya migrados (hoy da **5**, y el gate pedía 3).
  - **Modelo viejo**: `rg -l "import type \{[^}]*(RequestType|RequestStatus|AcademicRequest|TimelineEvent|SubjectInfo|WorkflowStageConfig|RequestTypeConfig)" app components lib` → **7 antes, 4 después** ✔. Quedan `lib/format.ts`, `components/brand.tsx`, `components/type-badge.tsx` y `components/workflow-timeline.tsx`, los cuatro previstos para la Fase 4.
  - **`mock-data`**: `rg -l "from '@/lib/mock-data'" app components lib` → **4 antes, 3 después** ✔ — exactamente `type-badge.tsx`, `brand.tsx` y `[id]/page.tsx`, que es lo que esta tarea predijo el 2026-08-27.
  - ⚠️ **La predicción de `types` falló donde el propio documento avisaba que fallaría.** Nombraba tres supervivientes (`brand`, `type-badge`, `workflow-timeline`) y son **cuatro**: falta `lib/format.ts`, invisible para el patrón `@/lib/types` porque los módulos de `lib/` se importan entre sí con forma relativa (`from './types'`). Es la trampa que la nota de abajo y la tarea 5.5 ya documentaban; se documentó y aun así se usó el patrón incompleto para predecir.

> ⚠️ **El alias no alcanza para contar consumidores reales** (misma trampa que documenta la 5.5):
> los módulos de `lib/` se importan entre sí con la forma relativa (`from './types'`), invisible
> para `rg "from '@/lib/types'"`. Con el patrón completo `"from '(@/lib|\.)/types'"` hay **12**
> consumidores, no 7. El gate de «3 y 3» mide `app/` y `components/`, que es su objetivo — pero
> **no significa que queden solo 3 en el repo**.

## Fase 4: Detalle — solo lectura (Slice 4a, PR4a, base PR3b)

- [x] 4.1 RED+GREEN crear `lib/use-request-detail.ts`: `request`, `timeline`, `loading`, `error`, `reload()` — dos GET en paralelo (D-C), incluye caso 404.
- [x] 4.2 Reescribir `components/workflow-timeline.tsx` para `TimelineEntry[]`: orden ascendente, "registrado por {actorEmail}" + "· en nombre de {responsible}" si presente, nota visible, sin badge de urgencia por antigüedad. [TL]
- [x] 4.3 **Se eliminaron en vez de reescribirse** (desviación deliberada, 2026-08-28). Reescritos, `StatusBadge` y `TypeBadge` quedaban en `<Badge variant="info">{state.name}</Badge>`: un envoltorio de una línea sin decisión adentro. La tabla de la 3b ya había resuelto lo mismo con `<Badge>` directo, así que conservarlos dejaba **dos criterios para el mismo problema**. `components/type-badge.tsx` se borra; `components/brand.tsx` conserva `Logo`, que no depende del modelo viejo y lo usa `app-shell`.
  - **Efecto colateral favorable**: eran los dos últimos consumidores de `mock-data` (`STATUS_LABELS`, `REQUEST_TYPE_LABELS`), así que el gate de `mock-data` llegó a **0** en 4a en lugar de en la Fase 5.
- [x] 4.5 Gate de 4a — **modelo viejo 4 → 1** (queda solo `lib/format.ts`, que limpia la 5.3); **`mock-data` 3 → 0**; `store` solo en `app/layout.tsx` (lo quita la 5.4).

> ⚠️ **`components/action-dialog.tsx` queda huérfano tras 4a** (0 consumidores, verificado con `rg`). No rompe `tsc` y no importa tipos viejos, pero **hay que sumarlo al alcance de 4b**: no figura en ningún artefacto SDD —ni proposal, ni spec, ni design, ni este archivo— y su `ActionConfig` fija las acciones en un union type `'revisar' | 'aprobar' | 'devolver' | 'finalizar'`, que contradice el escenario «Ausencia de códigos y etiquetas de transición o estado». Mismo descuido que tuvo la Fase 2 con el stepper.
- [x] 4.4 `app/requests/[id]/page.tsx`: responsable único si coincide en todas las transiciones salientes, por-acción si difieren, ninguno si `currentState.isFinal`; "lleva N días" con `daysSince` sobre la última entrada del timeline. [WR — Responsable del estado actual; TL — Antigüedad]

## Fase 5: Transiciones y contrato (Slice 4b, PR4b, base PR4a)

- [x] 5.1 Acciones desde `availableTransitions`: texto "Registrar: {targetState.name}"; nota obligatoria en UX si `requiresNote`. [RT — Composición de acciones]
- [x] 5.2 RED+GREEN manejo de errores: 422 nota faltante → campo nota inválido; 409 → banner + botón "Actualizar estado vigente" (`reload()`, sin optimismo); 400 → error de formulario con `detail`; 404 → "no encontrado". [RT — Nota obligatoria, Conflicto 409]
- [x] 5.3 Borrar `lib/store.tsx`, `lib/mock-data.ts` y los tipos viejos de `lib/types.ts` (`RequestType`, `RequestStatus`, `Priority`, `Attachment`, `TimelineEvent`, `SubjectInfo`, `AcademicRequest`, `WorkflowStageConfig`, `RequestTypeConfig`). **Ejecuta también lo que `design.md:75` decidió y nunca bajó a esta lista**: borrar de `lib/format.ts` las funciones `daysUntil`, `isOverdue` y `statusVariant` (más el tipo `StatusVariant`) junto con su `import type { RequestStatus }` de la línea 1 — son los últimos consumidores del modelo viejo, y sin este borrado la 5.3 rompe `tsc`.
- [x] 5.4 `app/layout.tsx`: quitar `TramitaProvider` (`AuthProvider` se queda) — cierra D4.
- [x] 5.5 Verificar 0 ocurrencias fuera de fixtures: `rg -n "from '(@/lib|\.)/types'" app components lib`, `rg -n "from '(@/lib|\.)/mock-data'" app components lib`, y códigos de trámite/estado hardcodeados en `app/`, `components/`, `lib/`. **El alias no alcanza**: los módulos de `lib/` se importan entre sí con la forma relativa (`from './types'`), invisible para `rg "from '@/lib/types'"` — con ese patrón el gate daba 0 con `lib/format.ts:1` todavía anclado al modelo viejo, que es justo el riesgo que `proposal.md:74` dice mitigar.

### Añadidos a la Fase 5 que no estaban en la lista (2026-08-28)

- **`components/action-dialog.tsx` → `components/transition-dialog.tsx`**. No figuraba en ningún
  artefacto SDD y fijaba las acciones en un union type `'revisar' | 'aprobar' | 'devolver' |
  'finalizar'`. Reescrito sobre `AvailableTransition`. **De paso murió una regla de negocio
  inventada**: exigía un comentario de al menos 5 caracteres, mínimo que no aparece en el contrato
  ni en ninguna spec — el backend sólo pide que la nota exista cuando `requiresNote`.
- **El 401 (hallazgo B4 del review de la 3b)**. La política ya existía enterrada en
  `changePassword`; se extrajo a `sessionExpired()` en el `AuthProvider` y se usa desde las dos
  rutas por las que un 401 llega al detalle. La 5.2 listaba 422/409/400/404 y lo omitía.

### Gate final 5.5 — medido el 2026-08-28

| Comando | Resultado |
|---|---|
| `rg -n "from '(@/lib\|\.)/mock-data'" app components lib` | **0** |
| `rg -n "from '(@/lib\|\.)/store'" app components lib` | **0** |
| códigos de trámite/estado fuera de tests | **0** |
| tipos viejos (los 9) | **0** |

`lib/types.ts` queda con los seis tipos del contrato y nada más. ⚠️ El último hallazgo fue **un
comentario** en `workflow-timeline.tsx` que citaba `RequestStatus` para explicar por qué murieron
los mapas por estado: se reformuló, porque un comentario que nombra un tipo inexistente manda a
buscar algo que ya no está.

## Verificación por fase

Cada fase (1, 2, 3a, 3b, 4 y 5) cierra en verde con `pnpm test` y `pnpm exec tsc --noEmit`. `pnpm lint` está roto
(`eslint .` sin ESLint instalado) — **no es criterio de verificación de ninguna tarea**.
