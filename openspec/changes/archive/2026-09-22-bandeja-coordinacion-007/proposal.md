# Proposal: Bandeja de trabajo de la Coordinación (consumo de la feature 007)

> **Insumos**: `exploration.md` (esta carpeta); plan del backend
> `2026-09-22-prompt-front-consumir-007.md` (**P**); preguntas y respuestas
> `2026-09-22-preguntas-front-al-backend-007.md` / `2026-09-22-respuestas-backend-al-front-007.md`
> (**R**, citadas por sección). Los tres viven en el workspace, fuera de este repo.
> **Autoridad del contrato**: `Tramita/specs/007-coordination-inbox/contracts/openapi.yaml` (**C**),
> sobre `412a5e0` (== `origin/main` del backend). Front medido sobre `9bf95a4` (== `origin/main`).
> **Cómo se midió**: esta fase no tuvo shell. Las mediciones propias se hicieron con ripgrep desde
> la raíz del repo y se transcriben como `rg …`. Las marcadas **(orq.)** las midió el orquestador el
> 2026-09-22 con el comando indicado y no se re-midieron aquí.

## En una línea

Que el tablero muestre al entrar qué espera hoy a la Coordinación y desde cuándo, en el orden que
manda el servidor, y que ninguna pantalla afirme lo que el sistema no sabe: ni un vencimiento, ni un
recorrido lineal, ni una configuración que no configura nada.

## Intent

1. **El tablero no lista nada al entrar.** Solo muestra resultados después de una búsqueda
   (`app/dashboard/page.tsx:27`, tabla condicionada en `:314`). Nadie consume la bandeja:
   `rg -ni 'inbox' app components lib` → solo el ícono de lucide
   (`components/dashboard/requests-table.tsx:5,48`). La 007 entrega `GET /requests/inbox` (C:35-119).
2. **Tres pantallas afirman cosas que no son ciertas.**
   - *Un vencimiento inventado*: `deriveDueDate` suma seis días a la radicación
     (`lib/store.tsx:154-157`) con `addBusinessDays`, que suma días corridos pese a su nombre
     (`lib/format.ts:46-51`). No hay plazo institucional citable para estos trámites (P:49-52, R §8).
   - *Un recorrido lineal*: el stepper manda todo estado intermedio a una sola etapa
     (`lib/store.tsx:147-152`) tomada de una tabla escrita a mano (`lib/ui-constants.ts:29-56`). Es el
     **#9**. El conjunto de estados no es una secuencia (C:133-136).
   - *Una configuración editable* que escribe en un estado que nadie lee (`app/settings/page.tsx`).
3. **El reconocimiento del estado inicial por código ya tiene reemplazo.** `lib/request-state.ts:50-66`
   reconoce `EN_COORDINACION` y `REGISTRADA` a mano; la 007 expone `State.isInitial` (C:295-301).

**Por qué ahora**: el backend mergeó la 007 el 2026-09-22 (PR `Tramita#47`, cierra `Tramita#22`), y
el #9 tiene criterios de cierre que dependen de ese dato.

## Scope

### In Scope

| # | Entrega | Dónde | Issue |
|---|---|---|---|
| 1 | Cliente `getInbox(responsible, limit?)`; tipos `InboxEntry` y `State.isInitial`; la etiqueta del responsable en **una** constante con nombre (`COORDINATION_RESPONSIBLE = 'COORDINACION'`) | `lib/api.ts`, `lib/types.ts` — **nada** en `lib/store.tsx` | parte del #12 |
| 2 | El tablero **carga la bandeja al entrar**: orden del servidor; «esperando desde hace N días» desde `waitingSince`; origen (enlace público / Coordinación / «Origen no registrado»); «puede haber más solicitudes» cuando `length === limit`. **La búsqueda se conserva.** | `app/dashboard/*`, componente(s) nuevos | parte del #12 |
| 3 | **Baja completa del vencimiento inventado**, con sus tests y fixtures; `addBusinessDays`, `businessDaysUntil` e `isOverdue` se borran porque pierden su último consumidor | ver *Affected Areas* | vencimiento del #10 |
| 4 | **Stepper → bloque del estado actual**: `currentState.name`, de quién depende ahora, marca de inicial o final; sin línea recta ni «paso N de M». Criterios del #9, cada uno fijado por un test: (a) Facultad y Registro Nacional se distinguen en pantalla; (b) un código de definición desconocido **nunca** se pinta como adición de créditos | `app/requests/[id]/page.tsx`; `components/workflow-stepper.tsx` (se borra); `stageFromState`; `currentStage` | **cierra #9** |
| 5 | `isInitialState` lee `currentState.isInitial`; `STATE_SEMANTICS` conserva solo `returned` y `rejection`; se actualiza el comentario de deuda (`lib/request-state.ts:8-12`) | `lib/request-state.ts`, `lib/types.ts`, `lib/store.tsx:48` (`ApiState`), fixtures | — |
| 6 | **Baja de la pantalla de Configuración** — decisión consciente, ver su sección | `app/settings/page.tsx`, navegación, provider, tipos | parte del #13 |

