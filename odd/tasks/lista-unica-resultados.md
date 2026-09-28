# Una sola lista paginada en el tablero (resultados de búsqueda en el formato de la bandeja)

## Objetivo y problema

Tras buscar, el tablero muestra dos listas de solicitudes con formatos distintos: la tabla de
resultados (`RequestsTable`, sin paginar) y la bandeja (`CoordinationInbox`, paginada de 10 en
10, #56). No son lo mismo —la tabla trae todos los trámites del estudiante buscado, en cualquier
estado; la bandeja, solo lo pendiente de la Coordinación—, pero para una usuaria no técnica dos
formatos son dos cosas que «hacen lo mismo». Decisión del propietario (2026-09-28, tras la prueba
en vivo de #56): una sola lista en pantalla, siempre paginada y con el mismo formato.

## Decisiones del propietario (2026-09-28)

- Se retira la lista que no está paginada (la tabla). Los resultados de búsqueda se muestran en
  el formato de la bandeja. Va en esta PR, aparte de #93, para no reabrir aquella.

## Alcance autorizado

- `CoordinationInbox` admite una variante «resultados»: título «Resultados de la búsqueda»,
  mensaje de vacío «Sin coincidencias para lo buscado.» y espera expresada como «Radicada hace
  N días» (desde `createdAt`; en los resultados hay trámites cerrados que no «esperan»).
- El tablero renderiza **una** lista: sin búsqueda, la bandeja; con búsqueda, los resultados
  filtrados (tipo, responsable, estado, fecha) adaptados a `InboxEntry`.
- «Volver a la bandeja» limpia la búsqueda (`clearSearch` en el store: resultados, `searched` y
  errores a cero) y devuelve la bandeja, que sigue cargada desde el montaje.
- Se borran `components/dashboard/requests-table.tsx` y su test. `StatusBadge` se queda: lo usan
  el detalle y `brand.tsx`.

Fuera de alcance: cambiar el buscador o los filtros; el saludo con correo que desborda a 390 px
(issue aparte); unificar `AcademicRequest` con `InboxEntry` en el store.

## Decisiones de diseño

- **D1 — Un solo componente de lista, con `variant`.** `CoordinationInbox` gana las props
  opcionales `variant?: 'inbox' | 'results'` (por defecto `'inbox'`: nada cambia para la bandeja
  ni para sus 23 tests). La variante solo cambia título, mensaje de vacío y rótulo de tiempo. Se
  descartó extraer un `RequestList` genérico: más churn en un componente recién revisado.
- **D2 — Adaptador en el tablero, no en el store.** `toInboxEntry(request: AcademicRequest):
  InboxEntry` vive en `app/dashboard/page.tsx` (o `lib/`), con `waitingSince = createdAt`,
  `pendingResponsible = ''` y `origin` tal cual. `baseRequest` (`lib/store.tsx:154-193`) ya
  conserva `id`, `definition`, `currentState`, `createdAt` y `origin`.
- **D3 — `clearSearch` en el store** (`lib/store.tsx`), junto a `searchRequests`: la única forma
  honesta de «volver a la bandeja» es dejar `searched = false`; el tablero no puede tocar ese
  estado. Los tests que mockean `useTramita` con objetos parciales reciben la función nueva por
  defecto en su helper.
- **D4 — La línea «Mostrando N de M solicitudes» del bloque de resultados desaparece**: la lista
  ya dice «Mostrando a–b de n» y «Página X de Y». Solo cuando hay filtros activos se muestra «N
  de M coinciden con los filtros», para que la usuaria sepa por qué ve menos.
- **D5 — «Volver a la bandeja» va debajo de la caja de búsqueda**, visible en cuanto hay
  resultados, como botón `ghost` con ícono; no dentro de la lista.

## Restricciones y ruta

- Worktree `../tramita-frontend-worktrees/lista-unica`, rama `feat/lista-unica-resultados`
  desde `origin/main` `89a4db8` (merge de #93), con índice CodeGraph propio.
- TDD estricto (`~/.claude/CLAUDE.md`): RED → GREEN → REFACTOR. Runner `pnpm test` (`vitest run`);
  enfocado `pnpm exec vitest run <archivo>`. Línea base en `89a4db8`: 28 archivos / 395 tests.
- Verificación por tarea: `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm test`, `pnpm build`,
  `git diff --check`.
- Ruta: delegada (un escritor para T1 y T2; disparador de escritor: varios archivos no
  triviales). RDD `off` por `clone_local`.
- Diff mostrado al propietario antes de cada commit; prueba en vivo en `:3001` (el backend solo
  admite ese `Origin`) antes de la PR; push y PR con autorización separada.
- Estrategia de entrega: `single-pr`. Pronóstico: ~350 líneas autorales (≈ −205 de la tabla).

## Tareas

- [x] **T1 — Variante «resultados» de la lista.** Commit `ff23fc2`. `components/dashboard/coordination-inbox.tsx`
  y su test. RED: con `variant="results"`, el título es «Resultados de la búsqueda», la región
  se llama así, el vacío dice «Sin coincidencias para lo buscado.» y una fila dice «Radicada
  hace N días»; con la variante por defecto todo sigue igual.
- [x] **T2 — Una sola lista en el tablero.** Commit `8b656eb`. `app/dashboard/page.tsx`, `page.test.tsx`,
  `page.integration.test.tsx` (si aplica), `lib/store.tsx` (`clearSearch`), borrado de
  `requests-table.tsx` y su test. RED: tras buscar no hay `table` y sí la región «Resultados de
  la búsqueda»; sin buscar, la región «Bandeja de trabajo» y no la de resultados; «Volver a la
  bandeja» llama a `clearSearch`; con un filtro activo aparece «N de M coinciden con los filtros».
- [x] **T3 — Prueba en vivo**, sirviendo el worktree en `:3000` (el backend solo admitía ese
  `Origin`): buscar, paginar resultados, filtrar, volver a la bandeja; en escritorio y a 390 px.
- [x] **T4 — Ajustes de T3.** Commit `74f8eb3`. Un filtro nuevo devuelve los resultados a la
  página 1 (`key` con los filtros activos en la lista de resultados; RED: tras «Siguiente» y
  un cambio de filtro, «Página 1 de 2»); «Volver a la bandeja» a 48 px como los demás controles.
  Ruta: inline (una línea de código y un test; el alto es visual).

## Progreso y evidencia

- 2026-09-28 — Documento creado tras el merge de #93. Issue #94 publicada con aprobación del
  propietario (sin duplicados en el repo).
- 2026-09-28 — **T1 hecha, commit `ff23fc2`**, escritor delegado (T1 y T2 en un mismo encargo),
  diff aprobado por el propietario. RED (`pnpm exec vitest run
  components/dashboard/coordination-inbox.test.tsx`): 3 fallidos / 23 en verde. GREEN: 26/26.
  Criterio propio del escritor, aceptado: `InboxRow` recibe el rótulo ya resuelto
  (`copy.ageLabel`) en vez de la variante. Verificado sobre su propio árbol (sin T2): `pnpm
  lint` OK · `pnpm exec tsc --noEmit` OK · `pnpm test` 28 archivos / 398 tests.
- 2026-09-28 — **T2 hecha, commit `8b656eb`**, mismo escritor, diff aprobado. RED (`pnpm exec
  vitest run app/dashboard/page.test.tsx`): 3 fallidos / 21 («sin buscar, la única lista es la
  bandeja» ya pasaba: no cambia el comportamiento previo). GREEN: 24/24. `lib/store.test.ts`
  (18/18) y `page.integration.test.tsx` (4/4) sin cambios: la integración afirma sobre el
  nombre del estudiante, que la fila sigue mostrando. Verificación: `pnpm lint` OK · `tsc` OK ·
  `pnpm test` 27 archivos / 397 (−1 archivo y −5 tests de la tabla, +3 de T1, +4 de T2) ·
  `pnpm build` OK · `git diff --check` OK. Chequeo puntual del orquestador: 50/50 en los dos
  archivos de test. Tamaño: +233/−247 en 7 archivos.
- 2026-09-28 — **T3 hecha** en Chrome (sesión del propietario), sirviendo el worktree en `:3000`
  unos minutos (el backend solo admitía ese `Origin`; `main` se restauró después). Con 48
  solicitudes en la bandeja y 38 resultados para «Prueba»:
  - Sin buscar: región «Bandeja de trabajo»; sin región de resultados, sin `table`, sin
    «Volver a la bandeja».
  - Tras buscar: región «Resultados de la búsqueda»; sin bandeja ni `table`; 10 filas,
    «Mostrando 1–10 de 38», «Página 1 de 4»; filas con «Radicada hace 1 día» y estados que la
    bandeja nunca muestra («Rechazada», «Finalizada», «En facultad»); «Volver a la bandeja»
    visible; panel de filtros visible; sin «coinciden con los filtros» (ningún filtro activo).
  - «Siguiente»: «Página 2 de 4», foco en la sección, scrollY 508.
  - Filtro «Tipo de trámite» = adición de créditos: «33 de 38 coinciden con los filtros»,
    «Mostrando 11–20 de 33» — **la lista se quedó en la página 2** (ajuste T4).
  - «Volver a la bandeja»: bandeja de vuelta, buscador vacío, sin panel de filtros, sin el
    botón, texto de ayuda visible.
  - 390 px (`iframe` con viewport propio): región de resultados, sin `table`, 10 filas
    apiladas de 192 px; «Volver a la bandeja» de 36 px (ajuste T4). `scrollWidth` 552 por el
    saludo con correo, preexistente y fuera de alcance.
  - Consola: sin errores de esta corrida (los dos `ReferenceError: query` registrados son de
    `localhost:3001` a las 14:05, un estado intermedio de HMR de la sesión de #93).
- 2026-09-28 — **T4 hecha, commit `74f8eb3`**, inline. RED (`pnpm exec vitest run
  app/dashboard/page.test.tsx`): 1 fallido / 24 («al cambiar un filtro, los resultados vuelven
  a la página 1»: quedaba «Página 2 de 2»). GREEN: 25/25. Verificación: `pnpm lint` OK · `tsc`
  OK · `pnpm test` 27 archivos / 398 · `pnpm build` OK · `git diff --check` OK. En vivo con
  HMR: «Página 2 de 4» → cambio de filtro → «Página 1 de 4»; «Volver a la bandeja» 54 px
  (48 × 1,125).

## Siguiente paso

Commit de T4 y de este documento; borrador de PR completo, push y PR (`Closes #94`) con
autorización; `main` restaurado en `:3000` para la muestra.
