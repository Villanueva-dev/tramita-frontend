# Issue #96 — Filtrar la bandeja sin buscar

## Objetivo y problema

Los filtros del tablero («Tipo de trámite», «Responsable», «Estado», «Fecha de radicación») solo
aparecen tras buscar, porque acotan los resultados de la búsqueda (D4 de #56). La bandeja —hasta
200 pendientes, paginada de 10 en 10— no se puede acotar sin buscar. La Coordinación lo probó el
2026-09-28 sobre `main` (`bcab51f`) y pidió filtrar los trámites existentes sin buscar. Alcance y
criterios: issue #96.

## Decisiones del propietario (2026-09-28)

- El selector «Estado» se arma con los estados presentes en la lista activa (nombres del
  servidor, `currentState.name`), no con el mapa legado `STATUS_LABELS`.
- «Responsable» se oculta mientras la lista activa es la bandeja (siempre es la Coordinación).

## Alcance autorizado

- El panel de filtros se muestra siempre y actúa sobre la lista activa: la bandeja sin búsqueda,
  los resultados con búsqueda. Filtrado de vista en el cliente, sin reordenar.
- «Responsable» solo con resultados. «Estado» con los estados presentes en la lista activa.
- Cambiar un filtro devuelve la lista a la página 1; «N de M coinciden con los filtros» solo con
  un filtro activo. «Volver a la bandeja» limpia búsqueda y filtros (ya lo hace).

Fuera de alcance: filtrar en el servidor (`GET /requests/inbox` solo acepta `responsible` y
`limit`, contrato 007 `:67-95`); el buscador; el saludo con correo que desborda a 390 px.

## Decisiones de diseño

- **D1 — Se filtra siempre sobre `InboxEntry[]`.** La lista activa es
  `searched ? resultEntries : inbox.entries`, donde `resultEntries` ya es `InboxEntry[]`
  (`toInboxEntry`, #94). Un solo predicado para las dos listas: tipo por
  `typeFromCode(entry.definition.code)`, estado por `entry.currentState.name`, fecha por
  `entry.createdAt`, responsable por `entry.pendingResponsible` (solo con búsqueda). Se descartó
  mantener dos filtrados (uno sobre `AcademicRequest`, otro sobre `InboxEntry`): duplica reglas.
- **D2 — `toInboxEntry` rellena `pendingResponsible` con `assignedTo`.** Hasta hoy era `''`; con
  el filtro unificado, «Responsable» lee ese campo. Sus opciones salen de los valores distintos
  presentes en los resultados, como hoy.
- **D3 — `statusFilter` pasa a ser un nombre de estado (`string`)**, no `RequestStatus`. El
  selector lista los `currentState.name` distintos de la lista activa, ordenados
  (`localeCompare('es')`); sin lista (cargando, error, vacía) queda solo «Todos los estados».
  `STATUS_LABELS` y `RequestStatus` dejan de importarse en el tablero.
- **D4 — La bandeja filtrada se pasa como `inbox` con `entries` reemplazadas** y el resto del
  estado intacto (`status`, `mayHaveMore`): el aviso de truncamiento sigue hablando de lo
  cargado, no de lo filtrado. El componente no cambia: sigue sin reordenar ni filtrar (mutante
  2b); el filtrado vive en el tablero.
- **D5 — La `key` con los filtros activos va en las dos listas**, no solo en la de resultados:
  un filtro nuevo vuelve a la página 1 también en la bandeja. El hook `useCoordinationInbox`
  vive en el tablero, así que remontar la lista no vuelve a consultar al servidor.
- **D6 — El contador «N de M coinciden con los filtros»** usa `filtered.length` y
  `activeEntries.length` en las dos listas. El encabezado «Tiene N solicitudes esperando su
  acción» sigue contando la bandeja cargada, sin filtrar.

## Restricciones y ruta

- Worktree `../tramita-frontend-worktrees/filtros-bandeja`, rama `feat/filtros-bandeja-96`
  desde `origin/main` `bcab51f` (merge de #95), con índice CodeGraph propio.
- TDD estricto: RED → GREEN → REFACTOR. Runner `pnpm test` (`vitest run`); enfocado
  `pnpm exec vitest run <archivo>`. Línea base en `bcab51f`: 27 archivos / 398 tests.
- Verificación por tarea: `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm test`, `pnpm build`,
  `git diff --check`.
- Ruta: delegada (un escritor: `page.tsx` y `page.test.tsx`, dos archivos no triviales).
  RDD `off` por `clone_local`.
- Diff mostrado al propietario antes del commit; prueba en vivo antes de la PR (`:3000` con el
  worktree unos minutos, el backend solo admite ese `Origin`; `main` se restaura después); push
  y PR (`Closes #96`) con autorización separada.
- Estrategia de entrega: `single-pr`. Pronóstico: ~200 líneas autorales.

## Tareas

- [x] **T1 — Filtros sobre la lista activa.** Commit `9fa30f2`. `app/dashboard/page.tsx` y `page.test.tsx`. RED:
  sin buscar, el panel es visible y no tiene «Responsable»; elegir «Adición de créditos» sin
  buscar deja en la bandeja solo adiciones, en el mismo orden relativo, y muestra «N de M
  coinciden con los filtros»; el selector «Estado» ofrece exactamente los estados presentes en
  la lista activa; cambiar un filtro en la bandeja vuelve a la página 1; con búsqueda,
  «Responsable» vuelve y filtra por `assignedTo`. Los tests de #56 que afirmaban que el panel
  no aparece antes de buscar se invierten.
- [x] **T2 — Prueba en vivo** en escritorio y a 390 px: filtrar la bandeja por tipo, estado y
  fecha; buscar y filtrar resultados con responsable; volver a la bandeja.
- [x] **T3 — Ajuste de T2: «Responsable» solo si algún resultado lo trae.** Commit `51273ef`.
  `GET /requests?search=` no devuelve el responsable (`RequestSummary`, contrato :237-246):
  `assignedTo` llega vacío y el selector ofrecía una opción en blanco. Se descartan los vacíos
  y el selector aparece solo con algún responsable real. Ruta: inline (dos líneas y dos tests).

## Progreso y evidencia

- 2026-09-28 — Documento creado tras publicar #96, antes de la primera escritura.
- 2026-09-28 — **T1 hecha, commit `9fa30f2`**, escritor delegado, diff aprobado por el
  propietario. RED (`pnpm exec vitest run app/dashboard/page.test.tsx`): 4 fallidos / 25 («el
  panel se ve sin buscar, sin «Responsable»», «elegir un tipo deja en la bandeja solo ese tipo,
  en el mismo orden, y explica cuántas coinciden», «Estado» ofrece exactamente los estados
  presentes», «cambiar un filtro en la bandeja vuelve a la página 1»); «Responsable» filtra
  los resultados» ya pasaba (el filtrado por `assignedTo` existía). GREEN: 29/29. Verificación:
  `pnpm lint` OK · `tsc` OK · `pnpm test` 27 archivos / 402 · `pnpm build` OK · `git diff
  --check` OK; `coordination-inbox.test.tsx` e integración intactos (30/30). Supuestos del
  escritor, aceptados: fixtures de responsable con `availableTransitions[0].responsible`
  (de ahí sale `assignedTo`, `store.tsx:183`); el helper `entry()` acepta `overrides`.
  Corrección del orquestador: el comentario del panel dice que #96 sustituye la D4 de #56.
  Chequeo puntual: 55/55 en los dos archivos de test. Tamaño: +144/−119 en `page.tsx` (en
  buena parte reindentado por sacar el panel del condicional) y +137/−6 en su test.

- 2026-09-28 — **T2 hecha** en Chrome (sesión del propietario), worktree en `:3000` unos
  minutos; 48 pendientes en la bandeja, 38 resultados para «Prueba».
  - Sin buscar: panel «Filtros» visible con Tipo de trámite, Estado y Fecha de radicación
    (sin Responsable); «Estado» ofrece exactamente los 4 estados presentes, ordenados
    («Aprobada por facultad», «Devuelta para corrección», «En coordinación (revisión)»,
    «Registrada»).
  - Tipo = novedad de notas: «12 de 48 coinciden con los filtros», solo filas de novedad.
    Estado = «Aprobada por facultad»: «1 de 48», solo ese estado. (La comprobación en vivo del
    orden fue inconcluyente por cómo se midió —primera página y nombres repetidos—; el orden lo
    garantiza `filter` y lo cubre el test unitario.)
  - «Página 2 de 5» → fecha = últimos 30 días → «Página 1 de 5», «47 de 48». «Limpiar» vuelve a
    48 sin «coinciden».
  - Con búsqueda: «Responsable» aparecía con una **opción vacía** (hallazgo → T3); «Estado»
    ofrece los 7 estados de los resultados; «Volver a la bandeja» deja Tipo/Estado/Fecha y la
    bandeja completa.
  - 390 px (`iframe`): panel visible sin buscar; tipo = adición → «36 de 48», 10 filas.
  - Consola sin errores.
- 2026-09-28 — **T3 hecha, commit `51273ef`**, inline. RED (`pnpm exec vitest run
  app/dashboard/page.test.tsx`): 1 fallido / 29 («Responsable» no se ofrece cuando ningún
  resultado trae responsable»). GREEN: 30/30; el test de #93 «no tiene una segunda caja de
  búsqueda» pasa a renderizar con un resultado que sí trae responsable, y el positivo de #96
  también. Verificación: `pnpm lint` OK · `tsc` OK · `pnpm test` 27 archivos / 403 ·
  `pnpm build` OK · `git diff --check` OK. En vivo con HMR: con búsqueda, sin «Responsable»
  (los resultados locales no lo traen) y 0 opciones vacías en los selectores.

## Siguiente paso

Commit de T3 y de este documento; PR (`Closes #96`) con el borrador mostrado; `main`
restaurado en `:3000`. Seguimiento posible en el backend: exponer el responsable pendiente en
`RequestSummary` para que «Responsable» tenga datos en los resultados.
