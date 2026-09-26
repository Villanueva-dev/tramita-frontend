# Apply Progress: Formulario público DO-FR-100 por pasos

> PR boundary de esta ejecución: **Slice 1 = PR-3a (modelo puro)**, tareas 1.1 y 1.2 de
> `tasks.md`. Sin commit (1.3 queda sin marcar a propósito: el responsable del proyecto revisa
> el diff antes de cada commit). Rama `feat/formulario-publico-3a-steps`, creada desde `main` en
> `5a5f848`; no se hizo push ni se abrió PR.

## Estado global (acumulado, Slices 1–3)

| Tarea | Estado | Nota |
|---|---|---|
| 1.1 — `steps.ts` + `steps.test.ts` | **Completa** | RED→GREEN observado, 18/18 tests |
| 1.2 — Verify (3 comandos) | **Completa** | 3/3 en verde tras la corrección del guardián (ver hallazgo y resolución abajo) |
| 1.3 — Commit | **Completa** | `c6e3bf2` tras el «Aprobado» del diff; PR #65 mergeado en `main` (`6693811`) |
| 2.1 — Helpers `fillPublicRequestForm`/`submitForm` | **Completa** | Refactor puro, mismas aserciones; ver sección Slice 2 abajo |
| 2.2 — Verify (3 comandos + lint extra) | **Completa** | 5/5 en verde (incluye `pnpm lint`, fuera del alcance formal de 2.2) |
| 2.3 — Commit | **Completa** | `4165b63` tras el «Aprobado» del diff; PR #66 mergeado en `main` (`bd1b69d`) |
| 3.1 — `wizard.tsx` + test (`StepPanel`/`StepProgress`/`StepNavigation`) | **Completa** | RED→GREEN observado, 16/16 tests; ver sección Slice 3 abajo |
| 3.2 — `review-summary.tsx` + test | **Completa** | RED→GREEN observado, 10/10 tests |
| 3.3 — REFACTOR `sections.tsx` | **Completa** | Approval testing: `innerHTML` idéntico antes/después, `page.test.tsx` 39/39 sin tocarlo (salvo la línea del guardián) |
| 3.4 — Verify (4 comandos) | **Completa** | 4/4 en verde; medición de tamaño supera 400 líneas — ver hallazgo abajo |
| 3.5 — Commit | **Completa** | Dos commits tras el «Procede» del diff: `b6d2418` (3c-i) y `b0bb338` (3c-ii); PR-3c-i y PR-3c-ii apiladas a `main` |

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

---

# Slice 3 — PR-3c: módulos presentacionales sin cablear