Dos precisiones que esta fase agrega a la exploración, ambas medidas:

- **«De quién depende ahora» está derivado pero no se muestra.** `currentResponsibility`
  (`app/requests/[id]/page.tsx:67-73`) ya implementa los casos único / varía / cerrado, pero
  `rg -n 'currentResponsibility' app components lib` → 1 coincidencia, su propia definición. El
  ítem 4 lo conecta por primera vez.
- **`isInitial` llega también en el timeline.** `TimelineEntryResponse` tipa `fromState`/`toState`
  como `StateResponse` (`Tramita/…/dto/TimelineEntryResponse.java:12-13`), que declara `isInitial`
  (`StateResponse.java:16`) — `rg -n 'record (TimelineEntryResponse|StateResponse)' ../Tramita/src/main/java`.
  Por eso `statusFromState` puede leerlo también para las entradas del timeline (`lib/store.tsx:230-231`).

### Out of Scope

| Qué | Por qué |
|---|---|
| `#36` | «Completadas» cuenta los resultados de la búsqueda, no la bandeja. Otra decisión. |
| El resto del `#10` (fusionar `store.tsx` con `api.ts`) | Esta change **solo quita** de `store.tsx` (vencimiento, `stageFromState`, `workflowConfig`) y no le agrega nada de la bandeja. |
| El resto del `#13` (banner del login, retardo de 700 ms, controles muertos) | Solo se retira el texto de «demostración» de Configuración, como efecto de borrar la pantalla. |
| `origin` en el detalle y en la búsqueda | Lo agrega la 008 del backend al detalle; la búsqueda no lo tendrá (R §2). Sin placeholder ni derivación desde el timeline. |
| Roles y control de acceso | FR-003a, trabajo futuro. La bandeja «filtra, no impide» (C:59-62); `/auth/me` devuelve solo `email` y `active` (R §9). |
| Paginación, total, `hasMore` | No previstos (R §6). |
| Migrar los DTO en UTC sin offset | `Tramita#36`. `parseServerDateTime` no se toca (R §5). |
| Corregir el nombre de `addBusinessDays` | Se borra solo porque pierde su último consumidor. |
| Deudas preexistentes que esta change **ve y no toca** | `assignedTo = availableTransitions[0]` (`lib/store.tsx:211`) alimenta el filtro «Responsable» del tablero (`app/dashboard/page.tsx:65,104`); `new Date(r.createdAt)` saltea `parseServerDateTime` (`app/dashboard/page.tsx:68,114`); el formulario nuevo rotula con `REQUEST_TYPE_LABELS` y no con el catálogo (`app/requests/new/page.tsx:236`); `metrics` nunca se puebla (exploración §A). |

## Capabilities

### New Capabilities

- `coordination-inbox`: la bandeja de la Coordinación en el tablero. Carga al entrar con la
  etiqueta única; conserva el orden del servidor sin reordenar; mide la espera desde `waitingSince`;
  muestra el origen en sus tres casos; avisa del posible truncamiento; trata la lista vacía como
  estado legítimo y no como error (C:97-101); trata el 401 como sesión terminada; no muestra número
  de documento (C:64-66); no muestra vencimiento.

### Modified Capabilities

- `workflow-requests`:
  - **«Interpretación de la semántica del estado»** — el inicio deja de resolverse reconociendo
    códigos y pasa a `currentState.isInitial`. La tabla queda para devolución y rechazo. Cambian los
    escenarios «Cada trámite reconoce su propio inicio» y «Un estado que el cliente no reconoce no
    rompe la pantalla»: con el dato del contrato, un código desconocido marcado inicial **sí** es
    inicial.
  - **«Detalle de una solicitud»** — bloque del estado actual sin orden lineal y criterios (a) y (b)
    del #9. Antecedente para el fork E: el requisito vigente **ya** exige mostrar `definition.name`
    (escenario «El detalle muestra los datos de identificación de la solicitud»). Hoy el detalle
    muestra `REQUEST_TYPE_LABELS[req.type]` y `TypeBadge` (`app/requests/[id]/page.tsx:288,600`)
    porque `AcademicRequest` no conserva `definition` (`lib/types.ts:136-172`). Esa es la raíz del #9(b).
  - **«Responsable del estado actual»** — sin cambio de comportamiento; se actualiza la forma de
    `State` que cita (`{code, name, isFinal}` → `+ isInitial`). Ver P2.
  - **Requisito nuevo** — *antigüedad, no vencimiento*: ninguna pantalla muestra «vence», «vencida»,
    «días restantes» ni plazo alguno. `sdd-spec` decide si vive aquí o en `coordination-inbox`.
  - Nota de redacción: el escenario «Un cierre negado no se cuenta como cumplido» habla de
    «indicadores de la bandeja» refiriéndose a los de la búsqueda. Con una bandeja real conviene
    renombrarlo.
- `request-timeline`: sin cambio de comportamiento. «Antigüedad del estado actual» difiere la regla
  de urgencia «a SP5»; SP5 es la 007 y decidió medir, no dictaminar (R §8), así que se actualiza esa
  mención. Ver P1: ese requisito está especificado pero **no implementado** en la pantalla montada.

