# Request Transitions Specification

## Purpose

Acciones registrables compuestas desde `availableTransitions`, redactadas como
registro y no como aprobación (encuadre de producto en `project.md`: "el verbo es
REGISTRAR"), con el responsable declarado por transición y el manejo de la nota
obligatoria y de los conflictos de estado.

Contrato: `Tramita/specs/002-workflow-engine/contracts/openapi.yaml` (líneas citadas
abajo se refieren a ese archivo).

## Requirements

### Requirement: Composición de acciones desde `availableTransitions`

El sistema **MUST** derivar cada acción registrable exclusivamente de
`currentState.availableTransitions` (`AvailableTransition` :210-219): texto desde
`targetState.name`, redactado como acto de registro (p. ej. "Registrar:
{targetState.name}"). El **verbo** de la acción **MUST** ser de registro; el nombre del
estado se cita como dato, no como acto del sistema, aunque contenga palabras de
aprobación o rechazo — `project.md:92-94` lo autoriza explícitamente: registrar
`APROBADA_FACULTAD` es dejar constancia de que la facultad aprobó, no aprobar. El
sistema **MUST NOT** presentarse a sí mismo como quien aprueba o rechaza. El
`targetStateCode` enviado en
`AdvanceRequestBody` (:193-200) **MUST** provenir exclusivamente de la opción
seleccionada entre las `availableTransitions` mostradas. El sistema **MUST NOT** fijar
códigos o etiquetas de transición/estado en `app/`, `components/` o `lib/` fuera de
fixtures.

#### Scenario: Acciones listadas desde el servidor

- GIVEN una solicitud con dos transiciones disponibles
- WHEN se abre su detalle
- THEN se listan dos acciones, cada una con el texto derivado de su propio
  `targetState.name`

#### Scenario: El verbo de la acción es de registro, no de aprobación

- GIVEN una transición cuyo `targetState.name` es "Aprobada por facultad"
- WHEN se renderiza su acción
- THEN el texto es "Registrar: Aprobada por facultad": el verbo pertenece al sistema
  (registrar) y el nombre del estado aparece citado como el hecho que se asienta
- AND ninguna acción presenta al sistema como quien aprueba, rechaza o decide

### Requirement: Responsable declarado por transición (no inferido)

El sistema **MUST** mostrar el `responsible` (:215-218) de cada opción de transición
de forma individual. El sistema **MUST NOT** aplicar el `responsible` de la primera
transición a las demás cuando difieren entre sí.

#### Scenario: Transiciones con responsables distintos

- GIVEN dos transiciones disponibles con `responsible = "FACULTAD"` y
  `responsible = "REGISTRO"` respectivamente
- WHEN se renderizan las acciones
- THEN cada acción muestra su propio `responsible` y ninguna usa el valor de la otra

### Requirement: Nota obligatoria en devoluciones (FR-014)

Cuando `requiresNote` es `true` (:219), el sistema **SHOULD** exigir el campo de nota
antes de habilitar el envío (validación de UX; la autoritativa es el backend). Un 422
por nota faltante (:125-129) **MUST** renderizarse como error del campo de nota, no
como fallo genérico. Cuando `requiresNote` es `false`, la nota **MUST** permanecer
opcional.

#### Scenario: Transición sin nota requerida

- GIVEN una transición con `requiresNote = false`
- WHEN se envía sin nota
- THEN la transición se aplica (200) sin bloqueo por nota

#### Scenario: Nota faltante en transición que la exige

- GIVEN una transición con `requiresNote = true` enviada sin `note`
- WHEN el backend responde 422
- THEN la UI marca el campo de nota como inválido con el motivo del error

### Requirement: Conflicto de transición o estado ya cerrado (409)

Ante un 409 (transición no vigente desde el estado actual, estado final, o conflicto
de concurrencia — :117-124), el sistema **MUST NOT** aplicar la transición de forma
optimista ni dejar la UI en un estado inconsistente; **MUST** informar el conflicto y
ofrecer refrescar el estado vigente.

#### Scenario: Transición ya no vigente

- GIVEN una acción visible que el backend ya no admite (otro cambio ganó la carrera)
- WHEN se envía y el backend responde 409
- THEN la UI no muestra la transición como aplicada y ofrece refrescar el detalle
