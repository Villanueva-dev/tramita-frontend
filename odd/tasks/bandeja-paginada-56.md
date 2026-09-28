# Issue #56 — Buscador arriba, bandeja paginada y sin tarjetas

## Objetivo y problema

El tablero de la Coordinación (`app/dashboard/page.tsx`) deja el buscador al final, debajo de la
bandeja, las tarjetas, los indicadores y los filtros, aunque localizar por nombre y cédula es la
tarea diaria (entrevista 3). La bandeja muestra hasta 50 filas seguidas y las tarjetas cuentan la
última búsqueda, no la bandeja (#51), con dos cifras sin dato detrás. El alcance y los criterios
de aceptación están en la issue #56 y en su comentario de alcance (borrar `summary-cards.tsx` y su
test, cerrar #36, no tocar `metrics` del store).

## Decisiones del propietario (2026-09-28)

- **El buscador se queda en el tablero**, como primer bloque después del encabezado. Se descarta
  la propuesta del mockup «Mis pendientes» (Claude Design) de mover la búsqueda a una pantalla
  aparte: «hay que hacerle la vida más fácil a la coordinadora, no hacer que trabaje más».
- **Formato A para las filas de la bandeja** (lista compacta), elegido sobre un canvas con cuatro
  opciones en escritorio y a 390 px. Del mockup se adopta solo lo visual: texto de 16 px, íconos
  con texto, controles de 48 px. Se descarta lo que el contrato no respalda (código y programa,
  «qué pide», motivo de la devolución, quién la envió, línea de seguimiento, pestañas que filtran
  en el cliente).
- **Tarde del 2026-09-28, para la muestra de avances de hoy**: de la revisión limpia se aplican
  M1, M2, M3 y B3; B1, B2, B4 y B5 quedan como deuda registrada abajo. La muestra corre desde
  `main` en `:3000`, así que la PR se mergea antes. El navegador queda libre para T3. No se sabe
  en qué pantalla trabaja la coordinadora: M2 se aplica para cubrir todos los anchos.

## Alcance autorizado

- `INBOX_LIMIT` de 50 a 200 (máximo del backend, `RequestController.java:108`).
- `CoordinationInbox` pagina en el cliente de 10 en 10, en el orden del servidor, y adopta el
  formato A.
- El tablero sube el buscador tras el encabezado; resultados y filtros debajo; deja de renderizar
  `SummaryCards`, los dos indicadores y el filtro por tarjeta.

Fuera de alcance: tarjetas con cifras globales (esperan conteos del backend, #51); fundir la caja
«Buscar» del panel de filtros con el buscador (#51); buscar por teléfono (Tramita#48); paginar los
resultados de búsqueda; `components/app-shell.tsx`.

## Decisiones de diseño

- **D1 — La fila entera es un solo enlace** a `/requests/{id}`. En escritorio muestra «Revisar →»
  como parte del enlace; a 390 px, un chevrón. Un solo punto de tabulación por fila, en vez de dos
  enlaces al mismo destino (nombre + botón).
- **D2 — El botón dice «Revisar» en todas las filas, nunca «Corregir».** El backend no expone
  edición: no hay `PUT` ni `PATCH` y los campos de `Request` son `updatable = false`.
- **D3 — La ficha de estado muestra `currentState.name`.** La marca de devuelta (ícono y tono
  cálido) sale del predicado existente `isReturnedForCorrection` (`lib/request-state.ts`) con
  `typeFromCode` (`lib/store.tsx`), que se exporta. No se crea ningún mapa nuevo de estado a color
  (regla 1 de `revisar-frontend-next`): se reutiliza la deuda ya declarada en `request-state.ts`.
  En novedad de notas la devolución no es un estado, así que ahí la ficha queda neutra.
- **D4 — Los filtros se muestran solo después de buscar.** Filtran los resultados de la búsqueda;
  antes de buscar no hay nada que filtrar y empujarían la bandeja hacia abajo.
- **D5 — La paginación es estado de vista local de `CoordinationInbox`** (`useState`), derivada del
  arreglo que llega: sin reordenar ni filtrar (`coordination-inbox.tsx:28`, mutante 2b).
- **D6 — La escala tipográfica sube solo en el buscador y la bandeja.** `TypeBadge` es compartido
  con el detalle: su tamaño no cambia por defecto.

## Restricciones y ruta

- Worktree `../tramita-frontend-worktrees/bandeja-paginada`, rama `feat/bandeja-paginada-56`,
  desde `origin/main` `5ff20a7`, con su propio índice CodeGraph.
- TDD estricto (`~/.claude/CLAUDE.md`, «Strict TDD Mode: enabled»): RED → GREEN → REFACTOR.
  Runner: `pnpm test` (`vitest run`); enfocado: `pnpm exec vitest run <archivo>`. Lo puramente
  visual no tiene RED propio: lo protegen los tests existentes.
- Línea base en `5ff20a7`: 29 archivos y 387 tests en verde; `tsc --noEmit` y `pnpm lint` limpios.
- Verificación por tarea (la de la CI): `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm test`,
  `pnpm build`, `git diff --check`.
- Ruta por tarea: directa delegada (disparador de escritor: 2+ archivos no triviales por tarea).
- RDD efectivo: `off` por `clone_local` (`gentle-ai review mode status`, 2026-09-28).
- Cada diff lo revisa el propietario antes de su commit; prueba en vivo en Chrome antes de la PR.
- Estrategia de entrega: `single-pr` (`Closes #56`, `Closes #36`). Pronóstico: 400–550 líneas
  autorales contando las borradas.
- No hacer push, abrir PR ni comentar issues sin autorización separada.

## Tareas

- [x] **T1 — Bandeja paginada con formato A.** Commit `2f4423f`. Archivos: `lib/use-coordination-inbox.ts`,
  `components/dashboard/coordination-inbox.tsx`, sus tests, `lib/store.tsx` (exportar
  `typeFromCode`) y, si hace falta, `components/type-badge.tsx` (`className` opcional). RED: con
  11 entradas, la página 1 muestra 10 y la undécima aparece en la página 2; con 10 o menos no hay
  controles de paginación; el orden del servidor se conserva; `mayHaveMore` se calcula con 200;
  cada fila es un enlace a `/requests/{id}`; una adición devuelta lleva la marca de devuelta y una
  en revisión no. GREEN: paginación y filas con el formato A.
- [x] **T2 — Tablero: buscador primero, sin tarjetas ni indicadores.** Commit `b3c1b1e`. Archivos:
  `app/dashboard/page.tsx`, `page.test.tsx`, `page.integration.test.tsx`; se borran
  `components/dashboard/summary-cards.tsx` y su test. RED: el buscador precede a la bandeja; no
  hay tarjetas ni indicadores; los filtros no aparecen antes de buscar y sí después. GREEN: el
  reordenamiento y las eliminaciones del comentario de alcance de #56.
- [ ] **T4 — M2: la ficha de estado parte línea en vez de montarse sobre la espera.**
  `coordination-inbox.tsx:50`: `min-h-[30px] py-0.5` en lugar de `h-[30px] whitespace-nowrap`.
  Visual, sin RED propio. Ruta: inline (una línea, sin decisión abierta).
- [ ] **T5 — M3: al cambiar de página, la lista vuelve a su inicio y lo anuncia.**
  `coordination-inbox.tsx` y su test. RED: tras «Siguiente», la sección de la bandeja recibe el
  foco y se desplaza a su inicio (`scrollIntoView`); «Página X de Y» lleva `aria-live="polite"`.
  Ruta: delegada (escritor: dos archivos no triviales).
- [ ] **T6 — M1: la spec deja de exigir `limit` = 50.** `openspec/specs/coordination-inbox/spec.md`
  (:21-26, :38, :160-172, :230-236): 200 y 199, citando el contrato `openapi.yaml:84-91`
  (`minimum 1`, `maximum 200`, `default 50`). Ruta: inline.
- [ ] **T7 — B3: reescribir los mensajes de `2f4423f` y `b3c1b1e`** a 72 columnas, con
  `Verificado:` y `Refs:`. Con rama de respaldo `backup-pre-reword-56` y autorización explícita.
- [ ] **T3 — Prueba en vivo** en Chrome, después de T4–T7, sirviendo el worktree en `:3001`: a
  1024, 1280, 1366 y 390 px, con más de 10 solicitudes; confirmar el tamaño raíz de fuente.

## Progreso y evidencia

- 2026-09-28 — Documento creado. Línea base medida en el worktree.
- 2026-09-28 — **T1 hecha, commit `2f4423f`**, tras la aprobación del diff por el propietario. Ruta:
  delegada (escritor). RED antes de implementar (`pnpm exec vitest run
  components/dashboard/coordination-inbox.test.tsx lib/use-coordination-inbox.test.ts`): 11
  fallidos / 20 en verde; entre ellos `limit=200` (recibía `limit=50`), «con 11 entradas, la
  página 1 muestra las primeras 10» (se renderizaban las 11), los botones de paginación
  inexistentes y la marca de devuelta ausente. GREEN tras implementar. Correcciones del
  propietario de la orquestación sobre el trabajo del escritor: se borró un test que no podía
  fallar (orden de la página 2 con fixture ya ordenado y una sola fila; el orden lo cubre el test
  con fixture desordenado); comentarios que citaban «design.md, D1» (el de OpenSpec, otra
  decisión); `app/dashboard/page.integration.test.tsx:149` fijaba `limit=50` y pasa a 200 en esta
  tarea para que el commit quede en verde; aviso `mayHaveMore` a 16 px; hover de fila; íconos en
  «Anterior»/«Siguiente». Desvío visual declarado: la marca de devuelta usa el token `warning`
  (ámbar, «requiere atención»), no el rojo del canvas, que en el sistema es `destructive`
  (error/rechazo). Verificación: `pnpm lint` OK · `pnpm exec tsc --noEmit` OK · `pnpm test` 29
  archivos / 394 tests en verde · `pnpm build` OK · `git diff --check` OK.

- 2026-09-28 — **T2 hecha, commit `b3c1b1e`**, tras la aprobación del diff por el propietario. Ruta:
  delegada (escritor). RED antes de implementar (`pnpm exec vitest run
  app/dashboard/page.test.tsx`): 3 de 4 tests nuevos fallaban (el buscador no precedía a la
  bandeja; «Pendientes» presente; el panel de filtros se renderizaba sin haber buscado). El
  cuarto («los filtros aparecen después de buscar») pasaba ya y se conserva como la otra mitad de
  la garantía D4. Se retiró «excluye los rechazos al filtrar por Completadas»: la regla de #35
  vive en `isSuccessfullyClosed` y la cubre `lib/request-state.test.ts:70-80`. Se borraron
  `summary-cards.tsx` y su test. Revisión del orquestador: sin correcciones. Verificación:
  `pnpm lint` OK · `pnpm exec tsc --noEmit` OK · `pnpm test` 28 archivos / 392 tests en verde ·
  `pnpm build` OK · `git diff --check` OK · sin referencias a `SummaryCards`.
- Tamaño acumulado: T1 +306/−90 y T2 +196/−458, unas 1050 líneas autorales contando borrados
  (el pronóstico era 400–550: no contaba el reindentado de `page.tsx` ni los 234 de
  `summary-cards`). No justifica partir la PR; si la CI lo exige, se pide `size:exception`.

- 2026-09-28 — **T3 en espera por decisión del propietario**: hay otra prueba en vivo en curso
  en el navegador compartido. No se usa Chrome hasta su aviso.

- 2026-09-28 — **Revisión con agente limpio** (procedimiento `Tramita/docs/workflow/code-review-agente-limpio.md`,
  `opus`, sin contexto, rango `5ff20a7..1cc77f5`). Veredicto: mergeable tras corregir; 0
  críticos, 0 altos, 3 medios, 5 bajos. 14 mutantes mueren y 6 sobreviven. **Nada aplicado:
  pendiente de decisión del propietario.** Re-verificados por el orquestador con comandos
  propios: M1, M2 (por aritmética, sin render), M3 y B3.
  - **M1 (confirmado).** La spec vigente exige `limit` = 50 y el aviso con 50/49
    (`openspec/specs/coordination-inbox/spec.md:22, 38, 160-174, 230-238`); el código manda 200
    y la rama no toca `openspec/`. Propuesta: actualizar esos requisitos en esta misma PR.
  - **M2 (confirmado por cálculo).** La ficha de estado (`w-fit whitespace-nowrap`,
    `coordination-inbox.tsx:50`) no cabe en su columna `minmax(0,1.1fr)` (`:76`) en anchos
    intermedios: a 1024 px la columna mide ~144 px y la ficha más de 200 px, y se monta sobre la
    columna de espera (según el revisor, entre ~768 y 900 px y entre ~1024 y 1180 px). Propuesta:
    permitir que la ficha parta línea o dar un mínimo a la columna; medir en T3 a 1024–1100 px.
  - **M3 (confirmado).** El cambio de página no se anuncia: no hay `aria-live` en el tablero. Si
    «Siguiente» se deshabilita teniendo el foco, este vuelve al documento (regla de *focus fixup*
    de HTML; confianza media). A 390 px, tras «Siguiente» la vista queda al pie de la lista.
    Propuesta: `aria-live="polite"` en «Página X de Y» y mover el foco al inicio de la lista.
  - **B1 (sin re-verificar).** Se perdió el test «origen nulo con estilo neutro»
    (`spec.md:98-100, 114-120`); el mutante que lo pinta de rojo sobrevive.
  - **B2 (sin re-verificar).** Sin test que distinga tres cosas: que el encabezado cuente todas
    las cargadas, que los filtros queden bajo el buscador y D2 («Revisar», no «Corregir»).
  - **B3 (confirmado, error del orquestador).** `2f4423f` y `b3c1b1e` no llevan la línea
    `Verificado:` (`.gitmessage:53`) y tienen líneas de 73 a 76 caracteres (máximo 72). Al
    `2f4423f` le falta además `Refs:` al contrato. Sin push todavía: se corrige reescribiendo los
    mensajes, con autorización del propietario.
  - **B4 (sin re-verificar, latente).** «Anterior» calcula desde `page` sin acotar
    (`coordination-inbox.tsx:181`); hoy no se alcanza porque la bandeja carga una vez por montaje.
  - **B5 (sin re-verificar).** `isSuccessfullyClosed` y la marca `rejection` quedan sin uso en
    producción; `metrics` sobra en el mock de `page.test.tsx`.

- 2026-09-28 (tarde) — **M2 medido con números reales**, no con el estimado del revisor. El
  código no fija tamaño raíz (ni `font-size` ni `--text-base`): la coordinadora ve 16 px. Con
  los nombres de estado del backend («En coordinación (revisión)», «Devuelta para corrección»)
  la ficha mide ≈ 232 px (Source Sans 3 semibold, ≈ 0,5 em por carácter; confianza media hasta
  medirla en T3). La columna `minmax(0,1.1fr)` mide ≈ 152 px a 768, 143 a 1024 (aparece la
  barra lateral `w-64`), 219 a 1280, 244 a 1366 y 266 a 1440: la ficha se monta sobre la espera
  entre 768 y ~1010 px y entre 1024 y ~1300 px, no solo hasta 1180. Descartada la alternativa
  de dar ancho mínimo a la columna: a 1024 aplasta el nombre y la espera.

## Deuda registrada (no se aplica en esta PR)

- B1 y B2: tests perdidos o faltantes (origen nulo con estilo neutro; encabezado que cuenta
  todas las cargadas; filtros bajo el buscador; D2).
- B4: «Anterior»/«Siguiente» calculan desde `page` y no desde `safePage`; inalcanzable hoy
  porque la bandeja carga una vez por montaje.
- B5: `isSuccessfullyClosed` y la marca `rejection` quedan sin uso en producción a propósito,
  a la espera de las tarjetas con conteos (#51); `metrics` sobra en el mock de `page.test.tsx`.

## Siguiente paso

T4–T7 con el diff mostrado al propietario antes de cada commit; después T3 en `:3001`; luego
el borrador de la PR completo, push y PR (`Closes #56`, `Closes #36`) con autorización
separada, y merge por el propietario antes de la muestra.
