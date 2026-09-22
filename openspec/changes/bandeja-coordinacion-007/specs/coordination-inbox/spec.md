# Coordination Inbox Specification

## Purpose

La bandeja de trabajo que la Coordinación ve al entrar al tablero, sin necesidad de
buscar: qué solicitudes esperan su acción, desde cuándo esperan y por qué canal
llegaron. El servidor decide el orden y el recorte; el cliente presenta, sin
recalcular el orden ni inventar un vencimiento que el backend no declara.

Contrato: `Tramita/specs/007-coordination-inbox/contracts/openapi.yaml` (líneas citadas
abajo se refieren a ese archivo).

## Requirements

### Requirement: Carga automática de la bandeja al entrar al tablero

El sistema **MUST** solicitar `GET /requests/inbox` (`responsible` y `limit` como
parámetros de consulta, :67-95) al entrar al tablero, sin esperar ninguna acción de
búsqueda del usuario. El parámetro `responsible` **MUST** viajar con el valor
constante `COORDINATION_RESPONSIBLE` (`'COORDINACION'`), declarado una única vez en el
cliente. El parámetro `limit` **MUST** viajar explícito, con el mismo valor que el
default documentado por el contrato (50, :84-95) — para que el aviso de truncamiento
(ver «Aviso de posible truncamiento») compare contra el valor que efectivamente viajó,
no contra un default del servidor que el cliente no ve.

#### Scenario: La bandeja aparece sin que el usuario busque

- GIVEN un usuario con sesión válida que entra al tablero por primera vez
- WHEN la pantalla termina de cargar, sin que el usuario haya escrito ni confirmado
  ninguna búsqueda
- THEN se muestran las solicitudes pendientes de `COORDINATION_RESPONSIBLE`

#### Scenario: `responsible` y `limit` viajan explícitos

- GIVEN la carga de la bandeja al entrar al tablero
- WHEN se inspecciona la petición emitida
- THEN `responsible` es exactamente `'COORDINACION'`
- AND `limit` es exactamente `50`, el mismo valor documentado como default por el
  contrato

### Requirement: El orden del servidor se conserva sin reordenar en el cliente

El sistema **MUST** renderizar las entradas de la bandeja exactamente en el orden en
que las devuelve `GET /requests/inbox` — de la más antigua en espera a la más reciente
(:97-101). El sistema **MUST NOT** aplicar ningún `.sort()` ni reordenamiento
equivalente sobre el resultado en el cliente.

#### Scenario: El DOM respeta el orden del servidor

- GIVEN un fixture de la bandeja cuyo orden no es el que produciría ordenar
  trivialmente por `waitingSince` en el cliente (por ejemplo, intercalado)
- WHEN se renderiza la bandeja
- THEN las filas aparecen en el DOM en el mismo orden del fixture, sin recalcular

#### Scenario: El mutante "reordenar en el cliente" queda en rojo

- GIVEN el mismo fixture del escenario anterior
- WHEN se introduce un `.sort()` sobre las entradas antes de renderizarlas
- THEN el test que fija el orden del servidor falla

### Requirement: La antigüedad de la espera se mide desde `waitingSince`

El sistema **MUST** calcular "Esperando desde hace N días" con `daysSince(waitingSince)`
(`lib/format.ts`, que ya respeta el offset `-05:00` del contrato) para cada entrada de
la bandeja. El sistema **MUST NOT** usar `createdAt` (:212-223) para este cálculo:
`waitingSince` (:224-241) y `createdAt` responden preguntas distintas —radicación
frente a última transición— y el contrato es explícito en que confundirlas desplaza el
orden de urgencia real: una solicitud radicada hace dos meses y corregida ayer lleva
un día esperando, no dos meses.

#### Scenario: La antigüedad sale de `waitingSince`, no de `createdAt`

- GIVEN una entrada de la bandeja radicada (`createdAt`) hace 60 días y cuya última
  transición (`waitingSince`) ocurrió hace 1 día
- WHEN se renderiza su antigüedad
- THEN se muestra "Esperando desde hace 1 día"

#### Scenario: El mutante "createdAt en vez de waitingSince" queda en rojo

- GIVEN la misma entrada del escenario anterior
- WHEN el cálculo de antigüedad se hace con `createdAt` en lugar de `waitingSince`
- THEN el resultado sería "Esperando desde hace 60 días", que contradice el fixture, y
  el test que fija esta antigüedad **MUST** fallar ante esa mutación

