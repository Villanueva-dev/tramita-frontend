# Apply Progress: Catálogo de programas en el formulario interno y requisito de anexo en el detalle

> PR boundary de esta ejecución: **PR-B1 completo (Fase 1, tareas 1.1-1.5, y Fase 2, tareas
> 2.1-2.10)**, en la rama `feat/catalogo-programas-formulario-interno` (worktree
> `tramita-frontend-worktrees/catalogo-programas-y-anexo`), sobre la base
> `sdd/catalogo-programas-y-anexo` (`28344a2`, ya sobre `main` `ae4ee11`). Sin commit: 1.6, 2.11
> (compuerta de PR, gate parcial ejecutado aquí), 2.12 (puerta en vivo) y 2.13 (commit + push +
> PR) quedan para el orquestador, con permiso del usuario, como indica el alcance de esta
> ejecución. Cambios en el árbol de trabajo, sin `git commit`.

## Estado global (Fase 0-2)

| Tarea | Estado | Nota |
|---|---|---|
| 0.1-0.3 | **Completa** (evidencia previa del orquestador) | Commit `28344a2`, PR-0 = #78 contra `main` (`ae4ee11`) |
| 1.1 — RED H1 (`lib/use-program-catalog.test.ts`) | **Completa** | ENOENT observado, luego verde |
| 1.2 — GREEN H1 (`lib/use-program-catalog.ts`) | **Completa** | Verde + mutante de frontera confirmado y revertido |
| 1.3 — REFACTOR `page.tsx` (público) | **Completa** | Refactor puro; `page.test.tsx` sin tocar |
| 1.4 — Verify H2 (suite pública + 2 mutantes) | **Completa** | 76/76 sin cambios de aserción; 2 mutantes confirmados y revertidos |
| 1.5 — `pnpm test` + `tsc` | **Completa** | 335/335, `tsc` limpio |
| 1.6 — Commit | **Pendiente** | Del orquestador |
| 2.1 — Andamiaje de prueba (`page.test.tsx` interno) | **Completa** | Mock de `@/lib/api`, `fillRequiredFields`, `waitForProgramCatalogReady` |
| 2.2 — RED/GREEN N1 (Sin programa, orden del catálogo) | **Completa** | RED observado, GREEN observado, mutante confirmado y revertido |
| 2.3 — RED/GREEN N2 (`program` undefined) | **Completa** | RED observado, GREEN observado, mutante confirmado y revertido |
| 2.4 — Caracterización N3 (NFD + doble espacio) | **Completa** | Mutante `.normalize('NFC')` confirmado y revertido (ver nota) |
| 2.5 — RED/GREEN N4 (`loading`/`error`/`[]`) | **Completa** | RED observado, GREEN observado, mutante confirmado y revertido |
| 2.6 — RED/GREEN N5 (Reintentar) | **Completa** | RED observado, GREEN observado, mutante confirmado y revertido |
| 2.7 — Caracterización N6 (400 error general) | **Completa** | Mutante confirmado y revertido |
| 2.8 — RED/GREEN S1 (`program?: string`) | **Completa** | RED de `tsc` observado, GREEN de `tsc` + Vitest, mutante confirmado y revertido |
| 2.9 — Caracterización S2 (cuerpo idéntico) | **Completa** | Mutante corregido (`.normalize('NFC')`) confirmado y revertido — ver hallazgo abajo |
| 2.10 — Borrar `PROGRAMS` | **Completa** | `rg -n '\bPROGRAMS\b' app components lib` → 0 coincidencias |
| 2.11 — Compuerta de PR-B1 | **Parcial** | `pnpm test`, `tsc`, `lint` y medición de tamaño corridos aquí; `pnpm build` diferido al orquestador (instrucción explícita del prompt) |
| 2.12 — Puerta en vivo | **Pendiente** | Del orquestador |
| 2.13 — Commit + push + PR | **Pendiente** | Del orquestador |

Modo: **Strict TDD** (`openspec/config.yaml: strict_tdd: true`, runner `pnpm test` / vitest 4.1.11).

## Fase 1 — Extracción de `useProgramCatalog`

### Safety net (antes de tocar nada)

- `pnpm exec vitest run app/solicitud/creditos-adicionales/page.test.tsx` → **76/76 verde**
  (baseline).
- `pnpm exec vitest run app/requests/new/page.test.tsx lib/store.test.ts` → **16/16 verde**
  (baseline, para la Fase 2).