## Approach

**Principio**: el servidor decide y el cliente presenta. El orden, el instante de la espera, el
origen y la etiqueta del responsable llegan como datos; el cliente no los recalcula.

**Secuencia por dependencia**, no por número de ítem:

```text
5 isInitial ─┬─> 4 bloque del estado ──> 6 baja de Configuración
             └─> 1 cliente de la bandeja ──> 2 tablero
3 vencimiento — independiente
```

- 6 va después de 4: el detalle lee `workflowConfig` para el stepper (`app/requests/[id]/page.tsx:87,116`);
  borrarlo antes rompe `tsc`.
- 5 va antes de 1: `InboxEntry.currentState` es un `State`, que gana `isInitial`.

**Por ítem**:

- **Cliente (1)**: el mismo patrón que `searchRequests` y `getRequest` en `lib/api.ts` (`apiFetch` +
  `ApiError` sobre problem+json). `limit` viaja **explícito**, con una única constante igual al
  default del contrato (50, C:91). Así, «puede haber más» compara contra el valor que efectivamente
  viajó y no contra un default del servidor que el cliente no ve.
- **Carga (2)**: nace de abrir la pantalla, así que va en un `useEffect` con flag `ignore`
  (regla 6 de `revisar-frontend-next`). El precedente correcto es `lib/use-request-detail.ts:36-72`,
  **no** `lib/store.tsx:344-360`, que carece de cleanup. Dónde vive el estado es el fork F.
- **Espera (2)**: `daysSince(waitingSince)` (`lib/format.ts:20-24`) ya pasa por
  `parseServerDateTime`, que respeta el `-05:00` (`lib/format.ts:8,15-17`). No se escribe código de
  fechas nuevo.
- **Origen (2)**: es un enum cerrado **del contrato** (C:247-249), no un dato configurable del
  motor, así que mapearlo a texto no viola la regla 1 de `revisar-frontend-next`. `null` →
  «Origen no registrado», neutro.
- **Bloque del estado (4)**: componente presentacional alimentado por `currentState` y
  `currentResponsibility(req)`. Sin lista de estados y sin orden.
- **Vencimiento (3) y Configuración (6)**: borrado puro. Los tests que hoy afirman «Vencida» pasan a
  afirmar su ausencia.
- **TDD estricto** (hereda `sdd-tasks`/`sdd-apply`): runner `pnpm test` (vitest); cada
  comportamiento, primero en rojo **por la razón esperada**, después en verde. Los cuatro mutantes
  obligatorios (P:133-136) deben observarse en rojo:
  1. reemplazar `waitingSince` por `createdAt` en la vista;
  2. reordenar la bandeja en el cliente;
  3. restaurar el badge «Vencida»;
  4. pintar una definición desconocida como `adicion_creditos`.

  Aplican también las convenciones de test de `revisar-frontend-next`: `cleanup()` manual,
  `mockClear()`, `within`, y un nombre de test que sea una afirmación.

## Decisiones tomadas — no re-litigar

| # | Decisión | Fuente |
|---|---|---|
| 1 | Se mide la antigüedad; no se dictamina vencimiento. Ningún «vence», «vencida», «días restantes» ni plazo. Si algún día se valida una ventana, la expone el backend como dato. | backend `spec.md:120-128` (orq.); R §8; `Tramita#42` abierto |
| 2 | Sin orden lineal de estados: ni stepper ni «paso N de M». | FR-011b (`spec.md:94`, orq.); C:133-136, :280 |
| 3 | La espera se mide desde `waitingSince`, nunca desde `createdAt`. El orden del servidor manda y el cliente no reordena. | P:55-57; C:97-101, :224-241 |
| 4 | `State.isInitial` reemplaza **ya** el reconocimiento del inicial. La tabla conserva solo `returned` y `rejection`: el motor no tiene esos conceptos y no habrá `isSuccess`. No se abre issue desde el front. | R §1; C:295-306 |
| 5 | `origin` solo en la bandeja. El detalle lo gana cuando la 008 del backend lo agregue a `RequestResponse`. Sin placeholder ni derivación desde el timeline. | R §2 |
| 6 | `waitingSince` es el mismo instante que el `occurredAt` de la última entrada del timeline. | R §3 — ver P1 |
| 7 | Un estado con varios responsables es válido: la solicitud aparece en cada bandeja y `pendingResponsible` es único por consulta. El caso «varía» del detalle se conserva. | R §4 |
| 8 | UTC sin offset sigue siendo el invariante de `RequestResponse`, `RequestSummaryResponse` y `TimelineEntryResponse` (`Tramita#36`). Las dos fechas de la bandeja traen `-05:00`. La mezcla se documenta y `parseServerDateTime` no se toca. | R §5; C:212-223 |
| 9 | `limit` por defecto (50). Sin total ni `hasMore`: si `length === limit`, se muestra «puede haber más solicitudes». Se implementa **y** se testea. | R §6; C:84-95 |
| 10 | `origin: null` → «Origen no registrado», visible y neutro. Se prueba con un mock: en dev no hay caso real y el trigger del timeline impide fabricarlo. | R §7; C:255-258 |
| 11 | La etiqueta del responsable es una constante con nombre, en un solo módulo, sin fallback desde la sesión. Excepción consciente a «nada del motor en el cliente»: el front **es** la cabina de la Coordinación. | R §9; P:104-105 |
| 12 | `getInbox` y sus tipos viven en `lib/api.ts` / `lib/types.ts`, no en `lib/store.tsx`. La búsqueda se conserva. | P:99 |

