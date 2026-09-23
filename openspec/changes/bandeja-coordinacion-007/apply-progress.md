# Apply Progress: Bandeja de trabajo de la Coordinación (bandeja-coordinacion-007)

> PR boundary de esta ejecución: **A-2 = C2 + C3** (rama `feat/bandeja-007-a2-tipo-honesto`,
> apilada sobre `feat/bandeja-007-a1-vencimiento`, que ya vive en PR #44 sin mergear). A-1
> (C1) fue completada en una ejecución previa — ver su sección abajo, sin cambios. Fases 4–8
> (C4–C7) quedan pendientes para futuras ejecuciones de `sdd-apply`, cada una en su propia
> rama apilada según `stacked-to-main`. No se pushea ni se abre PR desde este agente.

## Estado global

| Fase | Unidad | Estado |
|---|---|---|
| 1 | C1 — Baja del vencimiento inventado | **Completa** (15/15 tareas) |
| 2 | C2 — `State.isInitial` | **Completa** (16/16 tareas) |
| 3 | C3 — Tipo honesto (#9b) | **Completa** (19/19 tareas) |
| 4 | C4a/C4b — Bloque del estado actual | Pendiente |
| 5 | C5 — Baja de Configuración | Pendiente |
| 6 | C6 — Cliente + hook de la bandeja | Pendiente |
| 7 | C7a/C7b — Tablero carga la bandeja | Pendiente |
| 8 | Entrega (cuerpo de la PR) | Pendiente (aplica a la PR final de cada corte) |

## Tamaño medido de A-2 (C2 + C3) — size:exception aplica

`git diff --stat 4663858..HEAD -- . ':!openspec'` (excluye `openspec/`, incluye solo C2+C3,
ya que `4663858` es el HEAD de A-1): **19 archivos, 433 inserciones, 146 borrados → 579
líneas cambiadas.** Por unidad, medido con `git diff --stat` sobre cada commit:

| Unidad | Archivos | Inserciones | Borrados | Total | Rango estimado (`design.md`) |
|---|---|---|---|---|---|
| C2 | 16 | 168 | 94 | 262 | 120–200 (10% sobre el techo) |
| C3 | 15 | 300 | 87 | 387 | 180–240 (61% sobre el techo) |
| **A-2 total** | 19 (union) | 433 | 146 | **579** | 300–440 estimado |

**579 > 400** (el techo del `Review Workload Forecast` de `tasks.md`) y también supera el
rango estimado de A-2 (300–440). `tasks.md` («Review Workload Forecast», «Suggested split»)
registra que el responsable del proyecto aceptó `size:exception` el 2026-09-22 para A-2 «si
su rango lo exige al medirlo» — es exactamente esta situación. **`size:exception` aplica a
A-2.** Causa principal del exceso sobre C3: la migración al patrón `importOriginal` en dos
archivos de test (`app/dashboard/page.test.tsx`, `app/requests/[id]/page.test.tsx`) más sus
nuevos escenarios #9(b), que `design.md` estimaba pero no desglosaba línea por línea.

## Fase 1 — C1: Baja del vencimiento inventado — COMPLETA

Modo: **Strict TDD** (`openspec/config.yaml: strict_tdd: true`, runner `pnpm test` / vitest 4).

### TDD Cycle Evidence

| Tarea | RED (observado) | GREEN | REFACTOR |
|---|---|---|---|
| 1.1 — Tarjeta «Urgentes» cuenta solo prioridad | `expected '1' to be '0'` en `summary-cards.test.tsx` (contaba también el vencimiento) | `summary-cards.tsx`: `urgent` filtra solo `priority === 'urgente' && !isClosed`; label → «Urgentes» | — |
| 1.2 — Detalle no muestra vencimiento en trámite abierto antiguo | `Found multiple elements with the text matching: /Vencida/i` en `app/requests/[id]/page.test.tsx` | `page.tsx`: removidos `overdue`/`days`, la insignia «Vencida hace Nd» y la fila «Vencimiento» | — |
| 1.3 — Tabla de búsqueda no afirma vencimiento | `Found multiple elements with the text: /Vencida/` (desktop + card móvil) en `requests-table.test.tsx` (test renombrado) | `requests-table.tsx`: borrado `DueCell`, columna «Vencimiento» y sus celdas | — |
| 1.4 — Tablero sin indicadores «Vencidas»/«Por vencer» | `Unable to find an element with the text: Vencidas` (el elemento SÍ existía → fallo por presencia, no ausencia) — la aserción sobre el texto ausente falló porque el nodo estaba presente | `app/dashboard/page.tsx`: borradas ambas tarjetas de indicadores y `overdueRequests`/`dueSoonRequests` | — |

Los cuatro RED se observaron con `pnpm exec vitest run <archivo>` antes de tocar producción; cada
mensaje de fallo citado arriba es el texto real devuelto por vitest, no una suposición.

### Work Unit Evidence

| Evidencia | Valor |
|---|---|
| Comando de test focalizado y resultado exacto | `pnpm exec vitest run lib/format.test.ts lib/store.test.ts components/dashboard/summary-cards.test.tsx components/dashboard/requests-table.test.tsx app/dashboard/page.test.tsx "app/requests/[id]/page.test.tsx"` → **6 archivos, 40 tests, todos verdes** |
| Arnés de runtime | N/A — sin E2E instalado (`openspec/config.yaml`); `pnpm build` (Next.js 16, Turbopack) es la única prueba de runtime de esta unidad → **compiló y generó las 9 rutas estáticas/dinámicas sin error** |
| Rollback | Revertir el commit de C1 (`fix(vencimiento): ...`); independiente del resto de unidades — ningún archivo de C1 es tocado por C2–C7 antes de que esas unidades empiecen |

### Mutante 3 (obligatorio) — Observado

Se restauró temporalmente:
- una insignia `<Badge variant="destructive">Vencida hace 1d</Badge>` incondicional en
  `app/requests/[id]/page.tsx` (header), y
- una celda `<td>Vencida (1d)</td>` incondicional en
  `components/dashboard/requests-table.tsx` (fila desktop),

y se corrió `pnpm exec vitest run "app/requests/[id]/page.test.tsx" components/dashboard/requests-table.test.tsx`.
**Resultado observado**: 4 tests en rojo — el nuevo test de 1.2 (`expected ... to be null`, recibió
el badge), el renombrado de 1.3, y como efecto colateral esperado los dos tests preexistentes de
`requests-table.test.tsx` («cerrado», «rechazo») también cayeron, porque la celda mutada aparece en
cualquier fila. Se revirtieron ambas mutaciones con `Edit` (no se commiteó ninguna) y se confirmó
verde de nuevo antes de continuar.

### Verificación de la unidad (1.14)

| Comando | Resultado observado |
|---|---|
| `pnpm lint` | exit 0, sin salida (`eslint .`) |
| `rm -rf .next && pnpm exec tsc --noEmit` | exit 0, sin errores. **Nota**: había un proceso `next dev` vivo (pid 438742) al momento de correr `rm -rf .next`; `tsc` no se vio afectado, pero ese servidor de desarrollo puede requerir reinicio (`revisar-frontend-next`, «Trampas del entorno») |
| `pnpm test` | **21 archivos, 165 tests, todos verdes** — igual a la línea base medida el 2026-09-22 (neto 0: +3 tests nuevos de ausencia, −3 del `describe('isOverdue')` borrado) |
| `pnpm build` | Compiló con Turbopack, TypeScript sin errores, 9 rutas generadas (`/`, `/dashboard`, `/requests/[id]`, `/requests/[id]/documento`, `/requests/new`, `/settings`, etc.) |

### Criterio de aceptación de 1.12 — Desviación observada y documentada

El comando literal de la tarea 1.12
(`rg -n -i 'venc(e|er|ida|idas|imiento)|d[ií]as restantes|dueDate|isOverdue|businessDaysUntil|addBusinessDays' app components lib -g '!*.test.*'`)
da **1 resultado**, no 0:

```
app/settings/page.tsx:257:  Días hábiles antes de marcar una solicitud como vencida.
```

Es texto estático de la pantalla de Configuración, que **C5 retira por completo** (`design.md`,
`tasks.md` Fase 5) — fuera del alcance de este slice A-1 (C1 únicamente), y el prompt de esta
ejecución prohíbe explícitamente empezar C2–C7. El requisito «Ausencia de vencimiento en toda la
aplicación» del spec no queda 100% satisfecho hasta que C5 se aplique; este residuo es conocido y
esperado, no un defecto introducido por C1.

La verificación **más estricta del propio `design.md`** (D6, «Helpers muertos») sí da 0:

```
rg -n 'addBusinessDays|businessDaysUntil|isOverdue' app components lib
```
→ sin resultados. Los tres helpers y sus consumidores de producción están completamente
eliminados; lo único que sobrevive es el texto libre de Configuración, ajeno al código que esta
unidad tocaba.

`git diff main -- lib/format.ts` no toca `HAS_OFFSET` ni `parseServerDateTime` (confirmado: el
diff de `lib/format.ts` solo borra las tres funciones y su tipo `StatusVariant` queda intacto
justo debajo).

### Desviaciones de diseño

`tasks.md` Fase 1 no menciona ajustar los dos tests preexistentes de `requests-table.test.tsx`
(«no muestra vencimiento de un trámite cerrado» y «tampoco lo muestra para un rechazo definitivo»),
pero al borrar `DueCell` por completo (1.8) desaparece también su placeholder `—` para trámites
cerrados, que el primero de esos tests afirmaba con
`expect(screen.getAllByText('—').length).toBeGreaterThan(0)`. Se quitó esa aserción (ya no hay
ningún `—` en la tabla) y se conservó la aserción de ausencia de «Vencida» y el comentario
explicativo, actualizado. Sin este ajuste `pnpm test` no queda verde. El resto de la unidad sigue
el diseño sin desvíos.

### Archivos tocados en C1

| Archivo | Acción |
|---|---|
| `lib/format.ts` | Borra `addBusinessDays`, `businessDaysUntil`, `isOverdue` |
| `lib/format.test.ts` | Borra `describe('isOverdue')` y el import correspondiente |
| `lib/store.tsx` | Borra import de `addBusinessDays`, `deriveDueDate`, los dos usos de `dueDate` |
| `lib/types.ts` | Borra `AcademicRequest.dueDate` |
| `lib/fixtures/mock-requests.ts` | Borra `dueDate` de los 6 objetos |
| `components/dashboard/requests-table.tsx` | Borra `DueCell`, columna «Vencimiento», celdas desktop/móvil |
| `components/dashboard/requests-table.test.tsx` | Renombra el test del mutante 3; ajusta los dos tests de estado cerrado (ver desviación) |
| `components/dashboard/summary-cards.tsx` | «Urgentes / vencidas» → «Urgentes»; cuenta solo `priority` |
| `components/dashboard/summary-cards.test.tsx` | Nuevo test de ausencia (1.1) |
| `app/dashboard/page.tsx` | Borra tarjetas «Vencidas»/«Por vencer», `overdueRequests`/`dueSoonRequests`, mitad de vencimiento del filtro «urgente» |
| `app/dashboard/page.test.tsx` | Nuevo test de ausencia (1.4); fixture sin `dueDate` |
| `app/requests/[id]/page.tsx` | Borra insignia «Vencida», fila «Vencimiento», `overdue`/`days` |
| `app/requests/[id]/page.test.tsx` | Nuevo test de ausencia (1.2); fixture sin `dueDate` |
| `app/requests/[id]/documento/page.test.tsx` | Fixture sin `dueDate` (necesario para `tsc`; C3 la sigue tocando después) |

### Commit

`fix(vencimiento): retira el vencimiento inventado y sus helpers de días hábiles` — incluye código
de producción, tests, `tasks.md` (checkboxes 1.1–1.15) y este archivo.

Tamaño medido: `git diff --stat` sobre los 14 archivos de código/test de C1 → **60 inserciones, 143
borrados (203 líneas), dentro del rango estimado por `design.md` (190–230)**. No se necesita
`size:exception` para A-1.

**Enmienda del mensaje (2026-09-22, orquestador)**: el mensaje original llevaba un pie
`Closes #9 (parcial: …)`. Se retiró antes de pushear porque GitHub cierra el issue al mergear
cualquier commit con esa palabra clave en la rama por defecto, y C1 no cierra el #9 (tasks.md,
Fase 8, 8.1: la palabra clave va solo en el cuerpo de la PR A-3). El árbol del commit no cambió.

## Fase 2 — C2: `State.isInitial` reemplaza el reconocimiento del inicio por código — COMPLETA

Modo: **Strict TDD** (`openspec/config.yaml: strict_tdd: true`, runner `pnpm test` / vitest 4).
Rama: `feat/bandeja-007-a2-tipo-honesto`, sobre `feat/bandeja-007-a1-vencimiento`.

### Safety net (previo a C2)

`pnpm exec vitest run lib/request-state.test.ts lib/store.test.ts` → **2 archivos, 21 tests,
todos verdes**, antes de tocar producción.

### TDD Cycle Evidence

| Tarea | RED (observado) | GREEN | REFACTOR |
|---|---|---|---|
| 2.1/2.2 — Cada trámite reconoce su propio inicio; un estado desconocido con `isInitial` no rompe la pantalla | `lib/request-state.test.ts`, literales crudos (sin pasar por `adicion`/`novedad`): `expected false to be true` en «un estado que el cliente no reconoce… igual se presenta como pendiente» | `isInitialState` pasa a `return request.currentState.isInitial` | Reescrito el comentario de deuda (`:1-20`): tercio pagado (inicio), dos tercios que quedan (devolución, rechazo) |
| 2.3 — Mutante «vuelve a la tabla por código» | `expected true to be false` en «un código conocido con isInitial false no se reporta como inicial» (EN_COORDINACION, `isInitial:false`) | Igual que arriba — un solo cambio de implementación mata los tres RED de 2.1–2.3 | — |
| 2.4 — `status: 'pendiente'` sale de `isInitial`, no del código | `lib/store.test.ts`, literal crudo: `expected 'pendiente' not to be 'pendiente'` (código conocido sin `isInitial`) | `ApiState` gana `isInitial: boolean` (`lib/store.tsx:47`); `State` también (`lib/types.ts:18-23`) | Comentarios de `:51-55` y helper `withState` actualizados a mencionar la 007 en vez de «el cliente no tiene más remedio» |

Los cuatro RED se observaron con `pnpm exec vitest run lib/request-state.test.ts
lib/store.test.ts` antes de tocar producción; los mensajes citados arriba son el texto real
de vitest.

### Work Unit Evidence

| Evidencia | Valor |
|---|---|
| Comando de test focalizado y resultado exacto | `pnpm exec vitest run lib/request-state.test.ts lib/store.test.ts` → **2 archivos, 25 tests, todos verdes** (21 base + 4 nuevos) |
| Arnés de runtime | N/A — sin E2E instalado; `pnpm build` es la única prueba de runtime de la unidad → compiló y generó las 9 rutas sin error |
| Rollback | Revertir el commit `f3de927`; seguro — `isInitial` sigue llegando del backend y queda ignorado si se revierte (`design.md`, «Rollback por unidad») |

### Mutante extra (obligatorio, 2.14) — Observado

Se reemplazó temporalmente el cuerpo de `isInitialState` por una tabla local
`INITIAL_BY_CODE` (`EN_COORDINACION`/`REGISTRADA`) y se corrió
`pnpm exec vitest run lib/request-state.test.ts lib/store.test.ts`. **Resultado observado: 3
tests en rojo** — los dos mutantes de 2.1–2.3 (`request-state.test.ts`) y el de 2.4
(`store.test.ts`). Se revirtió con `Edit` (no se commiteó la mutación) y se confirmó verde de
nuevo (25/25) antes de continuar.

### Verificación de la unidad (2.15)

| Comando | Resultado observado |
|---|---|
| `pnpm lint` | exit 0, sin salida |
| `pnpm exec tsc --noEmit` (sin `rm -rf .next`: `next dev` vivo, pid 457968 — ver «Trampas del entorno» abajo) | exit 0, sin errores |
| `pnpm test` | **21 archivos, 169 tests, todos verdes** (165 base A-1 + 4 nuevos de C2) |
| `pnpm build` | Compiló con Turbopack, TypeScript sin errores, 9 rutas generadas |

### Criterio de aceptación de 2.6 — Observado

`rg -n 'initial: true' lib/request-state.ts` → **0 resultados**, confirmado.

### Archivos tocados en C2 (fixture churn en 13 archivos + 3 de producción)

| Archivo | Acción |
|---|---|
| `lib/types.ts` | `State` gana `isInitial: boolean` (requerido) |
| `lib/store.tsx` | `ApiState` gana `isInitial: boolean` |
| `lib/request-state.ts` | `isInitialState` lee `currentState.isInitial`; `StateSemantics`/`STATE_SEMANTICS` pierden `initial`; comentario de deuda reescrito |
| `lib/request-state.test.ts` | Helpers `adicion`/`novedad` reciben `{isFinal, isInitial}`; `ADICION_STATES`/`NOVEDAD_STATES` marcan `EN_COORDINACION`/`REGISTRADA`; 3 tests nuevos con literales crudos |
| `lib/store.test.ts` | `summary`/`withState` ganan `isInitial`; `toEqual` de la aserción de estado crudo lo incluye; 1 test nuevo |
| `components/dashboard/requests-table.test.tsx`, `components/dashboard/summary-cards.test.tsx`, `components/app-shell.test.tsx` | Helpers `conEstado`/`urgente` agregan `isInitial: false` |
| `app/dashboard/page.test.tsx`, `app/requests/[id]/page.test.tsx`, `app/requests/[id]/documento/page.test.tsx` | Literales `AcademicRequest`/`availableTransitions[].targetState` ganan `isInitial` |
| `lib/api.test.ts`, `lib/use-request-detail.test.ts` | Literales `Request`/`RequestSummary`/`TimelineEntry` ganan `isInitial` |
| `lib/fixtures/mock-requests.ts` | Los seis `currentState` ganan `isInitial` (`true` en `EN_COORDINACION`/`REGISTRADA`) |
| `app/dashboard/page.integration.test.tsx` | `MATCH.currentState` gana `isInitial: true` |

### Desviaciones de diseño

Ninguna. `tasks.md` Fase 2 se siguió sin desvíos; las 3 RED se escribieron con literales
crudos (`StatefulRequest`/objeto directo) en vez de pasar por los helpers `adicion`/`novedad`
o `withState` para que el RED de cada test fuera autocontenido y no dependiera de cómo se
migraran esos helpers — decisión de implementación, no un cambio de lo que pide `tasks.md`.

### Commit

`f3de927` — `refactor(estado): isInitial reemplaza el reconocimiento del inicio por código` —
16 archivos, 168 inserciones, 94 borrados (262 líneas). Incluye código de producción, tests,
`tasks.md` (checkboxes 2.1–2.16) y este archivo.

---

## Fase 3 — C3: Tipo honesto — `definition.name` sustituye la adivinanza (#9b) — COMPLETA

Modo: **Strict TDD**. Depende de C2 (fixtures ya con `isInitial`).

### Safety net (previo a C3)

`pnpm exec vitest run lib/store.test.ts lib/request-state.test.ts "app/requests/[id]/page.test.tsx" "app/requests/[id]/documento/page.test.tsx" components/dashboard/requests-table.test.tsx app/dashboard/page.test.tsx`
→ **6 archivos, 42 tests, todos verdes**, antes de tocar producción.

### TDD Cycle Evidence

| Tarea | Test File | Layer | RED (observado) | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|
| 3.3 | `lib/store.test.ts` | Unit | `expected undefined to deeply equal {...}` (definition ausente) + `expected 'adicion_creditos' to be null` | `baseRequest` agrega `definition: apiRequest.definition`; `typeFromCode` allowlist → `null` por defecto | ✅ 2 aserciones (definition + type) en el mismo test | — |
| 3.4 | `lib/request-state.test.ts` | Unit | `TypeError: Cannot read properties of undefined (reading 'ALGO')` en `semanticsOf` (crash real, no solo aserción) | `semanticsOf` retorna `SIN_SEMANTICA` cuando `type === null`; `StatefulRequest.type: RequestType \| null` | ✅ 2 tests (sin semántica / cierre sigue válido) | Comentario «inalcanzable» reemplazado por describe nuevo |
| 3.1 | `app/dashboard/page.test.tsx` | Integration | `getMultipleElementsFoundError`: «Solicitud Piloto» aparecía (desktop+móvil) en vez de excluirse del filtro | Sin cambio de código adicional — ya cubierto por 3.8/3.14 (filtro `r.type !== typeFilter` con `type: null`) | ➖ Un solo escenario | Migrado a `importOriginal` |
| 3.2 | `app/requests/[id]/page.test.tsx` | Integration | `TestingLibraryElementError`: «Trámite piloto» no encontrado (mostraba «Adición de Créditos») | `TypeBadge`, fila «Tipo de trámite», tabla de asignaturas de tres vías | ✅ 5 aserciones (nombre, ausencia de «adición», ausencia de «Créditos», ausencia ícono birrete, presencia ícono neutro) | Migrado a `importOriginal` |
| 3.5 | `app/requests/[id]/documento/page.test.tsx` | Integration | `TestingLibraryElementError`: «Solicitud de Adición de créditos» no encontrado (título con mayúscula vieja) + segundo test nuevo sin párrafo | `PdfDocument`: título/fila con `definition.name`; párrafo en tres vías (`request.type !== null &&`) | ✅ 2 tests (título actualizado + definición desconocida) | — |
| 3.6 | `components/dashboard/requests-table.test.tsx` | Integration | `TestingLibraryElementError`: «Adición de créditos» (minúscula) no encontrado (badge mostraba mayúscula) | `TypeBadge` callers → `code`/`name` de `definition` | ➖ Single | — |

### Test Summary

- **Total tests nuevos**: 7 (3.1, 3.2, 3.3, 3.4×2, 3.5×2 [1 modificado + 1 nuevo], 3.6)
- **Total tests pasando tras GREEN**: 49/49 en los 6 archivos focalizados
- **Capas usadas**: Unit (2), Integration (5)
- **Funciones puras nuevas/modificadas**: `typeFromCode` (allowlist), `semanticsOf` (guarda `null`)

### Work Unit Evidence

| Evidencia | Valor |
|---|---|
| Comando de test focalizado y resultado exacto | `pnpm exec vitest run lib/store.test.ts lib/request-state.test.ts "app/requests/[id]/page.test.tsx" "app/requests/[id]/documento/page.test.tsx" components/dashboard/requests-table.test.tsx app/dashboard/page.test.tsx` → **6 archivos, 49 tests, todos verdes** |
| Arnés de runtime | N/A — sin E2E instalado; `pnpm build` es la única prueba de runtime → compiló, TypeScript sin errores, 9 rutas generadas |
| Rollback | Revertir el commit `0d8ca3c`; reabre el #9(b) (`design.md`, «Rollback por unidad») |

### Mutante 4 (obligatorio, 3.17) — Observado en las tres capas

Se reemplazó temporalmente `typeFromCode` por
`code === 'NOVEDAD_NOTAS' ? 'novedad_notas' : 'adicion_creditos'` (el default vuelve a
adición) y se corrió
`pnpm exec vitest run lib/store.test.ts "app/requests/[id]/page.test.tsx" app/dashboard/page.test.tsx`.
**Resultado observado: 3 tests en rojo**, uno por capa:
- `lib/store.test.ts` — «conserva la definición cruda y clasifica…»: `expected 'adicion_creditos' to be null`.
- `app/requests/[id]/page.test.tsx` — «#9b»: `<th>Créditos</th>` presente en vez de ausente.
- `app/dashboard/page.test.tsx` — filtro: «Solicitud Piloto» encontrada dos veces en vez de excluida.

Se revirtió con `Edit` (no se commiteó la mutación) y se confirmó verde de nuevo (25/25 en
esos tres archivos) antes de continuar.

### Verificación de la unidad (3.18)

| Comando | Resultado observado |
|---|---|
| `pnpm lint` | exit 0, sin salida |
| `pnpm exec tsc --noEmit` (sin `rm -rf .next`: `next dev` vivo, pid 468506) | exit 0, sin errores |
| `pnpm test` | **21 archivos, 176 tests, todos verdes** (169 tras C2 + 7 nuevos de C3) |
| `pnpm build` | Compiló con Turbopack, TypeScript sin errores, 9 rutas generadas |

### Criterios de aceptación (3.16, «Rollback por unidad»)

`rg -n 'typeFromCode\(|typeToCode\(' app components lib` → **3 resultados, los tres en
`lib/store.tsx`** (`:194`, `:365`, `:439`): sigue siendo el único sitio de reconocimiento de
códigos de definición del cliente.

### Trampas del entorno (observadas, no del código)

Un proceso `next dev` estuvo vivo durante toda esta ejecución (pid 457968, luego 468506 tras
un reinicio ajeno a este agente). Siguiendo la restricción del prompt, `rm -rf .next` **no se
ejecutó** en ningún punto de C2 ni C3; `pnpm exec tsc --noEmit` corrió igual y dio exit 0 sin
errores en las cuatro corridas (fin de C2, mutante temporal, revert, fin de C3). Ningún
`TS2307` apareció en ninguna corrida, así que no hay hallazgo que reportar como falso
positivo de `.next/types`.

### Desviaciones de diseño

1. **`stageFromState` (`lib/store.tsx`) necesitó ensancharse a `RequestType | null`, algo que
   ni `tasks.md` ni `design.md` enumeran explícitamente para C3.** Es una consecuencia
   mecánica de que `typeFromCode` (3.8) ya no devuelve solo `RequestType`: `baseRequest`
   pasa ese mismo `type` a `stageFromState` para derivar `currentStage`. `stageFromState` se
   retira por completo en C4 junto con el stepper (`design.md`, D6), así que esto es deuda
   transitoria de un commit, no una decisión nueva: una definición desconocida cae en la
   etapa residual `'revision'` (la misma rama por defecto que ya usaba cualquier estado
   intermedio no mapeado), y ninguna pantalla la lee (`stages` sale de `workflowConfig`
   indexado por `type`, y con `null` ese `find` ya no encuentra nada). Documentado con
   comentario en el código.
2. **El efecto de `workflowConfig` en `lib/store.tsx` (carga de `/workflow-definitions`,
   fuera del árbol C1–C7 nombrado por `design.md` pero tocado por necesidad de compilación)
   pasó de `.map` a `.flatMap`, descartando definiciones con código desconocido.** Sin este
   cambio, `id: typeFromCode(definition.code)` (tipado `RequestType`) no aceptaba
   `RequestType | null` y `tsc` rompía. No hay test que cubra este efecto (verificado:
   `rg -n 'workflow-definitions|setWorkflowConfig' lib/store.test.ts app/settings/page.test.tsx`
   → 0 resultados) y se retira por completo en C5, así que es deuda transitoria idéntica en
   espíritu a la anterior: una definición no reconocida simplemente no gana una fila en la
   Configuración que de todos modos desaparece en dos unidades.
3. El resto de la unidad sigue `tasks.md` sin desvíos: el ícono de `TypeBadge` se identifica
   en los tests por `data-testid` (`type-badge-icon-adicion` / `-novedad` / `-neutral`), no
   por clase CSS — respeta la regla de `strict-tdd.md` contra aserciones sobre nombres de
   clase.

### Archivos tocados en C3

| Archivo | Acción |
|---|---|
| `lib/types.ts` | `AcademicRequest` gana `definition: WorkflowDefinition` y `type: RequestType \| null` |
| `lib/store.tsx` | `typeFromCode` → allowlist; `baseRequest` agrega `definition`; `statusFromState`/`stageFromState` aceptan `RequestType \| null`; efecto de `workflowConfig` con `flatMap` (desviación 2) |
| `lib/request-state.ts` | `StatefulRequest.type: RequestType \| null`; `semanticsOf` guarda `type === null` |
| `lib/request-state.test.ts` | 2 tests nuevos (`type: null`); comentario «inalcanzable» reemplazado |
| `lib/store.test.ts` | 1 test nuevo (mutante 4 en la fuente) |
| `components/type-badge.tsx` | Reescrito: `TypeBadge({code, name})`, mapa de íconos por código con respaldo neutro y `data-testid` |
| `components/dashboard/requests-table.tsx` | 2 llamadores de `TypeBadge` actualizados |
| `components/dashboard/requests-table.test.tsx` | 1 test nuevo (badge muestra `definition.name`) |
| `components/pdf-document.tsx` | Título/fila con `definition.name`; párrafo de detalle en tres vías |
| `app/requests/[id]/page.tsx` | `TypeBadge`, fila «Tipo de trámite», tabla de asignaturas en tres vías; import de `REQUEST_TYPE_LABELS` retirado (quedó sin uso) |
| `app/requests/[id]/page.test.tsx` | Migrado a `importOriginal`; test nuevo #9(b); `definition` en fixture |
| `app/requests/[id]/documento/page.test.tsx` | `definition` en fixtures; título actualizado a minúscula; test nuevo de definición desconocida |
| `app/dashboard/page.test.tsx` | Migrado a `importOriginal`; test nuevo del filtro #9(b); `definition` en fixture |
| `lib/fixtures/mock-requests.ts` | `definition` en los seis objetos |

### Commit

`0d8ca3c` — `fix(tipo): deja de adivinar el tipo de trámite con una definición desconocida
(#9b)` — 15 archivos, 300 inserciones, 87 borrados (387 líneas). Incluye código de
producción, tests, `tasks.md` (checkboxes 3.1–3.19) y este archivo.

---

## Próximo paso

`sdd-apply` para la Fase 4 (C4a — mudanza de `currentResponsibility`; C4b — `CurrentStateBlock`
reemplaza el stepper, #9a/P1/P2), rama `feat/bandeja-007-a3-...` apilada sobre
`feat/bandeja-007-a2-tipo-honesto` según `stacked-to-main`, gated por decisión humana (push/PR
de A-2 no están hechos por este agente). El `Review Workload Forecast` de `tasks.md` estima
A-3 en 380–470 líneas y ya anticipa un posible `size:exception`; medir al cierre de esa
ejecución igual que se hizo acá.
