# Design: Pantalla del formato DO-FR-100 — matrícula de créditos adicionales

> **Cómo se midió.** Lo que este documento afirma del repo se leyó hoy (2026-09-09):
> `components/app-shell.tsx` completo, `app/requests/new/page.tsx` y su test (**9** bloques
> `it(...)`), `lib/api.ts:77-106` y `:154-187`, `lib/api-errors.ts`, `package.json`,
> `vitest.config.mts`, el árbol de `app/` y el inventario de `components/ui/` (badge, button,
> card, input, label, select, textarea — **no hay checkbox**). **No verificado**: `pnpm test` y
> `tsc --noEmit`, que esta fase no ejecutó.

## Technical Approach

Ruta nueva bajo `app/formatos/`, container/presentational: la página orquesta estado,
validación de UX y envío; las seis tablas del formato viven en un presentational sin estado
compuesto de primitivas de `components/ui/`. El cuerpo se arma con el allowlist que ya existe
en `createRequest` (`lib/api.ts:180`) — esta pantalla es la razón por la que se escribió — y
los errores reusan `apiErrorMessages` (RFC 9457). Cero cambios en `lib/`, en
`app/requests/new/` y en el backend.

## Architecture Decisions

### Decisión 1 — Ruta: `app/formatos/do-fr-100/page.tsx`, montando `<AppShell>`

| | |
|---|---|
| **Elegido** | `app/formatos/do-fr-100/page.tsx` con `<AppShell title="…">`. `app-shell.tsx` no se toca. |
| **Alternativa de eje distinto** | Refinar el cálculo de `active` (`app-shell.tsx:38-40`): arreglar el shell en vez de esquivarlo (opción 4 del BRIEF). |

Las opciones 1-3 del BRIEF son **el mismo eje** (elegir un string de URL), así que no cuentan
como alternativa: la única otra palanca es cambiar quién decide el resaltado.

- **Por qué `formatos/` y no `requests/creditos/`**: por dos razones, ninguna de ellas técnica
  de enrutado. Primero, `formatos/` es inmune **por construcción** al cálculo de resaltado de
  `NAV` (`:23-26`), no por casualidad: tampoco lo encendería un futuro ítem `/requests`.
  Segundo, **nombra la clase de pantalla** que el delta de `workflow-requests` acaba de
  reconocer — «pantallas que reproducen un formato oficial» —, de modo que la estructura de
  carpetas y la especificación dicen lo mismo.

  > ⚠️ **Lo que NO es un argumento válido, y se descarta explícitamente.** Convivir con
  > `app/requests/[id]/page.tsx` **no** sería un conflicto: Next.js llama a ese caso *static
  > siblings* y lo resuelve de forma determinística y documentada — el segmento estático
  > siempre tiene precedencia sobre el dinámico hermano (`getRouteMatch` prueba las rutas
  > exactas antes que las dinámicas en `packages/next/src/server/base-server.ts`, la
  > especificidad las ordena en `sortable-routes.ts`, y hay una suite e2e dedicada en
  > `test/e2e/app-dir/static-siblings/`). El único efecto real sería que `/requests/creditos`
  > dejaría de ser alcanzable como `[id]`, lo que con identificadores UUID no puede ocurrir.
  > Se deja registrado para que nadie reconstruya este descarte sobre una premisa falsa.
- **Por qué se rechaza la alternativa**: `app-shell.tsx` lo comparten cinco pantallas y **no
  tiene tests** (`components/app-shell.test.tsx` no existe; los tests de página lo mockean).
  Elegí no tocarlo sabiendo que **el acoplamiento del resaltado queda vivo**: convertir un
  `git revert` de archivos nuevos en un rollback transversal no lo paga esta change. Follow-up
  con disparo explícito: cuando una ruta necesite de verdad el resaltado, primero un test del
  shell.
- **Por qué no la opción 5** (no montar `AppShell`): pierde el gate de sesión (`:130-132`
  redirige a `/`; `:150` no renderiza sin sesión). Cambiar autenticación por cosmética de nav es
  mal negocio. Precedente: `/account/password` y `/requests/[id]` ya se ven sin ítem resaltado.

### Decisión 2 — Tipo de solicitud: las cuatro casillas, ninguna interactiva

| | |
|---|---|
| **Elegido** | `<fieldset>` + `<legend>Tipo de solicitud</legend>` con las cuatro casillas como `<input type="checkbox" disabled>`; solo «Matrícula créditos adicionales» va `checked`. Una nota visible explica la restricción, atada con `aria-describedby`. |
| **Alternativa de eje distinto** | No usar controles de formulario: pintar la tabla 2 como marcado presentacional (glifos ▢/☑ en una lista), sin ningún `<input>`. |