## Decisión consciente: baja de la pantalla de Configuración

**Qué se borra**: `app/settings/page.tsx` completo (296 líneas); su entrada de navegación
(`components/app-shell.tsx:27`); el estado, el efecto y los campos de contexto de `workflowConfig` /
`updateWorkflowConfig` en `lib/store.tsx` (`:18, :27, :112, :121, :290, :344-360, :476, :493, :502-503`);
la tabla escrita a mano `lib/ui-constants.ts:29-56`; los tipos `RequestTypeConfig` y
`WorkflowStageConfig` (`lib/types.ts:118-124, :183-187`); y las claves inocuas `workflowConfig` de los
mocks en `app/requests/[id]/page.test.tsx:61` y `app/requests/new/page.test.tsx:15-34,46`.

**Evidencia**:

| Hecho | Medición |
|---|---|
| El equipo ya la había eliminado a conciencia el 2026-08-24 en `e3a19ef` («refactor(nav): elimina la pantalla de configuración del flujo»). El cuerpo del commit dice que editar etapas en el cliente «estaría mintiendo sobre lo que el sistema puede hacer», porque las definiciones viven en la base de datos y se leen, sin edición, por `GET /workflow-definitions`. | `git show e3a19ef` (orq.) |
| Volvió entera y sin mención en `ede7bc3` (2026-09-09, «feat: conecta frontend con motor de workflow»), un commit normal de integración cuyo cuerpo no la nombra. | `git show --stat ede7bc3` (orq.) |
| `enabled` no tiene ningún lector fuera de la propia página. | `rg -n '\.enabled' app components lib` → solo `app/settings/page.tsx:138-155` |
| Retirado el stepper, `workflowConfig` no tiene más lector que esta página: el detalle lo lee solo para las etapas. | `app/requests/[id]/page.tsx:87,116-117` |
| El formulario nuevo no depende de ella: rotula con `REQUEST_TYPE_LABELS`. | `app/requests/new/page.tsx:31,236` |
| La tarjeta de validación y el campo de SLA son estado local sin cablear. El SLA dice «Días hábiles antes de marcar una solicitud como vencida» (`:257`): otro texto de vencimiento que el ítem 3 dejaría vivo. | exploración §C; `app/settings/page.tsx:38,251-269` |
| «Guardar cambios» escribe en un contexto que, sin stepper, nadie lee. | `app/settings/page.tsx:62` → `lib/store.tsx:476` |
| Ningún test la cubre, y `components/app-shell.test.tsx` no fija los ítems de navegación. | `app/settings/` contiene solo `page.tsx`; app-shell (orq.) |
| Borrar la tabla quita 2 de los 3 llamados a `typeFromCode`, lo que achica el fork E. | `rg -n 'typeFromCode\(' app components lib` → `lib/store.tsx:184,351,352` |

**Alternativa descartada**: recortar solo el editor de etapas y el campo de SLA (≈60 líneas). Deja
una pantalla que sigue afirmando que configura el flujo y deja estado muerto en el provider.

**Consecuencias**:

- desaparece el ítem «Configuración» del menú;
- ≈390 líneas de borrado puro;
- se retira uno de los dos textos de «demostración» que lista el `#13`, **sin cerrarlo**;
- el cuerpo de la PR debe señalárselo explícitamente al integrante que la restauró en `ede7bc3`,
  porque esta change quita lo que ese commit trajo de vuelta.

## Forks para `sdd-design` — enmarcados, no decididos

`config.yaml` exige explorar al menos una alternativa **en un eje distinto** antes de elegir.

### E. Cómo satisfacer el #9(b) para `RequestType`

- **Cota de aceptación**: un código de definición desconocido **nunca** se presenta como adición de
  créditos, en ningún lugar donde se muestre el tipo (badge, fila «Tipo de trámite», filtro). Hoy
  `typeFromCode` cae en `'adicion_creditos'` por defecto (`lib/store.tsx:129`).
- **Alternativas** (exploración §E): *forma del dato* — tercer miembro explícito en la unión cerrada,
  con allowlist — frente a *flujo del dato* — conservar `definition` y leer `definition.name`.
- **Consideraciones a pesar**:
  - el patrón `Record<RequestType, …>` que el compilador hace cumplir ya está en el repo
    (`lib/request-state.ts:47-50`);
  - el requisito vigente ya pide `definition.name` en el detalle (ver *Capabilities*);
  - la change anterior sentó el precedente de conservar el dato crudo en lugar de descartarlo
    (`archive/2026-09-19-semantica-de-estado-del-tramite/proposal.md:23`);
  - la bandeja trae `definition.name` directo y no necesita derivar un tipo.

