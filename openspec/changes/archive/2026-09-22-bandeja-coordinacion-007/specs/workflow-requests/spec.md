# Delta for Workflow Requests

## Nota sobre `REMOVED Requirements`

Esta delta no incluye una sección `REMOVED Requirements`. Se verificaron completos
`openspec/specs/workflow-requests/spec.md`, `openspec/specs/request-timeline/spec.md`,
`openspec/specs/request-transitions/spec.md` y `openspec/specs/do-fr-100-form/spec.md`
(`rg -ni 'vencid|vencimiento|etapa|configuraci|stepper|paso \d|SLA|prioridad|urgente|urgencia' openspec/specs`)
y ninguno declara un requisito sobre la pantalla de Configuración, las etapas del
stepper o el vencimiento. Las tres coincidencias que produce ese comando no son
normativas sobre esos temas: la prohibición de insignia de urgencia en
«Antigüedad del estado actual» de `request-timeline` (que esta misma delta actualiza,
sin debilitarla), y la frase «Trámite inexistente en la configuración» de
`workflow-requests` (un 422 del backend, no la pantalla de Configuración). La baja de
`app/settings/page.tsx`, de `components/workflow-stepper.tsx` y de
`lib/format.ts#addBusinessDays/businessDaysUntil/isOverdue` es, por lo tanto, retiro de
comportamiento nunca especificado — no de un requisito existente. Queda documentada en
`proposal.md` («Decisión consciente: baja de la pantalla de Configuración», *Affected
Areas*) y como ausencia positiva en el nuevo requisito «Ausencia de vencimiento en toda
la aplicación» del dominio `coordination-inbox`.

## MODIFIED Requirements

### Requirement: Catálogo data-driven de definiciones de trámite

El sistema reconoce dos clases de pantalla de registro, cada una con su propia norma sobre el
origen del `code` de trámite, ninguna subordinada a la otra.

**Pantallas que ofrecen elegir un trámite** (por ejemplo, el registro genérico de
`app/requests/new`): el sistema **MUST** poblar su selector exclusivamente desde
`GET /workflow-definitions` (:14-28), usando `code` + `name` de `WorkflowDefinition` (:177-183).
El sistema **MUST NOT** fijar en ellas códigos o nombres de trámite fuera de fixtures.

**Pantallas que reproducen un formato oficial en papel** (por ejemplo, el DO-FR-100 acotado a
créditos adicionales): un formato de papel no ofrece elegir entre trámites, reproduce uno. El
sistema **MUST** declarar su código de trámite de forma explícita y **exactamente una vez** en el
código de la pantalla —sea para el cuerpo de la petición o para construir su ruta— y **MUST NOT**
ofrecer en ellas ningún selector de trámites.

**Presentación del tipo de trámite de una solicitud existente** (badge, fila «Tipo de
trámite» del detalle, filtro del tablero): el sistema **MUST NOT** presentar como
«Adición de créditos» —ni como ningún otro tipo reconocido— una solicitud cuyo código
de definición no reconoce. Un código de definición desconocido **MUST** presentarse de
forma neutra y **MUST NOT** romper la pantalla que lo muestra. Cierra el criterio (b)
del issue #9. Cómo se representa el dato —un tercer miembro explícito en una unión
cerrada con allowlist, o los datos crudos de la definición (`definition.name`)— lo
decide `sdd-design`; este requisito solo fija el resultado observable.

(Previously: el requisito solo contemplaba pantallas que ofrecen elegir trámite y prohibía sin
excepción cualquier `code` fijado en `app/`, `components/` o `lib/` fuera de fixtures. La
presentación del tipo en una solicitud existente no estaba cubierta; ahora lo está, con el
comportamiento observable fijado y la forma del dato deferida al diseño.)

#### Scenario: Selector poblado desde el catálogo

- GIVEN el backend expone N definiciones vigentes
- WHEN se abre el formulario de registro
- THEN el selector lista exactamente esas N opciones con su `name`

#### Scenario: Trámite nuevo aparece sin recompilar