### Requirement: El origen se presenta en sus tres casos

El sistema **MUST** traducir el campo `origin` (:247-258) de cada entrada a texto
legible, sin fijar un mapa de trámites ni de estados (regla 1 de
`revisar-frontend-next`): es un enum cerrado del contrato de la bandeja, no del motor
de trámites configurable.

| `origin` | Texto |
|---|---|
| `PUBLIC_LINK` | «Enlace público» |
| `COORDINATION` | «Coordinación» |
| `null` | «Origen no registrado» |

El caso `null` **MUST** presentarse con estilo neutro, no como error ni advertencia: el
contrato lo declara una anomalía de datos conocida —ausencia de entrada de nacimiento
en el timeline—, no un tercer origen real (review M3 del backend, :255-258).

#### Scenario: Origen por enlace público

- GIVEN una entrada con `origin = "PUBLIC_LINK"`
- WHEN se renderiza la fila
- THEN muestra «Enlace público»

#### Scenario: Origen por Coordinación

- GIVEN una entrada con `origin = "COORDINATION"`
- WHEN se renderiza la fila
- THEN muestra «Coordinación»

#### Scenario: Origen nulo se presenta sin alarmar

- GIVEN una entrada con `origin = null` (mock; el backend no permite fabricar el caso
  en vivo)
- WHEN se renderiza la fila
- THEN muestra «Origen no registrado» con el mismo estilo neutro que los otros dos
  casos, no un estilo de error o advertencia

### Requirement: Contenido de cada fila y ausencia de número de documento

El sistema **MUST** mostrar, para cada entrada de la bandeja: el nombre de la
definición (`definition.name`), el nombre del estudiante (`studentName`), el nombre
del estado actual (`currentState.name`) y la antigüedad y el origen definidos en los
requisitos anteriores. El sistema **MUST NOT** mostrar el número de documento del
estudiante en ninguna fila: `InboxEntryResponse` (:196-261) no lo envía — no hay dato
que mostrar, ni siquiera como columna vacía.

#### Scenario: Una fila muestra sus cinco datos

- GIVEN una entrada de la bandeja con `definition.name`, `studentName`,
  `currentState.name`, `waitingSince` y `origin` informados
- WHEN se renderiza la fila
- THEN se muestran los cinco datos derivados de esos campos

#### Scenario: Ninguna fila expone número de documento

- GIVEN la bandeja renderizada con al menos una entrada
- WHEN se inspecciona cualquier fila
- THEN no aparece ningún número de documento ni columna reservada para él

### Requirement: La lista vacía es un estado legítimo

Un `200` con arreglo vacío **MUST** presentarse como "no hay solicitudes pendientes" (o
equivalente), nunca como error ni como pantalla en blanco sin explicación — una lista
vacía es una respuesta legítima y frecuente (:97-101), y un estado que bloquea debe
explicar por qué (regla 7 de `revisar-frontend-next`).

#### Scenario: Bandeja vacía

- GIVEN `GET /requests/inbox` responde `200` con un arreglo vacío
- WHEN se renderiza el tablero
- THEN se muestra un mensaje que indica que no hay solicitudes pendientes, sin señal de
  error

### Requirement: Aviso de posible truncamiento

Cuando la bandeja devuelve exactamente `limit` entradas (50), el sistema **MUST**
mostrar un aviso de que puede haber más solicitudes que las mostradas. El sistema
**MUST NOT** mostrar ese aviso cuando devuelve menos de `limit` entradas.

#### Scenario: Aviso presente al llegar al límite

- GIVEN `GET /requests/inbox` responde con exactamente 50 entradas
- WHEN se renderiza el tablero
- THEN se muestra un aviso de que puede haber más solicitudes

#### Scenario: Sin aviso un elemento por debajo del límite

- GIVEN `GET /requests/inbox` responde con 49 entradas
- WHEN se renderiza el tablero
- THEN no se muestra ningún aviso de truncamiento

### Requirement: Una sesión expirada termina igual que en cualquier otra pantalla

Un `401` (:114-119) al cargar la bandeja **MUST** tratarse como el resto de la
aplicación: fin de sesión, con el mecanismo existente que activa el gate de
`AppShell`. El sistema **MUST NOT** mostrar un mensaje de error propio de la bandeja
para este caso.

#### Scenario: 401 al cargar la bandeja cierra la sesión

- GIVEN `GET /requests/inbox` responde `401`
- WHEN se procesa la respuesta
- THEN se activa el mismo mecanismo de sesión expirada que usan las demás pantallas
- AND no se muestra un mensaje de error propio de la bandeja