### F. Cómo conviven las filas de la bandeja con las de la búsqueda

- **Cota**: la decisión 12 (nada de la bandeja en `store.tsx`). El precedente sin uso
  `lib/use-request-detail.ts` ya aplica bien el patrón `ignore`. `InboxEntry` no trae
  `studentDocument` ni `dueDate`, y trae `waitingSince`, `origin` y `pendingResponsible`: los dos
  esquemas no están contenidos uno en el otro.
- **Alternativas** (exploración §F), en dos ejes ortogonales:
  - composición: tabla presentacional separada frente a modelo compartido ensanchado;
  - datos: hook en `lib/` frente a estado en el provider.

### Acotación al plan: `WorkflowDefinition.states`

El plan nombra «`WorkflowDefinition.states`» (P:99). El contrato, en cambio, separa a propósito
`WorkflowDefinitionDetailResponse` (con `states`) de `WorkflowDefinitionResponse`, que se anida en
cada solicitud y **no se amplía** (C:263-269, :308-317). En el front, `WorkflowDefinition` tipa
`Request.definition` y `RequestSummary.definition` (`lib/types.ts:37,48`), y tiparía
`InboxEntry.definition`: agregarle `states` haría que el tipo afirme un campo que el backend ahí no
envía. Además, nada en esta change lee `states[]`, porque el inicio sale de `currentState.isInitial`.

**Recomendación**: si se tipa, que sea como tipo propio (`WorkflowDefinitionDetail`) retornado por
`listWorkflowDefinitions` (`lib/api.ts:221`). Si no, diferirlo (YAGNI). Esto no reabre la decisión 12:
cambia la forma, no el lugar. Decide el diseño.

## Decisiones pendientes — devueltas al orquestador

> **Resueltas el 2026-09-22** por el responsable del proyecto; ver «Resolución de las decisiones
> pendientes» más abajo. El texto de esta sección se conserva como traza de por qué se preguntó.

No bloquean la propuesta. Solo esperan la parte de `sdd-spec` que depende de cada una.

**P1 — La antigüedad del detalle está especificada pero no implementada.**
`request-timeline` exige «lleva N días esperando» desde la última entrada del timeline. Pero
`rg -n 'esperando|lleva' app components` no encuentra nada en el detalle, y `daysSince`
(`lib/format.ts:20`) no tiene ningún consumidor de producción (solo `lib/format.test.ts`). La
decisión 6 («se conserva tal cual») presupone un cálculo que la pantalla montada no hace.
- (a) Incluirlo en el bloque del ítem 4, con `daysSince` sobre la última entrada (≈30–50 líneas con
  su test).
- (b) Dejarlo fuera y registrar la brecha como desvío conocido de la spec.

Recomendación: (a). La spec ya lo manda y el bloque es su lugar natural. Pero agranda el alcance y
requiere autorización. Depende de esto: el requisito del detalle en `sdd-spec`.

**P2 — La fila «Asignado a» contradice el requisito vigente.**
`app/requests/[id]/page.tsx:614` muestra `req.assignedTo`, es decir `availableTransitions[0]`
(`lib/store.tsx:211`): elige un responsable cuando difieren, algo que «Responsable del estado actual»
prohíbe. Con el bloque nuevo, la pantalla daría dos respuestas a la misma pregunta.

Recomendación: que el bloque sea la única respuesta y retirar la fila dentro del ítem 4. No está
entre los seis ítems, así que no se incluye sin confirmación.

**P3 — Dos sentidos de «pendiente» en el tablero.**
El encabezado «Tiene N solicitudes pendientes y M con atención prioritaria»
(`app/dashboard/page.tsx:126-134`) cuenta `requests` (la búsqueda) con `status === 'pendiente'`, que
significa solo «estado inicial». Con la bandeja cargada al entrar y sin buscar, diría «0 pendientes»
sobre una bandeja con filas.
- (a) Que la frase cuente la bandeja, con la misma salvedad de «puede haber más».
- (b) Reformularla para que diga qué cuenta.
- (c) Quitarla.

Recomendación: (a). Las tarjetas quedan como están (`#36`). Depende de esto: el requisito del tablero
en `coordination-inbox`.

## Resolución de las decisiones pendientes (2026-09-22)

Las tres se resolvieron con evidencia medida antes de decidir; los detalles viven en Engram
(`tramita-frontend/handoff/2026-09-22-consumir-007/decision-p1-p2-detalle` y `…/decision-p3-encabezado`).

**P1 + P2 — restaurar ambas filas y retirar «Asignado a».** El bloque de estado del ítem 4 vuelve a
mostrar «Ahora depende de» con sus tres casos (responsable único; «Depende de la acción que se
registre» cuando las salidas tienen responsables distintos; «Trámite cerrado» en estado final) usando
`currentResponsibility` (`app/requests/[id]/page.tsx:67-73`, hoy sin uso), y «Antigüedad del estado:
Lleva N días» calculada con `daysSince` sobre el `occurredAt` de la última entrada del timeline, oculta
cuando el trámite está cerrado. Se retira la fila «Asignado a» (`:614`). El campo `assignedTo` del
store se conserva porque lo usa el filtro «Responsable» del tablero, fuera de alcance.