- GIVEN se agrega una definición nueva en la semilla del backend
- WHEN se recarga el formulario sin cambiar el código del front
- THEN la nueva definición aparece en el selector

#### Scenario: Ausencia de códigos hardcodeados fuera de las pantallas de formato oficial

- GIVEN el código fuente en `app/`, `components/`, `lib/` (excluyendo fixtures, las pantallas
  que reproducen un formato oficial, y el mapa decorativo de íconos de
  `components/type-badge.tsx`: asocia dos códigos a un ícono, nunca al rótulo —que siempre sale
  de `definition.name`— y todo código ausente cae a un ícono neutro sin romper la pantalla)
- WHEN se busca cualquier `code` literal de trámite (p. ej. `ADICION_CREDITOS`)
- THEN la búsqueda devuelve 0 ocurrencias fuera de esas exclusiones

#### Scenario: Pantalla de formato oficial sin selector y con el literal declarado una sola vez

- GIVEN una pantalla que reproduce un formato oficial (por ejemplo, el DO-FR-100)
- WHEN se inspecciona su código fuente e interfaz
- THEN no expone ningún control que permita elegir un trámite distinto
- AND su literal de código de trámite aparece exactamente una vez, sin importar si alimenta el
  cuerpo de la petición o su ruta

#### Scenario: Un código de definición desconocido no se presenta como adición de créditos (#9b)

- GIVEN una solicitud cuyo código de definición el cliente no reconoce
- WHEN se presenta en cualquier lugar donde se muestre el tipo de trámite (badge, fila
  «Tipo de trámite», filtro del tablero)
- THEN no aparece como «Adición de créditos»
- AND la pantalla no falla ni queda en blanco por ese código

### Requirement: Detalle de una solicitud

El sistema **MUST** obtener `GET /requests/{id}` (:78-93) y mostrar `definition`,
`studentName`, `studentDocument`, `currentState` (`State`, ahora `{code, name,
isInitial, isFinal}` según el contrato de la feature 007, :284-306) y `createdAt`.
Cuando `currentState.isFinal` es verdadero, `availableTransitions` llega vacío (:233);
el sistema **MUST** presentar la solicitud como cerrada, sin acciones registrables.

El sistema **MUST** presentar el estado actual como un bloque con `currentState.name` y
su marca de inicial o final (derivadas de `isInitial`/`isFinal`), y **MUST NOT**
presentarlo como un paso dentro de un recorrido: ni stepper, ni «paso N de M», ni ningún
indicador de orden lineal entre estados. El contrato de `GET /workflow-definitions`
declara explícitamente que el conjunto de estados de una definición **no tiene orden
significativo** (FR-011b, contrato 007 :133-136), así que un recorrido lineal afirmaría
un dato que el motor no modela.

(Previously: no fijaba la forma de `State` con `isInitial` ni prohibía representar el
estado como un paso de un recorrido lineal; esa prohibición es nueva y reemplaza el
stepper retirado.)

#### Scenario: Detalle con transiciones disponibles

- GIVEN una solicitud en un estado no final con transiciones definidas
- WHEN se abre su detalle
- THEN se muestran `currentState.name` y las acciones derivadas de `availableTransitions`

#### Scenario: El detalle muestra los datos de identificación de la solicitud

- GIVEN una solicitud cualquiera
- WHEN se abre su detalle
- THEN se muestran `definition.name`, `studentName`, `studentDocument` y `createdAt`

#### Scenario: Trámite en estado final sin acciones

- GIVEN una solicitud cuyo `currentState.isFinal` es `true`
- WHEN se abre su detalle
- THEN no se ofrece ninguna acción registrable

#### Scenario: Solicitud inexistente

- GIVEN un `id` que el backend no reconoce
- WHEN se solicita su detalle
- THEN el backend responde 404 y la UI muestra un estado "no encontrado"

#### Scenario: Dos estados intermedios se distinguen en pantalla (#9a)

- GIVEN una solicitud en el estado «En facultad» y otra en el estado «En registro
  nacional», ambos intermedios de la misma definición
