# Delta for Request Timeline

## MODIFIED Requirements

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