- **Por qué no es ampliación de alcance sino restauración**: las dos filas cumplían
  `request-timeline` («Antigüedad del estado actual», `:49`) y `workflow-requests` («Responsable del
  estado actual», `:221`), fueron implementadas en `b50f056` (2026-08-28, «feat(detalle): lee la
  solicitud del backend y deriva su responsable») y borradas de la pantalla por `ede7bc3` (2026-09-09),
  el mismo commit que restauró la pantalla de Configuración. `currentResponsibility` sobrevivió como
  export sin llamadores. Ningún test las fijaba: por eso la regresión pasó en verde.
- **Prueba determinista** (funciones reales del repo, sin mocks): para una solicitud radicada hace
  60 días y reingresada ayer, la pantalla de hoy dice «vencida 54d», la bandeja 007 dirá «hace 1 día»
  y el detalle restaurado dice «Lleva 1 día». Con salidas de responsables distintos, «Asignado a»
  inventa el primero; en un trámite cerrado muestra una fila vacía.
- **Costo**: 30–50 líneas de código y 3–4 tests en el test de la página (único, varía, cerrada,
  antigüedad desde la última entrada) con el mutante «`createdAt` en vez de la última entrada» en rojo.
  Se suma al ítem 4.

**P3 — la frase del encabezado cuenta la bandeja.** «Tiene N solicitud(es) esperando su acción», con
«o más» cuando la lista llega al `limit` (la misma regla D8 de la bandeja). Se retira «y M con atención
prioritaria»: `priority` no existe en el backend y `baseRequest` lo rellena con `'normal'`
(`lib/store.tsx:186`), así que M es siempre 0.

- **Prueba** (render real de `DashboardPage` en un test temporal, borrado tras correr): al entrar sin
  buscar la frase dice hoy «Tiene 0 solicitudes pendientes y 0 con atención prioritaria»; tras buscar
  dos solicitudes con una en estado inicial dice «Tiene 1 solicitudes pendientes y 0 con atención
  prioritaria» (error de plural incluido).
- **Alternativas descartadas**: quitar la frase (11 líneas de borrado; pierde el resumen de un vistazo)
  y dejarla contando la búsqueda (diría «0 resultados» al entrar y no hablaría de la bandeja).
- **Costo**: 35–45 líneas (4–6 de JSX y 2 tests: singular/plural, y «o más» en el límite). La fuente
  del conteo la decide el diseño en el fork F. Se suma al ítem 2.

## Affected Areas

| Área | Impacto | Qué cambia | Ítem |
|---|---|---|---|
| `lib/api.ts` | Modified | `+getInbox`; constante del límite | 1 |
| Módulo de la constante del responsable (lo fija el diseño, fuera de `store.tsx`) | New | `COORDINATION_RESPONSIBLE` | 1 |
| `lib/types.ts` | Modified | `+InboxEntry`, `+State.isInitial`; `−dueDate` (:158), `−currentStage` (:169), `−RequestTypeConfig` (:118-124), `−WorkflowStageConfig` (:183-187) | 1, 3, 4, 5, 6 |
| `app/dashboard/page.tsx` y componente(s) nuevos en `components/dashboard/` | Modified / New | carga de la bandeja; `−` vencidas y por vencer (:15, 54-61, 106-110, 155-156) | 2, 3 |
| `lib/store.tsx` | Modified | `ApiState.isInitial` (:48); `−deriveDueDate` (:17, 154-157, 196, 472); `−stageFromState` (:147-152, 210); `−workflowConfig` (ver sección propia) | 3, 4, 5, 6 |
| `lib/request-state.ts` | Modified | `isInitialState` lee el contrato; tabla sin `initial`; comentario :8-12 | 5 |
| `lib/format.ts` | Modified | `−addBusinessDays`, `−businessDaysUntil`, `−isOverdue` (:46-67). `parseServerDateTime` intacto | 3 |
| `components/dashboard/requests-table.tsx` | Modified | `−DueCell` (:14-39), columna «Vencimiento» (:77 y tarjeta móvil) | 3 |
| `components/dashboard/summary-cards.tsx` | Modified | «Urgentes / vencidas» → solo prioridad (:13, 47-51, 83) | 3 |
| `app/requests/[id]/page.tsx` | Modified | bloque del estado; `−` stepper (:24, 87, 115-118, 318-330), badge «Vencida» (:42, 225-226, 281-285), **fila «Vencimiento» del resumen (:602-613)**; tipo mostrado (:288, 600) según el fork E | 3, 4 |
| `components/workflow-stepper.tsx` | Removed | 68 líneas, sin test (orq.) | 4 |
| `app/settings/page.tsx` | Removed | 296 líneas, sin test | 6 |
| `components/app-shell.tsx`, `lib/ui-constants.ts` | Modified | `−` entrada de navegación (:27); `−workflowConfig` (:29-56) | 6 |
| Tests y fixtures | Modified | `lib/format.test.ts:2,99-116`; **`components/dashboard/requests-table.test.tsx:18-50`** (un caso afirma que «Vencida» se muestra); `lib/store.test.ts:9-21,51-78`; `lib/request-state.test.ts`; `lib/fixtures/mock-requests.ts` (6 × `dueDate`/`currentStage`/`State`); fixtures de página con `dueDate` (`app/dashboard/page.test.tsx:27`, `app/requests/[id]/page.test.tsx:27`, `app/requests/[id]/documento/page.test.tsx:36`) y `currentStage` (`:38`, `:38`, `:47`); **`app/dashboard/page.integration.test.tsx:61-73`** (ver *Risks*) | 1–6 |

