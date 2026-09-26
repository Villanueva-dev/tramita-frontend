# Apply Progress: Formulario público DO-FR-100 por pasos

> PR boundary de esta ejecución: **Slice 1 = PR-3a (modelo puro)**, tareas 1.1 y 1.2 de
> `tasks.md`. Sin commit (1.3 queda sin marcar a propósito: el responsable del proyecto revisa
> el diff antes de cada commit). Rama `feat/formulario-publico-3a-steps`, creada desde `main` en
> `5a5f848`; no se hizo push ni se abrió PR.

## Estado global (acumulado, Slices 1–2)

| Tarea | Estado | Nota |
|---|---|---|
| 1.1 — `steps.ts` + `steps.test.ts` | **Completa** | RED→GREEN observado, 18/18 tests |
| 1.2 — Verify (3 comandos) | **Completa** | 3/3 en verde tras la corrección del guardián (ver hallazgo y resolución abajo) |
| 1.3 — Commit | **Completa** | `c6e3bf2` tras el «Aprobado» del diff; PR #65 mergeado en `main` (`6693811`) |
| 2.1 — Helpers `fillPublicRequestForm`/`submitForm` | **Completa** | Refactor puro, mismas aserciones; ver sección Slice 2 abajo |
| 2.2 — Verify (3 comandos + lint extra) | **Completa** | 5/5 en verde (incluye `pnpm lint`, fuera del alcance formal de 2.2) |
| 2.3 — Commit | **Sin hacer, a propósito** | Prohibido en el alcance de esta ejecución |

Modo: **Strict TDD** (`openspec/config.yaml: strict_tdd: true`, runner `pnpm test` / vitest 4.1.11).

## Tarea 1.1 — Modelo puro de pasos

Archivos nuevos:

- `components/do-fr-100/steps.ts` (87 líneas) — `StepId`, `FieldStepId`, `FormField`,
  `FormErrors`, `STEPS`, `FIELD_STEP`, `isFormField`, `errorsOfStep`, `firstStepWithError`,
  `stepsWithErrors`. Sin JSX, sin import de `page.tsx`; `import type { PublicRequestFormValues }
  from './sections'` es la única dependencia del módulo, tal como pide `design.md:144-155`.
- `components/do-fr-100/steps.test.ts` (131 líneas) — 18 pruebas de comportamiento, sin
  snapshots, agrupadas por función.

### TDD Cycle Evidence

| Tarea | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|---|
| 1.1 | `components/do-fr-100/steps.test.ts` | Unit | N/A (archivo nuevo) | ✅ Escrito | ✅ 18/18 en verde | ✅ 18 casos (varios por función) | ➖ No hizo falta — la primera implementación quedó limpia |

**RED observado** (`pnpm exec vitest run components/do-fr-100/steps.test.ts`, antes de crear
`steps.ts`):

```
FAIL  components/do-fr-100/steps.test.ts [ components/do-fr-100/steps.test.ts ]
Error: Failed to resolve import "./steps" from "components/do-fr-100/steps.test.ts". Does the file exist?
Test Files  1 failed (1)
     Tests  no tests
```

**GREEN observado** (mismo comando, tras crear `steps.ts`):

```
Test Files  1 passed (1)
     Tests  18 passed (18)
```

### Decisiones de implementación (sin desviación de `design.md`)

- `FIELD_STEP` mantiene el orden del papel en sus claves (nombre, identificación, correo,
  teléfono; programa, sede, facultad, semestre, modalidad; motivo; firma) — 11 campos, como
  exige la proposal.
- `isFormField` deriva su conjunto válido de `Object.keys(FIELD_STEP)`, no de una lista aparte
  (instrucción explícita del prompt): un campo sin paso no puede pasar el type guard.
- `heading` de «Datos académicos» y «Revisar y enviar» repite la etiqueta porque el papel no
  tiene un bloque propio para esos dos pasos (decisión 6 de `design.md`); el comentario en
  `steps.ts` lo explica.
- `errorsOfStep(errors, 'review')` devuelve siempre `{}`, tal como aclaró el prompt.
- `firstStepWithError` recorre `STEPS` en su orden fijo, no el orden de las claves de `errors`
  (probado explícitamente con un caso donde el orden de los campos y el de los pasos difieren).

## Tarea 1.2 — Verify

