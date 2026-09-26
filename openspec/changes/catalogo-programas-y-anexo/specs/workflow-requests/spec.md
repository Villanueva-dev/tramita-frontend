# Delta for Workflow Requests

## MODIFIED Requirements

### Requirement: Registro de una solicitud (US1)

El sistema **MUST** enviar vía `POST /requests` los seis campos siguientes, y solo esos:

| Campo | Límite | Fuente |
|---|---|---|
| `definitionCode` | ≤50 | `:155` |
| `studentName` | ≤120 | `:156` |
| `studentDocument` | ≤20 | `:157` |
| `program` | ≤120 | `:160` |
| `semester` | ≤50 | `:161` |
| `reason` | ≤2000 | `:162-166` |

El sistema **MUST** construir el cuerpo de la petición mediante un **allowlist explícito**, que
enumere campo por campo lo que se transmite. El sistema **MUST NOT** construirlo propagando el
objeto recibido ni el estado de un formulario mediante *spread* u operación equivalente.

> **Motivo — es una garantía de privacidad, no una preferencia de estilo.** La pantalla que
> consumirá este cliente presenta ocho campos que no se persisten: correo electrónico, número de
> contacto, ciudad, sede, facultad, modalidad, los catorce motivos de la solicitud y
> «Otro: ¿cuál?». Con una construcción por propagación, todos ellos llegarían al cuerpo de la
> petición y a sus registros de acceso. El propio contrato se compromete a lo simétrico del lado
> de la respuesta: *«NO incluye ningún dato de contacto del estudiante (FR-020, constitución
> §III)»* (`:218`).

El sistema **MUST NOT** incluir en el cuerpo campos **sin fuente en el contrato**:
`attachments`, `subjectInfo`, `priority`, `dueDate`, `radicado`, `assignedTo`, `studentEmail`.

El sistema **MUST NOT** incluir `studentCode` (`:158`) ni `subjects` (`:167-169`). Estos **sí
tienen fuente** en el contrato: quedan fuera por **decisión de alcance**, porque el formato
oficial del DO-FR-100 no los pide — verificado sobre la plantilla v2024, cuyas seis tablas no
contienen ningún campo de código de estudiante ni de asignaturas. La distinción importa: si el
alcance cambia, estos dos se incorporan sin tocar el contrato; los del párrafo anterior, no.

El valor de `semester` **MUST** interpretarse como **ordinal del semestre cursado y aprobado**
(por ejemplo `"8"`), **no** como identificador de periodo académico. El contrato lo declara
`string` (≤50) sin `pattern`, de modo que ambas formas son válidas para el servidor y la
convención vive únicamente aquí. El ejemplo del contrato (`example: '2026-2'`, `:161`) **MUST
NOT** tomarse como la convención vigente: induce a la interpretación contraria.

Los tres campos incorporados **MUST** permanecer opcionales, en coherencia con el contrato, que
declara `required: [definitionCode, studentName, studentDocument]` (`:153`). Un consumidor que
envíe solo los tres originales **MUST** seguir obteniendo un registro válido.

Se conservan sin cambios las garantías de la versión anterior: el sistema **MUST** validar en el
cliente que `studentName` y `studentDocument` no queden vacíos tras `trim()` y **MUST** enviar
los valores ya recortados; un `422` **MUST** renderizarse como error del campo del selector, no
como fallo genérico (`Problem`, RFC 9457).

**Advertencia de camino de código.** El allowlist explícito de arriba describe el `createRequest`
de `lib/api.ts` (`:295-307`). La pantalla `app/requests/new` **no** ejecuta esa función: ejecuta
el `createRequest` de `lib/store.tsx` (`:370-393`), que construye el cuerpo con más campos que los
seis declarados aquí (`lib/store.tsx:377-378,382-383`; issue #10, deuda previa no resuelta por
este cambio). Las cláusulas siguientes sobre `program` en el formulario interno describen el
comportamiento exigido en el camino que la pantalla ejecuta — `lib/store.tsx` —, y este requisito
**MUST NOT** interpretarse como una afirmación de que ese camino cumple el allowlist de seis
campos descrito arriba.