En **negrita**, lo que la exploración no listaba. Comandos que miden estas áreas:

```bash
rg -n 'dueDate|deriveDueDate|addBusinessDays|businessDaysUntil|isOverdue|Vencid|vencid|Vencimiento' app components lib
rg -n 'currentStage|stageFromState|WorkflowStepper|workflowConfig|updateWorkflowConfig|RequestTypeConfig|WorkflowStageConfig' app components lib
rg -n 'currentResponsibility|daysSince|esperando' app components lib
rg -n 'isInitialState\(|typeFromCode\(' app components lib
rg -n 'COORDINACION|COORDINATION' app components lib    # hoy: solo códigos de estado y fixtures
```

## Risks

| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| **Verde en `pnpm test`, rojo en `tsc`**: `app/settings/page.tsx` no tiene test, y `State.isInitial` rompe fixtures solo en compilación | Alta | `rm -rf .next && pnpm exec tsc --noEmit` en cada unidad de trabajo, no solo al final (el CI lo corre). 6 va después de 4. |
| **El stub de `fetch` de `app/dashboard/page.integration.test.tsx` enruta todo `/requests` a la cola de búsquedas** (`:66-67`): una carga de `/requests/inbox` al montar consumiría la primera respuesta encolada y desplazaría las demás, en rojo o —peor— en verde por la razón equivocada | Alta si la carga toca ese montaje | El stub debe distinguir `/requests/inbox` de `/requests?search=` **antes** de conectar la carga. |
| **Trampa del mock total** en cuatro tests (`app/dashboard/page.test.tsx:11`, `app/requests/[id]/page.test.tsx:11`, `app/requests/[id]/documento/page.test.tsx:13`, `app/requests/new/page.test.tsx:10`; orq.) | Media | La decisión 12 deja la bandeja fuera de `store.tsx`. Si alguno necesita un export real, usar el patrón `importOriginal` de `components/app-shell.test.tsx:12`. |
| Dos sentidos de «pendiente» en la misma pantalla | Alta si P3 queda sin resolver | P3. |
| Truncamiento D8: bajo `limit`, el corte es por radicación | Baja (30–40 solicitudes por semestre, R §6) | Aviso testeado en `length === limit` y ausente en `limit − 1`. |
| La mezcla de offsets se lee como inconsistencia nueva | Media | Decisión 8 documentada. El código nuevo no copia el `new Date(...)` preexistente del tablero. |
| Quitar lo que un integrante restauró | Media | La PR lo señala con la evidencia. Recuperable (ver *Rollback*). |
| `assignedTo` (primer responsable) comparado con `pendingResponsible` | Baja | Las filas de la bandeja usan solo `pendingResponsible`; no se mezclan fuentes. |
| `origin: null` nunca observado en vivo | Baja | Test con mock; el backend impide fabricar el caso (R §7). |
| Tamaño total por encima del presupuesto de 400 líneas | Alta | `ask-on-risk`; ver *Tamaño y entrega*. |

## Tamaño y entrega

**Estimación gruesa**, construida a partir del footprint medido. No es una medición.

| # | Trabajo | Líneas (adiciones + borrados) | Composición |
|---|---|---|---|
| 1 | Cliente + tipos | 100–150 | adiciones; cerca de la mitad, tests |
| 2 | Tablero con la bandeja | 300–450 | adiciones: carga, presentación, tests de orden, espera, origen, aviso, vacío y 401 |
| 3 | Baja del vencimiento | 170–230 | casi todo borrado, más la reescritura de `requests-table.test.tsx` |
| 4 | Bloque del estado + #9 | 220–380 | depende del fork E (y de P1/P2) |
| 5 | `isInitial` | 80–120 | churn de fixtures |
| 6 | Baja de Configuración | ≈390 | borrado puro |
| | **Total** | **≈1260–1720** | |

Con `ask-on-risk`, `sdd-tasks` preguntará si se divide. Dos cortes posibles, **sin decidir**:

- **A — el que sugiere el plan.** PR-1, solo borrado (3 + retiro del stepper + 6): ≈670–730 líneas.
  PR-2 (5 + bloque de 4 + 1 + 2): ≈650–1000. **Las dos exceden 400.** PR-1 es barata de revisar por
  línea; PR-2 no. Entre una y otra, el detalle queda sin tarjeta de etapa, aunque el badge del
  encabezado sigue mostrando `currentState.name` (`app/requests/[id]/page.tsx:277`). El #9 cierra con PR-2.