| Comando | Resultado observado |
|---|---|
| `pnpm exec vitest run components/do-fr-100/steps.test.ts` | **1 archivo, 18 tests, todos verdes** |
| `pnpm test` (primera corrida, del agente) | **1 archivo fallado, 24 pasados (25); 1 test fallado, 264 pasados (265)** — ver hallazgo abajo |
| `pnpm test` (segunda corrida, tras la resolución) | **25 archivos pasados (25); 265 tests pasados (265)** |
| `rm -rf .next && pnpm exec tsc --noEmit` (las dos corridas) | exit 0, sin errores |
| `pnpm lint` (observación extra, no forma parte de 1.2; las dos corridas) | `eslint .` → exit 0, sin salida |

### Hallazgo: `pnpm test` no queda 100% verde — causa identificada, fuera del alcance de esta ejecución

El único test que falla es, exactamente, el que la propia `design.md` (tabla *Testing Strategy*,
fila «Mecánico (1): `:75`») y `tasks.md` (tarea **4.5**, Slice 4) identifican como pendiente de
actualización: la prueba de frontera en `page.test.tsx:75-83` («guards the complete
public-request boundary from AppShell and request-store dependencies») compara la lista de
archivos de producción bajo `app/solicitud/creditos-adicionales/`, `components/do-fr-100/` y
`components/firma/` contra un arreglo cerrado de tres rutas. Al crear `components/do-fr-100/steps.ts`
(exactamente lo que pide la tarea 1.1), la lista real pasa a tener cuatro entradas:

```
AssertionError: expected [ …(4) ] to deeply equal [ …(3) ]
- Expected
+ Received
  [
    "app/solicitud/creditos-adicionales/page.tsx",
    "components/do-fr-100/sections.tsx",
+   "components/do-fr-100/steps.ts",
    "components/firma/canvas-firma.tsx",
  ]
❯ app/solicitud/creditos-adicionales/page.test.tsx:78:52
```

**Por qué no lo corregí**: el alcance de esta ejecución prohíbe explícitamente tocar
`page.test.tsx`, y `tasks.md` asigna esa actualización a la tarea 4.5, en el Slice 4 (PR-3d) —
no al Slice 1. No es una regresión de la lógica entregada: las 15 pruebas simples y las 4
`it.each` de `page.test.tsx` sin contar esta sí conservan sus 18 definiciones restantes en
verde (246 de 247 casos base + los 18 nuevos de `steps.test.ts` = 264/265).

**Riesgo real para la secuencia planificada**: esta misma prueba de lista cerrada se va a romper
de nuevo en el Slice 3 (PR-3c), en cuanto la tarea 3.1 cree `components/do-fr-100/wizard.tsx` —
un segundo archivo nuevo bajo el mismo directorio — porque la actualización de la lista sigue
fijada a la tarea 4.5. Si la intención era mantener `pnpm test` en verde en cada verificación de
slice (1.2, 2.2, 3.4 piden correr `pnpm test`), la actualización de `page.test.tsx:78-81` debería
moverse a la primera tarea que agregue un archivo nuevo en esos directorios (esta, 1.2), en vez de
diferirse a 4.5. Dejo la decisión al orquestador: autorizar una edición mínima de ese arreglo
cerrado (una línea) como parte de esta unidad, o aceptar explícitamente este test como
«conocido en rojo» hasta el Slice 4.

Por esta razón el agente dejó **1.2 sin marcar** en su corrida: dos de sus tres comprobaciones
estaban en verde, pero su criterio explícito («las 19 definiciones de `page.test.tsx` intactas»)
no se cumplía del todo.

### Resolución (orquestador, misma sesión)

- **Causa confirmada**: `publicRequestFeatureSource()` (`page.test.tsx:58-66`) enumera los
  archivos de producción de tres directorios y los compara con una lista cerrada. El guardián se
  rompe en el slice que crea un archivo nuevo, no en 4.5. Además, el CI del repo corre
  `pnpm test` (`.github/workflows`, paso «pnpm test»), así que un guardián rojo habría
  bloqueado la PR: «conocido en rojo hasta 4.5» no era una opción.
- **Corrección aplicada** (la que `design.md`, *Testing Strategy*, ya clasificaba como
  «Mecánico (1): `:75`», adelantada al slice correcto): `steps.ts` se suma a la lista cerrada de
  `page.test.tsx:78-83` (una línea). La segunda aserción del guardián —ningún archivo importa
  `app-shell`, `useTramita` ni `@/lib/store`— sigue vigente y `steps.ts` la cumple.