### Tarea 1.1 — RED H1

Archivo nuevo `lib/use-program-catalog.test.ts` (18 líneas): una sola prueba que lee
`lib/use-program-catalog.ts` con `readFileSync` y afirma que su fuente no coincide con
`/app-shell|useTramita|['"](?:@\/lib\/|\.\/)store['"]/i`.

RED observado:

```
FAIL  lib/use-program-catalog.test.ts > useProgramCatalog boundary > does not import AppShell or the request store
Error: ENOENT: no such file or directory, open 'lib/use-program-catalog.ts'
Test Files  1 failed (1)
     Tests  1 failed (1)
```

### Tarea 1.2 — GREEN H1

Archivo nuevo `lib/use-program-catalog.ts` (61 líneas): `useProgramCatalog()` con el mismo
estado/efecto que tenía la página pública (`loading`/`ready`/`error`, `programs: string[]`,
`ignore` en el cleanup) y `retry` por `useCallback` con un contador, igual patrón que
`lib/use-request-detail.ts:31-34,72`.

GREEN observado: `pnpm exec vitest run lib/use-program-catalog.test.ts` → **1/1 verde**.

**Mutante de frontera** (H1): agregar `import { useTramita } from './store'` al hook → el test
falla exactamente en la aserción del regex (confirmado); revertido. Diff limpio confirmado tras
revertir.

### Tarea 1.3 — REFACTOR `app/solicitud/creditos-adicionales/page.tsx`

Quita la unión `ProgramCatalog` local, los dos `useState` del catálogo, el efecto de carga y
`retryProgramCatalog`; los imports `useEffect` y `listPublicPrograms` quedan sin uso y se
eliminan. Agrega `useProgramCatalog()` y pasa `programCatalog={programCatalog}` directo (el hook
ya devuelve `{ status, programs, retry }`, la forma que `AcademicFields` espera). Sin cambios de
comportamiento. `app/solicitud/creditos-adicionales/page.test.tsx` **no se tocó**.

### Tarea 1.4 — Verify H2

- `pnpm exec vitest run app/solicitud/creditos-adicionales/page.test.tsx` → **76/76 verde**,
  mismas 76 pruebas de la baseline, sin ninguna aserción modificada.
- **Mutante (a)** — quitar `if (!ignore)` de la rama `ready`: falla exactamente
  `it('ignores an older catalog response after StrictMode replays the loading effect')`
  (1 failed | 75 passed); confirmado y revertido.
- **Mutante (b)** — `retry` sin incrementar el contador (`setRequest((current) => current)`):
  falla exactamente
  `it('blocks program selection after a catalog failure and retries without losing entered values')`
  (1 failed | 75 passed); confirmado y revertido.
- Diff de `lib/use-program-catalog.ts` limpio tras ambos mutantes (confirmado con `git diff` —
  vacío porque es archivo nuevo aún no trackeado; el contenido se releyó y coincide con la
  versión sin mutar).

### Tarea 1.5 — Verify de unidad

- `pnpm test` (completo) → **335/335 verde**.
- `rm -rf .next && pnpm exec tsc --noEmit` → limpio, sin salida.

### Tarea 1.6 — Commit

**Pendiente del orquestador.** Archivos de esta unidad: `lib/use-program-catalog.ts`,
`lib/use-program-catalog.test.ts`, `app/solicitud/creditos-adicionales/page.tsx`.

## Fase 2 — Formulario interno sin preselección

### Tarea 2.1 — Andamiaje

En `app/requests/new/page.test.tsx`: `vi.mock('@/lib/api', ...)` parcial (mismo patrón que la
suite pública), `defaultCatalog` con dos nombres (uno con tilde), `beforeEach` que resuelve el
catálogo, `mockReset()` del espía en `afterEach` (además del `vi.clearAllMocks()` ya existente),
`waitForProgramCatalogReady()` y `fillRequiredFields()` (código, cédula, nombre, correo,
semestre, primera asignatura, justificación ≥15 caracteres, casilla de firma). Sin RED propio;
habilita N1-N6.

**Hallazgo no previsto por el diseño**: `fillRequiredFields()` marca la casilla de firma, que
dispara `displayNameFromEmail(coordinatorName)` en el render (`page.tsx:539`). Los mocks nuevos
de `useTramita` no incluían `coordinatorName`, y esa función revienta con `undefined.split` — no
es un defecto de producción, es un mock de prueba incompleto. Se corrigió agregando
`coordinatorName: 'coordinacion@uniremington.edu.co'` (sintético) a los cuatro `mockReturnValue`
que llaman `fillRequiredFields()` (N2, N3, N4, N6). Ninguna prueba original ni N1/N5 lo necesitan
porque no marcan la firma.