- WHEN se abre el detalle de cada una
- THEN cada pantalla muestra el nombre de su propio `currentState`, y ambos nombres son
  distinguibles entre sí
- AND ninguna de las dos pantallas los agrupa bajo una etiqueta de etapa compartida

#### Scenario: Sin recorrido lineal entre estados

- GIVEN el detalle de una solicitud en un estado no final
- WHEN se inspecciona la pantalla
- THEN no aparece ningún stepper, «paso N de M» ni indicador de posición dentro de una
  secuencia de estados

### Requirement: Responsable del estado actual

`project.md:98-99` fija que el dato operativo central es «ahora de quién depende». Ese
responsable **no vive en el estado**: `State` (contrato 007, :284-306) es `{code, name,
isInitial, isFinal}`. El sistema **MUST** derivarlo de `availableTransitions[].responsible`
(:215-218) y **MUST NOT** pedir un campo nuevo al backend.

- Cuando todas las transiciones salientes declaran el **mismo** `responsible`, el sistema
  **MUST** mostrarlo como responsable del estado actual.
- Cuando **difieren**, el sistema **MUST** mostrar «Depende de la acción que se registre»
  y **MUST NOT** elegir uno de ellos como responsable del estado.
- Cuando `currentState.isFinal` es verdadero, `availableTransitions` llega vacía (:233): el
  sistema **MUST** presentar «Trámite cerrado» y **MUST NOT** mostrar responsable
  alguno. No es un dato faltante — un trámite cerrado no depende de nadie.

El detalle de una solicitud **MUST** presentar esta respuesta en un único punto de la
pantalla («Ahora depende de»), y ese punto **MUST** ser la única respuesta a «de quién
depende» que la pantalla ofrece. El sistema **MUST NOT** mostrar, además, una fila
derivada de `assignedTo` (el primer responsable de `availableTransitions`, sin
considerar si difieren entre sí): esa fuente puede contradecir la respuesta de este
requisito cuando los responsables varían, y una pantalla no puede dar dos respuestas a
la misma pregunta.

(Previously: no fijaba la redacción exacta de los tres casos («Depende de la acción que
se registre», «Trámite cerrado») ni prohibía una fila adicional derivada de
`assignedTo`; ambas precisiones son nuevas. Tampoco citaba `isInitial` en la forma de
`State`.)

#### Scenario: Responsable único en las transiciones salientes

- GIVEN una solicitud cuyas transiciones salientes declaran todas `responsible = "FACULTAD"`
- WHEN se abre su detalle
- THEN el estado actual se muestra con `FACULTAD` como responsable

#### Scenario: Responsables divergentes

- GIVEN una solicitud con dos salientes de `responsible` distinto
- WHEN se abre su detalle
- THEN se muestra «Depende de la acción que se registre», sin elegir uno de los
  responsables

#### Scenario: Sin transiciones disponibles en un estado no final

- GIVEN una solicitud cuyo `currentState.isFinal` es `false` y cuyas transiciones
  salientes llegaron vacías o ausentes (dato no disponible en el cliente, no una
  respuesta del backend: el motor nunca deja un estado no final sin salida)
- WHEN se abre su detalle
- THEN el sistema **MUST NOT** afirmar responsable alguno
- AND **MUST NOT** presentar el texto reservado para responsables divergentes

#### Scenario: Estado final sin responsable

- GIVEN una solicitud cuyo `currentState.isFinal` es `true`
- WHEN se abre su detalle
- THEN se muestra «Trámite cerrado» y no se muestra responsable ni un valor vacío

#### Scenario: No hay una segunda respuesta a quién depende

- GIVEN el detalle de cualquier solicitud
- WHEN se inspecciona la pantalla completa
- THEN el único punto que declara de quién depende el trámite es el bloque de este
  requisito
- AND no existe una fila «Asignado a» ni ninguna otra que derive un responsable de
  `assignedTo`

### Requirement: Interpretación de la semántica del estado

`State` (contrato 007, :284-306) declara `{code, name, isInitial, isFinal}`. Responde
dos preguntas con dato propio del contrato: si terminó, y si es el punto de partida del
trámite.