- **`tasks.md` reprogramado**: 1.2 incorpora la actualización de la lista para `steps.ts`; 3.4,
  para `wizard.tsx` y `review-summary.tsx`; 4.5 deja de mencionarla.
- **Corrección menor de comentario** en `steps.ts:12`: decía «once campos del papel más la
  firma»; son diez campos del papel más la firma, once en total.
- **Re-verificación**: `pnpm test` → 25/25 archivos, 265/265 tests; `tsc --noEmit` → exit 0;
  `pnpm lint` → limpio. 1.2 queda marcada.

## Work Unit Evidence

| Evidencia | Valor |
|---|---|
| Comando de test focalizado y resultado exacto | `pnpm exec vitest run components/do-fr-100/steps.test.ts` → **1 archivo, 18 tests, todos verdes** |
| Arnés de runtime | N/A — módulo puro sin JSX; nada lo importa todavía en producción (ni `page.tsx` ni ningún componente) |
| Rollback | Revertir `components/do-fr-100/steps.ts` y `components/do-fr-100/steps.test.ts` (ambos sin tracking de git); revertir el checkbox 1.1 en `tasks.md`. Ninguna otra unidad depende de estos dos archivos todavía |

## Tamaño medido — dentro del pronóstico

`git diff --no-index --stat /dev/null <archivo>` (archivos nuevos, sin tracking):

| Archivo | Líneas (todas inserciones) |
|---|---|
| `components/do-fr-100/steps.ts` | 87 |
| `components/do-fr-100/steps.test.ts` | 131 |
| `app/solicitud/creditos-adicionales/page.test.tsx` | +1 (una entrada en la lista cerrada) |
| **Total código** | **219** |

Pronóstico de `tasks.md` para 3a: **180–220 líneas, riesgo Low**. 219 cae dentro del rango
(al límite superior). No aplica `size:exception`.

Aparte, `openspec/changes/formulario-publico-por-pasos/tasks.md` cambió 10 inserciones / 7 borrados
(`git diff --numstat`): las marcas de 1.1 y 1.2 y la reprogramación de la lista cerrada en 1.2,
3.4 y 4.5 — proceso, no código, y no cuenta contra el presupuesto de 400 líneas de revisión.

## Archivos tocados en esta ejecución

| Archivo | Acción |
|---|---|
| `components/do-fr-100/steps.ts` | Creado |
| `components/do-fr-100/steps.test.ts` | Creado |
| `app/solicitud/creditos-adicionales/page.test.tsx` | Modificado por el orquestador (una entrada en la lista cerrada, `:81`) |
| `openspec/changes/formulario-publico-por-pasos/tasks.md` | Modificado (checkboxes 1.1 y 1.2; reprogramación de la lista cerrada en 1.2, 3.4 y 4.5) |
| `openspec/changes/formulario-publico-por-pasos/apply-progress.md` | Creado (este archivo) |

Ningún otro archivo fue leído para escritura ni modificado. No se hizo `git add` ni `git commit`.

## Próximo paso sugerido

1. El responsable del proyecto revisa el diff (`steps.ts`, `steps.test.ts`, la línea de
   `page.test.tsx`, `tasks.md`) y decide si commitea (1.3).
2. Slice 2 (PR-3b, helpers de test sobre la página actual, sin cambio de comportamiento).

---

# Slice 2 — PR-3b: helpers de test nivel-estudiante

> PR boundary de esta ejecución: **Slice 2 = PR-3b (helpers de test, sin cambio de
> comportamiento)**, tareas 2.1 y 2.2 de `tasks.md`. Sin commit (2.3 queda sin marcar a
> propósito: el responsable del proyecto revisa el diff antes de cada commit). Rama
> `feat/formulario-publico-3b-test-helpers`, creada desde `main` en `6693811` (merge de PR #65 =
> Slice 1); no se hizo push ni se abrió PR. Único archivo de producción/test tocado:
> `app/solicitud/creditos-adicionales/page.test.tsx`. `page.tsx`, `sections.tsx`, `steps.ts` y
> `canvas-firma.tsx` no se tocaron.

Modo: **Strict TDD**, régimen de *Approval Testing para refactor* (`strict-tdd.md`, sección
«Approval Testing»): la suite existente son las pruebas de aprobación; el criterio no es
RED→GREEN de comportamiento nuevo, sino verde idéntico antes y después de mover código.

## Tarea 2.1 — Helpers `fillPublicRequestForm(values)` / `submitForm()`

