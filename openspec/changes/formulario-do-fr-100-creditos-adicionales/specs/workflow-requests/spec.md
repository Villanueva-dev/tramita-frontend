# Workflow Requests Specification — delta

## Purpose

Acotar el requisito del catálogo data-driven para reconocer una segunda clase de pantalla
de registro: las que reproducen un formato oficial en papel (hoy el DO-FR-100), en lugar de
ofrecer un selector de trámites. La regla original se escribió en la fase B, cuando existía una
sola clase de pantalla, y describía bien ese mundo. El sistema ahora tiene dos clases; el
requisito se **completa** para cubrir la que faltaba — no se relaja para acomodar el código.

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
sistema **MUST** declarar su `definitionCode` de forma explícita y **exactamente una vez** en el
código de la pantalla, y **MUST NOT** ofrecer en ellas ningún selector de trámites.

(Previously: el requisito solo contemplaba pantallas que ofrecen elegir trámite y prohibía sin
excepción cualquier `code` fijado en `app/`, `components/` o `lib/` fuera de fixtures.)

#### Scenario: Selector poblado desde el catálogo

- GIVEN el backend expone N definiciones vigentes
- WHEN se abre el formulario de registro
- THEN el selector lista exactamente esas N opciones con su `name`

#### Scenario: Trámite nuevo aparece sin recompilar

- GIVEN se agrega una definición nueva en la semilla del backend
- WHEN se recarga el formulario sin cambiar el código del front
- THEN la nueva definición aparece en el selector

#### Scenario: Ausencia de códigos hardcodeados fuera de las pantallas de formato oficial

- GIVEN el código fuente en `app/`, `components/`, `lib/` (excluyendo fixtures y las pantallas
  que reproducen un formato oficial)
- WHEN se busca cualquier `code` literal de trámite (p. ej. `ADICION_CREDITOS`)
- THEN la búsqueda devuelve 0 ocurrencias fuera de esas exclusiones

#### Scenario: Pantalla de formato oficial sin selector y con el literal declarado una sola vez

- GIVEN una pantalla que reproduce un formato oficial (por ejemplo, el DO-FR-100)
- WHEN se inspecciona su código fuente e interfaz
- THEN no expone ningún control que permita elegir un trámite distinto
- AND su literal de `definitionCode` aparece exactamente una vez