### Requirement: La bandeja convive con la búsqueda existente

Cargar la bandeja al entrar **MUST NOT** alterar el comportamiento de la búsqueda por
nombre o cédula (`workflow-requests`, «Localización de solicitudes por nombre o
cédula»): ambas fuentes de datos son independientes y una petición no consume ni
desplaza la respuesta de la otra.

#### Scenario: Buscar después de que la bandeja cargó sigue funcionando

- GIVEN la bandeja ya cargó al entrar al tablero
- WHEN el usuario busca una solicitud por cédula
- THEN el resultado mostrado es el de la búsqueda, no el de la bandeja
- AND la petición de búsqueda no consume la respuesta que el cliente reservó para
  `/requests/inbox`

### Requirement: El encabezado cuenta la bandeja, no la búsqueda

El sistema **MUST** mostrar en el encabezado del tablero la frase «Tiene N
solicitud(es) esperando su acción», donde N es la cantidad de entradas devueltas por
la bandeja (`GET /requests/inbox`), no la cantidad de resultados de una búsqueda. El
sistema **MUST** pluralizar correctamente («0 solicitudes», «1 solicitud», «2
solicitudes»). Cuando la bandeja devuelve exactamente `limit` entradas, el sistema
**MUST** agregar «o más» a la frase, con la misma regla D8 del requisito «Aviso de
posible truncamiento». El sistema **MUST NOT** mencionar «atención prioritaria» ni
ningún conteo de prioridad: `priority` no existe en el contrato de la bandeja.

#### Scenario: La frase cuenta la bandeja al entrar, sin buscar

- GIVEN la bandeja carga 3 solicitudes al entrar al tablero, sin que el usuario busque
- WHEN se renderiza el encabezado
- THEN dice "Tiene 3 solicitudes esperando su acción"

#### Scenario: Singular cuando hay exactamente una

- GIVEN la bandeja carga 1 solicitud
- WHEN se renderiza el encabezado
- THEN dice "Tiene 1 solicitud esperando su acción", no "1 solicitudes"

#### Scenario: "o más" cuando la bandeja llega al límite

- GIVEN la bandeja devuelve exactamente `limit` (50) entradas
- WHEN se renderiza el encabezado
- THEN la frase incluye "o más"

#### Scenario: Sin "o más" un elemento por debajo del límite

- GIVEN la bandeja devuelve `limit - 1` (49) entradas
- WHEN se renderiza el encabezado
- THEN la frase no incluye "o más"

#### Scenario: Sin mención de atención prioritaria

- GIVEN el encabezado renderizado en cualquier estado de la bandeja
- WHEN se inspecciona su texto
- THEN no menciona "atención prioritaria" ni ningún conteo de prioridad

### Requirement: Ausencia de vencimiento en toda la aplicación

El sistema **MUST NOT** presentar ningún vencimiento, plazo ni conteo de días
restantes en ninguna pantalla — ni en el tablero (tarjetas de resumen, tabla de la
bandeja, tabla de resultados de búsqueda, tarjeta móvil), ni en el detalle de una
solicitud. No hay ventana institucional citable para estos trámites (`Tramita#42`
abierto); lo único que el sistema puede afirmar es cuánto lleva esperando un trámite
(ver «La antigüedad de la espera se mide desde `waitingSince`» en este dominio y
«Antigüedad del estado actual» en `request-timeline`), nunca si ese tiempo es
excesivo. En particular, el sistema **MUST NOT** mostrar las palabras "vence",
"vencida", "vencimiento" ni "días restantes" fuera del código y los tests que
verifican su ausencia.

#### Scenario: Ninguna pantalla afirma un vencimiento

- GIVEN cualquier solicitud, en cualquier estado, con cualquier antigüedad
- WHEN se recorren el tablero (tarjetas, tabla de bandeja, tabla de búsqueda, tarjeta
  móvil) y el detalle de la solicitud
- THEN ninguna de esas pantallas muestra un vencimiento, un plazo ni un conteo de días
  restantes

#### Scenario: El mutante "badge Vencida" queda en rojo

- GIVEN una solicitud con cualquier antigüedad
- WHEN se restaura una insignia "Vencida hace Nd" en el detalle, o una columna
  "Vencimiento" en cualquiera de las tablas del tablero
- THEN el conjunto de tests de esta change falla, porque afirman la ausencia de esa
  insignia y de esa columna
