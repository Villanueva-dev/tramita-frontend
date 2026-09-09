# Do Fr 100 Form Specification

## Purpose

Pantalla que reproduce el formato oficial **DO-FR-100 — Solicitud de excepción de matrícula**
(v01, plantilla v2024), acotada al único tipo de solicitud en alcance: matrícula de créditos
adicionales. Es una pantalla que reproduce un formato oficial en el sentido del requisito
"Catálogo data-driven de definiciones de trámite" de `workflow-requests`: declara su
`definitionCode` de forma explícita y no ofrece selector de trámites.

## Requirements

### Requirement: Reproducción fiel del formato oficial

El sistema **MUST** presentar las seis tablas del formato en el mismo orden y con los mismos
rótulos que el papel: (1) ciudad y fecha, (2) tipo de solicitud, (3) datos del solicitante,
(4) motivos de la solicitud, (5) compromisos adquiridos, (6) firmas y aprobaciones. Ante
cualquier duda de presentación no resuelta por esta especificación, la fidelidad al papel
**SHALL** prevalecer sobre la elegancia de la interfaz.

#### Scenario: Orden y rótulos de las seis tablas

- GIVEN la pantalla del DO-FR-100 renderizada
- WHEN se recorre su contenido de arriba a abajo
- THEN las seis secciones aparecen en el orden del formato oficial
- AND cada rótulo coincide con el texto de la plantilla v2024

### Requirement: Campos que persisten en la solicitud

El sistema **MUST** enviar a `POST /requests`, junto con el `definitionCode` declarado, los
siguientes cinco campos del formato:

| Campo del formato | Destino | Límite |
|---|---|---|
| Nombres completos del solicitante | `studentName` | ≤120 |
| Número de identificación | `studentDocument` | ≤20 |
| Programa académico | `program` | ≤120 |
| Semestre cursado y aprobado | `semester` (ordinal, p. ej. `'8'`) | ≤50 |
| Compromisos adquiridos | `reason` | ≤2000 |

El sistema **MUST** construir el cuerpo mediante el mismo allowlist explícito de `createRequest`
(`lib/api.ts`), sin propagar el estado del formulario.

#### Scenario: Envío con los cinco campos completos

- GIVEN el formulario diligenciado con nombre, documento, programa, semestre y compromisos
  adquiridos
- WHEN se envía la solicitud
- THEN el cuerpo emitido contiene esos cinco campos y `definitionCode: "ADICION_CREDITOS"`

#### Scenario: El semestre viaja como ordinal

- GIVEN un semestre diligenciado como `"8"`
- WHEN se envía la solicitud
- THEN el cuerpo transporta `"8"` sin transformarlo a un identificador de periodo académico

### Requirement: Campos que se pintan y no se envían

El sistema **MUST** presentar en pantalla, reproduciendo el formato oficial, los campos ciudad y
fecha, correo electrónico, número de contacto, sede, facultad, modalidad, las catorce casillas de
motivos de la solicitud y "Otro: ¿cuál?". El sistema **MUST NOT** incluir ninguno de estos
valores en el cuerpo emitido hacia `POST /requests`, sin importar si el usuario los diligencia.
Es una garantía de minimización de datos personales, no una preferencia de presentación.

#### Scenario: Ningún campo no persistido llega al cuerpo emitido

- GIVEN el formulario diligenciado por completo, incluyendo correo, contacto, ciudad, sede,
  facultad, modalidad, al menos un motivo marcado y el texto de "Otro: ¿cuál?"
- WHEN se envía la solicitud
- THEN el cuerpo de la petición emitida no contiene ninguna de esas ocho propiedades
- AND contiene exclusivamente `definitionCode`, `studentName`, `studentDocument`, `program`,
  `semester` y `reason`

#### Scenario: El campo de firmas no ofrece funcionalidad

- GIVEN la pantalla renderizada
- WHEN se inspecciona la sección de firmas y aprobaciones
- THEN se muestra únicamente el espacio del formato, sin campos editables ni envío asociado

### Requirement: Trámite declarado sin selector

El sistema **MUST** declarar el literal `"ADICION_CREDITOS"` como `definitionCode` de la
solicitud exactamente una vez en el código de la pantalla, y **MUST NOT** ofrecer ningún control
que permita elegir un trámite distinto. Las otras tres casillas de tipo de solicitud del formato
**MUST NOT** ser seleccionables; si se muestran deshabilitadas o se omiten queda a criterio del
design.

#### Scenario: `definitionCode` fijo sin selector

- GIVEN la pantalla del DO-FR-100 renderizada
- WHEN se inspecciona su código fuente y su interfaz
- THEN no existe ningún control que permita elegir un trámite distinto
- AND el literal `"ADICION_CREDITOS"` aparece exactamente una vez

#### Scenario: Las otras tres casillas no son seleccionables

- GIVEN las cuatro casillas de tipo de solicitud del formato
- WHEN se interactúa con las tres que no son "Matrícula créditos adicionales"
- THEN ninguna de ellas puede marcarse ni cambia el `definitionCode` de la solicitud

### Requirement: Validación de cliente como ayuda de UX

El sistema **MUST** validar en el cliente que ningún campo supere su límite de caracteres
(`studentName` ≤120, `studentDocument` ≤20, `program` ≤120, `semester` ≤50, `reason` ≤2000)
antes de emitir la petición. El sistema **MUST** validar que `studentName` y `studentDocument`
no queden vacíos tras `trim()`, en coherencia con el requisito "Registro de una solicitud" de
`workflow-requests`. Esta validación es **únicamente de UX**: el backend sigue siendo la
autoridad y un valor que la supere puede aun así ser rechazado por el servidor.

#### Scenario: Campo que excede el límite se marca inválido sin llamar al backend

- GIVEN `reason` con más de 2000 caracteres
- WHEN se intenta enviar el formulario
- THEN el campo se marca como inválido y no se emite `POST /requests`

#### Scenario: El backend sigue siendo la autoridad

- GIVEN un valor que pasa la validación del cliente
- WHEN el backend lo rechaza igualmente
- THEN el sistema muestra el error devuelto por el backend, sin asumir que el envío fue válido

### Requirement: Manejo de errores del backend

El sistema **MUST** interpretar los errores del backend como `application/problem+json`
(RFC 9457), reusando `apiErrorMessages` de `lib/api-errors.ts`. El `422` de `createRequest`
**MUST** renderizarse como error asociado al campo `definitionCode` (vía
`CREATE_REQUEST_422_FIELD`), no como aviso general. Cualquier otro error **MUST** renderizarse a
nivel de formulario.

#### Scenario: El 422 se ata al campo `definitionCode`

- GIVEN el backend responde `422` al registrar la solicitud
- WHEN se procesa la respuesta
- THEN el mensaje de error se muestra asociado al campo `definitionCode`
- AND no aparece como aviso general del formulario

#### Scenario: Otros errores se muestran a nivel de formulario

- GIVEN el backend responde con un error distinto de `422` (por ejemplo `500` o falla de red)
- WHEN se procesa la respuesta
- THEN el mensaje de error se muestra como aviso general del formulario, no atado a un campo

## Open Questions (para el design)

- **Ruta de la pantalla**: no se especifica aquí; ver `BRIEF.md:91-120` y las decisiones
  pendientes de la proposal.
- **Tratamiento de las otras tres casillas** (deshabilitadas vs. ausentes): solo se exige que no
  sean seleccionables; el mecanismo lo decide el design.
- **Verificación temprana de `definitionCode` contra el catálogo al montar** ("A′" en la
  discusión previa): queda como decisión abierta del design, no como requisito de esta spec.