**Origen y omisión de `program` en el formulario interno.** El sistema **MUST** poblar el
selector de `program` del formulario interno (`app/requests/new`) exclusivamente con los nombres
publicados por `GET /api/public/programs` (comparación byte a byte con el nombre recibido, sin
recortar ni normalizar mayúsculas, tildes ni espacios — FR-004,
`Tramita/specs/009-program-catalog-annex/spec.md:75`). La opción inicial, seleccionada por
defecto, **MUST** ser «Sin programa»: el sistema **MUST NOT** preseleccionar silenciosamente
ningún nombre del catálogo. Cuando se elige un nombre, el sistema **MUST** enviarlo idéntico,
byte a byte, al recibido del catálogo. Cuando no se elige ninguno, el sistema **MUST** omitir la
clave `program` del cuerpo de la petición y **MUST NOT** enviar una cadena vacía — el backend
responde 400 con `invalidFields: ["program"]` ante `program: ""`
(`Tramita/specs/009-program-catalog-annex/contracts/openapi.yaml:118-132`; FR-003,
`Tramita/specs/009-program-catalog-annex/spec.md:74`). Cuando el catálogo está cargando, falla o
llega vacío, el sistema **MUST** explicar la situación con un texto visible y **MUST** permitir
completar el registro sin programa. Un `400` con `invalidFields: ["program"]` **MUST** mostrarse
como error general del formulario, con el `detail` del backend, y **MUST NOT** atribuirse a
ningún campo del formulario.

(Previously: no distinguía qué camino de código construye el cuerpo del formulario interno, y
`program` salía de una lista fija en el cliente con preselección del primer valor; ahora los
valores de `program` para el formulario interno proceden del catálogo público, sin
preselección, y la clave se omite cuando no se elige ninguno.)

#### Scenario: El cuerpo enviado transporta los seis campos

- GIVEN un cuerpo con `definitionCode`, `studentName`, `studentDocument`, `program`, `semester` y `reason`
- WHEN se invoca el registro de la solicitud
- THEN el cuerpo de la petición emitida contiene los seis valores, cada uno con el valor recibido

#### Scenario: Un campo no declarado no alcanza la petición

- GIVEN un cuerpo que además incluye una propiedad no declarada en el contrato — por ejemplo un dato de contacto del estudiante
- WHEN se invoca el registro de la solicitud
- THEN el cuerpo de la petición emitida **no** contiene esa propiedad
- AND contiene exclusivamente los seis campos declarados

#### Scenario: Un envío incompleto deja de pasar inadvertido

- GIVEN un cuerpo con `program`, `semester` y `reason` informados
- WHEN se invoca el registro de la solicitud
- THEN los tres viajan en el cuerpo de la petición
- AND la verificación se realiza sobre el cuerpo emitido, **no** sobre el código de estado de la respuesta, porque un envío incompleto también obtiene `201`

#### Scenario: El semestre viaja como ordinal

- GIVEN un `semester` con el valor `"8"`
- WHEN se invoca el registro de la solicitud
- THEN el cuerpo transporta `"8"` sin transformarlo a un identificador de periodo

#### Scenario: Los tres campos incorporados son opcionales

- GIVEN un cuerpo con únicamente `definitionCode`, `studentName` y `studentDocument`
- WHEN se invoca el registro de la solicitud
- THEN la petición se emite y el registro se completa
- AND el consumidor existente del registro sigue operando sin modificaciones

#### Scenario: Trámite inexistente en la configuración

- GIVEN un `definitionCode` que el backend rechaza
- WHEN se envía el formulario
- THEN el backend responde 422 y la UI muestra el error asociado al campo del selector

#### Scenario: Campo de solo espacios rechazado sin llamar al backend

- GIVEN `studentName` o `studentDocument` con únicamente espacios en blanco
- WHEN se envía el formulario
- THEN la UI marca ese campo como inválido y **no** se emite `POST /requests`

#### Scenario: Los valores viajan recortados

- GIVEN `studentName` o `studentDocument` con espacios al principio o al final
- WHEN se envía el formulario
- THEN el cuerpo lleva el valor sin esos espacios

#### Scenario: El selector del formulario interno ofrece «Sin programa» primero y seleccionado

- GIVEN el catálogo cargado con los nombres publicados por `GET /api/public/programs`
- WHEN se abre el formulario interno de registro
- THEN el selector de programa muestra «Sin programa» como primera opción y como opción seleccionada
- AND las demás opciones son los nombres del catálogo, en el orden recibido

#### Scenario: Registrar sin programa omite la clave del cuerpo