El sistema **MUST** responder «¿el trámite terminó?» exclusivamente con
`currentState.isFinal`, y **MUST** responder «¿es el estado inicial?» exclusivamente con
`currentState.isInitial`. En ambos casos, el sistema **MUST NOT** deducir la respuesta
del valor de presentación con el que agrupa estados para colorear, etiquetar o filtrar,
ni de una tabla de códigos escrita en el cliente. Ese valor agrupa para mostrar; no es
fuente de decisiones.

Las demás preguntas —si el estado es una devolución para corrección, y si el cierre fue
exitoso o negado— **no están en el contrato**. Para responderlas, el sistema **MUST**
reconocer códigos de estado del motor, y al hacerlo:

- **MUST** declarar ese reconocimiento en un **único** lugar del cliente, de forma
  legible como dato y acompañada de tests.
- **MUST** resolverlo **por trámite**: cada definición nombra sus estados de forma
  independiente, y una regla global no puede servir a dos definiciones a la vez.
- **MUST NOT** atribuir semántica de devolución o de cierre exitoso/negado a un código de
  estado que no reconoce. Un estado nuevo del motor no puede romper la pantalla: no
  habilita acciones, la respuesta sobre el cierre sigue siendo válida porque no depende
  de ese reconocimiento, y la respuesta sobre si es inicial sigue siendo válida porque
  sale de `isInitial`, no de esta tabla.
- **MUST** distinguir un cierre exitoso de un cierre negado, que el contrato colapsa bajo
  el mismo `isFinal`.
- **MUST NOT** presentar como devuelto un trámite cuyo cierre fue negado: son situaciones
  distintas aunque ambas interrumpan el avance.

**Limitación declarada.** Cuando una definición modela la devolución como **transición de
retorno** en lugar de estado propio —como hace novedad de notas, según `V2.1.0`—, «estar
devuelto» deja de ser una propiedad del estado actual: el trámite vuelve a un estado
indistinguible de aquel en el que estuvo antes. El sistema **MUST NOT** inventar una
respuesta en ese caso, y **MUST** dejar la limitación visible mediante un test que la
afirme, en lugar de que se manifieste como una coincidencia que nunca ocurre.

(Previously: el inicio también se resolvía reconociendo códigos por trámite en la misma
tabla que devolución y cierre negado, sin dato propio del contrato. Ahora el inicio sale
de `currentState.isInitial` y la tabla de reconocimiento por código queda solo para
devolución y cierre negado — el motor no tiene concepto de «cierre exitoso»
(`isSuccess`) como campo propio, así que esa tabla tampoco lo incorpora.)

#### Scenario: El cierre se deriva del contrato, no de la etiqueta

- GIVEN una solicitud cuyo `currentState.isFinal` es `true`
- WHEN el sistema decide si sigue abierta
- THEN la responde con `isFinal`, sin consultar el valor de agrupación de presentación

#### Scenario: Un cierre negado no se cuenta como cumplido

- GIVEN una solicitud en un estado final que el motor define como rechazo
- WHEN se presentan los indicadores de los resultados de búsqueda (por ejemplo,
  «Completadas»), no los de la bandeja
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

- GIVEN dos definiciones cuyos estados iniciales tienen códigos distintos y ambos traen
  `isInitial = true`
- WHEN se abre una solicitud recién radicada de cada una
- THEN ambas se reconocen como pendientes de radicación a partir de
  `currentState.isInitial`
- AND el inicio de una definición no se acepta como inicio de la otra

#### Scenario: Un estado que el cliente no reconoce no rompe la pantalla

- GIVEN una solicitud en un estado cuyo `code` el cliente no reconoce en su tabla de
  devolución/rechazo
- WHEN se presenta la solicitud
- THEN no se le atribuye ser devolución ni cierre exitoso
- AND si el motor lo marca inicial (`isInitial = true`), el sistema la presenta como
  pendiente de radicación de todos modos, porque ese dato no depende del reconocimiento
  por código
- AND si el motor lo marca final, el sistema igualmente la presenta como cerrada
