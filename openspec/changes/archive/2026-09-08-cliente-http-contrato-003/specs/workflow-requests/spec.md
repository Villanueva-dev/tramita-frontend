# Workflow Requests Specification — delta

## Purpose

Ampliar el cuerpo de registro de una solicitud para que transmita los tres campos que el
contrato **003** agregó y el cliente descarta hoy en silencio.

Contrato de esta delta: `Tramita/specs/003-request-form-rules/contracts/openapi.yaml`
(las líneas citadas abajo se refieren a ese archivo). El requisito que se modifica fue escrito
contra la **002**, que no los tenía.

## MODIFIED Requirements

### Requirement: Registro de una solicitud (US1)

> **Qué cambia respecto de la versión vigente.** La versión anterior enumeraba `program` y
> `semester` entre los campos prohibidos por **no tener fuente en el contrato**. Eso era cierto
> contra la 002 y **dejó de serlo con la 003** (`CreateRequestBody` :151-169). El requisito se
> reescribe para incorporarlos y para distinguir dos motivos de exclusión que antes se
> confundían: *sin fuente en el contrato* y *fuera de alcance por decisión de producto*.

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
