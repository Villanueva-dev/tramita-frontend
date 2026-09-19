# Brief — Semántica del estado del trámite

> **Qué es este documento.** El insumo que originó esta change: lo que se sabía antes de
> escribir la proposal, reunido en una auditoría del cliente contra el contrato y las
> migraciones del motor. **No es la proposal.** Cuando `proposal.md`, `design.md` y `tasks.md`
> existan, ellos son la autoridad; este queda como registro de por qué la change se planteó así.

> ⚠️ **Orden real de los hechos, declarado para que nadie lo deduzca mal.** En esta change la
> implementación **precedió** a la redacción de estos artefactos. El trabajo se exploró, se
> discutió con alternativas y se aprobó como plan antes de escribir código —ese plan cumplió la
> función de proposal, design y tasks—, pero vivió fuera de `openspec/`. Los artefactos lo
> formalizan a posteriori, con los commits como evidencia de lo que efectivamente se hizo. Se
> escriben antes del merge, no después, para que la especificación gobierne lo que entra a
> `main`. Registrar esto vale más que simular una secuencia que no ocurrió.

## Cómo apareció

Al auditar una rama de integración se encontró un defecto que ninguna issue cubría: la tarjeta
«Completadas» del dashboard contaba los trámites **rechazados**. Se reprodujo con un test
ejecutable antes de afirmarlo, y se reportó como **#35** (prioridad alta).

Al buscar su causa apareció que no era un defecto aislado sino un síntoma. El cliente deriva
**toda** la semántica del trámite de un único enum, `RequestStatus` (`lib/types.ts`), con cinco
valores. Ese enum colapsa cuatro preguntas ortogonales:

| Pregunta | ¿La responde el contrato? |
|---|---|
| ¿está cerrado? | **sí** — `isFinal` |
| ¿terminó con éxito? | no |
| ¿está devuelto para corrección? | no |
| ¿es el estado inicial? | no |

Como las cuatro respuestas salen de un solo valor, **mover una mueve las otras tres**.

## Lo que el contrato da, y lo que no

`Tramita/specs/002-workflow-engine/contracts/openapi.yaml:212-218` declara
`State: { code, name, isFinal }` y nada más. `WorkflowDefinition` (:187-193) expone
`code`, `name` y `version`: **sin estados ni transiciones**. La columna `is_initial` existe en
`workflow_state` desde `V2.1.0` pero no viaja en el contrato.

Todo lo que el cliente no puede preguntar, lo adivina con `includes()` sobre el código del
estado, disperso entre funciones y sin forma de auditarlo.

## Los estados reales del motor

Verificados en `V2.1.0__Seed_workflow_definitions.sql` y `V3.2.0__Register_coordination_review_return.sql`.

**`ADICION_CREDITOS`** — `EN_COORDINACION` (inicial) → `EN_FACULTAD` → `APROBADA_FACULTAD` →
`EN_REGISTRO_CALI` → `EN_REGISTRO_NACIONAL` → `FINALIZADA` (final). Más `DEVUELTA` (no final,
con retorno a `EN_FACULTAD`) y `RECHAZADA` (final).

**`NOVEDAD_NOTAS`** — `REGISTRADA` (inicial) → `EN_PREPARACION` → `EN_FACULTAD` →
`EN_REVISION_FINANCIERA` → `EN_REGISTRO_CONTROL` → `FINALIZADA` (final). **Sin estado de
devolución ni de rechazo**: el seed declara que «la devolución NO es un estado: es la transición
de retorno a `EN_PREPARACION`», y que esa asimetría entre los dos trámites **es parte de la
demostración de US4 (SC-004)**.

Esa asimetría es la que la heurística de substring no sabe leer — y es justamente la que
demuestra que el motor es genérico.

## Una regresión encontrada al planear

`V3.2.0` renombró el estado inicial **solo para adición de créditos**: su `UPDATE` lleva
`AND d.code = 'ADICION_CREDITOS'`. Un arreglo previo que movía una constante global de
`REGISTRADA` a `EN_COORDINACION` corregía un trámite y **rompía el otro**, cuyo inicio sigue
llamándose `REGISTRADA`. Ningún test cubría novedad de notas, que es por lo que no se vio.

## Lo que sigue vigente y vale releer

La tabla de las cuatro preguntas, la lista de estados reales, y el criterio de que `isFinal` es
el único dato que el contrato garantiza. Lo demás puede envejecer: contrástelo con el código.