### Tarea 2.2 — RED/GREEN N1

RED observado (antes de tocar producción): 8/11 pruebas nuevas en rojo, incluida N1 (selecciona
`PROGRAMS[0]` en vez de «Sin programa» y no consulta el catálogo simulado); las 3 pruebas
originales siguen verdes.

GREEN: `program` arranca en `''`; `useProgramCatalog()` reemplaza `PROGRAMS`; `<option
value="">Sin programa</option>` primero, sin `disabled`; opciones del catálogo en el orden
recibido, `value` igual al nombre; `programCatalogAvailability()` (función pura de módulo) deriva
`loading | available | unavailable` (`[]` cuenta como `unavailable`); `disabled` en el `<select>`
cuando la vista no es `available`, con `aria-describedby="program-catalog-status"` en ese caso.

Comando: `pnpm exec vitest run app/requests/new/page.test.tsx` → tras dos ajustes de la prueba
misma (ver Tarea 2.1 y la nota de `toContain` vs `toBe` de 2.5), **11/11 verde**.

**Mutante**: preseleccionar `useState('Ingeniería de Sistemas')` en vez de `''` → falla N1 y,
en cascada, N2 y las tres de N4 (5 failed | 6 passed, exactamente las que dependen de arrancar
sin selección); confirmado y revertido.

### Tarea 2.3 — RED/GREEN N2

GREEN: `handleSubmit` pasa `program: program || undefined` a `createRequest`.

**Mutante**: quitar `|| undefined` → falla N2 y las tres de N4 (4 failed | 7 passed); confirmado
y revertido.

### Tarea 2.4 — Caracterización N3

Sin cambio de producción adicional: el `<select>` nativo ya conserva el valor byte a byte.

**Mutante** (ajustado — ver Hallazgo más abajo): agregar `.normalize('NFC')` al `onChange` del
`<select>` → falla exactamente N3 (1 failed | 10 passed); confirmado y revertido.

### Tarea 2.5 — RED/GREEN N4

`it.each` sobre `loading`, `error` y `[]`; texto estático `text-xs text-muted-foreground` en
`#program-catalog-status` para las dos vistas no disponibles («Cargando el catálogo de
programas.» / «El catálogo de programas no está disponible. Puede radicar la solicitud sin
programa.»); registro completo sin bloquear el envío.

**Ajuste de la prueba** (no de producción): la primera versión afirmaba
`textContent).toBe(expectedText)`, pero el texto y el botón «Reintentar» comparten el mismo
`id="program-catalog-status"` (igual que en la página pública), así que el `textContent` real
incluye «...programa.Reintentar». Se cambió a `toContain`, igual que ya hace la suite pública en
el caso equivalente (`page.test.tsx` original, caso de error).

**Mutante**: `programCatalogAvailability` trata `ready` siempre como `available` (sin comprobar
`programs.length > 0`) → falla exactamente el caso de lista vacía (1 failed | 10 passed);
confirmado y revertido.

### Tarea 2.6 — RED/GREEN N5

`Button` del proyecto (`type="button"`, `variant="outline"`, `size="sm"`, texto «Reintentar»),
`onClick={programCatalog.retry}`, visible solo en la vista `unavailable`.

**Mutante**: `onClick={() => {}}` → falla exactamente N5 (1 failed | 10 passed); confirmado y
revertido.

### Tarea 2.7 — Caracterización N6

Sin cambio de producción: `errors.form` ya se muestra en el aviso general
(`role="alert"`) y el selector no lleva `aria-invalid`.

**Mutante**: agregar `aria-invalid={Boolean(errors.form)}` al `<select>` → falla exactamente N6
(1 failed | 10 passed); confirmado y revertido.

### Tarea 2.8 — RED/GREEN S1

RED observado, **de `tsc`, no de Vitest**, tal como anticipa `design.md` (Riesgos) y `tasks.md`:

```
$ rm -rf .next && pnpm exec tsc --noEmit
app/requests/new/page.tsx(136,9): error TS2322: Type 'string | undefined' is not assignable to type 'string'.
  Type 'undefined' is not assignable to type 'string'.
lib/store.test.ts(296,66): error TS2322: Type 'undefined' is not assignable to type 'string'.
```

