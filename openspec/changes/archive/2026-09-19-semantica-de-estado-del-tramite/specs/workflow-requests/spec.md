# Workflow Requests Specification — delta

## Purpose

Fijar cómo el cliente interpreta la **situación** de un trámite a partir de lo que el contrato
entrega. Los requisitos vigentes ya establecen qué se muestra del estado («Detalle de una
solicitud») y de dónde sale el responsable («Responsable del estado actual»), y siguen valiendo
tal cual. Falta el tercero: qué puede y qué **no** puede deducir el cliente sobre la situación
del trámite, y de dónde.

Se agrega, no se modifica nada.

## ADDED Requirements

### Requirement: Interpretación de la semántica del estado

`State` (:212-218) declara `{code, name, isFinal}`. Es lo único que el contrato entrega sobre la
situación de un trámite, y responde **una** pregunta: si terminó.

El sistema **MUST** responder «¿el trámite terminó?» exclusivamente con `currentState.isFinal`,
y **MUST NOT** deducirlo del valor de presentación con el que agrupa estados para colorear,
etiquetar o filtrar. Ese valor agrupa para mostrar; no es fuente de decisiones.

Las demás preguntas —si el estado es el inicial, si es una devolución para corrección, y si el
cierre fue exitoso o negado— **no están en el contrato**. Para responderlas, el sistema **MUST**
reconocer códigos de estado del motor, y al hacerlo:

- **MUST** declarar ese reconocimiento en un **único** lugar del cliente, de forma legible como
  dato y acompañada de tests.
- **MUST** resolverlo **por trámite**: cada definición nombra sus estados de forma independiente,
  y una regla global no puede servir a dos definiciones a la vez.
- **MUST NOT** atribuir semántica a un código de estado que no reconoce. Un estado nuevo del
  motor no puede romper la pantalla: no habilita acciones, y la respuesta sobre el cierre sigue
  siendo válida porque no depende de ese reconocimiento.
- **MUST** distinguir un cierre exitoso de un cierre negado, que el contrato colapsa bajo el
  mismo `isFinal`.
- **MUST NOT** presentar como devuelto un trámite cuyo cierre fue negado: son situaciones
  distintas aunque ambas interrumpan el avance.

**Limitación declarada.** Cuando una definición modela la devolución como **transición de retorno**
en lugar de estado propio —como hace novedad de notas, según `V2.1.0`—, «estar devuelto» deja de
ser una propiedad del estado actual: el trámite vuelve a un estado indistinguible de aquel en el
que estuvo antes. El sistema **MUST NOT** inventar una respuesta en ese caso, y **MUST** dejar la
limitación visible mediante un test que la afirme, en lugar de que se manifieste como una
coincidencia que nunca ocurre.

#### Scenario: El cierre se deriva del contrato, no de la etiqueta

- GIVEN una solicitud cuyo `currentState.isFinal` es `true`
- WHEN el sistema decide si sigue abierta
- THEN la responde con `isFinal`, sin consultar el valor de agrupación de presentación

#### Scenario: Un cierre negado no se cuenta como cumplido

- GIVEN una solicitud en un estado final que el motor define como rechazo
- WHEN se presentan los indicadores de la bandeja
- THEN la solicitud figura como cerrada y **no** entre las completadas

#### Scenario: Un cierre negado no se presenta como devolución

- GIVEN una solicitud en un estado final que el motor define como rechazo
- WHEN el sistema decide si está devuelta para corrección
- THEN responde que no

#### Scenario: La devolución se reconoce donde el motor la modela como estado

- GIVEN una solicitud de un trámite cuya definición declara un estado de devolución
- AND la solicitud se encuentra en ese estado
- WHEN el sistema decide si está devuelta para corrección
- THEN responde que sí

#### Scenario: La devolución no se inventa donde el motor la modela como transición

- GIVEN una solicitud de un trámite cuya definición no declara estado de devolución
- WHEN el sistema decide si está devuelta para corrección
- THEN responde que no, en cualquiera de los estados de esa definición
- AND la limitación queda afirmada por un test, no implícita

#### Scenario: Cada trámite reconoce su propio inicio

- GIVEN dos definiciones cuyos estados iniciales tienen códigos distintos
- WHEN se abre una solicitud recién radicada de cada una
- THEN ambas se reconocen como pendientes de radicación
- AND el inicio de una definición no se acepta como inicio de la otra

#### Scenario: Un estado que el cliente no reconoce no rompe la pantalla

- GIVEN una solicitud en un estado cuyo código el cliente no reconoce
- WHEN se presenta la solicitud
- THEN no se le atribuye ser inicial, ni devolución, ni cierre exitoso
- AND si el motor lo marca final, el sistema igualmente la presenta como cerrada
