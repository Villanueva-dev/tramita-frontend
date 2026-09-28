# Rediseño visual del detalle de una solicitud

## Objetivo y problema

Llevar `app/requests/[id]/page.tsx` al lenguaje visual del mockup «Detalle de solicitud»
(proyecto «Workflow configurable Uniremington» en Claude Design, archivo
`Detalle de solicitud.dc.html`): banner de estado prominente, encabezado con el nombre del
estudiante, dos columnas con un panel lateral fijo para las acciones y el historial, y una escala
tipográfica más legible (16–17 px de base). Hoy el detalle concentra acciones, enlaces y estado en
una cabecera densa a 14 px, y el dato central del producto —de quién depende ahora el trámite—
compite visualmente con todo lo demás.

## Decisión de alcance (opción A, 2026-09-27)

Solo frontend: se adopta el lenguaje visual y se **descarta** lo que el mockup afirma y el
contrato no respalda. Verificado en disco y en git (`origin/main` del backend `fa3573a`,
`main` del frontend `be8a614`):

| Elemento del mockup | Por qué se descarta | Evidencia |
|---|---|---|
| «Paso N de M» y pasos futuros en el seguimiento | El conjunto de estados no tiene orden (FR-011b) | `openspec/specs/workflow-requests/spec.md:284-290`; backend `WorkflowDefinitionDetailResponse.java:16` |
| Botones fijos Aprobar / Devolver / Rechazar | Las acciones llegan de `availableTransitions`; el motor no distingue avanzar de devolver (FR-013); el verbo es registrar | `components/transition-dialog.tsx:16-18`; `CLAUDE.md:13` |
| «Le toca decidir a usted» | Segunda respuesta a «de quién depende»; el spec admite una sola («Ahora depende de») | `openspec/specs/workflow-requests/spec.md:396-401` |
| «Su decisión reemplaza la firma escaneada»; firma con nombre y cargo | Sin respaldo documental; `/auth/me` solo devuelve `email` y `active` | `docs/contexto-institucional.md:28`; backend `CurrentUserResponse.java:7` |
| Adjuntar o arrastrar documentos | No existe endpoint de subida | backend: ningún `*Controller.java` ni `openapi.yaml` declara subida |
| Tarjetas «tope del semestre» y «total a matricular» | `MAX_CREDITS` (21) es el máximo que puede sumar una solicitud, se valida solo al crearla y ningún DTO de respuesta lo expone | backend `RequestBusinessRulesImpl.java:89-100`, `V3.0.0__Configure_business_rules.sql:49` |
| Facultad, sede y modalidad | `RequestResponse` no las devuelve | backend `RequestResponse.java` (16 componentes, ninguno de esos) |

## Alcance autorizado

- Reordenar y reestilizar el detalle: enlace de regreso → banner de estado → encabezado (tipo,
  nombre del estudiante como `h2`, radicado y fecha, enlace al PDF) → dos columnas.
- Columna principal: «Datos del estudiante» (sin fila «Nombre», que pasa al `h2`; contacto con
  correo y, si existe, teléfono), «Lo que se solicita» (tabla de asignaturas de tres vías y motivo;
  para adición de créditos, una tarjeta «Créditos solicitados» con la suma de `subjects[].credits`)
  y «Documentos adjuntos» sin cambio funcional.
- Panel lateral fijo al hacer scroll: región «Acciones» con las transiciones dinámicas, el aviso
  de anexo y el aviso manual al estudiante; debajo, el historial (solo lo ya registrado). Se llama
  «Acciones» y no «Registrar avance» porque en un estado final solo contiene avisos.
- Reestilizar `CurrentStateBlock`, `WorkflowTimeline` y `ActionDialog` sin cambiar sus contratos.
- Mensaje de resultado dentro de la página que distingue éxito de error (hoy un error se muestra
  con el ícono de éxito, `page.tsx:249-253`).

Fuera de alcance: cambios de backend; `components/app-shell.tsx` (lo edita otra rama en paralelo);
la sección de documentos, que llama a rutas `/documents…` inexistentes en el backend (se tratará
en un issue aparte); eliminar el código muerto `components/transition-dialog.tsx`; cambiar la
variante de color de las transiciones que exigen nota.

## Decisiones de diseño

