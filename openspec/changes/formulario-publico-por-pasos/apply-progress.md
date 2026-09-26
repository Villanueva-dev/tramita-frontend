# Apply Progress: Formulario público DO-FR-100 por pasos

> PR boundary de esta ejecución: **Slice 1 = PR-3a (modelo puro)**, tareas 1.1 y 1.2 de
> `tasks.md`. Sin commit (1.3 queda sin marcar a propósito: el responsable del proyecto revisa
> el diff antes de cada commit). Rama `feat/formulario-publico-3a-steps`, creada desde `main` en
> `5a5f848`; no se hizo push ni se abrió PR.

## Estado global de esta ejecución

| Tarea | Estado | Nota |
|---|---|---|
| 1.1 — `steps.ts` + `steps.test.ts` | **Completa** | RED→GREEN observado, 18/18 tests |
| 1.2 — Verify (3 comandos) | **Completa** | 3/3 en verde tras la corrección del guardián (ver hallazgo y resolución abajo) |
| 1.3 — Commit | **Sin hacer, a propósito** | Prohibido en el alcance de esta ejecución |

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