- **B — por el grafo de dependencias.** S1 = 3 (≈200); S2 = 5 + 4 (≈300–500); S3 = 6 (≈390, borrado
  puro); S4 = 1 + 2 (≈400–600). Cada una queda cerca del presupuesto, y S4 podría pedir partirse en
  cliente + carga / presentación.

## Rollback Plan

- Todo vive en una rama, `feat/bandeja-coordinacion-007`. Cada ítem se revierte con sus commits de
  unidad de trabajo, **en orden inverso de dependencia** (2 → 1; 6 → 4 → 5; 3 es independiente).
  En otro orden, `tsc` rompe.
- No migra datos, no cambia el contrato y no pide nada al backend.
- La bandeja es aditiva: revertir 1–2 devuelve el tablero a solo búsqueda, que es el comportamiento de hoy.
- La pantalla borrada se recupera de `ede7bc3` (la restauración) o del padre de `e3a19ef` — por
  ejemplo, `git show ede7bc3:app/settings/page.tsx` (ruta no re-medida aquí).

## Dependencies

- Feature 007 del backend mergeada (`412a5e0`, `Tramita#47`). Es la única dependencia externa.
- La 008 del backend (origen en el detalle) **no** es dependencia: esta change no la espera.
- Antes de escribir código de App Router, leer la guía correspondiente en `node_modules/next/dist/docs/`
  (lo exige el `CLAUDE.md` del repo).
- Respuestas a P1–P3, solo para la parte de la spec que depende de cada una.

## Issues relacionados

- **Cierra #9.** En el cuerpo de la PR, la línea de cierre va en inglés y en texto plano, nunca entre
  backticks (`CLAUDE.md`, «Idioma y convenciones»).
- **Relacionado, en parte**: #10 (vencimiento; no agrandar `store.tsx`), #12 (la bandeja),
  #13 (retira un texto de «demostración»).
- **Backend**: `Tramita#22` cerrado por la PR #47 el 2026-09-22. `Tramita#36` (UTC) y `Tramita#42`
  (ventana de radicación) siguen abiertos y sostienen las decisiones 8 y 1.
- **La PR declara** las tres decisiones del backend (P:163-164): un revisor preguntará por qué
  desapareció el vencimiento. También señala la baja de Configuración a quien la restauró.

## Línea base medida

- `pnpm test` el 2026-09-22 → 21 archivos, 165 tests, todos en verde, 12,3 s (orq.).
- El CI corre lint, `rm -rf .next && pnpm exec tsc --noEmit`, tests y build.

## Success Criteria

> **Verificados el 2026-09-22 en `9731963`** por `sdd-verify`
> (`verify-report.md`, sección «Success Criteria»): 16 de 17 cumplidos con evidencia; el 17
> (cierre del #9) depende del merge de las cinco PRs, decisión del responsable del proyecto.

- [x] El tablero carga la bandeja al entrar, sin buscar, con `COORDINATION_RESPONSIBLE` y `limit`
      explícito.
- [x] El orden del DOM es el del servidor, probado con un fixture no ordenado. El mutante 2 queda en rojo.
- [x] «Esperando desde hace N días» sale de `waitingSince`. El mutante 1 queda en rojo.
- [x] El origen se presenta en sus tres casos, incluido `null` → «Origen no registrado», probado con mock.
- [x] «Puede haber más solicitudes» aparece con `length === limit` y no con `limit − 1`.
- [x] La lista vacía muestra un estado explicado, no un error. El 401 termina la sesión.
- [x] La búsqueda sigue funcionando: sus tests existentes siguen en verde.
- [x] Sin vencimiento: `rg -n -i 'venc(e|er|ida|idas|imiento)|d[ií]as restantes|dueDate|isOverdue|businessDaysUntil|addBusinessDays' app components lib -g '!*.test.*'`
      → 0. El mutante 3 queda en rojo.
- [x] Sin stepper ni etapas: `rg -n 'WorkflowStepper|stageFromState|currentStage' app components lib` → 0.
- [x] #9(a): un test muestra dos estados intermedios distintos (Facultad y Registro Nacional) con
      nombres distinguibles en pantalla.
- [x] #9(b): un test con un código de definición desconocido no muestra «Adición de créditos» en
      ningún lugar. El mutante 4 queda en rojo.
- [x] `isInitialState` lee `currentState.isInitial`: `rg -n 'initial: true' lib/request-state.ts` → 0,
      y el comentario de deuda dice qué tercio se pagó.
- [x] Configuración retirada: `app/settings/` no existe y
      `rg -n "workflowConfig|updateWorkflowConfig|RequestTypeConfig|WorkflowStageConfig|'/settings'" app components lib`
      → 0.
- [x] La etiqueta vive una sola vez: `rg -n "'COORDINACION'" app components lib -g '!*.test.*'` → 1.
- [x] `git diff main -- lib/format.ts` no toca `HAS_OFFSET` ni `parseServerDateTime`.
- [x] `pnpm lint`, `rm -rf .next && pnpm exec tsc --noEmit`, `pnpm test` y `pnpm build` en verde, con
      el resumen de vitest (archivos y tests) reportado.
- [ ] Tras el merge: `gh issue view 9 --json state,closedAt` → `CLOSED`.