- **D1 — Aviso de anexo dentro del panel de acciones.** El requisito canónico es «cerca de las
  acciones de transición» (`spec.md:292`, escenario `:355-359`). El orden anterior («entre las
  acciones y el estado», decisión P1 de `catalogo-programas-y-anexo/proposal.md:129`) fue la forma
  de cumplirlo con el layout viejo. El test deja de afirmar orden de DOM usando el enlace al PDF
  como aproximación y afirma lo que pide el spec: que el aviso vive en la región «Acciones».
  Se conservan las aserciones de no afirmar adjunto y de no ser región viva.
- **D2 — El historial conserva su orden** (más reciente primero). El mockup lo ordena
  cronológicamente porque mezcla pasos futuros; sin ellos, lo último registrado es lo más útil
  junto a las acciones.
- **D3 — Las transiciones conservan su etiqueta y su variante.** El botón se sigue llamando como
  el estado destino (`getByRole('button', { name: 'En facultad' })`), y `requiresNote` sigue
  eligiendo la variante como en `main`.
- **D4 — La escala tipográfica sube solo en el detalle.** Cambiar la base global afectaría
  pantallas fuera de alcance.

## Restricciones y ruta

- Worktree `../tramita-frontend-worktrees/detalle-ui`, rama `feat/detalle-ui`, desde `main`
  `be8a614`, con su propio índice CodeGraph.
- TDD estricto activado por la configuración global del usuario (`~/.claude/CLAUDE.md`,
  «Strict TDD Mode: enabled»): RED → GREEN → REFACTOR. Runner: `pnpm test` (`vitest run`);
  enfocado: `pnpm exec vitest run <archivo>`. Lo puramente visual no tiene RED propio: lo
  protegen los tests existentes, que deben seguir en verde.
- Línea base en `be8a614`: 28 archivos y 355 tests en verde; `tsc --noEmit` y `eslint` limpios.
- Verificación por tarea (la misma de la CI): `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm test`,
  `pnpm build`, `git diff --check`.
- Ruta por tarea: directa delegada. Evidencia: cada tarea toca `page.tsx` y `page.test.tsx` más al
  menos un componente (disparador de escritor: 2+ archivos no triviales).
- RDD efectivo: `off` por `clone_local` (`gentle-ai review mode status`); no activarlo.
- Cada diff lo revisa el propietario antes de su commit; prueba en vivo en Chrome antes de la PR.
- Estrategia de entrega: `single-pr`. Pronóstico: 450–600 líneas autorales con pruebas y este
  documento. Superar 400 no justifica encadenar PRs (decisión del propietario, 2026-09-26); si la
  CI lo exige, se pide `size:exception` como en #81.
- No hacer push, abrir PR ni crear issues sin una autorización separada para la operación remota.

## Tareas

- [x] **T1 — Panel lateral «Acciones».** Commit `b7b5393`. Va primero porque el test de orden
  del anexo se apoya en el layout actual: si el banner sube antes de que exista el panel, ese test
  se rompe entre dos commits. RED: las transiciones, el aviso de anexo y el aviso al estudiante
  viven en la región «Acciones»; en un estado final el anexo sigue ahí sin transiciones; un estado
  final sin anexo ni aviso no muestra la región. Reescribir el test de orden del anexo según D1.
  GREEN: layout de dos columnas con el panel fijo al hacer scroll; el enlace al PDF queda en el
  encabezado.
- [x] **T2 — Encabezado con el nombre del estudiante y banner de estado.** Commit `40b9028`. El
  nombre es `h2`, no `h1`: `AppShell` ya renderiza el `h1` con el título de la página
  (`components/app-shell.tsx:185-187`) y está fuera de alcance. RED: el `h2` es el nombre del
  estudiante y aparece una sola vez (la fila «Nombre» sale de «Datos del estudiante»); se muestra
  «Solicitud {radicado} · radicada el {fecha}». GREEN: el banner sube arriba y
  `CurrentStateBlock` adopta el estilo del mockup, con su API y sus 15 tests intactos (incluido
  «nunca paso N de M»); un estado final usa un tono neutro, no el de éxito, porque un cierre puede
  ser negado (`spec.md:496-503`). Se retira `StatusBadge` del encabezado: con datos reales repite
  el nombre del estado que ya muestra el banner (`stateName` sale de `currentState.name`); el
  test #9a no lo detectaba porque su fixture conserva un `stateName` desactualizado.
