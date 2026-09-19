# Verify Report: Semántica del estado del trámite

> Reporte diagnóstico. No certifica ni bloquea archive. Todas las afirmaciones sobre el
> repo se acompañan del comando que las midió, ejecutado el 2026-09-19 sobre el HEAD
> `5b61a4e` (rama `chore/archiva-semantica-de-estado-del-tramite`, salida de `main`).

## Alcance

- Change: `semantica-de-estado-del-tramite`.
- Artefactos leídos: `proposal.md`, `design.md`, `tasks.md` (15/18 marcadas completas),
  `specs/workflow-requests/spec.md` (delta ADDED, un requisito con siete escenarios),
  `apply-progress.md` (snapshot previo al merge de PR #37).
- TDD estricto activo (`openspec/config.yaml:17`, `strict_tdd: true`); se aplicó
  `strict-tdd-verify.md`.
- Implementación inspeccionada directamente (no solo el reporte): `lib/request-state.ts`,
  `lib/request-state.test.ts`, `lib/store.tsx`, `lib/store.test.ts`,
  `components/dashboard/summary-cards.tsx` y su test, `components/dashboard/requests-table.tsx`
  y su test, `components/app-shell.tsx` y su test, `app/dashboard/page.tsx` y sus dos tests,
  `app/requests/[id]/page.tsx` y su test, `app/requests/[id]/documento/page.tsx` y su test,
  `components/pdf-document.tsx`, `lib/format.ts`.

## Corrección del estado de build (reemplaza al snapshot de apply-progress)

`apply-progress.md` reporta `pnpm test` en 153/153 sobre 20 archivos, medido antes del merge
de PR #37 a `main`. Después entró PR #40 (`6f9568e`), que agregó un test de regresión sobre
el filtro «Completadas» del dashboard. La medición de esta sesión, sobre el HEAD actual,
es la que sigue.

## Checks ejecutados (comandos y resultados observados en esta sesión)

| Comando | Resultado |
|---|---|
| `pnpm test` | Exit 0 — **157/157 en 21 archivos**. No coincide con el snapshot de `apply-progress.md` (153/153, 20 archivos) porque ese reporte es anterior al merge de PR #40; la diferencia (4 tests, 1 archivo) es exactamente el test de regresión de #35 agregado después. |
| `rm -rf .next && pnpm exec tsc --noEmit` | Exit 0, sin salida. |
| `pnpm lint` (`eslint .`) | Exit 0, sin hallazgos. |
| `pnpm build` | Exit 0 — Next.js 16.3.5 compiló, TypeScript terminó sin errores dentro del build, se generaron 9/9 páginas. |
| `git status --porcelain` (antes y después de los checks) | Sin cambios propios de esta sesión; el único archivo modificado en el árbol (`public/tramita-logo.jpeg`) es ajeno a esta change y no se tocó. |

## Progreso observado

`tasks.md` marca **15/18** tareas completas: Fases 0–3 (regresión previa, módulo, modelo,
consumidores) están cerradas con commits registrados; Fase 4 tiene 4.1 (artefactos) hecha y
4.2 (este verify), 4.3 (archivar) y 4.4 (cerrar #15 y #35) sin marcar. No se reescribió
ningún checkbox.

## Cobertura escenario por escenario (`specs/workflow-requests/spec.md`)

| Escenario | Estado | Evidencia |
|---|---|---|
| El cierre se deriva del contrato, no de la etiqueta | ✅ | `lib/request-state.ts:77-79` — `isClosed` recibe `StatefulRequest = { currentState, type }`, sin campo de presentación: no hay valor de agrupación que pueda consultar, por construcción del tipo. Test de comportamiento: `lib/request-state.test.ts:55-64` (`isClosed` describe), que además prueba que un código desconocido sigue respondiendo por `isFinal`. |
| Un cierre negado no se cuenta como cumplido | ✅ | `lib/request-state.ts:82-84` (`isSuccessfullyClosed`). Unitario: `lib/request-state.test.ts:69-78`. A nivel de UI, dos tests independientes: `components/dashboard/summary-cards.test.tsx:35-45` (RECHAZADA cuenta 0 en «Completadas») y `app/dashboard/page.test.tsx:121-155` (test de regresión agregado por PR #40, `6f9568e`, que excluye el rechazo del filtro «Completadas» en la página completa). |
| Un cierre negado no se presenta como devolución | ✅ | `lib/request-state.test.ts:86-88` (`isReturnedForCorrection(adicion('RECHAZADA', true))` → `false`, dentro de `describe('isReturnedForCorrection')`). Sin test de componente que ejercite específicamente un rechazo contra el `WorkflowStepper` (ver limitación abajo). |
| La devolución se reconoce donde el motor la modela como estado | ✅ | `lib/request-state.ts:87-89`. Unitario: `lib/request-state.test.ts:82-84`. A nivel de UI: `components/dashboard/summary-cards.test.tsx:72-82` (DEVUELTA cuenta 1 en «En proceso»). |
| La devolución no se inventa donde el motor la modela como transición | ✅ | Este es el escenario de la **limitación declarada**. Cubierto explícitamente por `lib/request-state.test.ts:90-100`: itera los seis estados reales de `NOVEDAD_STATES` (línea 42-49, tomados de las migraciones del backend) y afirma `isReturnedForCorrection(request) === false` para cada uno. El comentario en el propio test (líneas 90-95) declara la limitación por su nombre — no es una ceguera silenciosa, está fijada por un test que la nombra. La iteración es sobre un array literal fijo de 6 elementos (no una consulta al DOM que pudiera venir vacía), así que no aplica la regla de "bucle fantasma". |
| Cada trámite reconoce su propio inicio | ✅ | `lib/request-state.ts:92-94`. Unitario, con variación de valores (no un solo caso): `lib/request-state.test.ts:106-119`, incluido el caso cruzado que prueba que el inicio de un trámite no se acepta como el del otro (líneas 111-114). A nivel de modelo: `lib/store.test.ts:56-78`, dos tests independientes por trámite. |
| Un estado que el cliente no reconoce no rompe la pantalla | ✅ | `lib/request-state.ts:70,73` (`SIN_SEMANTICA` como valor por defecto de `semanticsOf`). Test dedicado: `lib/request-state.test.ts:127-140` (`describe('degradación ante un estado que la tabla no conoce')`), que verifica las tres condiciones exactas del escenario: no se le atribuye ser inicial (línea 131), ni devolución (132), ni cierre exitoso (133), y que `isClosed` sigue respondiendo si el motor lo marca final (137). |

**Resultado**: 7/7 escenarios tienen respaldo en código y en al menos un test que lo ejercita
con el valor que el escenario describe, no solo con una aserción de tipo.

### Sobre la limitación declarada de `novedad_notas`

El requisito pide explícitamente que la limitación "quede visible mediante un test que la
afirme, en lugar de que se manifieste como una coincidencia que nunca ocurre". Verificado:
el test de `lib/request-state.test.ts:96-100` no es un caso que "da la casualidad de pasar"
— recorre los seis estados reales del trámite (tomados de las migraciones SQL, según el
comentario de `NOVEDAD_STATES`) y la tabla `STATE_SEMANTICS.novedad_notas` (líneas 58-65 de
`lib/request-state.ts`) está vacía de propósito, con un comentario que explica por qué. Si
alguien agregara por error una fila de devolución a esa tabla, este test se pondría en rojo.
Mutación verificada mentalmente contra el código (no ejecutada como mutation testing real,
que no está instalado): agregar `EN_PREPARACION: { returned: true }` a esa tabla rompería
la aserción de la línea 98 para ese estado específico.

### Sobre la degradación segura

El escenario y la Decisión 5 de `design.md` declaran que un estado ausente de la tabla "no
recibe semántica" y "no rompe la pantalla". El test de `lib/request-state.test.ts:127-140`
cubre el caso de **código de estado desconocido** dentro de un trámite conocido —exactamente
lo que el escenario describe ("una solicitud en un estado cuyo código el cliente no
reconoce"). No hay, y el propio `design.md` (Decisión 4) explica por qué no debería haberlo:
el caso de **trámite desconocido** es inalcanzable porque `RequestType` es una unión cerrada
y `STATE_SEMANTICS` es un `Record` sobre ella — el compilador exige la fila. El test de ese
caso se retiró deliberadamente (según el propio `design.md`) en vez de fingir cobertura de
algo que `tsc` no permite construir. Verificado indirectamente: `pnpm exec tsc --noEmit`
termina en exit 0, y no hay ningún `as StatefulRequest` ni `any` en `lib/request-state.ts`
que sortee esa garantía del compilador (confirmado por lectura directa del archivo completo).

## Cumplimiento TDD (Strict TDD Mode)

| Verificación | Resultado | Detalle |
|---|---|---|
| Evidencia TDD reportada | ✅ | `apply-progress.md` no trae una tabla "TDD Cycle Evidence" con ese nombre exacto, pero `tasks.md` documenta RED observado por tarea (ej. 0.1: `expected 'en_revision' to be 'pendiente'`; 1.1: fallo de resolución del módulo; 2.1: `expected undefined to deeply equal`; 3.1: `expected '1' to be '0'`) y `apply-progress.md` lista los 7 commits que cierran cada fase con su hash. Formato distinto al template estándar, pero cubre el mismo contenido (RED por tarea, commit de GREEN). |
| Archivos de test existen | ✅ | Confirmados en disco: `lib/request-state.test.ts`, `lib/store.test.ts`, `components/dashboard/summary-cards.test.tsx`, `components/dashboard/requests-table.test.tsx`, `components/app-shell.test.tsx`, `app/dashboard/page.test.tsx`. |
| GREEN confirmado (pasan ahora) | ✅ | `pnpm test` → 157/157 en esta sesión, incluidos todos los archivos de la change. |
| Triangulación | ✅ | Cada predicado tiene casos con valores distintos (verdadero/falso, por trámite, por código), no un único caso repetido. Ejemplo: `isInitialState` prueba reconocimiento propio, rechazo cruzado, y conteo exacto de un solo inicial por trámite. |
| Safety net en archivos modificados | ✅ (documentado) | `apply-progress.md` registra la equivalencia del refactor de `requests-table` y `app-shell` corriendo sus tests nuevos contra el código anterior vía `git stash` (6/6 en ambas versiones) — más riguroso que un safety net convencional, porque esos archivos no tenían tests previos que sirvieran de red. |

**Cumplimiento TDD**: 4/4 verificaciones con evidencia satisfactoria (formato de la tabla de
evidencia difiere del template pero el contenido equivalente está presente).

### Distribución por capa de test

| Capa | Archivos relevantes de la change | Herramienta |
|---|---|---|
| Unit | `lib/request-state.test.ts`, `lib/store.test.ts` | vitest |
| Integration | `components/dashboard/summary-cards.test.tsx`, `components/dashboard/requests-table.test.tsx`, `components/app-shell.test.tsx`, `app/dashboard/page.test.tsx` | vitest + @testing-library/react (jsdom) |
| E2E | 0 | No instalado (`openspec/config.yaml` lo declara `available: false`) |

### Calidad de aserciones (Assertion Quality Audit)

Escaneados los archivos de test tocados por esta change. Sin tautologías, sin aserciones que
no llamen código de producción, sin bucles fantasma reales (el único `for...of` del cambio,
en `lib/request-state.test.ts:97`, itera un array literal fijo de 6 elementos declarado en
el propio archivo, no una consulta que pueda venir vacía en runtime).

Un hallazgo de acoplamiento a detalle de implementación, ya documentado por quien implementó:

- `components/app-shell.test.tsx:54` — `badge()` lee `document.querySelector('.bg-brand-red')`.
  Es acoplamiento a clase CSS (categoría WARNING de la guía de assertion quality), pero el
  propio comentario del test (líneas 49-53) y el hallazgo 4 de `apply-progress.md` ya
  declaran que el contador de urgentes no tiene nombre accesible y que consultarlo por clase
  es la única vía disponible hoy — no es un descuido nuevo de esta change, es deuda de
  accesibilidad preexistente que la migración solo hereda y deja escrita.

**Calidad de aserciones**: 0 CRITICAL, 1 WARNING (ya autodocumentado por la implementación,
no es un hallazgo nuevo).

## Hallazgos

### WARNING — El delta no tiene test de componente que ejercite un rechazo contra `WorkflowStepper`

El escenario "Un cierre negado no se presenta como devolución" está cubierto a nivel unitario
(`lib/request-state.test.ts:86-88`) pero `app/requests/[id]/page.tsx:327` conecta
`isReturnedForCorrection(req)` al prop `returned` de `WorkflowStepper` sin que
`app/requests/[id]/page.test.tsx` monte la página con un `currentState` de tipo RECHAZADA o
DEVUELTA para confirmar el efecto visual en ese componente específico. `proposal.md` declara
el stepper explícitamente fuera de alcance (issue #9, "colapsar siete estados es un problema
de presentación con su propio alcance"), así que esta ausencia es consistente con el alcance
declarado, no una omisión oculta. Se deja constancia porque es el único de los ocho sitios
migrados sin test que ejercite el predicado con un valor distinto de "no devuelto" en ese
consumidor puntual.

Impacto: bajo — el predicado que alimenta el prop está probado exhaustivamente en su origen;
lo no probado es solo el cableado de un prop hacia un componente ya fuera de alcance.

### SUGGESTION — `components/pdf-document.tsx` usa `isClosed` sin test propio

`codegraph` identifica `components/pdf-document.tsx:7` como un noveno consumidor de
`isClosed`, no incluido en la lista de "ocho sitios" que `apply-progress.md` declara
migrados ni en el alcance de archivos que el orquestador señaló para esta revisión. No tiene
archivo de test dedicado (`find` no encontró `pdf-document.test.*`). El predicado en sí está
probado en su origen; lo que falta es cobertura de que el componente lo use correctamente
para decidir el rótulo "DOCUMENTO OFICIAL" vs. "DOCUMENTO DEL TRÁMITE". No es un defecto de
esta change —el componente ya usaba `isClosed` antes, según el propio código no aparece en
los commits listados en `apply-progress.md`— pero queda anotado por completitud de blast
radius.

Impacto: bajo, informativo — no bloquea nada de este delta.

## Sugerencias (SUGGESTION)

- El formato de "TDD Cycle Evidence" de `apply-progress.md` no sigue el template tabular que
  pide `strict-tdd-verify.md` (columnas RED/GREEN/TRIANGULATE/SAFETY NET por tarea); usa
  prosa narrativa en `tasks.md` más una tabla de commits en `apply-progress.md`. El contenido
  equivalente está presente y fue verificable, así que no se marca como CRITICAL, pero
  adoptar el formato tabular facilitaría verificaciones futuras.

## Resumen

- **CRITICAL**: 0
- **WARNING**: 2 (ausencia de test de componente para el rechazo contra `WorkflowStepper`,
  fuera del alcance declarado de esta change; acoplamiento a clase CSS en `app-shell.test.tsx`,
  ya autodocumentado como deuda preexistente)
- **SUGGESTION**: 2 (noveno consumidor `pdf-document.tsx` sin test propio; formato narrativo
  de evidencia TDD en vez de tabla)

Los 7 escenarios del delta `workflow-requests` tienen respaldo directo en código y en al
menos un test que los ejercita con el valor exacto que describen — incluidos los dos límites
señalados por el mandato de esta verificación: la limitación de `novedad_notas` está fijada
por un test que recorre sus seis estados reales y la nombra explícitamente en un comentario,
y la degradación segura ante un código de estado desconocido tiene su propio `describe` con
dos casos. Los 157 tests pasan, `tsc --noEmit`, `eslint` y `pnpm build` terminan sin errores
en esta sesión. Los dos hallazgos WARNING son de cobertura incompleta en aristas ya
declaradas fuera de alcance o ya documentadas como deuda preexistente, ninguno de
comportamiento roto.
