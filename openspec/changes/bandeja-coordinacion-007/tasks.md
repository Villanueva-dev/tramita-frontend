# Tasks: Bandeja de trabajo de la Coordinación (consumo de la feature 007)

> TDD estricto (`openspec/config.yaml`: `strict_tdd: true`). Cada tarea de comportamiento abre
> con su test en rojo **observado**, por la razón esperada — nunca supuesto. `pnpm test` no
> verifica tipos: un test puede correr en rojo aunque el código todavía no compile. `tsc` se
> exige al cerrar **cada** unidad, no solo al final (`rm -rf .next && pnpm exec tsc --noEmit`,
> con `pnpm dev` detenido). Los siete fases siguen el orden de dependencia de `design.md` §D6
> (C1…C7); las unidades C4 y C7 se dividen internamente en C4a/C4b y C7a/C7b, tal como marca
> `design.md`, «Nota para `sdd-tasks`: dónde se puede cortar».

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ≈1 900–2 270 (adiciones + borrados; una línea modificada cuenta dos veces — cifra de `design.md`, más precisa que la ≈1 260–1 720 de `proposal.md` porque incorpora el PDF) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | **Corte A, decidido el 2026-09-22 por el responsable del proyecto**: A-1 = C1 · A-2 = C2+C3 · A-3 = C4a+C4b · A-4 = C5 · A-5 = C6+C7a+C7b. `size:exception` aceptado para A-5 y, si su rango lo exige al medirlo, para A-2 y A-3. El Corte B queda abajo como alternativa evaluada |
| Delivery strategy | ask-on-risk |
| Chain strategy | `stacked-to-main`, decidido el 2026-09-22: cada PR apunta a `main` (o a la rama de la anterior mientras no se mergee) y se mergea en orden A-1 → A-5. Ramas `feat/bandeja-007-a1-vencimiento` … `feat/bandeja-007-a5-bandeja` |

```text
Decision needed before apply: No (resuelta el 2026-09-22: Corte A, stacked-to-main, size:exception por PR donde el rango lo exija)
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High
```

### Tamaño por unidad (de `design.md`, «Tamaño estimado por unidad»)

| Unidad | Líneas | Composición |
|---|---|---|
| C1 vencimiento | 190–230 | Casi todo borrado, más cuatro tests de ausencia |
| C2 isInitial | 120–200 | Churn de fixtures y reescritura de tests del predicado |
| C3 tipo honesto | 180–240 | `TypeBadge`, PDF, detalle, `definition` en fixtures y tests #9(b) |
| C4 bloque del estado (C4a+C4b) | 380–470 | Componente y test nuevos, detalle, stepper borrado (−68), mudanza de `currentResponsibility` |
| C5 Configuración | ≈390 | Borrado puro |
| C6 cliente + hook | 230–280 | Mitad tests |
| C7 tablero (C7a+C7b) | 400–460 | Componente, test del componente, página, tests de página y stub |
| **Total** | **≈1 900–2 270** | |

### Dos cortes candidatos — decidido el 2026-09-22: Corte A (el B se conserva como alternativa evaluada)

**Corte A — por borrado primero** (el que sugería `proposal.md`, refinado con las unidades del diseño):

| PR | Contenido | Líneas | Nota |
|---|---|---|---|
| A-1 | C1 | ≈210 | Independiente, barata por línea |
| A-2 | C2 + C3 | ≈300–440 | Base del #9(b) |
| A-3 | C4a + C4b | ≈380–470 | Cierra #9(a); requiere A-2 |
| A-4 | C5 | ≈390 | Borrado puro; requiere A-3 (el detalle deja de leer `workflowConfig` recién en C4) |
| A-5 | C6 + C7a + C7b | ≈660–770 | La bandeja completa; requiere C2 (A-2) y, blandamente, C3 (A-2) para `TypeBadge({code, name})` |

**Corte B — por grafo de dependencias** (el que detalla `design.md`, con los sub-cortes C4a/C4b y C7a/C7b):

| PR | Contenido | Líneas | Nota |
|---|---|---|---|
| B-S1 | C1 | ≈210 | Independiente |
| B-S2 | C2 + C3 | ≈300–440 | |
| B-S3a | C4a | ≈60–80 | Refactor puro: mudanza de `currentResponsibility` |
| B-S3b | C4b | ≈320–390 | El bloque; requiere B-S3a |
| B-S4 | C5 | ≈390 | Requiere B-S3b |
| B-S5 | C6 | ≈230–280 | Sin UI, aditivo |
| B-S6a | C7a | ≈30 | Solo test, verde sobre el código viejo |
| B-S6b | C7b | ≈370–430 | Requiere B-S6a y, blandamente, C3 (B-S2) |

**Orden alternativo válido** (ambos cortes): C2 → C6 → C7 primero, si se prefiere entregar la
bandeja antes de cerrar el #9. La única dependencia blanda es `TypeBadge({ code, name })` de C3;
sin C3, C7 muestra el nombre con un `Badge` plano en vez del ícono por trámite.

**Obligaciones de cualquier PR que contenga estas unidades** (de `design.md`):
- La PR con C1 declara las tres decisiones del backend sobre el vencimiento (ver *Fase 8*).
- La PR con C5 se lo señala, sin nombrarlo, al integrante que restauró la pantalla en `ede7bc3`.
- La PR con C3 señala el cambio de mayúsculas del tipo; el ícono por trámite se conserva con
  respaldo neutro.

### Suggested Work Units

