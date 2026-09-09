# Workflow Requests Specification

## Purpose

Catálogo de trámites vigentes, registro de una solicitud con los tres campos que el
backend soporta, localización por nombre o cédula, y consulta de detalle — todo
derivado del contrato, sin trámites ni estados fijados en el cliente (FR-009).

Contrato: `Tramita/specs/002-workflow-engine/contracts/openapi.yaml` (líneas citadas
abajo se refieren a ese archivo).

## Requirements

### Requirement: Catálogo data-driven de definiciones de trámite

El sistema **MUST** poblar el selector de trámites exclusivamente desde
`GET /workflow-definitions` (:14-28), usando `code` + `name` de `WorkflowDefinition`
(:177-183). El sistema **MUST NOT** fijar códigos o nombres de trámite en `app/`,
`components/` o `lib/` fuera de fixtures.

#### Scenario: Selector poblado desde el catálogo

- GIVEN el backend expone N definiciones vigentes
- WHEN se abre el formulario de registro
- THEN el selector lista exactamente esas N opciones con su `name`

#### Scenario: Trámite nuevo aparece sin recompilar

- GIVEN se agrega una definición nueva en la semilla del backend
- WHEN se recarga el formulario sin cambiar el código del front
- THEN la nueva definición aparece en el selector

#### Scenario: Ausencia de códigos hardcodeados

- GIVEN el código fuente en `app/`, `components/`, `lib/` (excluyendo fixtures)
- WHEN se busca cualquier `code` literal de trámite (p. ej. `ADICION_CREDITOS`)
- THEN la búsqueda devuelve 0 ocurrencias

### Requirement: Registro de una solicitud (US1)

El sistema **MUST** enviar únicamente `definitionCode` + `studentName` (≤120) +
`studentDocument` (≤20) vía `POST /requests` (:30-56, `CreateRequestBody` :185-191).
El sistema **MUST NOT** incluir en el payload ni en el formulario campos sin fuente en
el contrato (`attachments`, `subjectInfo`, `priority`, `dueDate`, `radicado`,
`assignedTo`, `program`, `semester`, `studentEmail`, `studentCode`). Un 422 **MUST**
renderizarse como error de campo, no como fallo genérico (`Problem` :165-176).

El sistema **MUST** validar en el cliente, antes de llamar al backend, que `studentName`
y `studentDocument` no quedan vacíos tras `trim()`, y **MUST** enviar los valores ya
recortados. Motivo: el backend los declara `@NotBlank` y una cadena de solo espacios es
no-vacía para el cliente y vacía para el servidor, de modo que sin esta validación el
formulario produce un **400** de bean validation — un error sin campo asociado, cuyo
render solo llega en la Fase 5.

#### Scenario: Registro exitoso

- GIVEN un trámite del catálogo y datos de estudiante válidos
- WHEN se envía el formulario
- THEN el backend responde 201 y la UI navega al detalle de la solicitud creada

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
- THEN el payload lleva el valor sin esos espacios

#### Scenario: Longitud por encima del límite rechazada en el cliente

- GIVEN `studentName` de 121 caracteres o `studentDocument` de 21
- WHEN se intenta enviar el formulario
- THEN la UI marca ese campo como inválido y **no** se emite `POST /requests`

#### Scenario: Formulario sin campos sin fuente

- GIVEN el formulario de registro renderizado
- WHEN se inspeccionan sus campos
- THEN solo existen el selector de trámite, `studentName` y `studentDocument`, y no
  existe ningún campo para `priority`, `dueDate`, `attachments` ni datos equivalentes

### Requirement: Localización de solicitudes por nombre o cédula (US3, FR-011)

El sistema **MUST** consultar `GET /requests?search=` (:57-76) con igualdad exacta
para cédula o fragmento case-insensitive para nombre (:63-66). El sistema **MUST NOT**
emitir la consulta con menos de 2 caracteres (`minLength: 2`, :67).

#### Scenario: Búsqueda por cédula exacta

- GIVEN una solicitud existente con `studentDocument = "1000000001"`
- WHEN se busca `"1000000001"`
- THEN la respuesta incluye esa solicitud (`RequestSummary` :237-246)

#### Scenario: Búsqueda por fragmento del nombre, sin distinguir mayúsculas

- GIVEN una solicitud cuyo `studentName` contiene un nombre en mayúscula inicial
- WHEN se busca un fragmento de ese nombre escrito en minúsculas
- THEN la respuesta incluye esa solicitud (:63-66)

#### Scenario: Menos de 2 caracteres no dispara la petición

- GIVEN el campo de búsqueda con 1 carácter
- WHEN el usuario intenta buscar
- THEN el sistema no emite la petición HTTP

#### Scenario: Sin coincidencias

- GIVEN un término que no coincide con ninguna solicitud
- WHEN se ejecuta la búsqueda
- THEN el backend responde 200 con lista vacía y la UI muestra "sin resultados", no un error

### Requirement: Detalle de una solicitud

El sistema **MUST** obtener `GET /requests/{id}` (:78-93) y mostrar `definition`,
`studentName`, `studentDocument`, `currentState` (`State` :202-208) y `createdAt`.
Cuando `currentState.isFinal` es verdadero, `availableTransitions` llega vacío
(:233); el sistema **MUST** presentar la solicitud como cerrada, sin acciones
registrables.

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

### Requirement: Responsable del estado actual

`project.md:98-99` fija que el dato operativo central es «ahora de quién depende». Ese
responsable **no vive en el estado**: `State` (:202-208) es `{code, name, isFinal}`. El
sistema **MUST** derivarlo de `availableTransitions[].responsible` (:215-218) y **MUST
NOT** pedir un campo nuevo al backend.

- Cuando todas las transiciones salientes declaran el **mismo** `responsible`, el sistema
  **MUST** mostrarlo como responsable del estado actual.
- Cuando **difieren**, el sistema **MUST** mostrar el responsable por acción y **MUST NOT**
  elegir uno de ellos como responsable del estado.
- Cuando `currentState.isFinal` es verdadero, `availableTransitions` llega vacía (:233): el
  sistema **MUST** presentar el trámite como cerrado y **MUST NOT** mostrar responsable
  alguno. No es un dato faltante — un trámite cerrado no depende de nadie.

#### Scenario: Responsable único en las transiciones salientes

- GIVEN una solicitud cuyas transiciones salientes declaran todas `responsible = "FACULTAD"`
- WHEN se abre su detalle
- THEN el estado actual se muestra con `FACULTAD` como responsable

#### Scenario: Responsables divergentes

- GIVEN una solicitud con dos salientes de `responsible` distinto
- WHEN se abre su detalle
- THEN el estado actual no declara un responsable único y cada acción muestra el suyo

#### Scenario: Estado final sin responsable

- GIVEN una solicitud cuyo `currentState.isFinal` es `true`
- WHEN se abre su detalle
- THEN se presenta como trámite cerrado y no se muestra responsable ni un valor vacío