Omitir las tres rompe la fidelidad al papel, que la spec fija como criterio de desempate: el
papel tiene cuatro casillas. Frente a los glifos, la casilla deshabilitada conserva la
afordancia que reconoce quien llena el formato y deja legible el alcance actual — las tres
grises **son** la pregunta a la Coordinación. Costo aceptado: un control `disabled` sale del
orden de tabulación y baja de contraste; se mitiga con la leyenda y la nota, no con un `title`.

### Decisión 3 — Sin verificación temprana del catálogo (A′ descartada)

| | |
|---|---|
| **Elegido** | No consultar `listWorkflowDefinitions()` al montar. El fallo de configuración sigue llegando como `422` en el envío, atado a la tabla 2. |
| **Alternativa de eje distinto** | En vez de detectar antes (eje *cuándo*), abaratar el fallo tardío (eje *cuánto cuesta*): mensaje accionable en su tabla, con el estado del formulario intacto. |

- Medido en `app/requests/new/page.tsx:95-104`: el `catch` **no resetea el estado ni navega**.
  Un `422` cuesta un clic, no volver a llenar seis tablas — el costo que A′ evitaría no existe.
- El repo ya tiene el preflight sin escribir una línea: `/requests/new` puebla su `<select>`
  desde `GET /workflow-definitions`; abrirla antes de la demo responde si `ADICION_CREDITOS`
  está sembrado.
- A′ costaría una llamada de red al montar, dos estados y ≥2 tests del camino de error, contra
  la prioridad declarada (velocidad para conseguir feedback) y KISS+YAGNI.
- **Disparo para reconsiderar**: si el `422` por trámite no sembrado aparece más de una vez en
  una demo real.

### Decisión 4 — `program`, `semester` y `reason` son obligatorios en la pantalla

**Cerrada: opción (a).** Decisión de producto tomada por el responsable del proyecto tras
plantearle el trade-off; no es una inferencia de este documento. El contrato 003 los declara
opcionales (`lib/api.ts:167-171`; `required` solo exige `definitionCode`, `studentName`,
`studentDocument`), pero el papel los pide siempre, y la fidelidad al papel es el criterio de
desempate declarado en la proposal y en la spec.

**Consecuencia deliberada**: la validación de la pantalla es **más estricta que el contrato**.
Es un endurecimiento de UX, no una regla de negocio nueva — la autoridad sigue siendo del
backend, que aceptaría el registro sin esos campos. Si aparece un caso legítimo con alguno
vacío, se revierte a (b) con el costo simétrico que la tabla describe.

| Opción | Costo | Base |
|---|---|---|
| **(a) Obligatorios** *(elegida)* | La UI es más estricta que el contrato: si la Coordinación tiene un caso legítimo con el campo vacío, la pantalla bloquea un registro que el backend aceptaría. +3 tests RED. | El papel: sus tablas 3 y 5 no admiten celdas en blanco, y la fidelidad al papel es el criterio de desempate declarado. |
| **(b) Opcionales** | Un `reason` vacío produce una solicitud sin contenido — y `reason` es el único lugar donde aparece la asignatura. Mala demo. | El contrato. |
| **(c) Split** (`reason` sí, los otros no) | Rechazada: la asimetría no se apoya ni en el papel ni en el contrato — es una corazonada disfrazada de matiz, y cuesta más explicarla que sostenerla. | — |

Se eligió **(a)**. El rework es simétrico (3 líneas + 3 tests en cualquier dirección), así que
la decisión se tomó por el riesgo de la demo, no por el costo de cambiarla después. Si alguna vez
se revierte a **(b)**, los campos vacíos deben viajar como `undefined` —no `''`—:
`JSON.stringify` (`lib/api.ts:92`) omite la clave, y una cadena vacía contra un `@Size` del
backend es ruido.

## Data Flow

    app/formatos/do-fr-100/page.tsx  (container)
      ├─ estado: 5 campos que persisten + 8 que se pintan y no se envían
      ├─ validate()  → solo UX: marca aria-invalid y NO emite POST
      └─ handleSubmit() → createRequest({ definitionCode: 'ADICION_CREDITOS',
                             studentName, studentDocument, program, semester, reason })
              │  allowlist de lib/api.ts:180 — los 8 no persistidos no tienen por dónde entrar
              ▼
         POST /api/requests ─┬─ 201 → router.push(`/requests/{id}?created=1`)
                             ├─ 422 → error en la tabla 2 (CREATE_REQUEST_422_FIELD)
                             └─ otro → banner de formulario (apiErrorMessages)

    components/do-fr-100/sections.tsx  ← props (valores + onChange + errors); sin estado propio