| Unit | Goal | Likely PR (Corte A · Corte B) | Focused test command | Runtime harness | Rollback boundary |
|---|---|---|---|---|---|
| C1 | Retira el vencimiento inventado y sus helpers | A-1 · B-S1 | `pnpm exec vitest run lib/format.test.ts lib/store.test.ts components/dashboard/summary-cards.test.tsx components/dashboard/requests-table.test.tsx app/dashboard/page.test.tsx "app/requests/[id]/page.test.tsx"` | N/A — sin E2E instalado (`openspec/config.yaml`); el `pnpm build` de la unidad es la única prueba de runtime | Revierte el commit de C1; independiente de las demás unidades |
| C2 | `State.isInitial` reemplaza el reconocimiento del inicio por código | A-2 · B-S2 | `pnpm exec vitest run lib/request-state.test.ts lib/store.test.ts` | N/A — mismo motivo | Revierte el commit de C2; seguro — `isInitial` sigue llegando del backend y queda ignorado |
| C3 | `definition.name` sustituye la adivinanza del tipo (#9b) | A-2 · B-S2 | `pnpm exec vitest run lib/store.test.ts lib/request-state.test.ts "app/requests/[id]/page.test.tsx" "app/requests/[id]/documento/page.test.tsx" components/dashboard/requests-table.test.tsx app/dashboard/page.test.tsx` | N/A — mismo motivo | Revierte el commit de C3; reabre el #9(b) |
| C4a | Muda `currentResponsibility` a `lib/request-state.ts` (refactor puro) | A-3 · B-S3a | `pnpm exec vitest run lib/request-state.test.ts` | N/A — mismo motivo | Revierte el commit de C4a; sin efecto visible por sí solo |
| C4b | `CurrentStateBlock` reemplaza el stepper (#9a, P1, P2) | A-3 · B-S3b | `pnpm exec vitest run components/current-state-block.test.tsx "app/requests/[id]/page.test.tsx"` | N/A — mismo motivo | Revierte el commit de C4b; exige revertir C5 antes (el detalle no puede volver a leer `workflowConfig` si ya no existe) |
| C5 | Retira la pantalla de Configuración y `workflowConfig` | A-4 · B-S4 | `pnpm exec vitest run app/requests/new/page.test.tsx "app/requests/[id]/page.test.tsx" components/app-shell.test.tsx` | N/A — mismo motivo | Revierte el commit de C5; recupera la pantalla y `workflowConfig` (también recuperable con `git show ede7bc3:app/settings/page.tsx`) |
| C6 | `getInbox` + `useCoordinationInbox`, sin UI | A-5 · B-S5 | `pnpm exec vitest run lib/api.test.ts lib/use-coordination-inbox.test.ts` | N/A — mismo motivo | Revierte el commit de C6; sin efecto visible (aditivo, sin consumidor) |
| C7a | Endurece el stub de `fetch` de la integración (solo test) | A-5 · B-S6a | `pnpm exec vitest run app/dashboard/page.integration.test.tsx` | N/A — mismo motivo | Revierte el commit de C7a; verde sobre el código anterior, sin dependencia hacia atrás |
| C7b | Sección de la bandeja y frase del encabezado | A-5 · B-S6b | `pnpm exec vitest run components/dashboard/coordination-inbox.test.tsx app/dashboard/page.test.tsx app/dashboard/page.integration.test.tsx` | Opcional, fuera del corte: `GET /api/requests/inbox?responsible=COORDINACION` contra el backend de dev con sesión válida — reautenticar antes, porque reiniciar el backend mata sesiones (ver *Fase 8*, 8.5) | Revierte el commit de C7b; el tablero vuelve a solo búsqueda (comportamiento de hoy) — aditivo |

---

## Fase 1 — C1: Baja del vencimiento inventado

**Propósito**: eliminar `deriveDueDate`, `addBusinessDays`, `businessDaysUntil` e `isOverdue`, y
toda pantalla que los consume (insignia «Vencida», columna «Vencimiento», indicadores «Vencidas» /
«Por vencer»). Ítem 3 de `proposal.md`. Cierra el mutante 3.
**Depende de**: — (independiente).
**Commit planeado**: `fix(vencimiento): retira el vencimiento inventado y sus helpers de días hábiles`

- [x] 1.1 RED — `components/dashboard/summary-cards.test.tsx`: la tarjeta «Urgentes» cuenta
      **solo** prioridad; una solicitud abierta, antigua y no urgente da `0`. Observar rojo por la
      razón correcta: hoy da `1` porque cuenta también el vencimiento.
- [x] 1.2 RED — `app/requests/[id]/page.test.tsx`: una solicitud abierta con radicación antigua
      **no** muestra la insignia «Vencida» ni la fila «Vencimiento», afirmado después de que
      termine la carga (convención 4). Traza al escenario «El mutante "badge Vencida" queda en
      rojo» de `coordination-inbox/spec.md` y al requisito «Ausencia de vencimiento en toda la
      aplicación» (mutante 3).
- [x] 1.3 RED — `components/dashboard/requests-table.test.tsx`: renombrar `:46-50` de «muestra el
      vencimiento» a «no afirma vencimiento de un trámite abierto antiguo» (mutante 3).
- [x] 1.4 RED — `app/dashboard/page.test.tsx`: sin indicadores «Vencidas» ni «Por vencer».
- [x] 1.5 GREEN — Borrar `addBusinessDays`, `businessDaysUntil` e `isOverdue` de
      `lib/format.ts:46-67`; borrar `describe('isOverdue')` y su import en
      `lib/format.test.ts:99-117`. Verificar `rg -n
      'addBusinessDays|businessDaysUntil|isOverdue' app components lib` → 0.
- [x] 1.6 GREEN — Borrar el import de `deriveDueDate` (`lib/store.tsx:17`), la función
      (`:154-157`) y el uso de `dueDate` (`:196,472`); borrar `dueDate` de `lib/types.ts:158`.
- [x] 1.7 GREEN — Quitar `dueDate` de los seis objetos de `lib/fixtures/mock-requests.ts`.
- [x] 1.8 GREEN — Borrar `DueCell` (`components/dashboard/requests-table.tsx:14-39`), la columna
      «Vencimiento» (`:77`) y sus celdas (`:118-120,153`), incluida la tarjeta móvil.
- [x] 1.9 GREEN — `components/dashboard/summary-cards.tsx`: renombrar «Urgentes / vencidas» a
      «Urgentes», contando solo prioridad (`:13,47-51,83-85`).
- [x] 1.10 GREEN — `app/dashboard/page.tsx`: borrar las tarjetas «Vencidas» y «Por vencer»
      (`:15,105-110,155-156`) y la parte de vencimiento del filtro «urgente» (`:54-61`).
- [x] 1.11 GREEN — `app/requests/[id]/page.tsx`: borrar la insignia «Vencida» (`:225-226,281-285`)
      y la fila «Vencimiento» del resumen (`:602-613`).
- [x] 1.12 REFACTOR — Confirmar ausencia total:
      `rg -n -i 'venc(e|er|ida|idas|imiento)|d[ií]as restantes|dueDate|isOverdue|businessDaysUntil|addBusinessDays' app components lib -g '!*.test.*'`
      → 0.
- [x] 1.13 Mutante — Restaurar temporalmente la insignia «Vencida» (o `DueCell`) → confirmar que
      1.2 y 1.3 quedan en rojo → revertir el cambio de prueba.
- [x] 1.14 Verificación — `pnpm lint`; `rm -rf .next && pnpm exec tsc --noEmit` (con `pnpm dev`
      detenido); `pnpm test`; `pnpm build`.
- [x] 1.15 Commit `fix(vencimiento): retira el vencimiento inventado y sus helpers de días hábiles`

**Criterios de aceptación**: los cuatro tests de ausencia (1.1–1.4) en verde; búsqueda del 1.12 en
0; `git diff main -- lib/format.ts` no toca `HAS_OFFSET` ni `parseServerDateTime`.
**Rollback**: revertir el commit de C1; independiente del resto (`design.md`, «Rollback por
unidad»).

---

## Fase 2 — C2: `State.isInitial` reemplaza el reconocimiento por código

**Propósito**: hacer `isInitial: boolean` requerido en `State`/`ApiState`; `isInitialState` lee el
contrato; `STATE_SEMANTICS` pierde `initial`; reescribir el comentario de deuda. Ítem 5 de
`proposal.md`. Churn de fixtures en 13 archivos, en el mismo commit (D6).
**Depende de**: — (independiente, pero `InboxEntry.currentState` es un `State` y C6 la necesita).
**Commit planeado**: `refactor(estado): isInitial reemplaza el reconocimiento del inicio por código`

- [x] 2.1 RED — `lib/request-state.test.ts`, escenario «Cada trámite reconoce su propio inicio»
      (`workflow-requests/spec.md`): dos definiciones con códigos de inicio distintos, ambas con
      `isInitial: true`; cada una se reconoce como pendiente de radicación desde su propio
      `currentState.isInitial`, y el inicio de una no se acepta como inicio de la otra.
- [x] 2.2 RED — `lib/request-state.test.ts`, escenario «Un estado que el cliente no reconoce no
      rompe la pantalla»: un código de estado desconocido en la tabla de devolución/rechazo, pero
      con `isInitial: true`, se presenta igual como pendiente de radicación; el mismo código con
      `isFinal: true` se presenta igual como cerrado.
- [x] 2.3 RED (mutante) — `lib/request-state.test.ts`: un código **conocido** (p. ej.
      `EN_COORDINACION`) con `isInitial: false` en el fixture **no** se reporta como inicial. Mata
      el mutante «`isInitialState` vuelve a la tabla por código».
- [x] 2.4 RED — `lib/store.test.ts`: `status: 'pendiente'` sale de `isInitial`, no del código;
      reescribir los comentarios obsoletos de `:51-55,65-68`.
- [x] 2.5 GREEN — Agregar `isInitial: boolean` (requerido) a `State` (`lib/types.ts:18-22`) y a
      `ApiState` (`lib/store.tsx:48`).
- [x] 2.6 GREEN — Reescribir `isInitialState` en `lib/request-state.ts` para leer
      `request.currentState.isInitial`; quitar `initial` de `StateSemantics`/`STATE_SEMANTICS`,
      dejando solo `returned`/`rejection` (sin tocar su comportamiento: los tests existentes de
      devolución y rechazo siguen verdes sin editarse); reescribir el comentario de deuda
      (`:1-15`, en particular `:8-12`) con los tres puntos de D3: el tercio pagado (inicio), los
      dos tercios que quedan (devolución, rechazo, sin `isSuccess`), y la corrección de `:3-6` y
      `:42-49`.
- [x] 2.7 GREEN (fixture churn) — `lib/request-state.test.ts`: los helpers `adicion`/`novedad`
      (`:15-23`) reciben `{ isFinal, isInitial }`; `ADICION_STATES` y `NOVEDAD_STATES` marcan
      `EN_COORDINACION` y `REGISTRADA` como iniciales.
- [x] 2.8 GREEN (fixture churn) — `lib/store.test.ts`: los helpers `summary`/`withState`
      (`:9-21`) ganan `isInitial`; la aserción `toEqual` de `:31-35` lo incluye.
- [x] 2.9 GREEN (fixture churn) — `components/dashboard/requests-table.test.tsx`,
      `components/dashboard/summary-cards.test.tsx`, `components/app-shell.test.tsx`: los helpers
      `conEstado`/`urgente` agregan `isInitial: false`.
- [x] 2.10 GREEN (fixture churn) — Literales tipados `AcademicRequest` y
      `availableTransitions[].targetState` en `app/dashboard/page.test.tsx`,
      `app/requests/[id]/page.test.tsx`, `app/requests/[id]/documento/page.test.tsx`.
- [x] 2.11 GREEN (fixture churn) — Literales tipados `Request`, `RequestSummary`, `TimelineEntry`
      en `lib/api.test.ts`, `lib/use-request-detail.test.ts`.
- [x] 2.12 GREEN (fixture churn) — Los seis `currentState` de `lib/fixtures/mock-requests.ts`.
- [x] 2.13 GREEN (fixture churn) — `app/dashboard/page.integration.test.tsx`: agregar
      `isInitial: true` al fixture `MATCH` (no tipado; sin él, `status` deja de ser `pendiente`).
- [x] 2.14 Mutante — Revertir `isInitialState` a la tabla por código temporalmente → confirmar que
      2.3 queda en rojo → revertir.
- [x] 2.15 Verificación — `pnpm lint`; `rm -rf .next && pnpm exec tsc --noEmit`; `pnpm test`;
      `pnpm build`.
- [x] 2.16 Commit `refactor(estado): isInitial reemplaza el reconocimiento del inicio por código`

**Criterios de aceptación**: `rg -n 'initial: true' lib/request-state.ts` → 0; el comentario de
deuda nombra qué tercio se pagó; los tests existentes de `returned`/`rejection` siguen verdes sin
modificarse.
**Rollback**: revertir el commit de C2; seguro — `isInitial` sigue llegando del backend y queda
ignorado si se revierte.

---

## Fase 3 — C3: Tipo honesto — `definition.name` sustituye la adivinanza (#9b)

**Propósito**: conservar `definition` en `AcademicRequest`; `typeFromCode` se vuelve una allowlist
que devuelve `RequestType | null`; `TypeBadge` recibe `{ code, name }` (ícono por código conocido,
respaldo neutro); el PDF y el detalle muestran `definition.name`. Ítem 4 (parte b) de
`proposal.md`. Cierra el mutante 4.
**Depende de**: C2 (los fixtures ya traen `isInitial`).
**Commit planeado**: `fix(tipo): deja de adivinar el tipo de trámite con una definición desconocida (#9b)`

- [x] 3.1 RED — Migrar el mock total de `@/lib/store` en `app/dashboard/page.test.tsx:11` al
      patrón `importOriginal` (como `components/app-shell.test.tsx:12-15`), conservando
      `baseRequest` real. Escribir el test: filtrar por «Adición de Créditos» **excluye** una
      solicitud construida con `baseRequest` y un código de definición desconocido — mutante 4 en
      el filtro. Observar rojo: hoy `typeFromCode` cae en `'adicion_creditos'` por defecto.
- [x] 3.2 RED — Migrar el mock total de `@/lib/store` en `app/requests/[id]/page.test.tsx:11` al
      mismo patrón. Escenario «Un código de definición desconocido no se presenta como adición de
      créditos (#9b)» (`workflow-requests/spec.md`): una solicitud con `baseRequest` real y código
      desconocido muestra `definition.name`, **no** muestra `/adición de créditos/i`, **no**
      muestra la columna «Créditos», y su `TypeBadge` lleva el ícono neutro, no el birrete.
- [x] 3.3 RED — `lib/store.test.ts`: `baseRequest` conserva `definition`; un código desconocido da
      `type === null` (mutante 4, en la fuente).
- [x] 3.4 RED — `lib/request-state.test.ts`: un trámite con `type: null` no recibe semántica
      (`SIN_SEMANTICA`) y su respuesta sobre el cierre sigue siendo válida (deriva de `isFinal`,
      no de `type`). Reemplaza el comentario «inalcanzable» de `:122-126`.
- [x] 3.5 RED — `app/requests/[id]/documento/page.test.tsx`: el título usa `definition.name`; una
      definición desconocida no muestra el párrafo de adición. Actualizar el literal de mayúscula
      vieja en `:73` a la forma del servidor («Adición de créditos»).
- [x] 3.6 RED — `components/dashboard/requests-table.test.tsx`: la insignia de tipo muestra
      `definition.name`.
- [x] 3.7 GREEN — Agregar `definition: WorkflowDefinition` y `type: RequestType | null` a
      `AcademicRequest` (`lib/types.ts`), con el comentario del bloque *Interfaces / Contracts*
      del diseño (advertencia sobre el ternario binario).
- [x] 3.8 GREEN — Convertir `typeFromCode` (`lib/store.tsx:129`) en la allowlist:
      `ADICION_CREDITOS → 'adicion_creditos'`, `NOVEDAD_NOTAS → 'novedad_notas'`, cualquier otro →
      `null`; `baseRequest` conserva `definition`; `statusFromState` acepta `type: RequestType |
      null`.
- [x] 3.9 GREEN — `lib/request-state.ts`: `StatefulRequest.type` admite `null`; `semanticsOf`
      devuelve `SIN_SEMANTICA` cuando `type` es `null`, reemplazando el comentario obsoleto.
- [x] 3.10 GREEN — `components/type-badge.tsx`: `TypeBadge({ code, name })` — el rótulo es siempre
      `name`; ícono por un mapa decorativo de `code` (`ADICION_CREDITOS` → `GraduationCap`,
      `NOVEDAD_NOTAS` → `BookOpen`), respaldo neutro para cualquier otro código.
- [x] 3.11 GREEN — Actualizar los llamadores de `TypeBadge`:
      `components/dashboard/requests-table.tsx:110,152` y `app/requests/[id]/page.tsx:288`.
- [x] 3.12 GREEN — `app/requests/[id]/page.tsx`: la fila «Tipo de trámite» (`:598-601`) usa
      `req.definition.name`; las columnas de asignaturas (`:378-388,399-413`) se ramifican en tres
      vías (notas / créditos / solo Código y Asignatura).
- [x] 3.13 GREEN — `components/pdf-document.tsx`: título y fila usan `request.definition.name`
      (`:49,74`); el párrafo de detalle se ramifica en tres vías (`:10,88-112`).
- [x] 3.14 GREEN — Confirmar sin cambio de código que el filtro «Tipo de trámite» del tablero
      (`app/dashboard/page.tsx:63,216`) ya funciona: con `type: null` la fila cae bajo «Todos», no
      bajo ningún tipo concreto.
- [x] 3.15 GREEN — Confirmar que `app/requests/[id]/documento/page.test.tsx:13` y
      `app/requests/new/page.test.tsx:10` **no** necesitan migrar a `importOriginal`: el primero ya
      lo usa para `@/lib/api`; ninguno necesita un export real de `@/lib/store` para este cambio.
- [x] 3.16 REFACTOR — `rg -n 'typeFromCode\(|typeToCode\(' app components lib` confirma que siguen
      siendo el único sitio de reconocimiento de códigos.
- [x] 3.17 Mutante — Revertir `typeFromCode` para que el `default` vuelva a `'adicion_creditos'` →
      confirmar que 3.1, 3.2 y 3.3 quedan en rojo → revertir.
- [x] 3.18 Verificación — `pnpm lint`; `rm -rf .next && pnpm exec tsc --noEmit`; `pnpm test`;
      `pnpm build`.
- [x] 3.19 Commit `fix(tipo): deja de adivinar el tipo de trámite con una definición desconocida (#9b)`

**Criterios de aceptación**: mutante 4 en rojo en las tres capas (store, detalle, filtro); el ícono
por trámite se conserva con respaldo neutro; el cambio de mayúsculas queda señalado para la PR.
**Rollback**: revertir el commit de C3; reabre el #9(b) (`design.md`, «Rollback por unidad»).

---

## Fase 4 — C4: Bloque del estado actual (#9a, P1, P2)

**Propósito**: reemplazar el stepper por `CurrentStateBlock`, presentacional; el contenedor deriva
responsable (`currentResponsibility`) y antigüedad (última entrada del timeline, nunca
`createdAt`); retira `stageFromState`, `currentStage` y la fila «Asignado a». Ítem 4 (parte a) de
`proposal.md`, ampliado por la resolución de P1+P2. Cierra el mutante P1/P2. Se divide en **C4a**
(mudanza de `currentResponsibility`, refactor puro) y **C4b** (el bloque).
**Depende de**: C2 (`State` con `isInitial`), C3 (mismas líneas del detalle).
**Commits planeados**: `refactor(estado): muda currentResponsibility a lib/request-state.ts` (C4a)
y `fix(detalle): reemplaza el stepper por el bloque de estado actual (#9a)` (C4b).

### C4a — Mudanza de `currentResponsibility`

- [ ] 4.1 RED — `lib/request-state.test.ts`, escenario «Responsable único en las transiciones
      salientes» (`workflow-requests/spec.md`): todas las transiciones salientes declaran el mismo
      `responsible` → el estado actual se reporta con ese responsable. Observar rojo: la función no
      existe en este módulo (hoy vive en `app/requests/[id]/page.tsx:53-56,67-73`, sin exportar
      para probarse en esta capa).
- [ ] 4.2 RED — Escenario «Responsables divergentes»: dos salientes con `responsible` distinto →
      `{ kind: 'varies' }`, sin elegir uno.
- [ ] 4.3 RED — Escenario «Estado final sin responsable»: `currentState.isFinal: true`
      (`availableTransitions` vacío) → `{ kind: 'closed' }`.
- [ ] 4.4 GREEN — Mudar `currentResponsibility` de `app/requests/[id]/page.tsx:53-56,67-73` a
      `lib/request-state.ts`, con su tipo `Responsibility`; cambiar el parámetro al tipo
      estructural `{ currentState: State; availableTransitions?: AvailableTransition[] }` — sin
      cambio de comportamiento.
- [ ] 4.5 GREEN — `app/requests/[id]/page.tsx` importa `currentResponsibility` desde
      `lib/request-state.ts` en vez de la definición local.
- [ ] 4.6 Verificación (checkpoint C4a) — `pnpm lint`; `rm -rf .next && pnpm exec tsc --noEmit`;
      `pnpm test`.
- [ ] 4.7 Commit `refactor(estado): muda currentResponsibility a lib/request-state.ts`

### C4b — El bloque del estado actual

- [ ] 4.8 RED — `components/current-state-block.test.tsx`: el nombre del estado (`state.name`)
      se renderiza dentro de una región `getByRole('region', { name: /estado actual/i })`
      (convención 3).
- [ ] 4.9 RED — Extender: una insignia para `isInitial: true` y otra, independiente, para
      `isFinal: true`; ninguna aparece cuando ambas son `false`.
- [ ] 4.10 RED — Extender: los tres textos de «Ahora depende de» — `single` → el nombre del
      responsable; `varies` → «Depende de la acción que se registre»; `closed` → «Trámite
      cerrado» — escenarios «Responsable único», «Responsables divergentes» y «Estado final sin
      responsable» de `workflow-requests/spec.md`, ahora a nivel de componente.
- [ ] 4.11 RED — Extender: «Antigüedad del estado» muestra «Lleva 1 día» (singular) y «Lleva N
      días» (N > 1, plural), calculado con `daysSince` sobre `waitingSince` y `now` inyectado; y
      «Lleva 30 días» renderiza con el **mismo estilo** que cualquier otro N — sin insignia ni
      color de urgencia (escenario «Sin insignia de urgencia aunque N sea alto»,
      `request-timeline/spec.md`).
- [ ] 4.12 RED — Extender: «Antigüedad del estado» se oculta cuando `state.isFinal` es `true`
      (escenario «La fila se oculta cuando el trámite está cerrado») y también cuando
      `waitingSince` es `null`.
- [ ] 4.13 RED — Extender: el componente nunca renderiza «paso», un número de paso ni una lista de
      estados (escenario «Sin recorrido lineal entre estados»).
- [ ] 4.14 GREEN — Crear `components/current-state-block.tsx`: `CurrentStateBlock({ state,
      responsibility, waitingSince, now })` presentacional, según el bloque *Interfaces /
      Contracts* del diseño.
- [ ] 4.15 RED — `app/requests/[id]/page.test.tsx`, escenario «Antigüedad calculada desde la
      última entrada» (`request-timeline/spec.md`) y mutante P1/P2: una solicitud con `createdAt`
      hace 60 días y última entrada del timeline hace 1 día muestra «Lleva 1 día». El contenedor
      **debe** derivar `waitingSince` de la última entrada de `req.timeline` (índice `length − 1`,
      o `null` si el timeline está vacío), nunca de `createdAt`.
- [ ] 4.16 RED — Extender: una solicitud con `currentState.isFinal: true` muestra «Trámite
      cerrado» y sin fila de antigüedad.
- [ ] 4.17 RED — Extender, escenario «No hay una segunda respuesta a quién depende»: la fila
      «Asignado a» (`:614`) ya no está presente.
- [ ] 4.18 RED — Extender, escenario «Dos estados intermedios se distinguen en pantalla (#9a)»:
      dos solicitudes en estados intermedios distintos de la misma definición («En facultad», «En
      registro nacional») muestran cada una su propio `currentState.name` y su propio responsable
      dentro de `CurrentStateBlock`, sin agruparlas bajo una etiqueta de etapa compartida.
- [ ] 4.19 GREEN — En `app/requests/[id]/page.tsx`: derivar `responsibility =
      currentResponsibility(req)` y `waitingSince` de la última entrada de `req.timeline`; agregar
      `now = useState(() => Date.now())` al tope de la página (mismo patrón que
      `app/dashboard/page.tsx:28`); reemplazar la tarjeta del stepper (`:318-330`) por
      `<CurrentStateBlock>`; borrar el import/uso del stepper (`:24,115-118`), la lectura de
      `workflowConfig` (`:87`), la definición local de `currentResponsibility`, y la fila «Asignado
      a» (`:614`).
- [ ] 4.20 GREEN — Borrar `components/workflow-stepper.tsx` (68 líneas, sin test).
- [ ] 4.21 GREEN — Borrar `stageFromState` (`lib/store.tsx:147-152`) y `currentStage`
      (`lib/store.tsx:210`); borrar `currentStage` (`lib/types.ts:169`) y `WorkflowStageConfig`
      (`lib/types.ts:183-187`); quitar `currentStage` de `lib/fixtures/mock-requests.ts`.
- [ ] 4.22 GREEN — Quitar las aserciones de `currentStage` en `lib/store.test.ts` (`:62,77`).
- [ ] 4.23 GREEN — Reducir la tarjeta «Resumen» (`app/requests/[id]/page.tsx:592-617`) a una sola
      fila: «Tipo de trámite» con `definition.name` (ya sin «Vencimiento», retirado en C1, ni
      «Asignado a», retirado en 4.19).
- [ ] 4.24 Mutante (P1/P2) — Calcular `waitingSince` desde `createdAt` en vez de la última entrada
      del timeline → confirmar que 4.15 queda en rojo → revertir.
- [ ] 4.25 Verificación — `pnpm lint`; `rm -rf .next && pnpm exec tsc --noEmit`; `pnpm test`;
      `pnpm build`.
- [ ] 4.26 Commit `fix(detalle): reemplaza el stepper por el bloque de estado actual (#9a)`

**Criterios de aceptación**: `rg -n 'WorkflowStepper|stageFromState|currentStage' app components
lib` → 0; #9(a) cerrado (dos estados intermedios distinguibles); P1+P2 restaurados con la fuente
correcta (última entrada, nunca `createdAt`).
**Rollback**: C4b exige revertir C5 primero (si no, el detalle queda leyendo un `workflowConfig`
inexistente); C4a no tiene efecto visible por sí solo.

---

## Fase 5 — C5: Baja de la pantalla de Configuración

**Propósito**: borrado consciente de `app/settings/page.tsx`, su entrada de navegación,
`workflowConfig` del provider, la tabla de `ui-constants.ts` y los tipos que solo ella usaba. Ítem
6 de `proposal.md`, con la evidencia completa en su sección «Decisión consciente».
**Depende de**: C4 (antes de C4, el detalle todavía lee `workflowConfig` y `tsc` rompe si se borra
antes).
**Commit planeado**: `refactor(configuracion): retira la pantalla de Configuración y workflowConfig`

- [ ] 5.1 RED — `app/requests/new/page.test.tsx`: renombrar el primer test (afirma usar «el
      catálogo del store», pero la página lee `GET /workflow-definitions` directo,
      `app/requests/new/page.tsx:55`) a lo que realmente prueba; quitar las claves mock de
      `workflowConfig` (`:15-23,34,46`).
- [ ] 5.2 RED — `app/requests/[id]/page.test.tsx`: quitar la clave mock inocua `workflowConfig`
      (`:61`) del mock de `@/lib/store` — confirma que nada la sigue leyendo.
- [ ] 5.3 RED — Confirmar (sin cambio, con medición) que `components/app-shell.test.tsx` no fija
      los ítems de navegación: `rg -n "'/settings'|Settings" components/app-shell.test.tsx` → si
      hay coincidencias, actualizar el test para no depender del ítem retirado.
- [ ] 5.4 GREEN — Borrar `app/settings/page.tsx` (296 líneas).
- [ ] 5.5 GREEN — Quitar la entrada de navegación `/settings` y el import del ícono `Settings` en
      `components/app-shell.tsx:27`.
- [ ] 5.6 GREEN — Borrar `workflowConfig` — estado, efecto y campos de contexto, incluida
      `updateWorkflowConfig` — de `lib/store.tsx`
      (`:18,27,112,121,290,344-360,476,493,502-503`).
- [ ] 5.7 GREEN — Borrar la tabla escrita a mano `lib/ui-constants.ts:29-56` y su import de
      `RequestTypeConfig`.
- [ ] 5.8 GREEN — Borrar `RequestTypeConfig` de `lib/types.ts:118-124` (confirmar con `rg` que
      `WorkflowStageConfig` ya se borró en C4 — si no, borrarla aquí).
- [ ] 5.9 REFACTOR — Parar `pnpm dev`, `rm -rf .next && pnpm exec tsc --noEmit`: un `TS2307` cuya
      ruta empieza con `.next/` es de tipos obsoletos, no del código (`revisar-frontend-next`,
      «Trampas del entorno»).
- [ ] 5.10 Verificación — `rg -n
      "workflowConfig|updateWorkflowConfig|RequestTypeConfig|WorkflowStageConfig|'/settings'" app
      components lib` → 0.
- [ ] 5.11 Verificación — `pnpm lint`; `rm -rf .next && pnpm exec tsc --noEmit`; `pnpm test`;
      `pnpm build`.
- [ ] 5.12 Nota para el cuerpo de la PR (no bloquea el commit): señalar, sin nombrar a la persona,
      que este cambio retira lo que `ede7bc3` (2026-09-09) restauró — la tabla de evidencia de
      `proposal.md`, «Decisión consciente: baja de la pantalla de Configuración» va citada en la
      *Fase 8*.
- [ ] 5.13 Commit `refactor(configuracion): retira la pantalla de Configuración y workflowConfig`

**Criterios de aceptación**: `app/settings/` no existe; la búsqueda de 5.10 da 0.
**Rollback**: revertir el commit de C5; recupera la pantalla y `workflowConfig`; también
recuperable con `git show ede7bc3:app/settings/page.tsx` (ruta no re-medida en el diseño).

---

## Fase 6 — C6: Cliente `getInbox` + hook `useCoordinationInbox` (sin UI)

**Propósito**: `getInbox` en `lib/api.ts`; tipos `InboxEntry`/`InboxOrigin`; el hook
`useCoordinationInbox` con las constantes `COORDINATION_RESPONSIBLE` e `INBOX_LIMIT`. Ítem 1 de
`proposal.md`. Unidad aditiva, sin consumidor todavía.
**Depende de**: C2 (`InboxEntry.currentState` es un `State`, que ya trae `isInitial`).
**Commit planeado**: `feat(bandeja): getInbox y useCoordinationInbox, sin UI`

- [ ] 6.1 RED — `lib/api.test.ts`, escenario «`responsible` y `limit` viajan explícitos»
      (`coordination-inbox/spec.md`): `getInbox('COORDINACION', 50)` llama a `apiFetch` con
      exactamente `/requests/inbox?responsible=COORDINACION&limit=50` y devuelve el arreglo tal
      cual.
- [ ] 6.2 RED — Extender: `getInbox` devuelve `[]` sin lanzar ante una respuesta `200` vacía.
- [ ] 6.3 RED — Extender: una respuesta `401` hace que `getInbox` lance `ApiError` con
      `status: 401`.
- [ ] 6.4 RED — Extender: una respuesta `400` hace que `getInbox` lance `ApiError` con
      `status: 400`.
- [ ] 6.5 GREEN — Agregar `InboxOrigin` e `InboxEntry` a `lib/types.ts`, según el bloque
      *Interfaces / Contracts* del diseño (sin `studentDocument`; `origin: InboxOrigin | null`).
- [ ] 6.6 GREEN — Agregar `getInbox(responsible, limit)` a `lib/api.ts`, con el mismo patrón
      `apiFetch` + `ApiError` sobre `problem+json` que `searchRequests`/`getRequest`; agregar el
      comentario D5 sobre `listWorkflowDefinitions` (`:220-225`) que explica por qué `states`
      queda sin tipar en esta change.
- [ ] 6.7 RED — `lib/use-coordination-inbox.test.ts`: mock de `useAuth` con `sessionExpired` como
      spy `vi.hoisted` **estable** (trampa documentada en `design.md`); el hook consulta con
      `responsible=COORDINACION&limit=50` al montar.
- [ ] 6.8 RED — Extender, escenario «El DOM respeta el orden del servidor», a nivel de hook: el
      estado transiciona `loading` → `ready` con `entries` en el orden exacto que devolvió el stub
      (mutante 2a: sin reordenar en el hook).
- [ ] 6.9 RED (mutante extra) — Extender: `mayHaveMore` es `true` con exactamente `INBOX_LIMIT`
      (50) entradas y `false` con `INBOX_LIMIT − 1` (49) — kills `>` en vez de `>=`.
- [ ] 6.10 RED — Extender, escenario «Bandeja vacía»: un `200` con `[]` resuelve
      `{ status: 'ready', entries: [] }`, no `error`.
- [ ] 6.11 RED — Extender: un `500` resuelve `{ status: 'error' }` con el `title` del `problem`
      (sin `fallback`, para que llegue el mensaje del servidor).
- [ ] 6.12 RED — Extender: una falla de red (`TypeError`) resuelve `{ status: 'error' }` con «Sin
      conexión con el servidor…».
- [ ] 6.13 RED — Extender, escenario «401 al cargar la bandeja cierra la sesión»: un `401` llama a
      `sessionExpired()` exactamente una vez y no produce mensaje.
- [ ] 6.14 GREEN — Crear `lib/use-coordination-inbox.ts`: `COORDINATION_RESPONSIBLE =
      'COORDINACION'`, `INBOX_LIMIT = 50`, unión discriminada `InboxState` (`loading | ready |
      error`), `useCoordinationInbox()` con el patrón `useEffect` + `ignore` de
      `lib/use-request-detail.ts:36-72`; deps `[sessionExpired]`; `mayHaveMore = entries.length >=
      INBOX_LIMIT`; `401` → `sessionExpired()` sin mensaje; `400` → `apiErrorMessages(err, {
      badRequest })`; otro → `apiErrorMessages(err)` sin `fallback`.
- [ ] 6.15 Confirmar anonimización — los fixtures de `InboxEntry` usados en 6.7–6.13 siguen la
      regla de `design.md` («Fixtures anonimizados»): nombres «Estudiante de prueba N», correos
      `@example.com`/`@correo.test`, identificadores sintéticos, ningún documento real.
- [ ] 6.16 Mutante (2a) — Agregar un `.sort()` sobre `entries` dentro del hook → confirmar que 6.8
      queda en rojo → revertir.
- [ ] 6.17 Mutante (extra) — Cambiar `>=` por `>` en `mayHaveMore` → confirmar que 6.9 queda en
      rojo → revertir.
- [ ] 6.18 Verificación — `rg -n "'COORDINACION'" app components lib -g '!*.test.*'` → 1.
- [ ] 6.19 Verificación — `pnpm lint`; `rm -rf .next && pnpm exec tsc --noEmit`; `pnpm test`;
      `pnpm build`.
- [ ] 6.20 Commit `feat(bandeja): getInbox y useCoordinationInbox, sin UI`

**Criterios de aceptación**: `rg -n 'inbox|Inbox|COORDINATION' lib/store.tsx` → 0 (decisión 12, la
bandeja no toca `store.tsx`); ambos mutantes de esta unidad muertos.
**Rollback**: revertir el commit de C6; sin efecto visible mientras no exista C7 que lo consuma.

---

## Fase 7 — C7: El tablero carga la bandeja al entrar (ítem 2, P3)

**Propósito**: sección `CoordinationInbox` montada en el tablero; frase del encabezado que cuenta
la bandeja; el stub de `fetch` de la integración distingue `/requests/inbox` de
`/requests?search=` **antes** de conectar la carga. Ítem 2 de `proposal.md`, con la resolución de
P3. Se divide en **C7a** (endurecer el stub, solo test) y **C7b** (la sección y la frase).
**Depende de**: C6 (el hook); blandamente de C3 (`TypeBadge({ code, name })` — sin C3 se vería un
`Badge` plano).
**Commits planeados**: `test(integracion): el stub distingue /requests/inbox de
/requests?search=` (C7a) y `feat(tablero): carga la bandeja de la Coordinación al entrar (#12,
P3)` (C7b).

### C7a — Endurecer el stub de `fetch` de la integración (primer paso, obligatorio antes de C7b)

- [ ] 7.1 GREEN (sin RED — arreglo de infraestructura de test, verde sobre el código actual) —
      `app/dashboard/page.integration.test.tsx`: reescribir `stubFetch` (`:66-69`) para que
      `/requests/inbox` responda con su propia respuesta (por defecto `json([])`),
      `/requests?search=` siga usando la cola existente, y cualquier otra URL siga arrojando
      `throw` como hoy. Correr `pnpm test` sobre este archivo y confirmar que sigue verde: la
      carga aún no está conectada (C7b no empezó).
- [ ] 7.2 GREEN — Borrar la ruta `/workflow-definitions` del stub (`:65`) — sin consumidor desde
      que C5 borró el efecto que la llamaba.
- [ ] 7.3 Verificación — `pnpm exec vitest run app/dashboard/page.integration.test.tsx` en verde,
      sin fallos nuevos.
- [ ] 7.4 Commit `test(integracion): el stub distingue /requests/inbox de /requests?search=`

### C7b — La sección de la bandeja y la frase del encabezado

- [ ] 7.5 GREEN — Agregar `ORIGIN_LABELS: Record<InboxOrigin, string>` a `lib/ui-constants.ts`
      (`COORDINATION` → «Coordinación», `PUBLIC_LINK` → «Enlace público», `null` → «Origen no
      registrado»).
- [ ] 7.6 RED — `components/dashboard/coordination-inbox.test.tsx`, escenario «Bandeja vacía» y el
      caso `loading`: `status: 'loading'` no muestra filas ni error; `status: 'ready'` con
      `entries: []` muestra un mensaje explicado, no un error.
- [ ] 7.7 RED — Extender: `status: 'error'` muestra los mensajes dentro de `role="alert"`.
- [ ] 7.8 RED — Extender, escenario «Una fila muestra sus cinco datos»: con un fixture completo,
      se muestran `definition.name`, `studentName`, `currentState.name`, la antigüedad y el
      origen.
- [ ] 7.9 RED — Extender, escenario «El DOM respeta el orden del servidor» (mutante 2b): las filas
      aparecen en el orden exacto del fixture, usando el fixture no trivialmente ordenable de
      `design.md` («Regla del fixture para el orden»): `waitingSince` `[5, 20, 1]` días,
      `createdAt` `[40, 10, 60]`, `studentName` en un tercer orden independiente.
- [ ] 7.10 RED — Extender, escenario «La antigüedad sale de `waitingSince`, no de `createdAt`»
      (mutante 1): un fixture con `createdAt` hace 60 días y `waitingSince` hace 1 día, ambos
      `-05:00`, `now` inyectado, muestra «Esperando desde hace 1 día».
- [ ] 7.11 RED — Extender, escenarios «Origen por enlace público / por Coordinación / nulo se
      presenta sin alarmar»: los tres casos de `origin`, incluido `null` con estilo neutro (mismo
      estilo que los otros dos, no de error).
- [ ] 7.12 RED — Extender, escenarios «Aviso presente al llegar al límite» / «Sin aviso un
      elemento por debajo del límite»: el aviso de truncamiento aparece con `mayHaveMore: true` y
      está ausente con `mayHaveMore: false`.
- [ ] 7.13 RED — Extender: el nombre del estudiante es un `<Link>` a `/requests/{id}` (mockear
      `next/navigation` como en `components/dashboard/requests-table.test.tsx:7-9`).
- [ ] 7.14 RED — Extender, escenario «Ninguna fila expone número de documento»: ninguna fila
      muestra «C.C.» ni una columna de documento.
- [ ] 7.15 RED — Extender: ningún texto de la bandeja matchea `/venc/i` (consistencia con el
      requisito «Ausencia de vencimiento en toda la aplicación»).
- [ ] 7.16 GREEN — Crear `components/dashboard/coordination-inbox.tsx`:
      `CoordinationInbox({ inbox, now })` presentacional, una única `<table>` con desplazamiento
      horizontal en móvil (no el par tabla + tarjetas de `RequestsTable`); columnas Estudiante
      (enlace) · Trámite (`TypeBadge`) · Estado · Esperando · Origen; estados `loading` / `error`
      / vacío / filas / aviso, según *Interfaces / Contracts* y *Data Flow* del diseño.
- [ ] 7.17 RED — `app/dashboard/page.test.tsx`: mockear `@/lib/use-coordination-inbox` con el
      patrón `importOriginal` (`vi.mock('@/lib/use-coordination-inbox', async (importOriginal) =>
      ({ ...(await importOriginal()), useCoordinationInbox }))`); agregar el helper
      `renderDashboard({ tramita, inbox })` que fija **ambos** mocks en cada test (para que ningún
      test herede el `mockReturnValue` de otro).
- [ ] 7.18 RED — Extender, escenario «La bandeja aparece sin que el usuario busque»: la sección
      aparece al entrar al tablero, sin buscar.
- [ ] 7.19 RED — Extender, escenarios «La frase cuenta la bandeja…» / «Singular cuando hay
      exactamente una»: la frase del encabezado dice «Tiene N solicitud(es) esperando su acción»,
      en singular (N=1) y en plural (N≠1).
- [ ] 7.20 RED — Extender, escenarios «"o más" cuando la bandeja llega al límite» / «Sin "o más"
      un elemento por debajo del límite»: la frase incluye «o más» con `INBOX_LIMIT` entradas y no
      la incluye con `INBOX_LIMIT − 1`.
- [ ] 7.21 RED — Extender, escenario «Sin mención de atención prioritaria»: la frase nunca
      menciona «atención prioritaria» ni ningún conteo de prioridad.
- [ ] 7.22 RED — Extender: la frase del encabezado está ausente mientras `status: 'loading'`.
- [ ] 7.23 RED — Extender `app/dashboard/page.integration.test.tsx`, escenario «La bandeja
      convive con la búsqueda existente»: cargar la bandeja al montar **no** consume las
      respuestas encoladas de la búsqueda; hay una única llamada a la bandeja con
      `responsible=COORDINACION&limit=50`; usar el spy `vi.hoisted` de `sessionExpired` en el mock
      de auth (`:20-27`).
- [ ] 7.24 RED — Extender el mismo archivo, escenario «Buscar después de que la bandeja cargó
      sigue funcionando»: tras el montaje, ejecutar una búsqueda por cédula y confirmar que el
      resultado mostrado es el de la búsqueda, no el de la bandeja.
- [ ] 7.25 GREEN — En `app/dashboard/page.tsx`: llamar a `useCoordinationInbox()` una sola vez en
      el contenedor; borrar la lógica vieja de la frase del encabezado (`:125-135`) y
      reemplazarla por la derivación del estado del hook (misma regla D8 de «puede haber más»
      para «o más»); montar `<CoordinationInbox inbox={inbox} now={now} />` en el orden:
      encabezado → sección de la bandeja → tarjetas de resumen → indicadores → filtros →
      búsqueda.
- [ ] 7.26 REFACTOR — Confirmar `rg -n 'inbox|Inbox|COORDINATION' lib/store.tsx` → 0 (la bandeja
      sigue sin tocar el store).
- [ ] 7.27 REFACTOR — Renombrar los tests de `app/dashboard/page.test.tsx` que llamaban «bandeja» a
      los resultados de búsqueda (`:54,158` y el comentario `:47-52`), ahora que existe una
      bandeja real.
- [ ] 7.28 Confirmar anonimización — los fixtures de `InboxEntry` introducidos en 7.6–7.24 siguen
      la regla de `design.md` («Fixtures anonimizados»).
- [ ] 7.29 Mutante (1) — Intercambiar `waitingSince` por `createdAt` en el cálculo de la espera de
      `CoordinationInbox` → confirmar que 7.10 queda en rojo → revertir.
- [ ] 7.30 Mutante (2b) — Agregar un `.sort()`/`.toSorted()` antes de renderizar las filas →
      confirmar que 7.9 queda en rojo → revertir.
- [ ] 7.31 Verificación — `rg -n "'COORDINACION'" app components lib -g '!*.test.*'` → sigue en 1
      (declarada una sola vez, en `lib/use-coordination-inbox.ts`).
- [ ] 7.32 Verificación — `pnpm lint`; `rm -rf .next && pnpm exec tsc --noEmit`; `pnpm test`
      (reportar el resumen de vitest: archivos y tests); `pnpm build`.
- [ ] 7.33 Commit `feat(tablero): carga la bandeja de la Coordinación al entrar (#12, P3)`

**Criterios de aceptación**: todos los bullets restantes de *Success Criteria* en `proposal.md`
quedan satisfechos; mutantes 1 y 2b muertos en esta unidad.
**Rollback**: revertir C7 → revertir C6; el tablero vuelve a solo búsqueda (comportamiento de hoy),
porque la bandeja es aditiva.

---

## Fase 8 — Entrega

**Propósito**: preparar el cuerpo de la PR y el chequeo posterior al merge. No agrega código de
producción.
**Depende de**: todas las unidades anteriores que entren en la PR (según el corte que el humano
elija).

- [ ] 8.1 Redactar el checklist del cuerpo de la PR: `Closes #9` **en inglés, en texto plano,
      nunca entre backticks** (`CLAUDE.md`, «Idioma y convenciones»; `proposal.md`, «Issues
      relacionados»); «Relacionado: #10, #12, #13 (parcial)».
- [ ] 8.2 Declarar en el cuerpo de la PR las tres decisiones del backend: sin plazos ni
      vencimiento (`Tramita#42` abierto, sin ventana institucional citable); sin orden lineal de
      estados (FR-011b del contrato 007); la espera se mide desde `waitingSince`
      (bandeja)/última entrada del timeline (detalle), nunca desde `createdAt`.
- [ ] 8.3 Señalar en el cuerpo de la PR, sin nombrar a la persona, que este cambio retira la
      pantalla de Configuración y `workflowConfig` que `ede7bc3` (2026-09-09) restauró — con la
      tabla de evidencia de `proposal.md`, «Decisión consciente: baja de la pantalla de
      Configuración».
- [ ] 8.4 Señalar en el cuerpo de la PR el cambio visible de mayúsculas del tipo («Adición de
      Créditos» → «Adición de créditos», forma del seed del backend) y que el ícono por trámite se
      conserva, con respaldo neutro para códigos desconocidos.
- [ ] 8.5 Citar en el cuerpo de la PR las referencias `archivo:línea` reales tocadas (de la tabla
      *File Changes* de `design.md`) y el resumen final de `pnpm test` (archivos y tests),
      comparado contra la línea base medida el 2026-09-22: 21 archivos, 165 tests, verde, 12,3 s.
- [ ] 8.6 Chequeo opcional en vivo contra el backend de desarrollo:
      `GET /api/requests/inbox?responsible=COORDINACION` con sesión válida. Reiniciar el backend
      mata las sesiones existentes — reautenticar antes de este chequeo. No bloquea la PR.
- [ ] 8.7 Tras el merge: `gh issue view 9 --json state,closedAt` → confirmar `CLOSED`.

**Criterios de aceptación**: todos los bullets de *Success Criteria* en `proposal.md` marcados; el
cuerpo de la PR incluye las cuatro declaraciones de 8.1–8.4.