- [x] **T3 — Datos del estudiante y lo que se solicita.** Commit `87396aa`. RED: la fila
  «Teléfono» aparece solo cuando existe `studentPhone` (correo y teléfono en filas separadas, no
  una fila «Contacto»: cada dato conserva su etiqueta); la tarjeta «Créditos solicitados» suma
  `subjects[].credits` en adición de créditos con asignaturas, y no aparece en novedad de notas,
  en una definición desconocida ni sin asignaturas. GREEN: «Información del trámite» pasa a «Lo
  que se solicita» y las tres secciones de la columna principal adoptan la escala del mockup
  (títulos de 20 px, etiquetas de 16 px, valores y tabla de 17 px); «Documentos adjuntos» solo
  cambia su título.
- [ ] **T4a — El diálogo de transición no se traba ante un error (`fix`).** Bug previo, hallado al
  preparar T4 e incluido con autorización del propietario (2026-09-27, opción A): `ActionDialog`
  espera 700 ms artificiales y llama a `onConfirm` sin esperar su resultado; si la transición
  falla, `runAction` no cierra el diálogo y `loading` nunca se restablece, así que «Confirmar» y
  «Cancelar» quedan deshabilitados y el error solo aparece en el toast, detrás del fondo del modal
  (reproducido con un test temporal, luego borrado). RED: tras un rechazo del backend, el diálogo
  sigue abierto, muestra el mensaje como alerta dentro de sí mismo y vuelve a habilitar sus
  botones. GREEN: `onConfirm` se espera; `runAction` propaga el error al diálogo en vez de
  mandarlo al toast; se retira la espera artificial y el test que la saltaba con relojes falsos
  pasa a esperar el resultado real. Commit propio `fix(solicitudes): …`.
- [ ] **T4b — Historial, diálogo y mensaje de resultado.** RED: el resultado de una acción de la
  página se anuncia dentro de la página y distingue éxito (`status`) de error (`alert`), sin el
  ícono de éxito para un error. GREEN: `WorkflowTimeline` y `ActionDialog` adoptan el estilo del
  mockup sin cambiar sus props; se retira la tarjeta «Resumen», porque el tipo ya está en el
  encabezado.
- [ ] **T5 — Prueba en vivo.** En Chrome contra el backend local, con permiso del propietario
  porque las transiciones escriben en la base local. Registrar la evidencia aquí. Comprobar en
  particular la columna lateral fija (`lg:sticky`): si el panel y un historial largo superan la
  altura de la ventana, el final del historial solo se ve al llegar al final de la página.

## Progreso y evidencia

- 2026-09-27 — Worktree creado desde `be8a614`; dependencias instaladas; índice CodeGraph
  inicializado; línea base medida.

- 2026-09-27 — **T1 implementada, pendiente de revisión y commit.** Ruta: delegada (escritor
  único; disparador: `page.tsx` + `page.test.tsx`). RED observado en 4 tests con
  `Unable to find an accessible element with the role "region" and name "Acciones"`: `abre el
  diálogo para la transición que entrega el backend`, `ofrece correo y WhatsApp para un cierre
  público…`, `muestra el requisito de anexo dentro del panel de acciones…` (reescrito según D1)
  y `en un estado final con anexo, la región Acciones existe…`. El test `sin transiciones, anexo
  ni enlaces de aviso, la región Acciones no se renderiza` no tiene RED propio: la aserción
  negativa ya se cumplía; queda como guarda. Revisión del orquestador: línea de 135 caracteres
  partida y un comentario aclarado. GREEN sobre el diff final: `pnpm test` 28 archivos / 357
  tests; `tsc --noEmit`, `pnpm lint`, `pnpm build` y `git diff --check` limpios. Riesgo nativo
  (`gentle-ai review assess`, excluyendo este documento sin trackear): `medium`,
  `under_budget`, 2 archivos, 182 líneas; verificación del propio escritor más comprobación
  puntual del orquestador (`vitest` enfocado: 18/18).
