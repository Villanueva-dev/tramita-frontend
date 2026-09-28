# Request Timeline Specification

## Purpose

Bitácora cronológica de auditoría con el par actor / en-nombre-de (FR-006, FR-008), y
la presentación de "cuánto lleva esperando" el estado actual como dato derivado, sin
reglas de negocio sobre umbrales de tiempo (diferidas a SP5).

Contrato: `Tramita/specs/002-workflow-engine/contracts/openapi.yaml` (líneas citadas
abajo se refieren a ese archivo).

## Requirements

### Requirement: Bitácora cronológica con actor y en-nombre-de (FR-008)

El sistema **MUST** obtener `GET /requests/{id}/timeline` (:131-149) y renderizar las
entradas en el orden ascendente devuelto. Cada entrada **MUST** mostrar `actorEmail`
(:259-263) como "registrado por {actorEmail}"; cuando `responsible` está presente
(:264-268) **MUST** agregar "· en nombre de {responsible}". La entrada de registro
(`fromState = null`, :253-257) no trae `responsible` (:267-268); el sistema
**MUST NOT** mostrar la cláusula "en nombre de" para esa entrada.

#### Scenario: Entradas renderizadas en orden ascendente

- GIVEN un timeline de tres entradas devueltas por el backend en orden ascendente
- WHEN se renderiza
- THEN aparecen en ese mismo orden, la más antigua primero, sin reordenar en el cliente

#### Scenario: Entrada de transición con actor y responsable

- GIVEN una entrada con `actorEmail = "coord@uniremington.edu.co"` y
  `responsible = "FACULTAD"`
- WHEN se renderiza el timeline
- THEN la entrada muestra "registrado por coord@uniremington.edu.co · en nombre de
  FACULTAD"

#### Scenario: Entrada de registro sin en-nombre-de

- GIVEN la primera entrada del timeline con `fromState = null` y sin `responsible`
- WHEN se renderiza el timeline
- THEN esa entrada muestra solo "registrado por {actorEmail}", sin cláusula "en nombre de"

#### Scenario: Observación visible

- GIVEN una entrada con `note` no vacío (:269)
- WHEN se renderiza el timeline
- THEN el texto de la nota es visible en esa entrada

### Requirement: Antigüedad del estado actual (presentación, no regla de negocio)

El sistema **MUST** calcular "lleva N días esperando" a partir del `occurredAt` de la
entrada más reciente del timeline (última en orden ascendente), como aritmética de
fechas puramente presentacional. El sistema **MUST NOT** clasificar ni estilizar ese
valor por urgencia (sin insignia ni color de "atrasado"/"urgente"): SP5 (la feature 007
del backend) decidió medir la espera, no dictaminar sobre ella, así que esa regla de
negocio sigue sin existir.

El detalle de una solicitud **MUST** mostrar este valor como una fila propia
(«Antigüedad del estado: Lleva N días»), y **MUST** ocultarla cuando
`currentState.isFinal` es verdadero — un trámite cerrado no está "esperando" nada. La
fuente del cálculo **MUST** ser siempre la última entrada del timeline, nunca
`createdAt` de la solicitud.

(Previously: fijaba el cálculo y la ausencia de insignia de urgencia, pero no exigía un
punto concreto de la pantalla donde mostrarlo, y la pantalla montada no lo
implementaba — brecha conocida documentada en `proposal.md`, decisión pendiente P1.
Esta versión cierra esa brecha, agrega la condición de ocultamiento en cierre y deja de
diferir la regla de urgencia "a SP5": SP5 ya llegó y decidió medir, no dictaminar.)

#### Scenario: Antigüedad calculada desde la última entrada

- GIVEN la última entrada del timeline con `occurredAt` de hace 3 días
- WHEN se abre el detalle de la solicitud
- THEN se muestra "Lleva 3 días" en la fila «Antigüedad del estado»

#### Scenario: Sin insignia de urgencia aunque N sea alto

- GIVEN la última entrada del timeline con `occurredAt` de hace 30 días
- WHEN se abre el detalle de la solicitud
- THEN se muestra "Lleva 30 días" con el mismo estilo que cualquier otro valor de N, sin
  color ni insignia diferenciados

#### Scenario: La fila se oculta cuando el trámite está cerrado

- GIVEN una solicitud cuyo `currentState.isFinal` es `true`
- WHEN se abre su detalle
- THEN la fila «Antigüedad del estado» no se muestra

#### Scenario: Consistencia con la antigüedad de la bandeja

- GIVEN una solicitud que aparece en la bandeja de la Coordinación con "Esperando desde
  hace N días", calculado desde `waitingSince`
- WHEN se abre el detalle de esa misma solicitud
- THEN la fila «Antigüedad del estado» muestra el mismo N
- AND ambos valores comparten la misma fuente: el instante de la última transición (la
  última entrada del timeline para el detalle, `waitingSince` para la bandeja)

#### Scenario: El mutante "createdAt en vez de la última entrada" queda en rojo

- GIVEN una solicitud radicada hace 60 días cuya última transición ocurrió hace 1 día
- WHEN el cálculo de la fila «Antigüedad del estado» usa `createdAt` en lugar de la
  última entrada del timeline
- THEN el valor mostrado sería "Lleva 60 días", que contradice la evidencia del fixture,
  y el test que fija esta fila **MUST** fallar ante esa mutación
