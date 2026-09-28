# Densidad del detalle de solicitud

## Objetivo

Aprovechar el ancho del banner del estado actual en escritorio y dejar de mostrar la fila
«Código» vacía, sin ocultar datos existentes.

## Problema y por qué

- A 1920 × 1080 el banner del estado actual medía 1152 × 242.5 px (medición de la auditoría
  visual): apilaba el estado y sus metadatos en una columna y dejaba unos 586 px vacíos a la
  derecha.
- El formulario público ya no envía `studentCode`, así que el detalle de esas solicitudes
  mostraba la etiqueta «Código» sin valor. El backend lo conserva como opcional
  (`PublicRequestBody.java:19`; columna `student_code VARCHAR(30)` que admite nulos en
  `V2.3.0__Persist_request_form_data.sql:8`), y los registros que lo traen deben seguir
  mostrándolo.

## Alcance autorizado y restricciones

- Solo el diseño del banner del estado actual y la fila del código del estudiante en el
  detalle, con sus pruebas.
- Conservar la prominencia del estado y del responsable, los encabezados semánticos, la
  accesibilidad y el apilado en pantallas angostas.
- Mostrar el código cuando no esté vacío; no tocar la columna de código de la tabla de
  asignaturas ni el contrato del backend.
- Sin push, PR ni merge: la entrega la decide el propietario.

## Tareas

- [x] **RD-1** — Reequilibrar el banner del estado actual en escritorio sin perder el
  comportamiento en pantallas angostas. Ruta: delegada (análisis visual y pruebas del
  componente en varios archivos). Aceptación: menos espacio desperdiciado a 1920 × 1080; sin
  desborde a 1024, 768, 390 ni 320 px; estado, responsable y antigüedad legibles.
  Evidencia: RED → GREEN observado en la prueba enfocada; `pnpm test` 383 en verde;
  `pnpm exec tsc --noEmit` y `pnpm lint` sin errores. Commit: `e95b04f` (mensaje reescrito
  en español; mismo árbol que el `63dbef7` original).
- [x] **RD-2** — Mostrar la fila «Código» del estudiante solo cuando el valor no esté vacío.
  Ruta: delegada; la terminó en línea la sesión principal (ver «Progreso»). Aceptación: sin
  la fila en solicitudes del formulario público; con ella en los registros que traen código;
  el resto de los campos del estudiante y el código de asignatura sin cambios. Evidencia:
  RED observado (2 fallidas: `""` y `"   "`), GREEN con 386 en verde; `pnpm exec tsc
  --noEmit` y `pnpm lint` sin errores; prueba en vivo (abajo). Commit: `ad7e9d8`.

## Prueba en vivo

Mismo navegador y mismo método para el antes y el después: el detalle se carga en un
`iframe` del ancho indicado y se mide el `section` del banner. Antes: `main` servido en
`:3000`. Después: este worktree servido con `next dev --webpack -p 3001` (Turbopack rechaza el
`node_modules` enlazado del worktree).

| Ancho | Antes (`main`) | Después (worktree) | Diferencia |
| --- | --- | --- | --- |
| 1920 | 1296 × 253 | 1296 × 127.1 | −125.9 px (−50 %) |
| 1280 | 906.4 × 253 | 906.4 × 205.8 | −47.2 px |
| 1024 | 974 × 253 | 974 × 205.8 | −47.2 px |
| 768 | 718.6 × 253 | 718.6 × 205.8 | −47.2 px |
| 390 | 340.4 × 423.3 | 340.4 × 445.8 | **+22.5 px** |
| 320 | 270.4 × 465.8 | 270.4 × 488.3 | **+22.5 px** |

Sin desborde horizontal del documento en ningún ancho. RD-2, en vivo a 1920 y 390 px: una
solicitud del formulario público lista «Cédula · Programa · Semestre · Correo · Teléfono»
(antes empezaba por «Código» vacío) y una que trae código conserva «Código» al inicio.

**Hallazgo pendiente de decisión**: por debajo de `sm` (640 px) RD-1 hace el banner 22.5 px
más alto. El `dl` pasó a ser hijo directo de la grilla (`gap-5`, 20 px) cuando antes vivía
dentro del bloque del estado (`gap-2`, 8 px), y su separación interna pasó de `gap-1` a
`gap-3`. La aceptación de RD-1 (sin desborde, legible) se cumple; corregirlo es un cambio de
alcance que decide el propietario.

## Ejecución y entrega

- TDD: estricto, habilitado por la configuración del proyecto (`openspec/config.yaml`);
  corredor: `pnpm test`. Cada tarea exige RED → GREEN → REFACTOR observados.
- Pronóstico: 120–220 líneas de autoría para las dos tareas (orientativo). Conteo real:
  78 en RD-1 y 31 en RD-2 (109), más este documento. Estrategia `ask-on-risk`; no hace falta
  partir en PR encadenadas.
- RDD: apagado en este clon (`gentle-ai review mode status`: `clone_local: off`). La
  evaluación de riesgo que corrió Codex sobre RD-1 dio `medium`, `under_budget`,
  `review_due: false`.

## Progreso

- 2026-09-27: Codex implementó RD-1 en el checkout compartido. Otra sesión cambiaba ese
  checkout de rama (reflog: vuelta a `main` a las 23:14:55 y 23:25:14, causa sin
  determinar), así que movió el trabajo a este worktree
  (`../tramita-frontend-worktrees/request-detail-density`), comprobó la copia con `cmp`,
  revirtió sus cambios del checkout principal y commiteó RD-1.
- 2026-09-28: Codex escribió las pruebas de RD-2 y observó el RED; su worker quedó esperando
  un permiso de escalado para `git apply` y la sesión principal aplicó el parche y observó
  el GREEN, pero se cortó sin correr `tsc` (3 errores TS2345 en las pruebas nuevas), sin
  actualizar este documento y sin commit. Una sesión de Claude Code terminó RD-2: tipó las
  búsquedas con `closest<HTMLElement>()`, marcó como guarda la prueba que conserva la fila,
  distinguió los dos casos del `it.each` en su título y quitó una línea en blanco doble.
- Corrección del registro anterior: `pnpm lint` no está roto. En el sandbox de Codex terminó
  por tiempo (exit 124, sin salida); en una terminal normal pasa en 8 s.

## Próximo paso

Decidir si se corrige el alto extra del banner por debajo de 640 px. Después, la entrega
(push y PR) queda a decisión del propietario.