- 2026-09-27 — **T1 commiteada**: `7cdd430` (este documento) y `b7b5393` (feat).
- 2026-09-27 — **T2 implementada, pendiente de revisión y commit.** Ruta: delegada (escritor
  único; disparador: `page.tsx`, `page.test.tsx` y `current-state-block.tsx`). RED observado:
  `el nombre del estudiante es el encabezado h2 del detalle` (`Unable to find an accessible
  element with the role "heading" and name "Ana Pérez"`), `muestra el radicado y las fechas…`
  (`Unable to find an element with the text: /^Solicitud request-1 · radicada el…/`) y `el
  encabezado no repite el nombre del estado…` (`expected [...] to have a length of 1 but got
  2`). `el nombre del estudiante aparece una sola vez (guarda)` no tiene RED propio. Revisión
  del orquestador: (1) un comentario atribuía a `CLAUDE.md` que el nombre del estudiante es el
  dato central —el dato central es de quién depende el trámite—, corregido; (2) el rótulo del
  banner era `h3` y quedaba antes del `h2` del nombre (jerarquía invertida): pasa a `h2`, con el
  test `los encabezados del detalle no saltan niveles`. Ese RED se observó revirtiendo la
  corrección a `h3` (`expected 3 to be less than or equal to 2`), porque la corrección se aplicó
  antes que el test. GREEN sobre el diff final: `pnpm test` 28 archivos / 362 tests; `tsc
  --noEmit`, `pnpm lint`, `pnpm build` y `git diff --check` limpios. Riesgo nativo: `medium`,
  `under_budget` (220 líneas antes de las correcciones del orquestador).
- 2026-09-27 — **T2 commiteada**: `5f135a0` (este documento) y `40b9028` (feat).
- 2026-09-27 — **T3 implementada, pendiente de revisión y commit.** Ruta: delegada (escritor
  único; disparador: `page.tsx` + `page.test.tsx`). RED observado: `muestra la fila «Teléfono»
  cuando studentPhone llega con un valor` (`Unable to find an element with the text:
  Teléfono`), `«Créditos solicitados» suma los créditos…` (`…with the text: Créditos
  solicitados`) y `la sección de asignaturas se titula «Lo que se solicita»` (`…with the text:
  Lo que se solicita`). Guardas sin RED propio: sin teléfono no hay fila; sin «Créditos
  solicitados» en novedad de notas, definición desconocida (#9b) ni adición sin asignaturas.
  Revisión del orquestador: dos comentarios imprecisos corregidos (el correo desborda porque no
  tiene espacios donde partirse, no por ser «el único dato largo»; `lib/store.tsx:210` convierte
  una clave ausente en `null` y el chequeo de verdad descarta además la cadena vacía). GREEN
  sobre el diff final: `pnpm test` 28 archivos / 367 tests; `tsc --noEmit`, `pnpm lint`, `pnpm
  build` y `git diff --check` limpios. Riesgo nativo: `medium`, `under_budget` (166 líneas).
- 2026-09-27 — **T3 commiteada**: `944ec57` (este documento) y `87396aa` (feat).
- 2026-09-27 — **T4a implementada, pendiente de revisión y commit.** Ruta: delegada (escritor
  único; disparador: `action-dialog.tsx` + `page.tsx` + `page.test.tsx`). RED observado: `si la
  transición falla, el diálogo sigue abierto y muestra el error dentro de sí mismo` (`Unable to
  find role="alert"` dentro del diálogo). Ajuste de un test existente: `muestra el aviso sin
  recargar tras una transición a estado final` dejó los relojes falsos y el avance de 700 ms,
  que solo saltaban la espera retirada; afirma lo mismo esperando el resultado real. Revisión del
  orquestador: el contrato de `onConfirm` citaba `onClose` como vía de cierre en éxito (el padre
  cierra con `setDialog(null)`), corregido; código y test citaban un identificador de memoria
  local que nadie más puede seguir, reemplazado por este documento. GREEN sobre el diff final:
  `pnpm test` 28 archivos / 368 tests; `tsc --noEmit`, `pnpm lint`, `pnpm build` y `git diff
  --check` limpios. Riesgo nativo: `medium`, `under_budget` (121 líneas).
- Deuda detectada, fuera de alcance: `.claude/skills/revisar-frontend-next/SKILL.md:123` afirma
  que `pnpm lint` está roto, pero ESLint 9.39.3 está instalado con `eslint.config.mjs` y corre
  limpio (lo usa la CI).

## Siguiente paso

Revisión del diff de T4a por el propietario; con su aprobación, commits `docs(odd)` y `fix` de
T4a, y después T4b.