## File Changes

| Archivo | Acción | Detalle |
|---|---|---|
| `app/formatos/do-fr-100/page.tsx` | Create | Container: estado, validación de UX, envío por allowlist, ruteo de errores. Monta `AppShell`. **Único lugar con el literal `ADICION_CREDITOS`.** |
| `app/formatos/do-fr-100/page.test.tsx` | Create | Tests de componente (jsdom). |
| `app/formatos/do-fr-100/definition-code.test.ts` | Create | Guarda de texto fuente (ver Testing). |
| `components/do-fr-100/sections.tsx` | Create | Presentational: las seis tablas en el orden del papel, compuestas de `components/ui/*`. |
| `components/do-fr-100/motivos.ts` | Create | Los 14 rótulos hardcodeados, aislados (ver Deuda declarada). |
| `components/ui/checkbox.tsx` | Create | Primitiva delgada `cn()` sobre `<input type="checkbox">`, igual patrón que `input.tsx`/`textarea.tsx`. 18 usos (4 + 14) justifican no repetir clases. |
| `app/requests/new/**`, `lib/api.ts`, `lib/types.ts`, `components/app-shell.tsx` | **Sin tocar** | Invariante de la change. |

## Deuda declarada — los 14 motivos

Van hardcodeados en `components/do-fr-100/motivos.ts`. Su destino correcto es **configuración
asociada a la definición del trámite**: la Coordinación confirmó que *«si cambian una casilla,
sacan la versión 2»* del formato, así que el catálogo de motivos versiona con el trámite, no con
el front. Se aísla en su propio módulo justamente para que esa migración toque un archivo. **No
se implementa ahora** (cuesta backend y esquema, y no acerca la demo).

## Testing Strategy

| Capa | Qué se prueba | Cómo |
|---|---|---|
| Componente | Orden y rótulos de las seis tablas; los 8 campos no persistidos no llegan al cuerpo; envío con los 5 campos; `semester` como ordinal; límites de longitud sin emitir POST; `422` en la tabla 2 vs. banner | Vitest + Testing Library, patrón de `app/requests/new/page.test.tsx`: `vi.stubGlobal('fetch')`, `cleanup()` manual, aserción sobre `JSON.parse(init.body)` |
| Componente | Guarda de `workflow-requests`, mitad **«no expone selector»** | `queryAllByRole('combobox')` → 0; las 4 casillas de la tabla 2 están `disabled` y un `click` en las tres no marcadas no las marca |
| Fuente | Guarda de `workflow-requests`, mitad **«el literal aparece exactamente una vez»** | Test aparte que lee `page.tsx` con `node:fs` y cuenta ocurrencias. No hay precedente en el repo (medido: 0 coincidencias de `readFileSync\|node:fs` en `**/*.{ts,tsx,mts}`), pero es la única forma mecanizable: un test de runtime no ve el texto del fuente. `@types/node` ya está instalado; sin dependencias nuevas |
| Regresión | `app/requests/new/page.test.tsx` intacto y verde (9 `it`) | `pnpm test` |
| Tipos | `pnpm exec tsc --noEmit` **precedido de `rm -rf .next`** | Manual |

El conteo del literal se mide **solo sobre código de producción**: los tests y fixtures lo
contienen legítimamente hoy (`lib/api.test.ts`, `app/**/*.test.tsx`), tal como lo interpretó la
medición de la proposal. Todos los valores de prueba salen de `BRIEF.md:42-53` — sintéticos.

`pnpm lint` no se ejecuta: ESLint no está instalado (issue #4).

## Threat Matrix

**N/A** — la change no toca routing de CLI, comandos de shell, subprocesos, automatización de
VCS/PR, clasificación de archivos ejecutables ni integración de procesos. Es una pantalla de
navegador contra un endpoint ya existente.

## Migration / Rollout

Sin migración: aditiva, sin estado persistido en el cliente, sin cambios de contrato ni de
backend. `git revert` de la PR retira archivos nuevos y deja el resto idéntico — la Decisión 1
preserva esa propiedad al no tocar `app-shell.tsx`. Se llega por URL directa; sin ítem de nav.

## Open Questions

- [x] **Obligatoriedad de `program`, `semester` y `reason`** — resuelta: son obligatorios,
      opción (a) de la Decisión 4. Ya no bloquea los tests de validación.
- [ ] Las cinco preguntas a la Coordinación de `proposal.md:104-116` siguen abiertas; ninguna
      bloquea la implementación.

No queda ninguna decisión pendiente para pasar a `tasks`.