- GIVEN el formulario interno con «Sin programa» seleccionado
- WHEN se registra la solicitud
- THEN el cuerpo de la petición no contiene la clave `program`
- AND en ningún caso contiene una cadena vacía

#### Scenario: Registrar con un programa elegido lo envía idéntico

- GIVEN el formulario interno con un nombre del catálogo elegido, con tilde
- WHEN se registra la solicitud
- THEN el cuerpo de la petición contiene `program` con ese nombre, idéntico byte a byte al recibido del catálogo

#### Scenario: El catálogo no disponible no bloquea el registro sin programa

- GIVEN el catálogo del formulario interno en error, o cargado como una lista vacía
- WHEN se abre el formulario interno
- THEN un texto visible explica que la lista de programas no está disponible
- AND el registro se completa sin la clave `program`

#### Scenario: Un programa fuera del catálogo se rechaza como error general, no de campo

- GIVEN el backend responde 400 con `invalidFields: ["program"]` al registrar desde el formulario interno
- WHEN se procesa la respuesta
- THEN el sistema muestra el `detail` del backend como error general del formulario
- AND no lo asocia a ningún campo

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

**Requisito de anexo.** El sistema **MUST** mostrar, cerca de las acciones de transición, un
aviso del requisito de anexo cuando la respuesta trae `annexRequirement` (`documentName`,
`sourceHint`), en cualquier estado — incluido un estado final —, porque el contrato lo declara
presente «desde el registro y en cualquier estado» (FR-009,
`Tramita/specs/009-program-catalog-annex/spec.md:80`;
`Tramita/specs/009-program-catalog-annex/contracts/openapi.yaml:316-322`). El texto del aviso
**MUST NOT** afirmar que el anexo se adjuntó, se recibió ni se pidió (FR-012,
`Tramita/specs/009-program-catalog-annex/spec.md:83`): solo recuerda qué documento llevar y de
dónde sale. El sistema **MUST NOT** mostrar ningún aviso ni contenedor vacío cuando la clave
`annexRequirement` está **ausente** de la respuesta — que es cómo el backend representa «no
aplica» (`RequestResponse.java:45`, `@JsonInclude(NON_NULL)` a nivel de clase;
`Tramita/specs/009-program-catalog-annex/contracts/openapi.yaml:324-327`), nunca con un valor
`null`. El aviso **MUST** seguir visible después de que una transición actualice el detalle, sin
que la Coordinación necesite recargar la pantalla. Un programa heredado, radicado antes de esta
feature y fuera del catálogo vigente, **MUST** seguir mostrándose tal como quedó registrado en la
fila «Programa» (FR-005, `Tramita/specs/009-program-catalog-annex/spec.md:76`), y la ausencia de
`annexRequirement` para ese programa **MUST** comportarse igual que cualquier otra ausencia de la
clave.

(Previously: no distinguía la ausencia de la clave `annexRequirement` de un valor `null`, ni
mostraba ningún aviso relacionado con el anexo que la facultad exige al reenviar una solicitud a
su programa.)

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

#### Scenario: El aviso de anexo se muestra junto a las acciones de transición

- GIVEN el detalle de una solicitud cuya respuesta trae `annexRequirement` con `documentName` y `sourceHint`
- WHEN se abre su detalle
- THEN se muestra un aviso, cerca de las acciones de transición, con ambos textos
- AND el aviso no afirma que el anexo se adjuntó, se recibió ni se pidió

#### Scenario: Sin la clave, no hay aviso ni contenedor vacío

- GIVEN el detalle de una solicitud cuya respuesta no trae la clave `annexRequirement`
- WHEN termina de cargar su detalle
- THEN no se muestra ningún aviso de anexo
- AND no queda ningún contenedor vacío en su lugar

#### Scenario: El aviso sigue visible después de una transición

- GIVEN una solicitud cuyo detalle trae `annexRequirement`
- WHEN se registra una transición y el detalle se actualiza con la respuesta
- THEN el aviso de anexo sigue visible tras la actualización

#### Scenario: Un programa heredado fuera del catálogo se muestra tal cual

- GIVEN una solicitud radicada antes de esta feature, con un programa que no está en el catálogo vigente (por ejemplo «Ing»)
- WHEN se abre su detalle
- THEN el programa se muestra tal como quedó registrado, sin corregirlo ni ocultarlo
- AND si esa solicitud no trae `annexRequirement`, se comporta igual que cualquier otra ausencia de la clave