> PR boundary de esta ejecución: **Slice 3 = PR-3c (módulos presentacionales, sin cablear)**,
> tareas 3.1 a 3.4 de `tasks.md`. Sin commit (3.5 queda sin marcar a propósito: el responsable
> del proyecto revisa el diff antes de cada commit). Rama
> `feat/formulario-publico-3c-presentacionales`, creada desde `main` en `bd1b69d` (merge de
> PR #66 = Slice 2); no se hizo push ni se abrió PR. **La medición de tamaño, tras las
> correcciones de la revisión del orquestador (ver «Correcciones de la revisión» abajo), es de
> 646 líneas** y supera el presupuesto de 400 — ver «Tamaño medido» para los dos cortes
> candidatos que `tasks.md` ya preveía (3c-i/3c-ii). `page.tsx`, `steps.ts`, `canvas-firma.tsx` y
> `design.md` no se tocaron.

Modo: **Strict TDD** para 3.1 y 3.2 (comportamiento nuevo); **Approval Testing para refactor**
(`strict-tdd.md`, sección «Approval Testing») para 3.3.

## Tarea 3.1 — `wizard.tsx`: `StepPanel`, `StepProgress`, `StepNavigation`

Archivos nuevos: `components/do-fr-100/wizard.tsx` (100 líneas), `components/do-fr-100/wizard.test.tsx`
(150 líneas, 16 pruebas). Sin *safety net* — archivo nuevo, nadie lo importa todavía en
producción.

**RED observado** (`pnpm exec vitest run components/do-fr-100/wizard.test.tsx`, antes de crear
`wizard.tsx`):

```
Error: Failed to resolve import "./wizard" from "components/do-fr-100/wizard.test.tsx".
Test Files  1 failed (1)
     Tests  no tests
```

**GREEN observado** (mismo comando, tras crear `wizard.tsx`; una segunda corrida corrigió dos
aserciones que usaban matchers de `@testing-library/jest-dom` — paquete **no instalado** en este
repo, ver «Hallazgo» abajo):

```
Test Files  1 passed (1)
     Tests  16 passed (16)
```

### TDD Cycle Evidence

| Tarea | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|---|
| 3.1 | `components/do-fr-100/wizard.test.tsx` | Integration (RTL) | N/A (archivo nuevo) | ✅ Escrito | ✅ 16/16 en verde | ✅ `StepPanel` con 3 pasos distintos (`applicant`/`reason`/`signature`) y refs activas/inactivas; `StepProgress` con paso activo y errores variados; `StepNavigation` con los 4 pasos y `isSubmitting` en ambos valores | ➖ No hizo falta — la implementación quedó limpia en el primer intento |

### Hallazgo: `@testing-library/jest-dom` no está instalado en este repo

Escribí las primeras aserciones con `toBeInTheDocument()`, `toHaveAttribute()` y `toBeDisabled()`
(matchers de jest-dom) porque son el idioma habitual de Testing Library. Fallaron con
`Invalid Chai property`: revisé `package.json` y `node_modules/@testing-library/` — el paquete
`@testing-library/jest-dom` no está instalado, y ningún test existente en el repo lo usa (grep
sobre `*.test.tsx` sin coincidencias). La convención real de esta suite es Chai/Vitest puro:
`toBeDefined()`, `toBeNull()`, `.getAttribute(...)`, `.disabled` como propiedad del DOM
(confirmado en `page.test.tsx:130-172`, líneas ya existentes antes de esta ejecución). Reescribí
las 6 aserciones afectadas con ese idioma en vez de agregar la dependencia — instalar un paquete
nuevo no estaba autorizado en el alcance de esta unidad y no hacía falta.

## Tarea 3.2 — `review-summary.tsx`: `ReviewSummary`

Archivos nuevos: `components/do-fr-100/review-summary.tsx` (97 líneas),
`components/do-fr-100/review-summary.test.tsx` (114 líneas, 10 pruebas). Sin *safety net* —
archivo nuevo.

**RED observado** (`pnpm exec vitest run components/do-fr-100/review-summary.test.tsx`, antes de
crear `review-summary.tsx`):

```
Error: Failed to resolve import "./review-summary" from "components/do-fr-100/review-summary.test.tsx".
Test Files  1 failed (1)
     Tests  no tests
```

**GREEN observado** (mismo comando, tras crear `review-summary.tsx`):

```
Test Files  1 passed (1)
     Tests  10 passed (10)
```

### TDD Cycle Evidence

| Tarea | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|---|
| 3.2 | `components/do-fr-100/review-summary.test.tsx` | Integration (RTL) | N/A (archivo nuevo) | ✅ Escrito | ✅ 10/10 en verde | ✅ 4 bloques distintos (`applicant`/`academic`/`reason`/`signature`), un segundo conjunto de valores para descartar texto fijo, y `it.each` de los 4 botones «Cambiar» con su `onEdit(stepId)` | ➖ No hizo falta — agregué el `eslint-disable` de `<img>` después (ver «Decisiones»), sin tocar la lógica |

### Decisiones de implementación (no fijadas del todo por spec/design — para veto del responsable)

> Las decisiones 1 y 3 de esta lista fueron **revertidas por la revisión del orquestador** — ver
> «Correcciones de la revisión» al final de esta sección de Slice 3. Se dejan tal como se
> escribieron entonces (registro histórico de por qué se decidieron así en el momento) en vez de
> reescribirlas.

1. ~~**Duplicación deliberada de los rótulos de campo.**~~ `review-summary.tsx` define su propio mapa
   `FIELD_LABELS` con los mismos diez textos que `sections.tsx` (`TextField`, la etiqueta de
   «Compromisos adquiridos»), en vez de importarlos. El alcance de esta ejecución fija que 3.2
   solo toca `review-summary.tsx` y 3.3 solo toca `sections.tsx` — como unidades separables, no
   hay un archivo neutral hoy desde el que ambas puedan importar una fuente común sin violar esa
   frontera. Costo: si un rótulo cambia en `sections.tsx`, hay que actualizarlo también aquí.
   **[Revertida — ver «Correcciones de la revisión», punto 1.]**
2. **La nota de la fecha de radicación se repite.** La franja fija («Lugar y fecha», extraída en
   3.3) seguirá mostrando «La fecha de radicación se registra al enviar la solicitud» en todos
   los pasos, incluida la revisión (design.md, decisión 7 de estructura). El prompt de esta
   ejecución pidió esa misma nota explícitamente dentro de `ReviewSummary`, así que aparece dos
   veces en el paso de revisión cuando Slice 4 cablee todo junto. No inventé una alternativa
   (por ejemplo, omitirla aquí y confiar en la franja) porque el texto exacto viene del prompt,
   no de mi criterio; señalo la duplicación para que el responsable decida si la note es
   redundante o intencional antes de Slice 4.
   **[Resuelta por el responsable el 2026-09-26: la nota va solo en la franja fija. Se quitó el
   `<p>` de `ReviewSummary` y su prueba (el módulo queda en 9 pruebas); la propuesta y el
   documento ODD («Ajustados») quedaron enmendados en la misma PR.]**
3. ~~**Asimetría entre grupos de campos**~~ (ver también la nota de la tarea 3.3): `ApplicantFields`
   y `AcademicFields` no tienen tarjeta propia (hoy comparten una sola tarjeta «Datos del
   solicitante»), mientras que `ReasonFields` y `SignatureFields` sí incluyen su propia tarjeta
   completa. Elegí esto para que la extracción de 3.3 produjera una salida idéntica byte a byte
   a la de hoy (verificado, ver Tarea 3.3); la consecuencia es que Slice 4 tendrá que decidir qué
   encabezado envuelve a `ApplicantFields`/`AcademicFields` cuando cada uno pase a ser su propio
   paso del asistente — no es un problema de esta unidad, pero condiciona la siguiente.
   **[Revertida — ver «Correcciones de la revisión», punto 2: ahora los cuatro grupos son
   simétricos, ninguno tiene tarjeta propia.]**
4. **Alt de la firma e `eslint-disable` del `<img>`.** Usé `<img>` en vez de `next/image` para
   la vista previa de la firma porque es un `data:` URL generado en el navegador (sin recurso que
   optimizar); agregué un comentario y `eslint-disable-next-line @next/next/no-img-element`
   justificándolo. `pnpm lint` quedó en 0 problemas tras el cambio (antes: 1 warning).

## Tarea 3.3 — REFACTOR `sections.tsx`

*Safety net* (antes de tocar el archivo): `pnpm exec vitest run app/solicitud/creditos-adicionales/page.test.tsx`
→ **1 archivo, 39 tests, todos verdes** (tras la actualización previa de la lista cerrada del
guardián, ver «Tarea 3.4»).

**Prueba de aprobación temporal** (no se commitea, borrada al terminar la tarea): un archivo
`components/do-fr-100/__approval.test.tsx` renderizó `PublicRequestSections` con valores y un
error sintéticos y volcó `container.innerHTML` a un archivo fuera del repo
(`/tmp/.../scratchpad/sections-approval-{before,after}.html`). `diff` entre la captura de antes y
la de después de extraer `PublicRequestFixedStrip`, `ApplicantFields`, `AcademicFields`,
`ReasonFields` y `SignatureFields` dio **cero diferencias** (`diff` sin salida). El archivo de
prueba temporal se borró (`rm components/do-fr-100/__approval.test.tsx`) antes de terminar la
tarea; no quedó en el árbol de trabajo.

Extracción realizada en esta tarea (todas exportadas, `TextField` se conserva sin exportar):

- `PublicRequestFixedStrip()` — las dos tarjetas sin campos («Lugar y fecha», «Tipo de
  solicitud»).
- `ApplicantFields({ values, onChange, errors })` — los cuatro campos de `FIELD_STEP.applicant`,
  sin tarjeta propia (ver decisión 3 de la Tarea 3.2).
- `AcademicFields({ values, onChange, errors })` — los cinco campos de `FIELD_STEP.academic`, sin
  tarjeta propia.
- `ReasonFields({ values, onChange, errors })` — las dos tarjetas del paso «Motivo de la
  solicitud» (la descriptiva y la del campo «Compromisos adquiridos»).
- `SignatureFields({ signatureCapture, error })` — la tarjeta «Firma del solicitante» completa.
- `PublicRequestSections` compone los cinco en el mismo orden de hoy, dentro del mismo `<form>`.

> **La forma de `ReasonFields`/`SignatureFields` descrita arriba cambió en la revisión del
> orquestador** (ver «Correcciones de la revisión», punto 2, al final de la sección de Slice 3):
> ahora son solo campo + error, sin tarjeta propia; `PublicRequestSections` pasó a poner
> directamente las tarjetas «Motivo de la solicitud», «Compromisos adquiridos» y «Firma del
> solicitante» que antes vivían dentro de estos dos grupos. La salida seguía siendo idéntica tras
> el cambio (verificado de nuevo, ver la misma sección).

### TDD Cycle Evidence (Approval Testing — sin RED, refactor puro)

| Tarea | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|---|
| 3.3 | `app/solicitud/creditos-adicionales/page.test.tsx` (existente) + aprobación temporal | Integration (RTL) | ✅ 39/39 antes de tocar el archivo | ➖ N/A — refactor sin comportamiento nuevo, régimen de Approval Testing | ✅ 39/39 tras la extracción + `innerHTML` idéntico antes/después | ➖ N/A — no hay lógica nueva que triangular, es reagrupar JSX existente | ✅ 39/39 al final; `TextField` sigue interno, sin referencias sueltas |

## Tarea 3.4 — Verify

| Comando | Resultado observado |
|---|---|
| `pnpm exec vitest run components/do-fr-100/` | **3 archivos, 44 tests, todos verdes** (18 de `steps.test.ts` + 16 de `wizard.test.tsx` + 10 de `review-summary.test.tsx`) |
| `pnpm test` | **27 archivos, 291 tests, todos verdes** (265 base + 16 + 10) |
| `rm -rf .next && pnpm exec tsc --noEmit` | exit 0, sin errores (dos corridas: antes y después del `eslint-disable`) |
| `pnpm lint` (extra, no forma parte formal de 3.4) | 0 problemas tras el `eslint-disable` justificado (antes: 1 warning de `@next/next/no-img-element`) |

### Hallazgo (igual que en 1.2): la lista cerrada de `page.test.tsx` vuelve a romperse

Como anticipaba el propio `apply-progress.md` de Slice 1, crear `wizard.tsx` y
`review-summary.tsx` rompió de nuevo `page.test.tsx:87-92` (la lista cerrada de archivos de
producción). Apliqué la misma corrección que en 1.2 — la única edición autorizada en ese archivo
en esta ejecución —: agregar `'components/do-fr-100/review-summary.tsx'` y
`'components/do-fr-100/wizard.tsx'` a la lista, en orden alfabético
(`review-summary` < `sections` < `steps` < `wizard`). Diff: `+2/-0` (git detectó la edición como
dos inserciones puras, sin líneas removidas). La segunda aserción del guardián (ningún archivo
importa `app-shell`/`useTramita`/`@/lib/store`) sigue vigente en los dos archivos nuevos.

## Work Unit Evidence

| Evidencia | Unidad 3.1 (`wizard.tsx`) | Unidad 3.2 (`review-summary.tsx`) | Unidad 3.3 (`sections.tsx`) |
|---|---|---|---|
| Comando de test focalizado y resultado exacto | `pnpm exec vitest run components/do-fr-100/wizard.test.tsx` → **18/18 verdes** (16 originales + 2 de la corrección de revisión, punto 3) | `pnpm exec vitest run components/do-fr-100/review-summary.test.tsx` → **10/10 verdes** | `pnpm exec vitest run app/solicitud/creditos-adicionales/page.test.tsx` → **39/39 verdes** (mismo conteo antes y después) |
| Arnés de runtime | N/A — módulo presentacional puro, nadie lo importa aún en producción | N/A — igual que `wizard.tsx` | N/A — refactor sin cambio de comportamiento; nada en `page.tsx` cambió |
| Rollback | Revertir `wizard.tsx`/`wizard.test.tsx` (sin tracking de git); ninguna otra unidad depende de ellos todavía | Revertir `review-summary.tsx`/`review-summary.test.tsx` (sin tracking); tampoco tiene dependientes | `git checkout -- components/do-fr-100/sections.tsx` revierte el refactor completo sin afectar Slices 1–2 ni 3.1/3.2 |

Rollback compartido: revertir la línea `+2` de `page.test.tsx` (`git diff` la aísla) y los
checkboxes 3.1–3.4 en `tasks.md`.

## Tamaño medido — supera el presupuesto de 400, división recomendada

> Tabla **refrescada tras las correcciones de la revisión** (ver «Correcciones de la revisión»
> abajo). La primera medición de esta tarea había dado 621 líneas; quedó superada por este mismo
> refresco y no se conserva aparte, porque las cuatro correcciones tocaron los mismos archivos
> que ya medía esa tabla.

| Archivo | Líneas | Cómo se midió |
|---|---|---|
| `components/do-fr-100/wizard.tsx` | 108 | `wc -l` (archivo nuevo, todo inserción) |
| `components/do-fr-100/wizard.test.tsx` | 173 | `wc -l` (archivo nuevo, todo inserción) |
| `components/do-fr-100/review-summary.tsx` | 74 | `wc -l` (archivo nuevo, todo inserción) |
| `components/do-fr-100/review-summary.test.tsx` | 108 | `wc -l` (archivo nuevo, todo inserción) |
| `components/do-fr-100/sections.tsx` | 181 (138 inserciones + 43 borrados) | `git diff --numstat` |
| `app/solicitud/creditos-adicionales/page.test.tsx` (línea del guardián) | 2 (2 inserciones + 0 borrados) | `git diff --numstat` |
| **Total Slice 3** | **646** | Suma de las filas anteriores |

**646 > 400** — supera el presupuesto, tal como anticipaba el forecast de `tasks.md` («3c es la
segunda candidata a exceder»); la revisión del orquestador movió el total (621 → 655 → 646): las
correcciones 1 y 2 movieron código entre `sections.tsx`/`review-summary.tsx`, la corrección 3
sumó 8 líneas netas a `wizard.tsx`/`wizard.test.tsx` (marca visible + 2 pruebas) y la decisión
del responsable sobre la nota de la fecha de radicación quitó 9 líneas de `review-summary.tsx` y
su prueba. Cortes candidatos, ambos dentro de presupuesto:

- **3c-i (`wizard.tsx`)**: 108 + 173 + 1 (su entrada en la lista del guardián) = **282 líneas**.
- **3c-ii (`review-summary.tsx` + `sections.tsx`)**: 74 + 108 + 181 + 1 (su entrada en la lista
  del guardián) = **364 líneas**.

282 + 364 = 646, cuadra con el total medido. Ninguno de los dos cortes cambia el comportamiento
de la pieza que mueve (ni `wizard.tsx` ni `review-summary.tsx` están cableados a `page.tsx`
todavía; `sections.tsx` produce salida idéntica, reverificado con la prueba de aprobación tras
las correcciones — ver abajo). No recorté nada (comentarios, tests y aserciones íntegros) para
acercarme al presupuesto. Dejo la decisión de partir el commit en dos PRs (3c-i, luego 3c-ii
apilado sobre 3c-i según `stacked-to-main`) al responsable del proyecto, que revisa el diff antes
de cada commit.

## Correcciones de la revisión

El orquestador revisó el diff de Slice 3 contra el checklist del proyecto
(`revisar-frontend-next/SKILL.md`) y `design.md` decisión 1, y pidió cuatro correcciones antes de
continuar. Mismos límites que la ejecución original: sin commit, sin push, sin PR; sin tocar
`page.tsx`, `steps.ts`, `canvas-firma.tsx` ni `design.md`. La nota de la fecha de radicación
duplicada en `ReviewSummary` (decisión 2 de la Tarea 3.2) queda **sin tocar**, tal como pidió el
orquestador — el responsable del proyecto sigue decidiendo si se queda.

### 1 — Fuente única de los rótulos de campo (DRY)

`sections.tsx` ahora exporta `FIELD_LABELS: Record<keyof PublicRequestFormValues, string>`
(los mismos diez textos de antes) y los nueve `TextField` más el `<Label>` de «Compromisos
adquiridos» lo consumen (`label={FIELD_LABELS.studentName}`, etc., en vez de la cadena literal).
`review-summary.tsx` borró su copia local y el comentario que la justificaba, e importa
`FIELD_LABELS` de `./sections` junto con el tipo `PublicRequestFormValues`. La razón de
«separabilidad» que había usado para justificar la duplicación no se sostiene: 3.2 y 3.3
pertenecen al mismo corte candidato 3c-ii (ver «Tamaño medido»), así que importar entre ellos no
cruza ninguna frontera de PR.

### 2 — Grupos de campos simétricos (design.md, decisión 1)

`ReasonFields` y `SignatureFields` dejaron de incluir su propia `Card`: ahora `ReasonFields`
renderiza solo `<Label>` + `<Textarea>` + error, y `SignatureFields` solo el `<figure>` con el
`signatureCapture` inyectado + `figcaption` + error — igual de "solo campos" que
`ApplicantFields`/`AcademicFields`. `PublicRequestSections` pasó a poner directamente las
tarjetas «Motivo de la solicitud» (con su `CardDescription`), «Compromisos adquiridos»
(conteniendo `<ReasonFields/>`) y «Firma del solicitante» (con su `CardDescription`, conteniendo
`<SignatureFields/>`) — la misma estructura de tarjetas que existía antes, solo que ahora
`PublicRequestSections` las declara en vez de que cada grupo cargue con la suya. Motivo
registrado: en Slice 4, `StepPanel` (`wizard.tsx`) ya pone el encabezado `<h2>` de cada paso; un
grupo con su propia `Card`+`CardTitle` habría impreso el título del paso dos veces.

**Reverificación de salida idéntica**: repetí la prueba de aprobación temporal
(`components/do-fr-100/__approval.test.tsx`, mismos valores sintéticos y el mismo error que la
corrida original de la Tarea 3.3), comparé el `innerHTML` resultante contra
`sections-approval-before.html` (la captura original, previa a toda la Tarea 3.3) — **`diff` sin
salida, idéntico**. El archivo de prueba se volvió a borrar al terminar.

### 3 — Marca visible de error en `StepProgress` (spec, escenario del 422)

**RED observado** (`pnpm exec vitest run components/do-fr-100/wizard.test.tsx`, tras agregar dos
pruebas nuevas que leen el atributo `data-error` — que todavía no existía):

```
AssertionError: expected [] to have a length of 2 but got +0
AssertionError: expected null to be 'true' // Object.is equality
Test Files  1 failed (1)
     Tests  2 failed | 16 passed (18)
```

**GREEN observado** (mismo comando, tras el cambio en `wizard.tsx`):

```
Test Files  1 passed (1)
     Tests  18 passed (18)
```

Implementación: cada `<li>` de `StepProgress` ahora lleva `data-error="true"` cuando su paso
tiene error (antes solo existía el `<span className="sr-only">` con « (con errores)», invisible
para quien ve la pantalla) y la clase de color pasa a `text-destructive` cuando hay error —
pisando al color del paso activo en vez de combinarse, para que la marca sea igual de visible
esté o no ese paso activo, sin perder el `font-semibold` que distingue al paso activo. Sigue sin
haber ningún elemento interactivo (mismas 2 aserciones de la prueba original, sin tocar).

**Por qué la prueba no asevera la clase `text-destructive` directamente**: `strict-tdd.md`
prohíbe aserciones sobre nombres de clase CSS («Implementation Detail Coupling Rule» — una
aserción de test debe sobrevivir un refactor visual). Las dos pruebas nuevas comprueban
`data-error="true"/ausente` (un atributo semántico que agregué a propósito para poder probarlo),
no la clase; la clase satisface el requisito de "visible para un usuario vidente" sin ser lo que
el test verifica.

### TDD Cycle Evidence (corrección 3)

| Tarea | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|---|
| 3.1 (corrección) | `components/do-fr-100/wizard.test.tsx` | Integration (RTL) | ✅ 16/16 antes de agregar las pruebas nuevas | ✅ Escrito (2 pruebas nuevas, ambas en rojo) | ✅ 18/18 en verde | ➖ N/A — la marca es booleana, dos pruebas (marcado/no marcado + activo con error) cubren las combinaciones relevantes | ➖ No hizo falta refactor adicional |

### 4 — Sin `as` que oculte la forma real (checklist «TypeScript»)

`review-summary.tsx`: `REVIEW_BLOCK_STEPS` pasó de `STEPS.filter(...) as ReadonlyArray<{...}>` a
un type guard: `STEPS.filter((step): step is (typeof STEPS)[number] & { id: FieldStepId } =>
step.id !== 'review')`. El compilador ahora deriva `step.id: FieldStepId` de la propia condición
del filtro, en vez de confiar en una aserción que no puede fallar en tiempo de compilación si
`STEPS` cambiara de forma. El `Object.keys(FIELD_STEP) as (keyof PublicRequestFormValues |
'signature')[]` de `fieldsOfStep` se dejó igual — es el idioma estándar para tipar
`Object.keys()`, que TypeScript no infiere solo, y la corrección lo permitía explícitamente.

### Verify tras las cuatro correcciones

| Comando | Resultado observado |
|---|---|
| `pnpm exec vitest run components/do-fr-100/` | **3 archivos, 46 tests, todos verdes** (18 `steps.test.ts` + 18 `wizard.test.tsx` + 10 `review-summary.test.tsx`) |
| `pnpm test` | **27 archivos, 293 tests, todos verdes** (291 previos + 2 nuevas de la corrección 3) |
| `rm -rf .next && pnpm exec tsc --noEmit` | exit 0, sin errores |
| `pnpm lint` | 0 problemas |

También reverifiqué, antes de las cuatro correcciones, que `app/solicitud/creditos-adicionales/page.test.tsx`
seguía en **39/39** tras los cambios de `sections.tsx` (corrección 2) — no se tocó ese archivo
salvo por la línea del guardián, ya presente desde la Tarea 3.4 original.

## Archivos tocados en esta ejecución (Slice 3)

| Archivo | Acción |
|---|---|
| `components/do-fr-100/wizard.tsx` | Creado; corregido después (marca visible de error, corrección 3) |
| `components/do-fr-100/wizard.test.tsx` | Creado; corregido después (2 pruebas nuevas, corrección 3) |
| `components/do-fr-100/review-summary.tsx` | Creado; corregido después (importa `FIELD_LABELS`, type guard sin `as`; correcciones 1 y 4) |
| `components/do-fr-100/review-summary.test.tsx` | Creado (sin cambios en la corrección) |
| `components/do-fr-100/sections.tsx` | Modificado — extracción de 5 componentes presentacionales, cero cambio de salida; corregido después (`FIELD_LABELS` exportado, `ReasonFields`/`SignatureFields` sin tarjeta propia; correcciones 1 y 2), salida verificada idéntica otra vez |
| `app/solicitud/creditos-adicionales/page.test.tsx` | Modificado — una entrada por archivo nuevo en la lista cerrada del guardián (única edición autorizada; sin cambios en la corrección) |
| `openspec/changes/formulario-publico-por-pasos/tasks.md` | Modificado (checkboxes 3.1–3.4; nota de medición refrescada a 646 líneas tras la corrección) |
| `openspec/changes/formulario-publico-por-pasos/apply-progress.md` | Modificado (sección de Slice 3 agregada y luego corregida con la subsección «Correcciones de la revisión»; Slices 1–2 intactos) |

Archivo temporal creado y borrado **dos veces** dentro de esta misma ejecución (no queda en el
árbol de trabajo): `components/do-fr-100/__approval.test.tsx` — una vez para la Tarea 3.3
original, otra para reverificar la salida idéntica tras las correcciones 1 y 2. Ningún otro
archivo fue leído para escritura ni modificado. No se hizo `git add` ni `git commit`.

## Próximo paso sugerido (tras Slice 3 y sus correcciones)

1. El responsable del proyecto revisa el diff completo de Slice 3 (incluidas las cuatro
   correcciones) y decide si lo parte en 3c-i/3c-ii antes de abrir PR, o si acepta un
   `size:exception` para un solo PR de 646 líneas.
2. Con cualquiera de las dos rutas, commitea (3.5) y continúa con Slice 4 (PR-3d, el cableado:
   estado, navegación, envío, foco y errores por paso — el único cambio de comportamiento de todo
   el cambio).