`completeForm()` (sin parámetros, fijo a `completeValues`) se reemplazó por
`fillPublicRequestForm(values: PublicRequestFormValues)`, que itera sobre `values` en vez de la
constante (el tipo viene del contrato en `sections.tsx`, así que un campo mal escrito no compila) y conserva exactamente la misma lógica de firma (mock de `getContext`/`toDataURL` y los
tres eventos de puntero). Se agregó `submitForm()`, que envuelve el único
`fireEvent.click(screen.getByRole('button', { name: 'Enviar solicitud' }))` repetido en el
archivo. Ningún cambio en `page.tsx`, `sections.tsx` ni `canvas-firma.tsx`.

### Mapeo de las 12 «Reescritas» de `design.md` (línea diseño → línea actual → `it(` → resultado)

Líneas de diseño medidas en `9c40acc`; +1 por la línea que Slice 1 sumó en `:81` del arreglo
cerrado del guardián (confirmado leyendo el archivo, no solo por aritmética: las 12
correspondencias de contenido calzan exactas con el +1 uniforme).

| Diseño | Actual | `it(`/`it.each(` | Resultado en esta tarea |
|---|---|---|---|
| `:89` | `:90` | `keeps the official blocks and field labels in form order` | **Sin cambio en esta tarea** — no llama `completeForm()` ni envía; solo renderiza y lee `label`s. Su reescritura real (navegar los 5 pasos para ver todos los bloques) le corresponde a la 4.5, junto con `expectStep`/`continueTo` |
| `:153` | `:154` | `integrates the canvas and keyboard-operable image alternative...` | **Sin cambio en esta tarea** — mismo motivo: solo renderiza, sin fill/submit |
| `:163` | `:164` | `renders the submit control with the design-system button and a 44 px touch target` | **Sin cambio en esta tarea** — solo lee atributos del botón, no lo pulsa |
| `:174` | `:175` | `it.each(...)('blocks submission and marks %s invalid when it is blank after trim'` | Migrada a ambos: `fillPublicRequestForm({ ...completeValues, [field]: '   ' })` + `submitForm()` |
| `:185` | `:186` | `blocks submission when the signature has not been captured` | Migrada **solo a `submitForm()`**; el bucle de relleno se deja igual porque depende de no firmar, y el helper siempre firma — se documentó con un comentario en el test |
| `:197` | `:198` | `it.each(...)('blocks %s over its contract limit'` | Migrada a ambos: `fillPublicRequestForm({ ...completeValues, [field]: overLimitValue })` + `submitForm()` |
| `:216` | `:217` | `sends the unchanged semester and replaces the form with an in-place receipt on 201` | Migrada a ambos |
| `:231` | `:232` | `it.each(...)('keeps entered data and gives the specified message for %s'` | Migrada a ambos |
| `:245` | `:246` | `maps missing and invalid 422 fields separately...` | Migrada a ambos (dos llamadas a `submitForm()`, una por envío) |
| `:272` | `:273` | `shows a form-level error when a 422 names only unknown fields` | Migrada a ambos |
| `:301` | `:302` | `it.each(...)('blocks submission when studentPhone has %s...'` | Migrada a ambos: `fillPublicRequestForm({ ...completeValues, studentPhone: phone })` + `submitForm()` |
| `:340` | `:341` | `sends studentDocument and studentPhone as digit-only strings in the request body` | Migrada a ambos: `fillPublicRequestForm({ ...completeValues, studentDocument: '00.000.010-0', studentPhone: '000 000-0100' })` + `submitForm()` |

**Discrepancia encontrada y cómo se resolvió** (no se adivinó, se reporta): de las 12 líneas que
`design.md` marca como «Reescritas», solo 9 llaman hoy a `completeForm()` y/o al botón de envío
(8 a ambos, 1 solo al envío). Las otras 3 (`:90`, `:154`, `:164` actuales) únicamente renderizan
y leen el DOM — no hay ningún fill/submit que migrar a los dos helpers de esta tarea. Se dejaron
intactas en vez de forzarles una llamada a un helper que no necesitan: `design.md` clasifica «qué
test cambia de texto en algún punto de todo PR-3», no «qué test usa los dos helpers de la
tarea 2.1» — su reescritura (con navegación real entre pasos) llega en la 4.5, junto con
`expectStep`/`continueTo`, que sí requieren que exista el asistente. La tarea 186 tampoco encaja
del todo: usa `submitForm()` pero no `fillPublicRequestForm`, porque su propósito exacto es que la
firma quede sin capturar. Las 12 líneas SÍ se localizaron una a una con exactitud (ninguna quedó
sin mapear); la discrepancia es sobre el TIPO de migración que cada una necesitaba en esta tarea
concreta, no sobre encontrarlas.