(El primer error es la propia Tarea 2.3, que ya había anticipado el tipo opcional; ambos se
resuelven con el mismo cambio.)

GREEN: `NewRequestInput.program?: string` en `lib/store.tsx`. `tsc --noEmit` → limpio.
`pnpm exec vitest run lib/store.test.ts` → **15/15 verde**.

**Mutante**: `program: input.program ?? ''` en la construcción del cuerpo → falla exactamente S1
(1 failed | 14 passed); confirmado y revertido.

### Tarea 2.9 — Caracterización S2

**Hallazgo — el mutante literal de `tasks.md` no mata la mutación.** La tarea 2.9 pide reusar
«el mismo valor de 2.4» (`'Ingeniería  de Sistemas'.normalize('NFD')`, ya en forma
descompuesta) y mutar con `input.program?.normalize('NFD')`. Verificado empíricamente: aplicar
`.normalize('NFD')` a un valor que **ya está** en NFD es una operación idempotente (por
definición de la normalización Unicode) y el test sigue en verde con el mutante puesto —
sobrevive, no lo mata. Sustituí el mutante por `input.program?.normalize('NFC')` (que sí cambia
los bytes de un valor NFD, recomponiéndolo), y confirmé que **ese** mutante sí falla
exactamente S2 (1 failed | 14 passed). El test y la implementación quedan exactamente como pedía
el diseño; el ajuste fue solo en qué mutante se usa para demostrar la cobertura. Reportado como
desviación, no aplicado silenciosamente.

### Tarea 2.10 — Borrar `PROGRAMS`

`lib/ui-constants.ts:33-39` eliminado (8 líneas). Verificación:
`rg -n '\bPROGRAMS\b' app components lib` → **0 coincidencias**.

### Tarea 2.11 — Compuerta de PR-B1 (parcial, esta ejecución)

| Comando | Resultado observado |
|---|---|
| `pnpm test` | **345/345 verde** (28 archivos) |
| `rm -rf .next && pnpm exec tsc --noEmit` | Limpio, sin salida, exit 0 |
| `pnpm lint` | `eslint .` → **exit 0, sin salida** (contradice la advertencia de `revisar-frontend-next/SKILL.md` de que está roto; coincide con el registro de `config.yaml` del 2026-09-16. Medido en frío ahora, como pide la tarea) |
| `pnpm build` | **Diferido al orquestador**, por instrucción explícita del prompt de esta ejecución («no ejecutar pnpm build; lo corre el orquestador durante la puerta») |
| `git diff --shortstat sdd/catalogo-programas-y-anexo -- . ':!openspec'` | **8 files changed, 319 insertions(+), 52 deletions(-)** → **371 líneas de autoría**, contra el pronóstico de ~263-323 de `tasks.md`/`design.md` (desvío de +15% sobre el extremo alto, dentro del presupuesto de 400) |
| `git status --short` | 6 archivos modificados + 2 nuevos, exactamente el split de la unidad 1 (`lib/use-program-catalog.ts`, `.test.ts`, `page.tsx` público) y la unidad 2 (`app/requests/new/page.tsx`, `.test.tsx`, `lib/store.tsx`, `lib/store.test.ts`, `lib/ui-constants.ts`) |
| `rg -n '\bPROGRAMS\b' app components lib` | 0 coincidencias |

**No se partió en PR-B1a**: 371 < 400, dentro del presupuesto pese al desvío sobre la
estimación puntual.

### Tareas 2.12-2.13

**Pendientes del orquestador**: puerta en vivo en Chrome contra el backend local, `pnpm build`,
commits por unidad (`git add lib/use-program-catalog.ts lib/use-program-catalog.test.ts
app/solicitud/creditos-adicionales/page.tsx` para la unidad 1;
`git add app/requests/new/page.tsx app/requests/new/page.test.tsx lib/store.tsx
lib/store.test.ts lib/ui-constants.ts` para la unidad 2), push y apertura de PR-B1 con
«Relacionado: #74».

## Archivos tocados (sin commit)

