# Apply Progress: Formulario público DO-FR-100 por pasos

> PR boundary de esta ejecución: **Slice 1 = PR-3a (modelo puro)**, tareas 1.1 y 1.2 de
> `tasks.md`. Sin commit (1.3 queda sin marcar a propósito: el responsable del proyecto revisa
> el diff antes de cada commit). Rama `feat/formulario-publico-3a-steps`, creada desde `main` en
> `5a5f848`; no se hizo push ni se abrió PR.

## Estado global (acumulado, Slices 1–4)

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
| 3.5 — Commit | **Completa** | Dos commits tras el «Procede» del diff: `b6d2418` (3c-i, PR #67, merge `09078d0`) y `7e18017` (3c-ii, PR #68, merge `ff4b6ab`) — corrección: GitHub reescribió el hash de 3c-ii de `b0bb338` a `7e18017` al reencauzar su rama contra el `main` que ya incluía 3c-i; PR-3c-i y PR-3c-ii apiladas a `main` |
| 4.1 — `page.tsx`: estado, navegación, correo | **Completa** | RED→GREEN observado, 50/50 tests en `page.test.tsx`; ver sección Slice 4 abajo |
| 4.2 — Composición con `wizard.tsx`/`review-summary.tsx` | **Completa** | Mismo commit de implementación que 4.1 (un solo `page.tsx` cohesivo, ver nota metodológica en Slice 4) |
| 4.3 — 422/404/413/429 por paso | **Completa** | Cubierto por la misma implementación; escenarios propios verificados |
| 4.4 — Firma sobrevive a Volver/Cambiar | **Completa** | Verificado; `CanvasFirma` no se desmonta |
| 4.5 — Helpers a navegación real | **Completa** | `fillPublicRequestForm`/`submitForm`/`reachReview` repuntados; `{ hidden: true }` no fue necesario (ver Slice 4) |
| 4.6 — Verify (4 comandos + mutantes) | **Completa** | 4/4 en verde; 3/3 mutantes confirmados en rojo y revertidos |
| 4.7 — Puerta en vivo | **Completa** | Corrida el 2026-09-26 en Chrome con el mouse; ver «Puerta en vivo (tarea 4.7)» en Slice 4 |
| 4.8 — Medir tamaño | **Completa** | **607 líneas**, supera el pronóstico (450–550) y el presupuesto de 400 — ver Slice 4 |
| 4.9 — Commit | **Completa** | `1fb9de9` tras el «aprobado» del diff y el `size:exception` (607 líneas) del 2026-09-26; hash registrado en el commit de docs del corte |
| 5.1 — `canvas-firma.tsx`: 200px, guía y botón «Borrar y firmar de nuevo» | **Completa** | RED→GREEN observado, 13/13 tests; ver sección Slice 5 abajo |
| 5.2 — `page.tsx`: 413, encabezado, Ayuda, aviso por paso | **Completa** | RED→GREEN observado, 65/65 tests en `page.test.tsx`; ver sección Slice 5 abajo |
| 5.3 — `sections.tsx`: ejemplos, contador, tamaños | **Completa** | RED→GREEN observado, 60/60 tests en `page.test.tsx` (checkpoint intermedio); ver sección Slice 5 abajo |
| 5.4 — `page.tsx`: acuse destaca `studentEmail` | **Completa** | Mismo RED→GREEN que 5.2 (un solo `page.tsx` cohesivo); ver nota metodológica en Slice 5 |
| 5.5 — `review-summary.tsx`: sin `<img>` sin firma | **Completa** | RED→GREEN observado, 10/10 tests; ver sección Slice 5 abajo |
| 5.6 — Verify (4 comandos + mutantes) | **Completa** | 27 archivos/322 tests verdes; `tsc`, `lint`, `build` en verde; 2/2 mutantes confirmados en rojo y revertidos (`diff` limpio) |
| 5.7 — Puerta en vivo | **Completa** | Corrida el 2026-09-26 en Chrome con el mouse; ver «Puerta en vivo (tarea 5.7)» en Slice 5 |
| 5.8 — Commit | **Completa** | `020429a` tras la puerta en vivo y la corrección de la revisión (389 líneas, dentro del presupuesto); hash registrado en el commit de docs del corte |

> **Estado de entrega vigente (2026-09-26):** la PR #70 se integró a `main` en `55c9ede`.
> El Slice 5 quedó implementado y verificado en esta ejecución (5.1–5.6); 5.7 (puerta en vivo) y
> 5.8 (commit) quedan para el orquestador, como indica el alcance de esta ejecución. Las notas
> posteriores que indican «Sin commit», «no se hizo push» o recomiendan abrir la PR describen el
> estado de cada ejecución histórica; no contradicen este estado acumulado.

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

---

# Slice 4 — PR-3d: cableado (el cambio de comportamiento)

> PR boundary de esta ejecución: **Slice 4 = PR-3d (cableado)**, tareas 4.1–4.6 y la medición de
> 4.8 de `tasks.md`. Sin commit (4.9 queda sin marcar a propósito: el responsable del proyecto
> revisa el diff antes de cada commit). Tarea 4.7 (puerta en vivo) queda para que el orquestador
> la corra con permiso del usuario. Rama `feat/formulario-publico-3d-cableado`, creada desde
> `main` en `ff4b6ab` (merge de PR #68 = Slice 3c-ii); no se hizo push ni se abrió PR. Archivos de
> producción/test tocados: `app/solicitud/creditos-adicionales/page.tsx`,
> `app/solicitud/creditos-adicionales/page.test.tsx`, `components/do-fr-100/sections.tsx` (solo
> la baja de código muerto y la autocontención de `FieldGroupProps`). `steps.ts`, `wizard.tsx`,
> `review-summary.tsx` y `canvas-firma.tsx` no se tocaron.

Modo: **Strict TDD** (`openspec/config.yaml: strict_tdd: true`, runner `pnpm test` / vitest
4.1.11).

## Nota metodológica: un solo RED para 4.1–4.5

Las tareas 4.1 a 4.5 de `tasks.md` están descritas como pasos `RED→GREEN` separados, pero
`page.tsx` es un único archivo cuyo cableado (estado, composición con `wizard.tsx`/
`review-summary.tsx`, manejo de errores del backend y repunte de los helpers de prueba) no se
puede componer parcialmente: no existe un `page.tsx` intermedio que tenga «solo el estado» pero
no la composición, porque sin la composición no hay ningún paso que probar. Por eso el RED
observado es **el archivo de pruebas completo (50 definiciones, cubriendo 4.1–4.5) corrido contra
el `page.tsx` viejo de una sola página**, y el GREEN es el mismo archivo corrido contra el
`page.tsx` nuevo — un único ciclo RED→GREEN que cubre las cinco tareas a la vez, no cinco ciclos
independientes. Esto se ajusta a la razón del propio prompt de esta ejecución (asignar 4.1–4.6 a
una sola unidad de trabajo con una sola puerta de verificación, 4.6) y a la advertencia de
`tasks.md`: «3d es la única unidad sin corte honesto adicional». La tabla de abajo reporta una
fila por tarea para trazabilidad, pero las cinco comparten el mismo RED/GREEN.

**RED observado** (`pnpm exec vitest run app/solicitud/creditos-adicionales/page.test.tsx`, con
el archivo de pruebas nuevo — 50 definiciones — corrido contra el `page.tsx`/`sections.tsx`
viejos, de una sola página):

```
Test Files  1 failed (1)
     Tests  43 failed | 7 passed (50)
```

Los 7 que pasaban ya entonces son los que no dependen de la navegación por pasos (el `h1`, la
guarda de frontera, la franja fija sin casillas, el filtro de dígitos, y las tres pruebas de solo
lectura de `studentDocument`/`studentPhone` que no invocan `continueTo`).

**GREEN observado** (mismo comando, tras escribir `page.tsx`/`sections.tsx` nuevos, con dos
correcciones intermedias — nombres accesibles de «Cambiar», ver «Decisiones» abajo):

```
Test Files  1 passed (1)
     Tests  50 passed (50)
```

### TDD Cycle Evidence

| Tarea | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|---|
| 4.1 | `app/solicitud/creditos-adicionales/page.test.tsx` | Integration (RTL) | ✅ 39/39 antes de tocar el archivo (baseline de la rama) | ✅ Escrito (43/50 en rojo, ver arriba) | ✅ 50/50 en verde | ✅ Múltiples escenarios por comportamiento (Continuar válido/inválido, Volver, correo con y sin arroba/dominio, foco en carga/cambio, Enter implícito) | ➖ No hizo falta — la implementación quedó limpia salvo la corrección de nombres accesibles |
| 4.2 | (mismo archivo, mismo ciclo — ver nota metodológica) | Integration (RTL) | — | ✅ (incluido en el RED de 4.1) | ✅ (incluido en el GREEN de 4.1) | ✅ «Cambiar» + recorrido de pasos siguientes + firma que viaja en el cuerpo | ➖ No hizo falta |
| 4.3 | (mismo archivo, mismo ciclo) | Integration (RTL) | — | ✅ (incluido) | ✅ (incluido) | ✅ 422 con campos propios, 422 sin campos propios, 404, 413 (+ atajo), 429 | ➖ No hizo falta |
| 4.4 | (mismo archivo, mismo ciclo) | Integration (RTL) | — | ✅ (incluido) | ✅ (incluido) | ✅ Firma tras Volver, firma tras Cambiar, firma en el cuerpo enviado | ➖ No hizo falta |
| 4.5 | (mismo archivo, mismo ciclo) | Integration (RTL) | — | ✅ (incluido) | ✅ (incluido) | ➖ N/A — repunte de helpers, no comportamiento nuevo propio | ➖ No hizo falta |

### Test Summary

- **Total tests en el archivo**: 50 (39 antes + 11 nuevas; ninguna borrada sin razón declarada —
  ver «Decisiones» para las 3 renombradas y las reescritas).
- **Total tests pasando**: 50/50.
- **Layers usados**: Integration (React Testing Library) — el mismo layer que ya tenía el
  archivo; no aplica una capa distinta.
- **Approval tests**: Ninguna — Slice 4 es la unidad de comportamiento nuevo, no un refactor.
- **Funciones puras nuevas**: `replaceErrorsOfStep` (`page.tsx`), pura y sin dependencias del
  DOM; `focusFirstInvalid`/`goToStep`/`handleContinue`/`handleBack`/`handleSubmit` son impuras
  por diseño (foco, estado, red — decisión 2/6 de `design.md`, ya adoptada en slices previas).

## Mutantes (tarea 4.6)

Los tres exigidos por el prompt de esta ejecución, cada uno aplicado, verificado en rojo y
revertido antes de continuar (diff idéntico al original confirmado con `diff` tras cada reversión):

| # | Mutante | Resultado | Prueba(s) que lo detecta |
|---|---|---|---|
| 1 | Quitar el `flushSync` que envuelve `setStep`/`setFormError` en `goToStep` | **Rojo**: 3 fallos, 47/50 | `walks the following steps with Continuar after Cambiar…`, `does not move focus on load, then moves it to the new heading…`, `maps missing and invalid 422 fields separately…` |
| 2 | Quitar el despacho por paso del `onSubmit` (dejar que siempre llame a `handleContinue`) | **Rojo**: 8 fallos, 42/50 | Las 8 pruebas que dependen de llegar a `handleSubmit`/`submitPublicRequest`: el envío en 201, los 4 códigos de error, el atajo del 413, el 422/429 combinado, el envío tras «Cambiar», y el envío con dígitos limpiados |
| 3 | Quitar el `flushSync` que aplica los errores antes de `focusFirstInvalid()` en el `handleContinue` fallido | **Rojo**: 1 fallo, 49/50 | `does not advance and focuses the first invalid field when Continuar fails on a step` — exactamente la predicción de `design.md` («el DOM va un render atrás… el foco cae en el encabezado») |

Los tres confirman lo que `design.md` (Testing Strategy) exige. Después de cada mutante se
restauró el archivo desde una copia de respaldo (`diff` sin salida contra el original, confirmado
las tres veces) antes de aplicar el siguiente.

## Verify (tarea 4.6)

| Comando | Resultado observado |
|---|---|
| `pnpm exec vitest run app/solicitud/creditos-adicionales/page.test.tsx` | **1 archivo, 50 tests, todos verdes** |
| `pnpm test` | **27 archivos, 303 tests, todos verdes** (292 base + 11 nuevas en `page.test.tsx`) |
| `pnpm exec vitest run app/requests/new/page.test.tsx` | **1 archivo, 3 tests, todos verdes** — archivo intacto (`git status` no lo lista) |
| `rm -rf .next && pnpm exec tsc --noEmit` | exit 0, sin errores |
| `pnpm lint` | `eslint .` → exit 0, sin salida |
| `pnpm build` | Compilación exitosa; 9 rutas generadas, incluida `/solicitud/creditos-adicionales` como estática |

## Decisiones de implementación (no fijadas del todo por spec/design — para veto del responsable)

1. **Nombre accesible de «Cambiar» usa el `heading` del paso, no el `label` de la barra.**
   `review-summary.tsx` (ya existente, Slice 3) construye `aria-label={`Cambiar ${step.heading}`}`.
   Para el primer paso, `label` es «Sus datos» pero `heading` es «Datos del solicitante»
   (`design.md`, decisión 6: la barra usa el nombre corto, el encabezado el nombre oficial del
   bloque). Escribí una prueba con `'Cambiar Sus datos'` por error y la corregí a
   `'Cambiar Datos del solicitante'` tras verla fallar — no es una decisión nueva de esta unidad,
   sino un acierto de una decisión ya adoptada en Slice 3.
2. **`SignatureFields`, `ReasonFields`, `ApplicantFields` y `AcademicFields` se componen dentro
   de `page.tsx` sin un `CardHeader`/`CardTitle` propio para «Sus datos»/«Datos académicos»**
   (task 4.2 del prompt de esta ejecución: «applicant/academic: a Card with the grid and the
   field group»); el título del bloque lo pone el `<h2>` de `StepPanel` (`wizard.tsx`, ya
   existente), evitando la duplicación que `review-summary.tsx` ya había resuelto para
   `ReasonFields`/`SignatureFields` en la corrección 2 de Slice 3. Consecuencia: «Firma del
   solicitante» y «Motivo de la solicitud» ya no son `[data-slot="card-title"]` (son el `h2` del
   panel); «Compromisos adquiridos» sigue siendo un `CardTitle` real, sin cambios.
3. **La prueba «guards the exact contract controls…» pasó de consultar
   `'input, textarea, select, button'` a `'input, textarea, select'`.** D2 (los cinco pasos
   siempre montados) hace que esa consulta cruda vea los botones de navegación del asistente
   (Continuar, Volver, 4× Cambiar, Limpiar firma) además de los 11 controles del contrato,
   ensanchando la lista de IDs vacíos de 2 a 6 sin que eso diga nada sobre el contrato de datos
   que la prueba vigila. Quité `button` de la consulta: el propósito declarado de la prueba —
   orden correcto, sin campos espurios, una sola `textarea`— queda intacto y ya no es frágil a
   cada botón de navegación que el asistente agregue. La lista de IDs esperada no cambió.
4. **«Ir a la firma» usa el foco por omisión de `goToStep` (encabezado), no un destino
   especial.** Ni `design.md` ni la spec fijan a dónde va el foco tras ese atajo; el encabezado
   de «Firma» es la opción mínima y consistente con el resto de transiciones no derivadas de un
   error de campo (decisión 6: solo el salto de un 422 usa `'firstInvalid'`).
5. **La revalidación defensiva de `handleSubmit` («con errores… sin enviar») no tiene una prueba
   de UI dedicada — gap documentado, no un olvido.** Implementé el código exactamente como
   describe el *Data Flow* de `design.md` (`validate(…)` con errores → `goToStep(firstStepWithError,
   'firstInvalid')`, sin enviar), pero **no encontré una secuencia de interacción legítima** (sin
   manipular el DOM oculto directamente, algo que el propio *Risks* de `design.md` prohíbe) que
   llegue a `handleSubmit` con un campo inválido: cada «Continuar» valida su propio paso antes de
   avanzar, así que el estudiante no puede alcanzar la revisión con un dato inválido a través de
   la interfaz expuesta — es, literalmente, la «defensa» que el propio comentario del código
   nombra. El mecanismo subyacente (`firstStepWithError` + `goToStep(target, 'firstInvalid')`) sí
   queda probado por la prueba del 422. Señalo esto para que el responsable decida si quiere una
   prueba unitaria que llame a la función interna igualmente (hoy no exportada), o si acepta que
   el gap quede así, documentado.
6. **La prueba de «blocks submission…» por campo se renombró a «blocks Continuar…».** El
   comportamiento cambió de verdad (ya no se bloquea al enviar desde una sola página, se bloquea
   al intentar continuar desde el paso del campo), así que el nombre viejo ya no describía lo que
   la prueba hace (regla del proyecto: «el nombre del test es una afirmación»).

## Deviations from Design

Ninguna en `wizard.tsx` ni en `review-summary.tsx`: no fue necesario tocarlos para satisfacer
ningún escenario de la spec. Todo el cableado vive en `page.tsx` y en la poda de código muerto de
`sections.tsx`, tal como delimita el alcance de esta ejecución.

## Work Unit Evidence

| Evidencia | Valor |
|---|---|
| Comando de test focalizado y resultado exacto | `pnpm exec vitest run app/solicitud/creditos-adicionales/page.test.tsx` → **50/50 verdes** |
| Arnés de runtime | Puerta en vivo 4.7, corrida el 2026-09-26 con el mouse en Chrome — ver la sección siguiente |
| Rollback | `git checkout -- app/solicitud/creditos-adicionales/page.tsx app/solicitud/creditos-adicionales/page.test.tsx components/do-fr-100/sections.tsx` revierte el cableado completo sin afectar Slices 1–3 (`steps.ts`, `wizard.tsx`, `review-summary.tsx` no se tocaron); `page.tsx` vuelve a una sola página, exactamente como describe la columna *Rollback boundary* de `tasks.md` para la Unidad 4 |

## Puerta en vivo (tarea 4.7)

Corrida por el orquestador el 2026-09-26 con permiso del usuario, en Chrome contra `next dev`
en `localhost:3000`, ruta `/solicitud/creditos-adicionales`, con datos ficticios (nombre
«Estudiante de Prueba Uno», identificación `1000000001`, correo `prueba.uno@example.com`,
teléfono `3001234567`). La firma se trazó con el mouse (dos arrastres): firmar con el dedo solo
lo puede confirmar el usuario en un celular, y queda como puerta de 5.7. «Enviar solicitud» no se
pulsó: no hay backend levantado y el envío lo cubren las pruebas de 4.3. Cada fila es una lectura
de `document.activeElement`, del DOM o del `ImageData` del canvas, no una inferencia.

| Paso | Acción | Observado |
|---|---|---|
| Carga | Abrir la ruta | `activeElement` = `body`: el foco no se mueve al cargar |
| 1 → 2 | Llenar «Sus datos» y Continuar | Panel «Datos académicos» visible; foco en su `h2` |
| 2 | Continuar con los cinco campos vacíos | No avanza; cinco «Este campo es obligatorio.»; foco en `#program` (primer campo inválido); la barra marca «Datos académicos» en rojo |
| 2 → 3 → 4 | Llenar y Continuar dos veces | Foco en el `h2` de «Motivo de la solicitud» y luego en el de «Firma del solicitante» |
| 4 | Firmar con el mouse | Canvas de 950×198 con 1693 píxeles de tinta (alfa > 0); sin `#signature-error` |
| 4 → 3 | Volver | Foco en el `h2` de «Motivo»; el canvas sigue montado bajo `hidden` con los mismos 1693 píxeles; `#reason` conserva el texto (decisión 7: `hidden` no desmonta) |
| 3 → 4 | Continuar | El trazo se ve otra vez, 1693 píxeles |
| 4 → 5 | Continuar | «Revisar y enviar» con foco en su `h2`; `img[alt="Firma capturada del solicitante"]` con `src` `data:image/png;base64,…` de 950×198; cuatro «Cambiar» y «Enviar solicitud» presentes |
| 5 → 1 → … → 5 | «Cambiar Datos del solicitante», luego Continuar cuatro veces | Paso 1 con los valores conservados y foco en su `h2`; «Cambiar» recorre los pasos siguientes; la tinta sigue en «Firma» (1693) y la revisión vuelve a mostrar la imagen |

Consola del navegador: sin errores propios del cableado. El único mensaje es el aviso «1 issue»
del overlay de `next dev`, un error de React: `An empty string ("") was passed to the src
attribute`. Lo dispara `components/do-fr-100/review-summary.tsx:55` (`<img src={signature.dataUrl}>`),
que D2 monta oculto con `dataUrl: ''` desde la carga; no es del diff de este corte (el archivo es
de Slice 3 y ya vive en `main`), pero solo se manifiesta al cablear. En el DOM el atributo no
llega a emitirse (`getAttribute('src')` devuelve `null`), así que no hay petición de red: es ruido
de desarrollo que tapa avisos reales. Decisión del usuario (2026-09-26): diferirlo a Slice 5 como
tarea 5.5, sin tocar `review-summary.tsx` en 3d (conserva «Deviations from Design: ninguna» y las
607 líneas medidas).

## Tamaño medido (tarea 4.8) — supera el pronóstico y el presupuesto

`git diff --numstat` sobre los tres archivos de código tocados (sin tracking previo de
`openspec/`, que no cuenta contra el presupuesto de revisión):

| Archivo | Inserciones | Borrados | Total |
|---|---|---|---|
| `app/solicitud/creditos-adicionales/page.test.tsx` | 276 | 51 | 327 |
| `app/solicitud/creditos-adicionales/page.tsx` | 177 | 26 | 203 |
| `components/do-fr-100/sections.tsx` | 9 | 68 | 77 |
| **Total código** | **462** | **145** | **607** |

**607 > 400** (presupuesto) y por encima del pronóstico de 450–550 que `tasks.md` ya marcaba
como **Riesgo Alto** y como «la única unidad sin corte honesto adicional» bajo
`stacked-to-main`: partirla dejaría en `main` un paso sin destino o una revisión sin resumen,
un estado que no cumple la spec. Conforme a la instrucción explícita de esta ejecución, **reporto
el número exacto y no divido ni recorto** nada (comentarios, pruebas y aserciones íntegros) para
acercarlo al presupuesto. Los 68 borrados de `sections.tsx` son la baja de `PublicRequestSections`
y su interfaz (código muerto tras la composición en `page.tsx`, instruido explícitamente en el
alcance). El responsable del proyecto concedió el `size:exception` el 2026-09-26, junto con el
«aprobado» del diff, tal como indica la ⚠️ del *Review Workload Forecast* de `tasks.md`.

## Archivos tocados en esta ejecución (Slice 4)

| Archivo | Acción |
|---|---|
| `app/solicitud/creditos-adicionales/page.tsx` | Reescrito — estado `step`, `handleContinue`/`handleBack`/`goToStep`/`focusFirstInvalid`, `<form onSubmit>` con despacho único, rama de correo en `validate`, `FormError` tipado, composición con `wizard.tsx`/`review-summary.tsx`/`sections.tsx` |
| `app/solicitud/creditos-adicionales/page.test.tsx` | Reescrito — helpers `fillField`/`expectStep`/`continueTo`/`signCanvas`/`reachSignatureStep`/`fillPublicRequestForm`/`reachReview`/`reachStepWithOverride`, 50 definiciones (39 base + 11 nuevas; 3 renombradas por cambio de comportamiento) |
| `components/do-fr-100/sections.tsx` | Modificado — baja de `PublicRequestSections`/`PublicRequestSectionsProps` (código muerto); `FieldGroupProps` y `TextField` autocontenidos con tipos propios (`FieldChangeHandler`/`FieldErrors`) |
| `openspec/changes/formulario-publico-por-pasos/tasks.md` | Modificado — checkboxes 4.1–4.9 (4.7 y 4.9 por el orquestador); tarea 5.5 nueva por el hallazgo de la puerta en vivo; corrección del hash `b0bb338` → `7e18017` en 3.5 |
| `openspec/changes/formulario-publico-por-pasos/apply-progress.md` | Modificado — tabla global extendida a Slices 1–4, corrección del mismo hash, esta sección agregada (la puerta en vivo la escribió el orquestador); Slices 1–3 intactas |

Ningún otro archivo fue leído para escritura ni modificado. El agente no hizo `git add` ni
`git commit`; el orquestador commiteó tras el «aprobado» del diff (4.9).
Los tres mutantes se aplicaron y revirtieron sobre `page.tsx` únicamente, con `diff` confirmando
cada reversión exacta antes de continuar.

## Próximo paso sugerido (tras Slice 4)

1. Abrir la PR de 3d contra `main` con el formato de #65–#68 y `Closes #58` (el foco tras un
   error es lo que ese issue pide); registrar el hash del commit en 4.9 y en el documento ODD.
2. Slice 5 (PR-4, pulido visual), que ahora incluye la tarea 5.5 (la `<img>` de la firma no se
   renderiza sin firma) y cuya puerta en vivo 5.7 es la única que puede confirmar la firma con el
   dedo en un celular.

## Slice 5 — PR-4: pulido visual

> PR boundary de esta ejecución: tareas **5.1 a 5.6** de `tasks.md` (implementación y
> verificación completa del pulido visual). 5.7 (puerta en vivo con el dedo) y 5.8 (commit)
> quedan para el orquestador, tal como delimita el alcance de esta ejecución. Rama
> `feat/formulario-publico-4-pulido`, creada desde `origin/main` en `0650548`; sin `git add` ni
> `git commit` de código por parte de este agente.

Modo: **Strict TDD** (`openspec/config.yaml: strict_tdd: true`, runner `pnpm test` / vitest
4.1.11). Base medida antes de empezar: 27 archivos, 303 tests verdes.

### TDD Cycle Evidence

| Tarea | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|---|
| 5.1 | `components/firma/canvas-firma.test.tsx` | Integration (RTL) | ✅ 10/10 antes de tocar el archivo | ✅ Escrito (6/13 en rojo: 3 renombres de «Limpiar firma» + 3 pruebas nuevas) | ✅ 13/13 en verde | ✅ Altura/clase, overlay `aria-hidden`/`pointer-events`, nombre del botón y explicación del deshabilitado — 4 comportamientos distintos, cada uno con su propia aserción | ➖ No hizo falta — la implementación quedó limpia en el primer intento |
| 5.2 | `app/solicitud/creditos-adicionales/page.test.tsx` | Integration (RTL) | ✅ 60/60 antes de tocar el archivo (tras 5.3, ver nota metodológica) | ✅ Escrito (5/65 en rojo: encabezado, Ayuda, aviso por paso ausente/presente, acuse, texto del 413) | ✅ 65/65 en verde | ✅ Aviso por paso con 0 y con 4 errores (ausencia y presencia); Ayuda con `href`/`target`/`rel` | ➖ No hizo falta |
| 5.3 | `app/solicitud/creditos-adicionales/page.test.tsx` | Integration (RTL) | ✅ 50/50 antes de tocar el archivo | ✅ Escrito (11/60 en rojo: 8 ejemplos por campo vía `it.each`, altura del input, contador en 0 y en 31) | ✅ 60/60 en verde | ✅ `it.each` con 8 campos distintos (incluida la rama `reason`, que exige llegar más lejos en el asistente); contador con dos valores distintos (0 y 31) | ➖ No hizo falta |
| 5.4 | (mismo archivo/ciclo que 5.2 — ver nota metodológica) | Integration (RTL) | — | ✅ (incluido en el RED de 5.2) | ✅ (incluido en el GREEN de 5.2) | ➖ Single — un solo escenario (201 con acuse) | ➖ No hizo falta |
| 5.5 | `components/do-fr-100/review-summary.test.tsx` | Unit (RTL) | ✅ 9/9 antes de tocar el archivo | ✅ Escrito (1/10 en rojo, reproduciendo el aviso de React de `src=""`) | ✅ 10/10 en verde | ➖ Single — el caso «con firma» ya existía (prueba previa de Slice 3); este agrega el complementario «sin firma» | ➖ No hizo falta |

### Nota metodológica: orden real de implementación (5.3 antes que 5.2/5.4)

Las tareas se implementaron en el orden 5.1 → 5.5 → wizard (h-13, parte de 5.3/decisión C) →
5.3 → 5.2/5.4, no en el orden numérico de `tasks.md`: `sections.tsx` (5.3) no depende de los
cambios de `page.tsx` (5.2/5.4), así que se adelantó para mantener cada RED acotado a un solo
archivo de producción por vez. Cada fila de la tabla registra el estado del archivo de pruebas
*en el momento de esa tarea*, no el orden de las filas en `tasks.md`. 5.2 y 5.4 comparten un
solo RED→GREEN igual que 4.1–4.5 en el Slice 4: ambas tocan el mismo `page.tsx` en la misma
pasada (encabezado, Ayuda, aviso por paso, texto del 413 y acuse no se pueden separar en un
`page.tsx` intermedio sin dejar un paso a medio construir).

**RED de 5.1** (`pnpm exec vitest run components/firma/canvas-firma.test.tsx`, tras renombrar
las 4 consultas de «Limpiar firma» y agregar 3 pruebas nuevas, contra el `canvas-firma.tsx`
viejo):

```
Test Files  1 failed (1)
     Tests  6 failed | 7 passed (13)
```

**GREEN de 5.1** (mismo comando, tras el nuevo `canvas-firma.tsx`):

```
Test Files  1 passed (1)
     Tests  13 passed (13)
```

Al correr `page.test.tsx` a continuación (antes de tocar `page.tsx`), la consulta restante
`page.test.tsx:252` («Limpiar firma») quedó roja como efecto directo del renombre de 5.1 — es la
quinta consulta que anuncia el prompt de esta ejecución, no una regresión de 5.2/5.3. Se corrigió
de inmediato (evidencia en «Test Summary» abajo).

**RED de 5.5** (`pnpm exec vitest run components/do-fr-100/review-summary.test.tsx`, con la
prueba nueva «no renderiza la imagen sin firma» contra el `review-summary.tsx` viejo):

```
stderr: An empty string ("") was passed to the src attribute...
Tests  1 failed | 9 passed (10)
```

Reproduce exactamente el aviso de React que la puerta en vivo de 4.7 había registrado. **GREEN**
(mismo comando, tras condicionar la imagen a `signature.hayFirma`): `10/10` en verde, sin el
aviso de React.

**RED de 5.3** (`pnpm exec vitest run app/solicitud/creditos-adicionales/page.test.tsx`, con las
11 pruebas nuevas de ejemplos/contador/altura, contra `sections.tsx` viejo):

```
Tests  11 failed | 49 passed (60)
```

**GREEN**: `60/60` tras los ocho `hint` nuevos, el contador de `reason` y `className="h-13"` en
`TextField`.

**RED de 5.2/5.4** (mismo archivo, con las pruebas de encabezado, Ayuda, aviso por paso y acuse,
contra el `page.tsx` viejo — ya con `sections.tsx`/`wizard.tsx` de 5.3):

```
Tests  5 failed | 60 passed (65)
```

Los cinco: encabezado con `Logo`/código, panel de Ayuda, aviso por paso presente con cuatro
campos, acuse con el correo resaltado y el texto exacto del 413. **GREEN**: `65/65` tras el
encabezado, el `<details>` de Ayuda, `StepErrorNotice`, el resaltado del correo y el texto nuevo
del 413.

### Test Summary

- **Total tests nuevos**: 19 (3 en `canvas-firma.test.tsx`, 1 en `review-summary.test.tsx`, 15 en
  `page.test.tsx`: 8 de ejemplos por campo vía `it.each`, 1 de altura de input, 1 de contador, 2
  de encabezado/Ayuda, 2 de aviso por paso, 1 de acuse con correo destacado —más el rename de la
  prueba del botón h-11→h-13 y la corrección de `page.test.tsx:252`, que no suman tests nuevos).
- **Total tests pasando**: 322/322 (`pnpm test`, 303 base + 19 nuevas).
- **Layers usados**: Integration (RTL) en `page.test.tsx` y `canvas-firma.test.tsx`; Unit (RTL,
  sin mocks de red) en `review-summary.test.tsx` — mismas capas que ya tenían esos archivos.
- **Approval tests**: Ninguna — Slice 5 es comportamiento/presentación nueva, no un refactor de
  comportamiento existente.
- **Funciones puras nuevas**: `fieldLabel` (`page.tsx`) — resuelve el rótulo de un `FormField`,
  incluida la excepción de `signature` que `FIELD_LABELS` no cubre.

### Mutantes (tarea 5.6)

Los dos exigidos por el prompt de esta ejecución, cada uno aplicado, verificado en rojo y
revertido antes de continuar (`diff` sin salida contra una copia de respaldo tras cada
reversión):

| # | Mutante | Resultado | Prueba(s) que lo detecta |
|---|---|---|---|
| 1 | Restaurar `src={signature.dataUrl}` sin condicionar a `signature.hayFirma` en `review-summary.tsx` | **Rojo**: 1 fallo, 9/10 | `does not render the signature image when there is no signature yet` |
| 2 | Volver el texto del 413 a «Límpiela y fírmela de nuevo.» en `page.tsx` | **Rojo**: 1 fallo, 0/1 (corrida focalizada por nombre) | `gives the exact 413 wording pointing to redo the signature, replacing the retired "Límpiela" phrasing` |

Ambos confirman que las pruebas nuevas realmente cubren el comportamiento que describen, no un
verde falso.

### Verify (tarea 5.6)

| Comando | Resultado observado |
|---|---|
| `pnpm exec vitest run components/firma/canvas-firma.test.tsx components/do-fr-100/review-summary.test.tsx app/solicitud/creditos-adicionales/page.test.tsx` | **3 archivos, 88 tests, todos verdes** |
| `pnpm test` | **27 archivos, 322 tests, todos verdes** (303 base + 19 nuevas) |
| `pnpm exec vitest run app/requests/new/page.test.tsx` | **1 archivo, 3 tests, todos verdes** — archivo intacto |
| `pnpm exec vitest run app/solicitud/creditos-adicionales/page.test.tsx -t "guards the complete public-request boundary"` | **1/1 verde** — la guarda de frontera (`app-shell\|useTramita\|@/lib/store`) sigue en pie: `Logo` se importa desde `@/components/brand`, fuera de los directorios que la prueba escanea |
| `pnpm exec tsc --noEmit` | exit 0, sin errores. **Sin `rm -rf .next`**: el prompt de esta ejecución prohíbe limpiarlo con el `next dev` vivo; se corrió `tsc` directo, como indica esa misma instrucción |
| `pnpm lint` | `eslint .` → exit 0, sin salida |
| `pnpm build` | Compilación exitosa; 9 rutas generadas, incluida `/solicitud/creditos-adicionales` como estática — corrido dos veces (antes y después de revertir los mutantes), mismo resultado |

## Decisiones de implementación (Slice 5)

Los ocho puntos A–H del prompt de esta ejecución se implementaron tal como se decidieron, sin
desviación:

- **A (región viva)**: `StepErrorNotice` (`page.tsx`, nueva) es un `<p>` sin `role` ni
  `aria-live`, derivado de `errorsOfStep(errors, step)`; se renderiza como primer hijo de cada
  `StepPanel` con campos propios (no en «Revisar y enviar», donde `errorsOfStep` siempre da
  `{}`). Los `role="alert"` de campo (`sections.tsx`) no se tocaron.
- **B (ejemplos)**: ocho `hint` nuevos vía la prop existente de `TextField`/`ReasonFields`
  (nunca `placeholder`), con datos sintéticos que no reproducen un nombre real, un número de
  documento con estructura colombiana válida ni el dominio institucional. Los dos hints
  existentes (`studentDocument`, `studentPhone`) no se tocaron. El contador de `reason` deriva de
  `values.reason.length` contra `PUBLIC_REQUEST_FIELD_LIMITS.reason`, sin `role`/`aria-live`.
- **C (tamaños)**: `text-[17px]` en los dos `<main>` de `page.tsx` (formulario y acuse), nunca en
  `html`. `h-13` (52px) en: los `Input` de `TextField` (`sections.tsx`, único punto de cambio,
  sin tocar `components/ui/input.tsx`), los dos botones de `StepNavigation` (`wizard.tsx` — la
  única razón por la que se tocó ese archivo en este corte) y el botón «Borrar y firmar de
  nuevo» (`canvas-firma.tsx`). El `Textarea` de `reason` no se tocó: su `min-h-20` (80px) ya
  supera el piso de 52px, y reducirlo perdería espacio de escritura sin que el prompt lo pidiera
  explícitamente («mínimo», no un valor fijo). La prueba de `h-11`→`h-13` en el botón de envío
  (`page.test.tsx`) es el mismo patrón de excepción ya documentado en el archivo (comentario
  «jsdom no calcula layout»); esta ejecución no inventa una excepción nueva a la regla del
  proyecto contra aserciones por clase CSS, la extiende al mismo tipo de control (objetivo
  táctil) con el mismo comentario justificativo.
- **D (encabezado y Ayuda)**: `Logo` (sin `variant`, tamaño por omisión) + `<span>` con «Formato
  DO-FR-100», solo en la vista del formulario (no en el acuse — ver «para veto» abajo). El panel
  de Ayuda usa `<details>`/`<summary>` nativos, sin estado, con el WhatsApp como texto y como
  `<a href="https://wa.me/573152966601" target="_blank" rel="noopener noreferrer">`.
- **E (413)**: texto exacto «La firma es demasiado pesada. Bórrela y fírmela de nuevo.»; el
  botón «Ir a la firma» no se tocó.
- **F (firma)**: `CANVAS_HEIGHT` 200, `h-50`; guía (`<div>` con borde punteado) y texto superpuestos
  con `style={{ pointerEvents: 'none' }}` y `aria-hidden="true"`, fuera del canvas (no dibujados,
  así que no entran en `toDataURL` ni los borra `clearRect`); botón «Borrar y firmar de nuevo»
  con el `Button` del proyecto, `variant="outline"`, `h-13`, mismo `disabled` que antes, con
  `aria-describedby` apuntando a un `<p>` visible «Se habilita cuando haya una firma.» — visible
  siempre, no solo cuando está deshabilitado (más simple, sin estado nuevo).
- **G (acuse)**: mantuve la redacción «La Coordinación responderá al correo que diligenció:
  **{email}**.» en vez del ejemplo literal del prompt («responderá a {email}»), para no tocar
  la aserción existente `screen.getByText(/coordinación responderá al correo/i)` — se extendió
  con una aserción nueva sobre el `<strong>`, en vez de reemplazar la existente. **Para veto**:
  si el responsable prefiere la redacción literal del prompt, es un cambio de una línea.
- **H (`review-summary.tsx`)**: `signature.hayFirma ? <img .../> : null`, con la prueba RED
  «does not render the signature image when there is no signature yet» reproduciendo primero el
  aviso de React documentado en la puerta en vivo de 4.7. **Si esto cierra el hallazgo**: sí —
  la condición elimina exactamente la rama que emitía `src=""`; no queda ningún otro `<img>` sin
  condicionar en el árbol de revisión.

**Para veto del responsable** (decisiones no fijadas del todo por el prompt, tomadas para
avanzar):

1. El encabezado (`Logo` + «Formato DO-FR-100») y el panel de Ayuda se agregaron solo a la vista
   del formulario, no a la del acuse (`submitted === true`). El prompt describe «Header of the
   public page» sin distinguir las dos vistas; opté por el alcance mínimo porque la Ayuda
   (contactar a la Coordinación) tiene menos sentido después de haber enviado, y porque no hay
   ningún criterio de aceptación ni prueba que exija el encabezado en el acuse. Extenderlo es un
   cambio pequeño y aislado si se prefiere lo contrario.
2. La redacción del acuse (punto G arriba): mantuve «correo que diligenció: **email**» en vez de
   la redacción literal del prompt.
3. El texto de ejemplo de `reason` («Presentar los trabajos pendientes antes de finalizar el
   semestre.») es una redacción propia dentro de la pauta «un compromiso genérico de una línea»;
   no cita ningún compromiso real de un caso observado.

## Deviations from Design

Ninguna en `steps.ts`, `lib/api.ts`, `lib/types.ts`, `lib/public-request-limits.ts`,
`app/requests/**` ni el contrato del backend — no se tocaron, tal como delimita el alcance de
esta ejecución. `wizard.tsx` se tocó (dos clases `h-11`→`h-13`), algo que el propio prompt
anticipa y autoriza explícitamente («wizard.tsx only if the navigation buttons live there — if
so, that is an allowed minimal edit, note it under Deviations»).

## Work Unit Evidence

| Evidencia | Valor |
|---|---|
| Comando de test focalizado y resultado exacto | `pnpm exec vitest run components/firma/canvas-firma.test.tsx components/do-fr-100/review-summary.test.tsx app/solicitud/creditos-adicionales/page.test.tsx` → **88/88 verdes** |
| Arnés de runtime | Pendiente — tarea 5.7 (firmar con el dedo en el recuadro de 200px con la guía), a cargo del orquestador con permiso del usuario |
| Rollback | `git checkout -- app/solicitud/creditos-adicionales/page.tsx app/solicitud/creditos-adicionales/page.test.tsx components/do-fr-100/sections.tsx components/do-fr-100/wizard.tsx components/do-fr-100/review-summary.tsx components/do-fr-100/review-summary.test.tsx components/firma/canvas-firma.tsx components/firma/canvas-firma.test.tsx` revierte el pulido completo sin afectar los Slices 1–4 (`steps.ts` no se tocó) |

## Correcciones de la revisión (Slice 5, orquestador)

### 1 — La letra de 17 px no llegaba a los controles, y estaba en px

Al medir en vivo, `label`, `input`, `textarea` y hints seguían en `text-sm` (14 px con la raíz por
omisión): `Input`, `Label` y `Textarea` (`components/ui/*`) fijan ese tamaño, así que el
`text-[17px]` del `<main>` (decisión 8) solo alcanzaba al `h2` del paso. Dos consecuencias: la
«letra de 17 px» de la propuesta no se cumplía donde el estudiante lee y escribe, y un input menor
de 16 px provoca el zoom automático de iOS al enfocarlo. Además, el Chrome del usuario tiene la
raíz en 18 px por preferencia del navegador (`globals.css` no fija `font-size`), lo que mostró que
un valor en px ignora esa preferencia.

Corrección, con RED→GREEN: `READING_TEXT_SIZE = 'text-[1.0625rem]'` en `sections.tsx`, aplicado a
`Label` e `Input` de `TextField` y a `Label` y `Textarea` de `ReasonFields` (puntos de uso, sin
tocar las primitivas que comparte la app interna), y el mismo valor en los dos `<main>` de
`page.tsx` en lugar de `text-[17px]`. `1.0625rem` son 17 px con la raíz por omisión (16 px) y
escala con la preferencia del navegador. Los hints, el aviso por paso y el resumen de Ayuda
conservan `text-sm` como texto secundario. Prueba nueva en `page.test.tsx`: «renders labels,
inputs and the textarea at the 17 px reading size, in rem so the browser font preference still
scales it».

| Paso | Comando | Resultado observado |
|---|---|---|
| RED | `pnpm exec vitest run app/solicitud/creditos-adicionales/page.test.tsx` con la prueba nueva contra el código del agente | `1 failed \| 65 passed (66)` — `expected 'min-h-screen bg-background px-4 py-8 …' to contain 'text-[1.0625rem]'` |
| GREEN | `pnpm exec vitest run components/firma/canvas-firma.test.tsx components/do-fr-100/review-summary.test.tsx app/solicitud/creditos-adicionales/page.test.tsx` | 3 archivos, **89/89** |
| Verify | `pnpm test` · `pnpm exec tsc --noEmit` · `pnpm lint` · `pnpm build` | **27 archivos, 323/323** · sin errores · `eslint .` sin salida · 9 rutas, `/solicitud/creditos-adicionales` estática |

Decisión 8 de `design.md` («17 px en el `<main>`») queda enmendada en el commit de docs del corte.

## Puerta en vivo (tarea 5.7)

Corrida por el orquestador el 2026-09-26 en Chrome contra `next dev` (`localhost:3000`), sobre el
código ya corregido, con los mismos datos ficticios de la puerta 4.7. La firma se trazó con el
mouse: firmar con el dedo solo lo puede confirmar el usuario en un celular. «Enviar solicitud» no se
pulsó (sin backend); el acuse y el texto del 413 quedan cubiertos por las pruebas. Cada fila es una
lectura del DOM, de `getComputedStyle` o del `ImageData` del canvas.

| Qué | Observado |
|---|---|
| Encabezado y Ayuda | `Logo` cargado (1280×640 natural); «Formato DO-FR-100»; `<details>` con `summary` «Ayuda» y el enlace `wa.me` con `target="_blank"` |
| Tamaños (raíz del navegador: 18 px) | `label`, `input`, `textarea` y `<main>` a 19,125 px = 1,0625 rem; hint 15,75 px = `text-sm`; altura de input y botones 58 px = 3,25 rem (`h-13`) |
| Consola al cargar | Solo DevTools y HMR: el aviso «An empty string ("") was passed to the src attribute» ya no aparece; un solo `<img>` en el DOM (el logo) |
| Continuar con el paso 1 vacío | Aviso «Faltan 4 campos por corregir en este paso: …» con los cuatro rótulos, sin `role` ni `aria-live`; foco en `#studentName`; cuatro `role="alert"` de campo |
| Pasos 1→2→3 | Al llenar y continuar, el aviso desaparece; contador «0 de 2000 caracteres» → «31 de 2000 caracteres» al escribir; `aria-describedby` del textarea = `reason-hint reason-counter` |
| Paso «Firma» | Foco en el `h2`; canvas con `height="200"` (buffer 300×200 mientras estaba oculto, 950×247 al hacerse visible, 864×225 CSS); guía y texto con `pointer-events: none` y `aria-hidden`; «Borrar y firmar de nuevo» con `data-slot="button"`, 58 px, `disabled`, descrito por «Se habilita cuando haya una firma.» |
| Firmar atravesando la guía | Dos arrastres, uno sobre el texto y otro cruzando la línea: 2194 píxeles de tinta; el overlay no bloqueó el trazo; el botón de borrar se habilitó |
| Borrar y firmar de nuevo | 0 píxeles de tinta tras el clic; nuevo trazo de 1779 píxeles |
| Revisión | Foco en el `h2`; `img[alt="Firma capturada del solicitante"]` con `data:image/png` de 950×247 que muestra solo el trazo, sin guía ni texto (están fuera del canvas por construcción) |

## Tamaño medido (Slice 5)

`git diff --numstat -- . ':!openspec' ':!odd'` sobre los archivos de código tocados en esta
ejecución (excluye `docs/contexto-institucional.md`, modificado por otro proceso antes de que
empezara esta ejecución — ver «Environment cautions» del prompt):

| Archivo | Inserciones | Borrados | Total |
|---|---|---|---|
| `app/solicitud/creditos-adicionales/page.test.tsx` | 108 | 4 | 112 |
| `app/solicitud/creditos-adicionales/page.tsx` | 64 | 11 | 75 |
| `components/firma/canvas-firma.tsx` | 49 | 15 | 64 |
| `components/firma/canvas-firma.test.tsx` | 37 | 4 | 41 |
| `components/do-fr-100/sections.tsx` | 21 | 7 | 28 |
| `components/do-fr-100/review-summary.tsx` | 10 | 8 | 18 |
| `components/do-fr-100/review-summary.test.tsx` | 11 | 0 | 11 |
| `components/do-fr-100/wizard.tsx` | 2 | 2 | 4 |
| **Total código (Slice 5)** | **302** | **51** | **353** |

**353 ≤ 400** (presupuesto): dentro del pronóstico de 300–400 de `tasks.md` para PR-4. No se
pidió `size:exception`.

**Tras la corrección de la revisión** (`git diff --numstat -- . ':!openspec' ':!odd' ':!docs'`):
`page.test.tsx` 129/4, `sections.tsx` 33/10, el resto sin cambio → **335 inserciones, 54 borrados,
389 líneas**, dentro del presupuesto de 400 y del pronóstico de 300–400. Sin `size:exception`.

## Archivos tocados en esta ejecución (Slice 5)

| Archivo | Acción |
|---|---|
| `components/firma/canvas-firma.tsx` | Modificado — `CANVAS_HEIGHT` 200, `h-50`, overlay de guía y texto, botón «Borrar y firmar de nuevo» vía `Button` con explicación del deshabilitado |
| `components/firma/canvas-firma.test.tsx` | Modificado — 4 consultas renombradas, 3 pruebas nuevas |
| `components/do-fr-100/sections.tsx` | Modificado — 8 `hint` nuevos, contador de `reason`, `h-13` en `TextField` |
| `components/do-fr-100/wizard.tsx` | Modificado — `h-11`→`h-13` en los dos botones de `StepNavigation` |
| `components/do-fr-100/review-summary.tsx` | Modificado — `<img>` condicionada a `signature.hayFirma` |
| `components/do-fr-100/review-summary.test.tsx` | Modificado — 1 prueba nueva |
| `app/solicitud/creditos-adicionales/page.tsx` | Modificado — `StepErrorNotice`, encabezado con `Logo`, panel Ayuda, texto del 413, acuse con correo destacado |
| `app/solicitud/creditos-adicionales/page.test.tsx` | Modificado — 15 pruebas nuevas, 1 renombrada (`h-11`→`h-13`), 1 corregida (`page.test.tsx:252`) |
| `openspec/changes/formulario-publico-por-pasos/tasks.md` | Modificado — checkboxes 5.1–5.6 |
| `openspec/changes/formulario-publico-por-pasos/apply-progress.md` | Modificado — tabla global extendida a Slice 5, esta sección agregada |

Ningún otro archivo fue leído para escritura ni modificado. El agente no hizo `git add` ni
`git commit`. Los dos mutantes se aplicaron y revirtieron sobre `review-summary.tsx` y
`page.tsx` respectivamente, con `diff` confirmando cada reversión exacta antes de continuar.

## Próximo paso sugerido (tras Slice 5)

1. Abrir la PR-4 contra `main` con el formato de #65–#70 y `Closes #27` (el botón de borrar ya
   usa el `Button` del proyecto, mide 52 px y explica su `disabled`); registrar el hash del commit
   en 5.8 y en el documento ODD, y enmendar la decisión 8 y la pregunta abierta de `design.md`.
2. Tras el merge de PR-4: 6.1 (grep dirigido de piezas descartadas) y 6.2 (archivar el cambio
   `formulario-publico-por-pasos`). Firmar con el dedo en un celular sigue pendiente de que el
   usuario lo confirme.