## Tarea 2.2 — Verify

| Comando | Resultado antes (baseline) | Resultado después (refactor) |
|---|---|---|
| `pnpm exec vitest run app/solicitud/creditos-adicionales/page.test.tsx` | 1 archivo, **39 tests**, todos verdes | 1 archivo, **39 tests**, todos verdes — mismo conteo |
| `pnpm test` | **25 archivos, 265 tests**, todos verdes | **25 archivos, 265 tests**, todos verdes — mismo conteo |
| `rm -rf .next && pnpm exec tsc --noEmit` | exit 0 | exit 0 |
| `pnpm lint` (pedido aparte, no forma parte de 2.2) | `eslint .` → exit 0, sin salida | `eslint .` → exit 0, sin salida |

Mismo número de archivos de test (25), misma cantidad de tests (265/39) y las mismas 39
definiciones del archivo tocado antes y después: la migración no agregó ni quitó ningún `it`/
`it.each`, solo cambió cómo cada uno llena y envía el formulario.

### TDD Cycle Evidence (Approval Testing — sin RED, refactor puro)

| Tarea | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|---|
| 2.1 | `app/solicitud/creditos-adicionales/page.test.tsx` | Integration (React Testing Library) | ✅ 39/39 antes de tocar el archivo | ➖ N/A — refactor de test sin comportamiento nuevo, régimen de Approval Testing | ✅ 39/39 tras cada tramo de la migración | ➖ N/A — no hay lógica nueva que triangular, es reordenar llamadas existentes | ✅ 39/39 al final; `completeForm()` eliminado sin dejar referencias sueltas (verificado con `grep`) |

## Work Unit Evidence

| Evidencia | Valor |
|---|---|
| Comando de test focalizado y resultado exacto | `pnpm exec vitest run app/solicitud/creditos-adicionales/page.test.tsx` → **1 archivo, 39 tests, todos verdes** (idéntico al baseline) |
| Arnés de runtime | N/A — refactor de test, mismo comportamiento de producción; nada en `page.tsx`/`sections.tsx`/`canvas-firma.tsx` cambió |
| Rollback | `git checkout -- app/solicitud/creditos-adicionales/page.test.tsx` revierte el refactor completo sin afectar Slice 1 (`steps.ts`/`steps.test.ts` no dependen de este archivo); revertir los checkboxes 2.1/2.2 en `tasks.md` |

## Tamaño medido — muy por debajo del pronóstico

`git diff --stat -- app/solicitud/creditos-adicionales/page.test.tsx`:

```
1 file changed, 31 insertions(+), 25 deletions(-)
```

**56 líneas cambiadas** (31 + 25; incluye el tipado del helper con `PublicRequestFormValues` y su
comentario, ajustados por el orquestador en la revisión del diff). Pronóstico de `tasks.md` para 3b: **200–280 líneas, riesgo
Low–Medium**. 56 queda muy por debajo del rango — el archivo ya tenía la mayor parte de la
duplicación concentrada en una sola línea por test (`completeForm()` + un `fireEvent.click`), así
que centralizarla resultó más económico que lo estimado. No aplica `size:exception`; no se
recortó nada (comentarios, tests y aserciones se conservaron íntegros) para llegar a este número.

## Archivos tocados en esta ejecución (Slice 2)

| Archivo | Acción |
|---|---|
| `app/solicitud/creditos-adicionales/page.test.tsx` | Modificado — helpers `fillPublicRequestForm`/`submitForm`, 9 de las 12 «Reescritas» migradas |
| `openspec/changes/formulario-publico-por-pasos/tasks.md` | Modificado (checkboxes 2.1 y 2.2, con la nota de discrepancia de los 9/12) |
| `openspec/changes/formulario-publico-por-pasos/apply-progress.md` | Modificado (esta sección agregada; Slice 1 intacto) |

Ningún otro archivo fue leído para escritura ni modificado. No se hizo `git add` ni `git commit`.

## Próximo paso sugerido (tras Slice 2)

1. El responsable del proyecto revisa el diff (`page.test.tsx`, `tasks.md`,
   `apply-progress.md`) y decide si commitea (2.3).
2. Slice 3 (PR-3c, módulos presentacionales `wizard.tsx` + `review-summary.tsx` sin cablear, y
   extracción de `sections.tsx`).