| Archivo | Acción | Unidad |
|---|---|---|
| `lib/use-program-catalog.ts` | Nuevo | 1 |
| `lib/use-program-catalog.test.ts` | Nuevo | 1 |
| `app/solicitud/creditos-adicionales/page.tsx` | Modificado | 1 |
| `app/requests/new/page.tsx` | Modificado | 2 |
| `app/requests/new/page.test.tsx` | Modificado | 2 |
| `lib/store.tsx` | Modificado | 2 |
| `lib/store.test.ts` | Modificado | 2 |
| `lib/ui-constants.ts` | Modificado | 2 |
| `openspec/changes/catalogo-programas-y-anexo/tasks.md` | Modificado (checkboxes 1.1-1.5, 2.1-2.10) | docs |
| `openspec/changes/catalogo-programas-y-anexo/apply-progress.md` | Nuevo (este archivo) | docs |

## TDD Cycle Evidence

| Tarea | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|---|
| 1.1-1.2 (H1) | `lib/use-program-catalog.test.ts` | Unit | N/A (archivo nuevo) | ✅ ENOENT observado | ✅ 1/1 | ➖ Única prueba (guarda estructural) | ✅ Mutante de frontera confirmado |
| 1.3-1.4 (H2) | `app/solicitud/creditos-adicionales/page.test.tsx` | Integration | ✅ 76/76 antes | ➖ Sin RED propio (refactor) | ✅ 76/76 después | ➖ N/A | ✅ 2 mutantes confirmados |
| 2.2 (N1) | `app/requests/new/page.test.tsx` | Integration | ✅ 3/3 antes | ✅ Observado | ✅ Observado | ➖ Un solo caso (orden + selección inicial) | ✅ Mutante confirmado |
| 2.3 (N2) | ídem | Integration | ✅ | ✅ Observado | ✅ Observado | ➖ Single | ✅ Mutante confirmado |
| 2.4 (N3) | ídem | Integration | ✅ | ➖ Caracterización | ✅ Ya pasaba | ➖ N/A | ✅ Mutante (corregido) confirmado |
| 2.5 (N4) | ídem | Integration | ✅ | ✅ Observado | ✅ Observado | ✅ 3 casos (`loading`/`error`/`[]`) | ✅ Mutante confirmado |
| 2.6 (N5) | ídem | Integration | ✅ | ✅ Observado | ✅ Observado | ➖ Single | ✅ Mutante confirmado |
| 2.7 (N6) | ídem | Integration | ✅ | ➖ Caracterización | ✅ Ya pasaba | ➖ N/A | ✅ Mutante confirmado |
| 2.8 (S1) | `lib/store.test.ts` | Unit | ✅ 13/13 antes | ✅ `tsc` observado | ✅ `tsc` + Vitest | ➖ Single | ✅ Mutante confirmado |
| 2.9 (S2) | ídem | Unit | ✅ | ➖ Caracterización | ✅ Ya pasaba | ➖ N/A | ✅ Mutante (corregido) confirmado |

### Test Summary

- **Total de pruebas nuevas**: 10 (1 en `use-program-catalog.test.ts`; 8 en
  `app/requests/new/page.test.tsx` — N1, N2, N3, N4×3, N5, N6; 2 en `lib/store.test.ts` — S1, S2).
- **Total de pruebas del repo tras esta unidad**: 345/345 verdes (baseline 335 + 10).
- **Mutantes aplicados y confirmados**: 10 (2 de H2, N1-N6 = 6, S1, S2 = 10 en total, más el de
  frontera H1) — 11 en total, todos confirmados en rojo y revertidos.
- **Capas usadas**: Unit (2 archivos: hook, store), Integration (2: página pública, formulario
  interno).

## Replanteo del 2026-09-26 (orquestador, tras la revisión con el responsable)

- **Retirados** N6 (2.7) y S2 (2.9): caracterizaban comportamiento que el código nuevo no
  condiciona; S2 duplicaba la garantía byte a byte de N3. Pruebas nuevas netas: 8; repo:
  **343/343** verdes; `rm -rf .next && pnpm exec tsc --noEmit` exit 0; `pnpm lint` exit 0.
- **Comentarios recortados** en el hook, su guarda, el formulario interno, `NewRequestInput` y la
  prueba S1: sin números de línea ni punteros a `design.md`/`spec.md`, solo el porqué.
- **Spot check del orquestador**: build exit 0 (tras reemplazar el symlink `node_modules` por una
  instalación propia del worktree); mutante `if (!ignore)` reproducido (rompe solo la prueba de
  StrictMode de la suite pública) y revertido byte a byte. Los otros 10 mutantes quedan con la
  evidencia de esta ejecución.
- **Entrega**: una sola PR con los cuatro commits y `Closes #74`; ver el replanteo al inicio de
  `tasks.md`.
