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
