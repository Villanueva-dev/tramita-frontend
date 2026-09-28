<!-- Persistido por el orquestador el 2026-09-22: el ejecutor de sdd-explore no dispone de
herramienta de escritura de archivos. El contenido es el de la observación Engram
`sdd/bandeja-coordinacion-007/explore` (#2337), sin cambios. -->

## Exploration: Bandeja de trabajo de la Coordinación (consumo de la feature 007 del backend)

Medido 2026-09-22 sobre front `9bf95a4` (== `origin/main`) y backend `Tramita` `412a5e0`. TDD estricto activo (runner `pnpm test`, vitest). Las 12 decisiones fijadas en las respuestas del backend (2026-09-22-respuestas-backend-al-front-007.md) se dan por resueltas; esta exploración no las reabre.

### Current State

#### A. Flujo de datos del dashboard hoy, y dónde engancharía la carga de la bandeja

`app/layout.tsx` monta `<TramitaProvider>` (lib/store.tsx:286, 2 callers) envolviendo todo el árbol — es un Client Component (`'use client'`, store.tsx:1) porque React Context no corre en Server Components (node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md, sección "Context providers").

`TramitaProvider` guarda `requests: AcademicRequest[]` (store.tsx:288), poblado ÚNICAMENTE por `searchRequests(term)` (store.tsx:302-328), que llama `lib/api.ts#searchRequests` (importado como `fetchRequestsByTerm`, store.tsx:13) y mapea cada `RequestSummary` con `baseRequest()` (store.tsx:183-220). No hay ninguna carga al montar: el único `useEffect` de arranque (store.tsx:344-360) trae `/workflow-definitions`, no `/requests`. `app/dashboard/page.tsx:27` toma `searched` de `useTramita()` y la tabla se condiciona en `:314` (`{searched ? <RequestsTable requests={filtered} /> : null}`).

`requests` dobla como "resultado de la última búsqueda" — no hay una segunda lista en memoria. Cargar la bandeja al entrar exige, como mínimo, una fuente de datos independiente de `requests`/`searched`, porque una carga en `useEffect` al montar y una búsqueda posterior del usuario no pueden compartir el mismo estado sin que una pise a la otra (ver F para las dos formas de resolverlo).

`metrics: RequestMetrics | null` (store.tsx:289) nunca se puebla desde una petición real — solo se resetea a `null` en logout/expiración (store.tsx:336,369) — así que `metrics?.averageCycleHours`/`metrics?.returnCount` en el dashboard (page.tsx:157-158) siempre caen al valor derivado de `requests`. Es dead state preexistente, no de esta change, pero es la evidencia de que "requests vacío" ya es un estado normal que la UI sabe tolerar.

`assignedTo` (usado en el filtro "Responsable" del dashboard, page.tsx:104,224-243) sale de `apiRequest.availableTransitions?.[0]?.responsible ?? ''` (store.tsx:211) — el PRIMER responsable disponible, no el conjunto; no replica el caso "varía" que sí maneja `currentResponsibility()` del detalle (app/requests/[id]/page.tsx:67-73). Es una discrepancia preexistente entre dashboard y detalle, no introducida por esta change, pero relevante si `pendingResponsible` de la bandeja se compara contra este campo.

#### D. Radio de impacto de cambiar `isInitialState` por `State.isInitial`

`isInitialState` (lib/request-state.ts:92-94) hoy resuelve por `STATE_SEMANTICS[type][code].initial` (tabla escrita a mano, :50-66). Grep confirma exactamente 2 sitios de llamada reales en `lib/store.tsx`: `:139` (`statusFromState`, decide `'pendiente'`) y `:149` (`stageFromState`, decide `'radicacion'`), más la línea de import (:15). El resumen de blast-radius de codegraph reportó "4 callers in lib/store.tsx" para este símbolo — no pude reproducir ese conteo con grep directo; trátese como no verificado y prefiérase el conteo de 2 sitios de llamada para planificar el tamaño del cambio.

`lib/request-state.test.ts` prueba `isInitialState` en 4 `it(...)` (líneas 103-120) más el caso de degradación (127-134), todos construyendo `StatefulRequest` a mano con `{ currentState: { code, name, isFinal }, type }` — NINGUNO construye un `State` con `isInitial` porque el tipo actual (`lib/types.ts:18-22`) no lo declara. Migrar `isInitialState` a leer `request.currentState.isInitial` en vez de la tabla por código exige, como mínimo: (1) agregar `isInitial: boolean` a `State` en `lib/types.ts:18-22` — con eso TODO fixture que construya un `State` sin ese campo falla `tsc` (candidatos medidos: `lib/request-state.test.ts` -8 objetos `State` inline vía `adicion()`/`novedad()` en :15-23-, `lib/fixtures/mock-requests.ts` -6 objetos `currentState`-, `app/dashboard/page.test.tsx:23`, `components/app-shell.test.tsx:33`, y cualquier `ApiState`/`ApiRequest` mock en los demás `page.test.tsx`); (2) cambiar `STATE_SEMANTICS` para que ya no declare `initial` (solo `returned`/`rejection`, per constraint #4) y actualizar el comentario de deuda (:8-12) para decir qué tercio se pagó.

`isClosed` (request-state.ts:77-79) NO se toca — ya usa `currentState.isFinal` directo del contrato, no la tabla, y tiene 19 llamadores medidos (codegraph) — fuera de alcance de esta migración.

#### G. Restricciones de testing

**Trampa de mock total confirmada por lectura directa.** `app/dashboard/page.test.tsx:6,11` — `const useTramita = vi.hoisted(() => vi.fn()); vi.mock('@/lib/store', () => ({ useTramita }))` — reemplaza el módulo entero; cualquier export nuevo de `store.tsx` llega `undefined` en este archivo, y el fallo aparece en el componente que lo consume, no en el mock. El prompt del backend cita los otros tres (`app/requests/[id]/page.test.tsx:11`, `app/requests/[id]/documento/page.test.tsx:13`, `app/requests/new/page.test.tsx:10`) con el mismo patrón — no releídos byte a byte en esta exploración, pero el patrón de import (`vi.mock('@/lib/store', () => ({ useTramita }))`) es idéntico al de dashboard por construcción del proyecto.

**Patrón de arreglo, con precedente real en el repo.** `components/app-shell.test.tsx:12-15` usa `vi.mock('@/lib/store', async (importOriginal) => ({ ...(await importOriginal<typeof import('@/lib/store')>()), useTramita }))` — conserva `baseRequest` real (lo usa su helper `urgente()`, :27-36) mientras mockea solo `useTramita`. Es el patrón a aplicar en los 4 archivos de mock total SI llegan a importar algo nuevo de `store.tsx` que sus tests necesiten real.

**Precedente sin mock.** `lib/store.test.ts` importa `baseRequest`/`subjectsForApi` DIRECTO desde `./store`, sin `vi.mock` — no es candidato de la trampa. Sus fixtures de entrada (`summary`, :9-16) no incluyen `dueDate` (es un campo derivado, no de entrada), así que quitar `deriveDueDate`/`dueDate` de `baseRequest` no rompe este archivo por construcción: ningún `it()` en él asertúa sobre `dueDate`.

**Constraint #12 (bandeja NO en store.tsx) implica que los 4 archivos de mock total quedan estructuralmente a salvo de la adición de la bandeja** — si `getInbox`/`InboxEntry` viven en `lib/api.ts`/`lib/types.ts`, ninguno de esos 4 tests necesita ver un nuevo export de `store.tsx` por la bandeja en sí. Siguen expuestos, en cambio, a lo que SÍ toca `store.tsx`: la baja de `dueDate` (afecta la forma de `AcademicRequest` que sus fixtures inline construyen) y el reemplazo de `isInitialState`.

**Render/entorno.** `@testing-library/react` (`render`, `screen`, `fireEvent`, `cleanup`) + jsdom (`vitest.config.mts`, sin `globals`). `cleanup()` manual + `vi.clearAllMocks()` en `afterEach` en todos los archivos leídos (dashboard :42-45, app-shell :22-25). Cada test de página mockea `@/components/app-shell` (stub que renderiza `children`) y `next/navigation`.

**Forma de un test "el servidor manda el orden" / mutante "sin re-orden en cliente".** Con la convención existente (mock del hook devolviendo un array vía `vi.fn().mockReturnValue(...)` o resolviendo una promesa), el test da al mock un array en un orden NO trivialmente ya ordenado (p. ej. `waitingSince` descendente o intercalado) y afirma con `within(container).getAllBy...` (regla 3 de `revisar-frontend-next`) que el DOM sigue ESE orden, no uno recalculado. El mutante que lo mata: introducir un `.sort(...)` en el hook o en el render y confirmar que el test se pone rojo — exactamente la regla 6 del skill de revisión ("rompé la línea que el test dice cubrir").

#### H. Especificidades de Next.js 16 relevantes

Toda la app es Client Components (`'use client'` en `lib/store.tsx:1`, `app/dashboard/page.tsx:1`, `app/settings/page.tsx:1`, etc.) — no hay Server Components ni fetch en RSC en el área a tocar, así que las guías de streaming/`use cache`/`Suspense` para Server Components (node_modules/next/dist/docs/01-app/01-getting-started/06-fetching-data.md, secciones "Server Components"/"Streaming") no aplican directamente.

Para Client Components, la doc oficial (misma página, sección "Client Components") documenta dos vías: el API `use()` de React sobre una promesa pasada desde un Server Component, o una librería como SWR/React Query. El repo NO usa ninguna de las dos — usa `useEffect` + `fetch`/`apiFetch` plano (store.tsx:344-360 para `/workflow-definitions`; `lib/use-request-detail.ts:36-72` para detalle+timeline). Es un patrón válido pero distinto del que la doc actual destaca; no está deprecado, pero conviene que sdd-design decida a conciencia si la carga de la bandeja sigue este mismo precedente (consistente con el resto de la app) en vez de introducir `use()`/SWR, que nada más en el repo usa hoy.

`lib/use-request-detail.ts` (no consumido por ninguna pantalla activa hoy — `app/requests/[id]/page.tsx:87,96` usa `useTramita().getRequest()`, no este hook; solo aparece en su propio test y en un design.md archivado) SÍ seguía correctamente la regla 6 de `revisar-frontend-next` (`ignore` flag en el cleanup, :37,69-71) para una carga que nace de abrir la pantalla. El `useEffect` de `/workflow-definitions` en `store.tsx:344-360`, en cambio, NO tiene flag `ignore` ni cleanup — es una pequeña violación preexistente de esa misma regla que no conviene copiar para el efecto de carga de la bandeja.

Revisado `node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md` completo: ningún breaking change de la lista (Turbopack por defecto, Async Request APIs, `next/image`, `middleware`→`proxy`, APIs de caché de Server Actions, PPR/`cacheComponents`) toca Client Components, `useEffect` o el patrón de fetch de esta app. Confianza alta: doc leída completa, no por muestreo.

### Affected Areas

#### B. Baja del vencimiento inventado — footprint completo

| Archivo | Qué cae |
|---|---|
| `lib/store.tsx:17` (import), `:154-157` (`deriveDueDate`), `:196` (`dueDate: deriveDueDate(...)` en `baseRequest`), `:472` (`dueDate: item.dueDate` preservado en `transition()`) | función + 2 sitios de uso |
| `lib/format.ts:46-51` (`addBusinessDays`) | queda sin ningún consumidor tras quitar `:196` — único caller medido es `deriveDueDate` |
| `lib/format.ts:53-60` (`businessDaysUntil`), `:65-67` (`isOverdue`) | pierden todos sus consumidores de producción (quedan solo en `lib/format.test.ts`, que también debe revisarse) |
| `lib/types.ts:158` (`AcademicRequest.dueDate`) | campo del tipo |
| `app/dashboard/page.tsx:15` (import), `:57` (`overdueRequests`), `:106-110` (tarjetas "Vencidas"/"Por vencer") | UI + cálculo |
| `components/dashboard/requests-table.tsx:11` (import), `:14-39` (`DueCell`), columna "Vencimiento" en la tabla desktop (:77) y en la card móvil (:153) | componente completo |
| `components/dashboard/summary-cards.tsx:13` (import), `:47-51` (`urgent`, tarjeta "Urgentes/vencidas") | cálculo mezclado con `priority==='urgente'`, que SÍ se queda |
| `app/requests/[id]/page.tsx:42` (import), `:225-226` (`overdue`/`days`), `:281-285` (badge "Vencida hace Nd") | 2 usos independientes en la misma pantalla |
| `lib/fixtures/mock-requests.ts` (6 objetos, campo `dueDate` en cada uno) | fixture de demo |
| `app/dashboard/page.test.tsx:27`, `app/requests/[id]/page.test.tsx:27` (citado por el prompt, no releído byte a byte), `app/requests/[id]/documento/page.test.tsx:36` (ídem) | fixtures inline de test |
| `lib/format.test.ts:99-116` (`describe('isOverdue', ...)`, 3 `it`) | tests que quedan huérfanos si `isOverdue` se borra |

`businessDaysUntil`/`isOverdue` NO tienen test propio fuera de `isOverdue` en `format.test.ts` — `businessDaysUntil` no tiene test directo medido (0 casos con su nombre en `format.test.ts`).

#### C. Baja del stepper — footprint completo (más ancho de lo que cita el prompt del backend)

| Archivo | Rol | Test propio |
|---|---|---|
| `components/workflow-stepper.tsx` (68 líneas) | componente `<WorkflowStepper>` | ninguno (confirmado por codegraph: "no covering tests found") |
| `app/requests/[id]/page.tsx:24` (import), `:115-117` (`stages` vía `useMemo`), `:324-329` (render) | consumidor único de producción | cubierto solo indirectamente por el test de la página, si existe |
| `lib/ui-constants.ts:29-56` (`workflowConfig`, tabla escrita a mano con `stages` por trámite) | fuente de datos hardcodeada | ninguno |
| `lib/types.ts:118-124` (`RequestTypeConfig.stages`), `:183-187` (`WorkflowStageConfig`) | tipos | — |
| `lib/store.tsx:18` (import `defaultWorkflowConfig`), `:112` (tipo en contexto), `:121,476` (`updateWorkflowConfig`), `:290` (estado inicial), `:344-360` (merge con `/workflow-definitions` — preserva `stages` del match existente o `[]` para uno nuevo) | estado + mutador expuestos por el contexto | — |
| `app/settings/page.tsx` (296 líneas completas) — **NO citado por el prompt del backend ni por los hechos previos del orquestador** | pantalla de "Configuración" que edita `RequestTypeConfig` completo: activa/desactiva tipos (`updateType`, :40-44) y edita la ETIQUETA de cada etapa (`updateStageLabel`, :46-59, :165-182) vía `updateWorkflowConfig(config)` (:62) | **ninguno** (`app/settings/*` solo tiene `page.tsx`, sin `.test.tsx`) |

Hallazgo nuevo: `app/settings/page.tsx` es un editor "de demostración" explícito — dice en pantalla "Los cambios se aplican de forma local en esta demostración" (:278) y trae, además del editor de etapas, un input suelto de "Tiempo objetivo de atención (SLA) — Días hábiles antes de marcar una solicitud como vencida" (`slaDays`, :38,251-269) que no está cableado a nada (ni a `deriveDueDate` ni al backend) pero es MÁS superficie textual de "vencida" que sobrevive en la UI si no se toca esta pantalla. Quitar `RequestTypeConfig.stages`/`workflowConfig` rompe `tsc` en este archivo sin que ningún test lo detecte primero — es el único de los 5 consumidores sin red de tests.

#### D. Migración de `isInitialState` — ver Current State arriba (conteo de sitios de llamada + fixtures de `State` que exigirán `isInitial`).

### Approaches

#### E. Cierre del #9(b) — `RequestType`/`typeFromCode`/`TypeBadge`/`ui-constants` (NO decidido, dos ejes distintos)

Hoy `typeFromCode` (store.tsx:129) es un `if/else` sin default seguro: `code === 'NOVEDAD_NOTAS' ? 'novedad_notas' : 'adicion_creditos'` — cualquier código de definición desconocido cae en `'adicion_creditos'`, que es exactamente lo que el criterio de cierre (b) del #9 prohíbe. `RequestType` es una unión cerrada de 2 miembros (`lib/types.ts:75`) con 18 usos medidos en 8 archivos (store.tsx 6, request-state.ts 4, types.ts 3, requests/new/page.tsx 3, dashboard/page.tsx 3, ui-constants.ts 2, type-badge.tsx 2, request-state.test.ts 1).

**Alternativa 1 — bolsa "desconocido" dentro de la unión cerrada (eje: forma del dato).** Extender `RequestType` a un tercer miembro explícito (p. ej. `'desconocido'`) y cambiar `typeFromCode` a un allowlist (`code === 'ADICION_CREDITOS' ? ... : code === 'NOVEDAD_NOTAS' ? ... : 'desconocido'`).
- Pros: el compilador exige completar la fila nueva en cada `Record<RequestType, …>` existente (`STATE_SEMANTICS` en request-state.ts, que su propio comentario :47-49 ya defiende como "no decorativo"; `REQUEST_TYPE_LABELS`/`STATUS_LABELS` en ui-constants.ts) — mismo mecanismo de seguridad que el proyecto ya eligió antes, sin inventar uno nuevo.
- Contras: sigue siendo clasificación de definiciones por código en el cliente — no elimina la deuda de reconocimiento, solo la hace segura; cada `Record` nuevo necesita una entrada "desconocido" con semántica neutra defendible (label genérico, sin stage/semántica de estado).

**Alternativa 2 — dejar de derivar `type` del código y llevar `definition.code`/`definition.name` hasta donde se necesite (eje: flujo del dato).** Igual que `stateName` ya hace con el estado (types.ts:143-146: "`status` agrupa… pero no puede distinguir…"), `TypeBadge` y cualquier lugar que hoy lee `req.type` pasarían a leer el dato crudo de la definición, sin bolsa cerrada.
- Pros: satisface el criterio (b) estructuralmente, no con una rama más; un tercer trámite agregado por configuración (Principio VI) no toca el cliente para su badge de tipo, igual que la regla 1 de `revisar-frontend-next` pide genéricamente.
- Contras: cambio más profundo en los mismos 8 archivos, no aditivo — `STATE_SEMANTICS` (`Record<RequestType,…>`) y `stageFromState`'s branching por `type === 'novedad_notas'` (store.tsx:151) pierden el eje sobre el que están construidos y necesitan un mecanismo distinto (o quedan fuera de esta change).

No se recomienda una sobre otra aquí — es la clase de fork que `sdd-propose`/`sdd-design` debe resolver con el trade-off explícito que pide `openspec/config.yaml` (regla design: "explorar al menos una alternativa en un eje DISTINTO").

#### F. Coexistencia de `InboxEntry` con `AcademicRequest`/`RequestSummary` (NO decidido, dos ejes distintos)

`InboxEntry` (según el contrato de la 007) trae `waitingSince`, `origin`, `pendingResponsible`, y NO trae `studentDocument`; `AcademicRequest`/`RequestSummary` traen `studentDocument`/`dueDate`(hasta que se borre)/`stateName`, y no traen ninguno de los tres campos de la bandeja. Son esquemas genuinamente distintos, no un subconjunto uno del otro.

**Aproximación 1 — tabla presentacional separada + hook nuevo en `lib/`.** Un `useInbox(responsible)` en `lib/use-inbox.ts` (mismo patrón que YA existe, sin uso, en `lib/use-request-detail.ts:22-75`: `useEffect` + flag `ignore` + llamada directa a `lib/api.ts`) alimenta un componente presentacional nuevo (p. ej. `<InboxTable entries={...} />`), en paralelo a `RequestsTable`, sin tocar `AcademicRequest`/`RequestSummary`.
- Pros: cumple la constraint #12 al pie de la letra (bandeja fuera de `store.tsx`); no ensancha `store.tsx`, que la respuesta del backend #12 fence explícitamente ("no en store.tsx (no agrandar el #10)"); reutiliza un patrón ya escrito y correcto en el repo en vez de inventar uno.
- Contras: dos tablas visualmente distintas en el dashboard (una para bandeja, otra para resultados de búsqueda), más superficie de UI/tests que un solo componente; `RequestsTable`/`DueCell` no se reutilizan tal cual para filas de bandeja.

**Aproximación 2 — modelo compartido ensanchado + estado en el provider.** Un tipo `RequestListItem` (unión u opcional) que ambas formas satisfacen, renderizado por una tabla generalizada; el estado de la bandeja vive en `TramitaContextValue` (junto a `requests`/`searchRequests`, sin reemplazarlos).
- Pros: un solo componente de tabla que mantener y testear; una coordinadora ve una forma de fila consistente sin importar el origen.
- Contras: tensiona la constraint #12 si el fetch se orquesta desde el provider (aunque la llamada HTTP en sí viva en `lib/api.ts`, la distinción "estado en el provider vs. llamada en api.ts" es fácil de desdibujar en review); el tipo unión reintroduce exactamente la ambigüedad "campo presente vs. ausente" que la regla 3 de `revisar-frontend-next` señala para `null`/`[]` — una fila de búsqueda tendría que ocultar `waitingSince`/`origin` en el render, que es ramificar por forma de dato, no simplificar.

No se recomienda una sobre otra — el eje de composición (tabla separada vs. modelo único) y el eje de arquitectura de datos (hook vs. provider) son ortogonales; `sdd-design` puede, en principio, mezclar aproximaciones de ejes distintos.

### Recommendation

No hay recomendación única para E ni F — son forks reales con trade-offs en ejes distintos, tal como pide `openspec/config.yaml`; les corresponde a `sdd-propose`/`sdd-design`, no a esta exploración. Lo que SÍ es defendible ahora, sobre la secuencia de trabajo: el descubrimiento de `app/settings/page.tsx` (sin test, consumidor no documentado de `RequestTypeConfig.stages`) debe entrar al proposal como parte EXPLÍCITA del alcance de "quitar el stepper" — de lo contrario `tsc --noEmit` rompe sin que ningún test lo haya anticipado, violando la regla del propio skill de revisión ("hoy hubo dos veces en que la suite estaba verde y tsc en rojo").

### Risks

- **`app/settings/page.tsx` sin cobertura de test** rompe con `tsc` si `RequestTypeConfig.stages` cambia de forma, y no hay ningún test que lo señale antes — riesgo de "verde en `pnpm test`, rojo en `tsc`" documentado como trampa recurrente del propio proyecto.
- **Discrepancia de conteo no resuelta**: codegraph reportó 4 callers de `isInitialState` en `lib/store.tsx`; grep directo solo confirma 2. Confianza media — usar el número de grep (2) para estimar tamaño, pero re-verificar en el momento de aplicar.
- **`assignedTo` del dashboard (store.tsx:211) usa `availableTransitions[0]`, no el conjunto** — si se compara contra `pendingResponsible` de la bandeja como si fueran la misma fuente de verdad, puede desalinearse en el caso "varía" (constraint #7).
- **`RequestMetrics` es dead state** (`metrics` nunca se puebla desde una petición real) — no bloquea esta change, pero cualquier futuro que intente derivar indicadores de bandeja desde `metrics` en vez de desde `requests`/`inbox` heredaría ese vacío.
- **Mezcla de offset horario dentro de la bandeja misma resuelta, pero exige documentarse en el proposal**: `createdAt`/`waitingSince` de `InboxEntryResponse` llevan `-05:00` (decidido, constraint #8), mientras `RequestResponse`/`RequestSummaryResponse`/`TimelineEntry` siguen en UTC sin marcador — `parseServerDateTime` ya resuelve ambos formatos y NO debe tocarse, pero el proposal debe declarar la mezcla para que un revisor no la lea como inconsistencia nueva.
- **D8 (truncamiento bajo `limit`)**: con `limit` default (50) sin pedir 200 (decidido), el corte real es por radicación ascendente y el orden por espera se aplica después — la regla honesta del lado cliente (constraint #9: "si `length === limit`, mostrar 'puede haber más solicitudes'") debe implementarse y testearse, no solo documentarse.
- **Ninguna pregunta genuinamente abierta permanece sobre las 12 decisiones** — las 9 preguntas originales del front están todas resueltas o confirmadas por el backend; lo que queda abierto son los DOS forks de diseño (E, F) arriba, que son decisiones de esta change, no incertidumbre externa.

### Ready for Proposal

Sí. Las dos preguntas que bloqueaban la propuesta (semántica de estado, origen/waitingSince fuera de la bandeja) están resueltas por el backend. Quedan dos forks de diseño genuinos (E: `RequestType` cerrado vs. datos crudos de definición; F: tabla separada+hook vs. modelo compartido+provider) que `sdd-propose`/`sdd-design` deben resolver con trade-off explícito, y un hallazgo nuevo (`app/settings/page.tsx`) que debe entrar al alcance declarado del proposal para que la baja del stepper no rompa `tsc` sin aviso.

---

Verificación del orquestador (2026-09-22, tras la fase): la discrepancia de conteo de `isInitialState` se resolvió con `git grep` — son exactamente 2 sitios de llamada en `lib/store.tsx` (`:139`, `:149`); el conteo de codegraph incluía el import y otras referencias. `app/settings/page.tsx` (296 líneas, sin test) y la ausencia de consumidores de `lib/use-request-detail.ts` quedaron confirmadas en disco.
