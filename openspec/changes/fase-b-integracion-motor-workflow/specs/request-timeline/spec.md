# Request Timeline Specification

## Purpose

Bitácora cronológica de auditoría con el par actor / en-nombre-de (FR-006, FR-008), y
la presentación de "cuánto lleva esperando" el estado actual como dato derivado, sin
reglas de negocio sobre umbrales de tiempo (diferidas a SP5).

Contrato: `Tramita/specs/002-workflow-engine/contracts/openapi.yaml` (líneas citadas
abajo se refieren a ese archivo).

## Requirements

### Requirement: Bitácora cronológica con actor y en-nombre-de (FR-008)

El sistema **MUST** obtener `GET /requests/{id}/timeline` (:131-149) y renderizar las
entradas en el orden ascendente devuelto. Cada entrada **MUST** mostrar `actorEmail`
(:259-263) como "registrado por {actorEmail}"; cuando `responsible` está presente
(:264-268) **MUST** agregar "· en nombre de {responsible}". La entrada de registro
(`fromState = null`, :253-257) no trae `responsible` (:267-268); el sistema
**MUST NOT** mostrar la cláusula "en nombre de" para esa entrada.

#### Scenario: Entrada de transición con actor y responsable

- GIVEN una entrada con `actorEmail = "coord@uniremington.edu.co"` y
  `responsible = "FACULTAD"`
- WHEN se renderiza el timeline
- THEN la entrada muestra "registrado por coord@uniremington.edu.co · en nombre de
  FACULTAD"

#### Scenario: Entrada de registro sin en-nombre-de

- GIVEN la primera entrada del timeline con `fromState = null` y sin `responsible`
- WHEN se renderiza el timeline
- THEN esa entrada muestra solo "registrado por {actorEmail}", sin cláusula "en nombre de"

#### Scenario: Observación visible

- GIVEN una entrada con `note` no vacío (:269)
- WHEN se renderiza el timeline
- THEN el texto de la nota es visible en esa entrada

### Requirement: Antigüedad del estado actual (presentación, no regla de negocio)

El sistema **MUST** calcular "lleva N días esperando" a partir del `occurredAt` de la
entrada más reciente del timeline (última en orden ascendente), como aritmética de
fechas puramente presentacional. El sistema **MUST NOT** clasificar ni estilizar ese
valor por urgencia (sin insignia ni color de "atrasado"/"urgente"): esa regla de
negocio queda diferida a SP5.

#### Scenario: Antigüedad calculada desde la última entrada

- GIVEN la última entrada del timeline con `occurredAt` de hace 3 días
- WHEN se abre el detalle de la solicitud
- THEN se muestra "lleva 3 días esperando"

#### Scenario: Sin insignia de urgencia aunque N sea alto

- GIVEN la última entrada del timeline con `occurredAt` de hace 30 días
- WHEN se abre el detalle de la solicitud
- THEN se muestra "lleva 30 días esperando" con el mismo estilo que cualquier otro
  valor de N, sin color ni insignia diferenciados
