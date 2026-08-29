# Proposal: Fase B — integración con el motor de workflow

## Intent

El front corre 100% sobre mocks y **congela en TypeScript la genericidad que el backend prueba por dato**: `lib/types.ts` fija `RequestType`/`RequestStatus` como union types literales, y `lib/store.tsx` reimplementa la máquina de estados en el cliente. Agregar un trámite exigiría recompilar el front. La Fase B conecta contra la `002` y traslada trámites, estados y acciones al servidor, bajo el encuadre ya fijado: **el verbo es REGISTRAR, no aprobar** (`project.md`).

## Scope

### In Scope

- Modelo cliente **data-driven**: `WorkflowDefinition`, `State`, `AvailableTransition`, `TimelineEntry` reflejan el payload real.
- **Muere la FSM del cliente**: `nextStatusFor()` / `stageForStatus()` (FR-009 — transiciona el servidor).
- **Crear**: form recortado a `definitionCode` + `studentName` + `studentDocument`; selector poblado desde `GET /workflow-definitions`.
- **Buscar** por nombre o cédula (`GET /requests?search=`, mín. 2 caracteres).
- **Detalle**: estado actual con responsable, «lleva N días esperando», acciones compuestas desde `availableTransitions` (`targetState.name` + `responsible`) redactadas como registro; devolución con motivo obligatorio (422).
- **Timeline** con el par `actorEmail` + `responsible` («registrado por X · en nombre de Y»).

### Out of Scope

| Sale | Destino | Justificación |
|---|---|---|
| `components/workflow-stepper.tsx` | **Se borra** | La cadena lineal **no es derivable ni agregando endpoint**: grafo cíclico (devoluciones) y `workflow_state` sin columna de orden (PK UUID, sin timestamp). Y «paso 3 de 6» promete un avance que el proceso no garantiza. |
| `app/settings/page.tsx` | **Se borra** | Sin sprint asignado; su propio texto la declara demo local y el backend no expone escritura de configuración. |
| `documento/page.tsx` + `components/pdf-document.tsx` | **Stub autosuficiente** | El stub declara en código: SP3/Sprint 2 · recuperación `git show 9d9c53c:components/pdf-document.tsx` · faltantes en backend (`radicado`, `program`, `semester`, `subjects`, `reason`, firma, sello). Incluye actualizar el `<Link>` en `app/requests/[id]/page.tsx:242-245`. |
| Bandeja consolidada (conteos, filtros, badge urgentes) | **SP5 / Sprint 3** | Exclusión documentada de la `002` (`spec.md:162`); FR-011 dice *localizar*, no listar. El dashboard se rediseña como **buscador**. |
| `priority`, `dueDate` | **Diferidos a SP5** | Anticipan los recordatorios; no se descartan por absurdos. |
| `attachments`, `SubjectInfo`, `radicado`, `assignedTo`, `program`, `semester`, `studentEmail`, `studentCode` | **Se recortan** | Sin fuente en el backend. |

## Capabilities

### New Capabilities

- `workflow-requests`: catálogo de trámites, registro con los tres campos reales, localización por nombre/cédula y consulta de detalle.
- `request-transitions`: acciones compuestas desde `availableTransitions`, redactadas como registro, con nota obligatoria cuando `requiresNote`.
- `request-timeline`: bitácora cronológica con el par actor / en-nombre-de y la antigüedad del estado actual.

### Modified Capabilities

- None. `openspec/specs/` está vacío: es el primer change del proyecto.

## Approach

`lib/api.ts` (Fase A) ya resuelve cookie de sesión, `X-XSRF-TOKEN` y `problem+json`: **se reutiliza tal cual** y solo se le agregan ~50-70 líneas de funciones de dominio. El resto es sustituir el mock por el contrato y componer la UI desde los datos del servidor.

Tres reglas transversales que la spec debe recoger:

1. **El responsable actual es supuesto declarado, no inferido.** `responsible` vive en la *transición*, no en el estado. Hoy coincide en ambas semillas, pero el esquema no lo garantiza: si las transiciones salientes difieren, la UI **MUST** mostrar el responsable por acción y **MUST NOT** elegir el primero en silencio.
2. **«Lleva N días» es presentación**, derivada del `occurredAt` de la última entrada. Decidir que N días es *tarde* es regla de negocio → SP5.
3. **Cero texto hardcodeado**: buscar códigos de trámite o de estado en `app/`, `components/` y `lib/` (excluyendo fixtures) debe dar 0 ocurrencias — el mismo criterio que usó el backend.

## Plan de entrega (slices)

~2.700 líneas tras el recorte contra un presupuesto de 800 → **PRs encadenadas sobre `feature/fase-b`**, cada una con su propio verde.

**El orden es Parallel Change** (*expand → migrate → contract*, [Sato, 2014](https://martinfowler.com/bliki/ParallelChange.html)), no «primero los tipos». Razón medida: `lib/types.ts` tiene **10 consumidores** (`rg -l "from '@/lib/types'"`), `lib/mock-data.ts` tiene 6 y `lib/store.tsx` tiene 7, con `strict: true` en `tsconfig.json:11`. Reescribir el modelo viejo en el primer slice rompe el type-check de diez archivos a la vez y **contradice el criterio de éxito de esta misma propuesta** («`tsc --noEmit` sin errores en cada slice»). Por eso el borrado del modelo viejo vive en el slice 4, no en el 1.

| # | Slice | Fase | Archivos | ~L | Verde |
|---|---|---|---|---|---|
| 1 | **Fundación** | *expand* | `lib/types.ts` (**solo agrega**), `lib/api.ts` (+funciones de dominio), `lib/format.ts` (antigüedad del estado) | ~200 aditivas | ✅ garantizado: nada existente cambia de forma. 100% Vitest |
| 2 | **Poda** | — | borra `components/workflow-stepper.tsx` (68) + `app/settings/` (296), stub del documento (161 → ~30), `<Link>` del detalle, badge de `app-shell.tsx` | ~500 netas de borrado | ✅ |
| 3 | **Registro y búsqueda** | *migrate A* | `app/requests/new/page.tsx`, `app/dashboard/page.tsx`, `dashboard/requests-table.tsx`, `dashboard/summary-cards.tsx` + el acceso a datos de esas pantallas en `lib/store.tsx` | ~800 | ✅ |
| 4 | **Detalle, timeline y contract** | *migrate B + contract* | `app/requests/[id]/page.tsx`, `components/workflow-timeline.tsx`, `brand.tsx`, `type-badge.tsx`, resto de `lib/store.tsx`; **recién acá** se borran los tipos viejos de `types.ts` y `lib/mock-data.ts` (298) | ~750 + ~370 de borrado | ✅ |

**Cómo se vacían los consumidores.** El slice 2 saca **3 de los 10** consumidores de `lib/types.ts` (`app/settings/page.tsx`, `components/pdf-document.tsx`, `components/workflow-stepper.tsx`). El slice 3 migra 4 más (`dashboard/page.tsx`, `requests/new/page.tsx`, `requests-table.tsx`, `summary-cards.tsx`) y el slice 4 los 3 restantes (`brand.tsx`, `type-badge.tsx`, `workflow-timeline.tsx`). Solo entonces el modelo viejo queda sin referencias y su borrado compila. `lib/mock-data.ts` se vacía por el mismo camino: sus 6 consumidores caen entre los slices 2, 3 y 4.

**Reparto de `lib/store.tsx` (cross-cutting).** **El slice 1 no lo toca**: la FSM del cliente (`nextStatusFor`, `stageForStatus` — privadas del módulo, `store.tsx:58,73`) no es la superficie pública, pero recortarla cambia la forma de lo que devuelve `useTramita()`, y de eso dependen **7 archivos**. `store.tsx` se migra por consumidor junto con la pantalla que lo usa: el slice 3 toca solo el acceso a datos de listado/creación, el 4 solo el de detalle/timeline, y ninguno pisa al otro. Si el Context global sobrevive o se pasa a fetch por página lo decide `sdd-design`.

## Risks

| Riesgo | Prob. | Mitigación |
|---|---|---|
| `responsible` divergente rompe la UI en silencio con una definición futura | Media | Requisito explícito en spec (regla 1), con escenario que lo ejercite. |
| Los slices 3 y 4 se pisan en `lib/store.tsx` | Media | Regla de reparto por consumidor: cada slice edita solo el acceso a datos de su pantalla. El slice 1 no lo toca. |
| El modelo viejo sobrevive al slice 4 por un consumidor no detectado | Baja — **materializado**: `lib/format.ts:1` | El *contract* solo se aplica cuando `rg -n "from '(@/lib\|\.)/types'" app components lib` y `rg -n "from '(@/lib\|\.)/mock-data'" app components lib` devuelven 0 ocurrencias fuera de fixtures. El patrón debe cubrir **la forma relativa además del alias**: los módulos de `lib/` se importan entre sí con `from './types'`, y el patrón anterior (solo `@/lib/types`) era ciego a ellos. Cierre en la tarea 5.3. |
| Se reintroduce texto hardcodeado al componer la UI | Media | Criterio de éxito verificable con `rg` en `sdd-verify`. |
| El slice 3 excede el presupuesto de 800 líneas | Media | `new/page.tsx` es borrado neto (~85% de campos sin fuente); si excede, se parte en form + dashboard. |
| Se pierde el trabajo del PDF | Baja | Stub autosuficiente con el comando de recuperación **en el código**, sin depender de Engram ni del historial. |

## Rollback Plan

El front no persiste estado propio: revertir es puramente de código. Cada slice es una PR encadenada revertible con `git revert` en orden inverso; revertir las cuatro devuelve el front a mocks. `lib/api.ts` de Fase A no se reescribe (solo se le agregan funciones), así que **el login nunca queda expuesto a un rollback de la Fase B**.

## Dependencies

- Backend `002` mergeado y corriendo (`edcf188`) — cumplido.
- Semilla `V2.1.0` cargada, para que el selector de trámites no salga vacío.
- Ninguna dependencia npm nueva: el tooling de test de componentes (`@testing-library/react`, `@testing-library/dom`, `jsdom`, `@vitejs/plugin-react` + `vitest.config.mts`) ya está instalado y commiteado (`4e63077`).

## Success Criteria

- [ ] Buscar códigos de trámite o de estado en `app/`, `components/`, `lib/` (sin fixtures) → **0 ocurrencias**.
- [ ] Un trámite nuevo en la semilla del backend aparece en el selector **sin recompilar el front**.
- [ ] `pnpm test` verde y `pnpm exec tsc --noEmit` sin errores en cada slice.
- [ ] El detalle muestra estado, responsable y antigüedad **sin** `workflow-stepper`.
- [ ] Devolución sin motivo → el 422 se renderiza como error del campo, no como fallo genérico.
- [ ] El timeline distingue quién asentó de en nombre de quién.

## Auditoría de esta proposal — estado al 2026-08-23

> Auditada contra las **fuentes** (contrato `002`, migraciones Flyway, código Java del backend y código del front), no contra sí misma. Los hallazgos vivían solo en Engram (#1100, #1103, #1104); se trasladan acá porque `openspec/` está gitignorado y **no tiene respaldo remoto**.
>
> Auditados el 2026-08-19 y **resueltos por el usuario el 2026-08-23**, salvo D4 y D5. Cada resolución se anota junto al defecto.

### ✅ H6 — RESUELTO, y su premisa era falsa

**Lo que H6 afirmaba**: que la semilla (`V2.1.0:29,34` → `'Aprobada por facultad'`, `'Rechazada'`) usa lenguaje de aprobación que contradice el encuadre de bitácora, y que el front no puede arreglarlo sin hardcodear etiquetas.

**La contradicción no existe.** `project.md:92-94` — el encuadre del producto, escrito el 2026-08-15 — ya nombra ese estado exacto y lo autoriza:

> «Cuando la coordinación mueve un trámite a `APROBADA_FACULTAD` no está aprobando como facultad: está dejando constancia de que la facultad aprobó.»

Que Trámita sea una bitácora significa que **Trámita no aprueba**, no que la facultad no apruebe. Que la facultad apruebe es un hecho del proceso, y asentarlo es justamente lo que hace una bitácora.

**El defecto real estaba en la spec, no en la semilla.** El escenario *«ninguna contiene "aprobar" ni "rechazar"»* prohibía una subcadena sin distinguir entre un acto propio del sistema y un hecho ajeno que se registra — más estricto que el encuadre que decía implementar.

**Resolución (2026-08-23)**: se cambia la **plantilla** del texto de la acción, de `"Registrar en {name}"` a `"Registrar: {name}"`, y se reescribe el escenario para que verifique **el verbo de la acción**, no la ausencia de palabras. Aplicado en `request-transitions/spec.md`. **Cero cambios en el backend**: ni migración, ni semilla, ni contrato, ni tests.

### Defectos de esta proposal

| # | Defecto | Evidencia | Estado |
|---|---|---|---|
| **D1** | **Contradicción interna sobre el responsable** — y es el dato central del producto. `:15` promete «Detalle: estado actual **con responsable**»; `:47` (regla 1) afirma lo contrario. | El contrato le da la razón a `:47`: `State` (`openapi:202-208`) = `{code, name, isFinal}`, **sin responsable**. Corolario no escrito: en estado final `availableTransitions` llega **vacío** (`:233`) → no hay responsable en absoluto. | ✅ **RESUELTO 2026-08-23**: el responsable **siempre** se muestra, derivado de `availableTransitions[].responsible` — cero backend. En estado final no se muestra ninguno, porque el trámite cerrado no depende de nadie. Requisito nuevo en `workflow-requests/spec.md`. Prevalece `:47`. |
| **D2** | **El 409 es alcance no declarado.** No aparece en In Scope, Risks ni Success Criteria — solo el 422. | Contrato `openapi:117-124` (transición no vigente / estado final / conflicto de concurrencia). **Implementado de verdad**, con dos fuentes: `IllegalTransitionException` y `ObjectOptimisticLockingFailureException` (`GlobalExceptionHandler:48-69`). `request-transitions/spec.md` **sí** lo especificó (requisito 4). | ✅ **RESUELTO 2026-08-23**: se acepta. El slice 4 maneja el 409. |
| **H2** | **El 400 tampoco está declarado, ni en la proposal ni en el contrato.** El front no lo maneja. | `GlobalExceptionHandler:24` extiende `ResponseEntityExceptionHandler`: el 400 de `@Valid` sale como `ProblemDetail`. Probado en `RequestControllerIT:260-272` (nota de 2001 caracteres → **400**, no 422). `AdvanceRequestBody.note` tiene `@Size(max = 2000)` que el contrato no declara. | ✅ **RESUELTO 2026-08-23**: el slice 4 maneja **cuatro** caminos — 422, 409, 400 y 404. El 401, el 403 y el 429 ya los resuelve `lib/api.ts` solo. |
| **D4** | **`app/layout.tsx` es consumidor de `lib/store` y no tiene slice asignado.** | Reparto real de los 7 consumidores: `dashboard/page`→3, `new/page`→3, `documento/page`→2, `settings/page`→2, `app-shell`→2, `[id]/page`→4, **`layout.tsx`→ninguno**. La regla de `:66` («se migra junto con la pantalla que lo usa») no lo cubre: no es pantalla, es donde vive el `TramitaProvider`. | 🟡 **ABIERTO** — atado a la decisión del Context global, diferida a `sdd-design`. |
| **D5** | **El dashboard-buscador no tiene estado inicial declarado.** | `search` es `required: true` (`openapi:60-61`): **no existe «listar todo»**. Ni la proposal ni la spec dicen qué se ve **antes** de buscar — la spec cubre «sin coincidencias», que es distinto. Es el estado por defecto de la pantalla principal. | 🟡 **ABIERTO** — ver «Dashboard» abajo. |

### ⚠️ Condición obligatoria del slice 1 — el parseo de fechas está roto

No es un defecto de esta proposal: es un bug del front que ningún documento registraba. Se anota acá porque el slice 1 ya toca `lib/format.ts` y es la única oportunidad barata de arreglarlo.

El contrato declara `createdAt`/`occurredAt` como `format: date-time` (RFC 3339, **exige offset**), pero la implementación usa `LocalDateTime` (`RequestResponse:18`, `TimelineEntryResponse:17`) y serializa `"2026-08-14T15:00:00"`, sin zona — convención deliberada del chasis, documentada en `V2.0.0:6`. `new Date()` en JS interpreta un date-time sin offset como **hora local**, y `lib/format.ts:4,13,25` usa `new Date(iso)` directo en las tres funciones.

**Medido con `TZ=America/Bogota`: 5 de cada 24 horas del día (21%) dan un «lleva N días» incorrecto** — y «lleva N días» es un MUST de `request-timeline/spec.md`. El arreglo va del lado del front (parsear como UTC explícito), porque cambiar la convención del chasis es caro.

### ✅ Refutado

- ~~**D3 — «la atribución del 422 a un campo no está anclada para la creación»**~~ — **mal fundado**. Se alegó que el 422 de `POST /requests` tenía dos causas, citando el contrato `:53` («tipo de trámite inexistente **o datos inválidos**»). En la implementación eso es falso: los datos inválidos por Bean Validation salen **400** (ver H2), y el 422 solo lo lanza `UnprocessableRequestException` de negocio. **El 422 de creación SÍ es determinístico** y la spec del front que lo asocia al selector está bien. El defecto real es del contrato, que afirma una causa que no ocurre (#1103).

### Deuda del contrato del backend (no bloquea la Fase B)

Candidata a issue en el repo del backend, no a trabajo del front: el contrato `002` omite **400**, **429**, **403** y el `maxLength` de `note`; afirma un «o datos inválidos» en el 422 que la implementación desmiente; y declara `format: date-time` sin offset. El 429 y el 403 **ya los maneja `lib/api.ts`** (`:19-20,63-65` y `:96-101`).

### ⚠️ `NOVEDAD_NOTAS` es una cadena PROVISIONAL

Marcado en el propio SQL (`V2.1.0:10, :60`): la cadena de novedad de notas **no tiene hilo de correo que la respalde**, tiene 4 preguntas abiertas con la Coordinación y dos inferencias sin validar. La sección Dependencies la lista como «Semilla V2.1.0 cargada» sin mencionarlo. Por **constitución v2.2.0 §IV**, toda captura del front con esa cadena debe salir marcada como provisional y no auditada en el documento de grado.

## Decisiones abiertas (del usuario, no del agente)

Quedan **dos**. Ninguna bloquea `sdd-design`.

1. **¿Sobrevive el Context global de `lib/store.tsx`?** → se difiere a `sdd-design`, decisión explícita del usuario el 2026-08-23. Ligada a **D4**: si se responde «no», `app/layout.tsx` deja de ser consumidor y el defecto desaparece.
2. ~~**D5 — el dashboard**~~ → **RESUELTO POR DIFERIMIENTO** el 2026-08-23. Ver la sección siguiente.

## D5 — el dashboard: criterio cerrado, ejecución diferida (2026-08-23)

**Decisión de secuencia**: la Fase B sigue siendo **100 % frontend**. El slice 3 entrega el dashboard como **buscador puro**, y el dashboard de seguimiento vuelve en un ciclo posterior, después de un change chico en el backend. Se eligió no frenar la Fase B.

**El criterio de producto ya está cerrado y no hay que rediscutirlo cuando vuelva.**

### Qué debe mostrar, y por qué

El dolor tiene respaldo verbatim en la fuente primaria (`material-coord/transcript-entrevista-coordi-2.md`):

> «Cuando alguien no firma, se demora, ¿cómo se entera? Hasta que no pregunta a la persona por el proceso o lo regresen… **no hay forma de que ustedes se enteren cuando alguien todavía no ha firmado y tienen que preguntar**.»

El mecanismo actual es perseguir a mano por Teams («*recuerde que tenemos este formato pendiente*»). Y **el trámite se traba de los dos lados**: no solo la facultad que no firma, también «*realmente se me olvidó*» y «*a mí se me traspapeló*». Por eso el criterio de «requiere atención» es **«está trabado»**, no «le toca a la coordinación».

**Contenido**: los trámites **no finales** (`currentState.isFinal = false`), ordenados por **tiempo sin movimiento**, descendente.

### El recorte que lo mantiene fuera de SP5

La regla transversal 2 de esta proposal difiere a SP5 «decidir que N días es *tarde*». **Ordenar por antigüedad no es decidir que algo es tarde**: es ordenar, y el juicio lo pone la coordinación al mirar. Por lo tanto el dashboard **MUST NOT** traer umbral, semáforo, badge de «urgente» ni conteo de vencidos — eso sí sería SP5.

Además: hoy **la priorización no existe, es FIFO por orden de llegada** (entrevistas). Ordenar por tiempo sin movimiento **es** FIFO — el dashboard hace visible la política que ya usan, no inventa una nueva. Ese es el argumento para la defensa.

### Lo que el backend tiene que agregar (change aparte, no en esta Fase B)

Verificado de primera mano contra el contrato y el código:

| Necesita | Estado hoy |
|---|---|
| Listar sin buscar | ❌ `search` es `required: true`, `minLength: 2` (`openapi:60-62`) |
| Tiempo sin movimiento | ❌ `RequestSummary` (`openapi:237-246`) no tiene `updatedAt`, y `Request.java` tampoco: solo `createdAt`, `@Version` y `currentState` |
| Está inconcluso | ✅ `currentState.isFinal` ya viaja en el summary |

Cambio mínimo: **`search` pasa a opcional** (sin él → los no finales) y **`RequestSummary` suma un campo de último movimiento**, derivable de `MAX(request_transition_log.occurred_at)` — sin denormalizar. Con **~30-40 trámites por semestre en Cali** no hace falta paginación, y el N+1 ya aceptado como deuda no molesta a ese volumen.

### Cerradas

- ~~**H6 — lenguaje de aprobación**~~ — **refutado y resuelto** el 2026-08-23: la premisa era falsa (`project.md:92-94` ya autorizaba el caso) y el defecto estaba en el escenario de la spec. Se cambió la plantilla a `"Registrar: {name}"`. Cero backend. Detalle arriba.
- ~~**D1 — responsable del estado actual**~~ — **resuelto** el 2026-08-23: siempre visible, derivado de `availableTransitions[].responsible`; en estado final se presenta el trámite como cerrado, sin responsable. Requisito nuevo en `workflow-requests/spec.md`. Se descartó agregar `responsible` al schema `State` (duplicaría un dato que ya vive en `workflow_transition` y no resuelve el estado final) y se descartó derivarlo de la última entrada del timeline (responde otra pregunta: quién movió el trámite, no de quién depende ahora).
- ~~**D2 + H2 — caminos de error**~~ — **resuelto** el 2026-08-23: el slice 4 maneja **422, 409, 400 y 404**. El 401, el 403 y el 429 ya los resuelve `lib/api.ts` sin trabajo nuevo.
- ~~**Respaldo de `openspec/`**~~ — **decidido** el 2026-08-23: **no se versiona.** El usuario asume que la única copia vive en su disco, con la contra a la vista (el repo es público y `openspec/` guarda decisiones internas del trabajo de grado).

- ~~**Tooling de test de componentes**~~ — **resuelto**: el usuario autorizó tocar el `package.json` compartido y se instalaron `@testing-library/react ^16.3.2`, `@testing-library/dom ^10.4.1`, `jsdom ^30.0.1` y `@vitejs/plugin-react ^6.0.5`, con `vitest.config.mts`. Los cuatro slices son testeables; `strict_tdd: true` no necesita excepción. Commiteado en `4e63077`.
