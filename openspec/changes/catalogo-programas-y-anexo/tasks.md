# Tareas: Catálogo de programas en el formulario interno y requisito de anexo en el detalle

> Solo lo accionable. La prosa de fondo — intención, alcance, decisiones tomadas, alternativas y
> riesgos — vive en `proposal.md` y `design.md`; aquí se cita por id o por línea. Esta fase no
> tiene shell: ninguna cifra de líneas de abajo es una medición de diff, son las estimaciones de
> `design.md` §Entrega, con su suma re-verificada aquí. `sdd-apply` mide con `git diff --numstat`
> / `--shortstat` en cada compuerta de PR y sustituye la estimación por el número real.
>
> Convención de zsh: las rutas con corchetes (`app/requests/[id]/...`) se citan entre comillas
> simples en cualquier comando, porque zsh las expande como glob si no.

## Review Workload Forecast

| Archivo | PR-0 | PR-B1 | PR-B2 |
|---|---|---|---|
| `openspec/changes/catalogo-programas-y-anexo/**` | doc | — | — |
| `lib/use-program-catalog.ts` | — | 38-45 | — |
| `lib/use-program-catalog.test.ts` | — | 15-20 | — |
| `app/solicitud/creditos-adicionales/page.tsx` | — | 35-40 | — |
| `app/requests/new/page.tsx` | — | 45-55 | — |
| `app/requests/new/page.test.tsx` | — | 100-125 | — |
| `lib/ui-constants.ts` | — | 8 | — |
| `lib/store.tsx` | — | 2 | 5-7 |
| `lib/store.test.ts` | — | 20-28 | 55-65 |
| `lib/types.ts` | — | — | 10-14 |
| `components/annex-requirement-notice.tsx` | — | — | 25-30 |
| `app/requests/[id]/page.tsx` | — | — | 8-10 |
| `app/requests/[id]/page.test.tsx` | — | — | 45-55 |
| **Subtotal** | doc | **~263-323** | **~148-181** |
| **Total del cambio** | | | **~415-500** |

```text
Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High
```

- **Por qué `High` y no `Medium`**, aunque cada PR ya cae bajo el presupuesto tras el corte: el
  total sin cortar (~415-500) supera las 400 líneas incluso en su extremo bajo, y el precedente
  más reciente de una estimación comparable (`odd/tasks/validaciones-basicas-creditos.md`, VAL-2:
  selector + efecto + pruebas del formulario público) fue estimado en 150-220 líneas por la mañana
  y **midió 365** al entregarse — un desvío de +65 a +140 %. Aplicar ese mismo desvío al extremo
  alto de PR-B1 (323) lo llevaría por encima de 400. Por eso el corte es obligatorio y la tarea
  2.11 vuelve a medir antes de abrir el PR, con la contingencia de partir el commit 1 en su propio
  PR-B1a si la medición real lo exige (igual que preveía `design.md` §6).
- `sdd-apply` MUST medir cada PR con `git diff --shortstat` antes de abrirlo (tareas 2.11 y 4.9) y
  reportar el número exacto, no la estimación, en el cuerpo del PR.

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|---|---|---|---|---|---|
| 0 | Paquete de OpenSpec (esta carpeta) | PR-0 | `git diff --stat -- openspec/changes/catalogo-programas-y-anexo/` (confirma que no toca código) | N/A — solo documentación | Revertir el commit retira únicamente `openspec/changes/catalogo-programas-y-anexo/**` |
| 1 | Extraer `useProgramCatalog` sin cambiar el comportamiento público | PR-B1 (commit 1) | `pnpm exec vitest run lib/use-program-catalog.test.ts app/solicitud/creditos-adicionales/page.test.tsx` | N/A — refactor puro; lo prueba la suite pública en verde sin tocar sus aserciones | Revertir `lib/use-program-catalog.ts`, `.test.ts` y el cambio en `app/solicitud/creditos-adicionales/page.tsx` restaura el efecto en línea, mismo comportamiento |
| 2 | Formulario interno: catálogo, «Sin programa», omisión de la clave | PR-B1 (commit 2) | `pnpm exec vitest run app/requests/new/page.test.tsx lib/store.test.ts` | Chrome contra el backend local con la 009: abrir `/requests/new`, registrar sin y con programa, simular catálogo caído | Revertir `app/requests/new/page.tsx`, la parte de `lib/store.tsx` (`NewRequestInput.program?`) y `lib/ui-constants.ts` restaura `PROGRAMS` y la preselección; el hook de la unidad 1 sigue intacto |
| 3 | Tipos y mapeo de `annexRequirement` en el store | PR-B2 (commit 3) | `pnpm exec vitest run lib/store.test.ts` | N/A — solo capa de datos; sin consumidor visible todavía | Revertir `lib/types.ts` y la parte de `lib/store.tsx`/`lib/store.test.ts` de esta unidad; nada lo consume aún, cero efecto visible |
| 4 | Aviso de anexo en el detalle | PR-B2 (commit 4) | `pnpm test -- 'app/requests/[id]/page.test.tsx'` | Chrome contra el backend local con la 009: abrir el detalle de una solicitud con anexo, confirmar el aviso, registrar una transición y confirmar que sigue | Revertir `components/annex-requirement-notice.tsx` y el render condicional en `app/requests/[id]/page.tsx`; el campo sigue llegando del backend pero el cliente vuelve a ignorarlo |

Diagrama de cadena (`stacked-to-main`, ramas cortadas de `main` en cada paso):

```
main ← PR-0  (docs, rama sdd/catalogo-programas-y-anexo) ← merge
main ← PR-B1 (unidades 1+2, rama feat/catalogo-programas-formulario-interno) ← merge
main ← PR-B2 (unidades 3+4, rama feat/catalogo-programas-anexo-detalle, Closes #74) ← merge
```

## Fase 0 — PR-0: paquete de OpenSpec

- [ ] 0.1 Confirmar que `openspec/changes/catalogo-programas-y-anexo/` contiene, con las
      decisiones ya cerradas por `design.md` (P1, P2 y T2-T5 heredadas de `proposal.md`; hook vs.
      efecto repetido resuelto por la decisión 1 de `design.md`): `exploration.md`,
      `proposal.md`, `specs/workflow-requests/spec.md` (delta), `design.md` y este `tasks.md`. No
      se toca ningún archivo de código.
- [ ] 0.2 Commit, solo con rutas explícitas bajo `openspec/changes/catalogo-programas-y-anexo/`
      (convención del repo, "Commits por rutas explícitas"):
      `git add openspec/changes/catalogo-programas-y-anexo/` y
      `git commit -m "docs(openspec): añade catálogo de programas y anexo (propuesta, spec, diseño y tareas)"`.
      Verificación: `git diff --stat -- openspec/changes/catalogo-programas-y-anexo/` antes del
      commit — confirma que la lista de archivos tocados es exactamente la de 0.1, sin nada de
      `app/`, `lib/` ni `components/`.
- [ ] 0.3 Push de la rama `sdd/catalogo-programas-y-anexo` y apertura de PR contra `main`, cuerpo
      con «Relacionado: #74» (no `Closes`, porque este PR no cierra el issue). Base: `main`
      (`ae4ee11` al momento de escribir esto; `sdd-apply` confirma el `main` vigente antes de
      abrir).

## Fase 1 — PR-B1, commit 1: extracción de `useProgramCatalog`

**Objetivo**: mover el efecto de carga del catálogo, hoy en línea en la página pública
(`app/solicitud/creditos-adicionales/page.tsx:186-213`), a `lib/use-program-catalog.ts`, sin
cambiar comportamiento observable. Decisión 1 de `design.md`.

- [ ] 1.1 RED — H1. Crear `lib/use-program-catalog.test.ts` con una sola prueba: lee el fuente de
      `lib/use-program-catalog.ts` como texto (`fs.readFileSync`, ruta relativa al propio test) y
      afirma que **no** coincide con la expresión
      `/app-shell|useTramita|['"](?:@\/lib\/|\.\/)store['"]/i` (la del guardián público,
      `page.test.tsx:324`, más la forma relativa `./store`, natural dentro de `lib/`).
      Comando: `pnpm exec vitest run lib/use-program-catalog.test.ts`.
      Fallo esperado: `ENOENT` — `lib/use-program-catalog.ts` no existe todavía.
      Líneas estimadas: ~15-20 (todo el archivo de test).
- [ ] 1.2 GREEN — H1. Crear `lib/use-program-catalog.ts` con `'use client'`, importando solo
      `react` y `./api`. Tipo `ProgramCatalogState` (`loading | ready | error`, con `programs:
      string[]`), `export type ProgramCatalog = ProgramCatalogState & { retry: () => void }`,
      `export function useProgramCatalog(): ProgramCatalog`. Cuerpo: estado inicial `{ status:
      'loading', programs: [] }`; efecto con dependencia en un contador `request` —
      `setState(loading)` → `listPublicPrograms()` → `ready` con los nombres en el orden recibido,
      o `error`; `let ignore = false` y `return () => { ignore = true }` en el cleanup, copiado sin
      cambios de `page.tsx:192-209`; `retry = useCallback(() => setRequest((n) => n + 1), [])`,
      igual que `lib/use-request-detail.ts:31-34,72`. Comentario JSDoc sobre el tipo exportado
      documentando que es la forma que ya espera `AcademicFields`
      (`components/do-fr-100/sections.tsx:170-176`) y que el hook tiene dos consumidores (la
      página pública y el formulario interno) desde la decisión 1 de `design.md` — es la "tarea de
      documentación" de este commit.
      Comando: `pnpm exec vitest run lib/use-program-catalog.test.ts` → verde.
      Mutante de frontera: agregar `import { useTramita } from './store'` al hook, re-correr,
      confirmar que H1 falla (coincide con la expresión), revertir.
      Líneas estimadas: ~38-45.
      Criterio de aceptación: decisión 1 de `design.md` ("El hook MUST NOT importar `@/lib/store`
      ni `AppShell`"); no hay escenario de spec para este refactor porque no cambia comportamiento
      observable.
- [ ] 1.3 REFACTOR — modificar `app/solicitud/creditos-adicionales/page.tsx`: quitar la unión
      `ProgramCatalog` (`:85-88`), los dos estados y el efecto con `retryProgramCatalog`
      (`:186-213`), los imports `useEffect` y `listPublicPrograms` que queden sin uso (`:3,31`);
      importar y llamar `useProgramCatalog()`; la llamada de `:378` pasa a
      `programCatalog={programCatalog}`. Ningún cambio de comportamiento; `page.test.tsx` **no se
      toca**.
      Líneas estimadas: ~35-40 (mayormente eliminaciones).
- [ ] 1.4 Verify — H2: la suite pública completa sigue en verde, sin modificar ninguna de sus
      aserciones. Comando: `pnpm exec vitest run app/solicitud/creditos-adicionales/page.test.tsx`.
      Mutantes de caracterización (demuestran que la suite pública ejercita el hook, no solo lo
      importa): (a) quitar `if (!ignore)` dentro del hook → debe romper `page.test.tsx:250`; (b)
      no incrementar el contador dentro de `retry` → debe romper `page.test.tsx:233`. Aplicar cada
      uno, confirmar el rojo, revertir.
      Criterio de aceptación: `proposal.md`, Out of Scope, fila 1 — "el formulario público… MUST
      seguir en verde sin modificar sus aserciones".
- [ ] 1.5 `pnpm test` completo (nada más en el repo debería moverse) y
      `rm -rf .next && pnpm exec tsc --noEmit` (evita los `TS2307` falsos de caché, tabla de
      trampas de `revisar-frontend-next`).
- [ ] 1.6 Commit: `git add lib/use-program-catalog.ts lib/use-program-catalog.test.ts app/solicitud/creditos-adicionales/page.tsx` y
      `git commit -m "refactor(catalogo): extrae la carga del catálogo a un hook compartido"`.

## Fase 2 — PR-B1, commit 2: formulario interno sin preselección

**Objetivo**: `app/requests/new/page.tsx` consume el catálogo público, arranca en «Sin programa»,
degrada explicando la falla y nunca envía `program: ""`. Decisión 2 de `design.md`.

- [ ] 2.1 RED (andamiaje de prueba) — agregar a `app/requests/new/page.test.tsx` la misma
      simulación parcial que usa la suite pública:
      `vi.mock('@/lib/api', async (importOriginal) => ({ ...(await importOriginal<typeof import('@/lib/api')>()), listPublicPrograms: vi.fn() }))`,
      con un valor por omisión en `beforeEach` (dos nombres, uno con tilde) y `mockReset()` del
      espía en el `afterEach` (`page.test.tsx:17-30` es el precedente exacto). Agregar el helper
      `fillRequiredFields()` (código, cédula, nombre, correo, semestre, primera asignatura,
      justificación ≥15 caracteres, casilla de firma, datos sintéticos). `createRequest` sigue
      simulado en `useTramita` como hoy (`page.test.tsx:5-10`).
      Este andamiaje no tiene un RED propio observable por sí solo — habilita las pruebas N1-N6.
      Líneas estimadas: ~35-40.
- [ ] 2.2 RED — N1: "arranca con «Sin programa» seleccionado y los nombres del catálogo en el
      orden recibido". Espera a que termine la carga (convención 4 de `revisar-frontend-next`)
      antes de leer las opciones.
      Comando: `pnpm exec vitest run app/requests/new/page.test.tsx`.
      Fallo esperado: hoy preselecciona `PROGRAMS[0]` ("Ingeniería de Sistemas") y no consulta el
      catálogo mockeado.
      Líneas de test estimadas: ~15-20.
      GREEN: en `app/requests/new/page.tsx`, cambiar `useState(PROGRAMS[0])` (`:61`) por
      `useState('')`; consumir `useProgramCatalog()`; renderizar
      `<option value="">Sin programa</option>` primero (sin `disabled`), luego los nombres del
      catálogo en el orden recibido, `value` igual al nombre, sin `trim()` ni `normalize()`; una
      función pura de módulo `programCatalogAvailability(catalog): 'loading' | 'available' |
      'unavailable'` (`ready` con `programs.length > 0` es `available`; `error`, o `ready` con
      `[]`, es `unavailable`); `disabled` en el `<select>` cuando la vista no es `available`, con
      `aria-describedby="program-catalog-status"`.
      Líneas de producción estimadas: ~25-30.
      Mutante: ordenar la lista, o volver a preseleccionar el primero → N1 falla; revertir.
      Criterio de aceptación: `specs/workflow-requests/spec.md`, escenario "El selector del
      formulario interno ofrece «Sin programa» primero y seleccionado".
- [ ] 2.3 RED — N2: "sin elegir programa, pasa `program` `undefined` al store, nunca `''`".
      Fallo esperado: hoy siempre pasa un string.
      Líneas de test estimadas: ~10-12.
      GREEN: en `handleSubmit`, pasar `program: program || undefined` (`:120`) a
      `createRequest`.
      Líneas de producción estimadas: ~2-3.
      Mutante: quitar `|| undefined` → N2 falla; revertir.
      Criterio de aceptación: `spec.md`, escenario "Registrar sin programa omite la clave del
      cuerpo".
- [ ] 2.4 Caracterización — N3: un nombre con tilde descompuesta (NFD) y doble espacio
      (`'Ingeniería  de Sistemas'.normalize('NFD')`) mockeado como opción del catálogo llega
      idéntico, byte a byte, al `program` que recibe el store simulado. Sin cambio de producción
      — la ausencia de `.normalize()`/colapso de espacios en el `onChange` ya es el comportamiento
      correcto por default de un `<select>` nativo.
      Comando: `pnpm exec vitest run app/requests/new/page.test.tsx`.
      Líneas de test estimadas: ~12-15.
      Mutante: agregar `.normalize()` o un colapso de espacios en el `onChange` del `<select>` →
      N3 falla; revertir.
      Criterio de aceptación: `spec.md`, escenario "Registrar con un programa elegido lo envía
      idéntico".
- [ ] 2.5 RED — N4: `it.each` sobre `loading`, `error` y lista vacía (`[]`) del catálogo mockeado;
      afirma el texto en `program-catalog-status` ("Cargando el catálogo de programas." para
      `loading`; "El catálogo de programas no está disponible. Puede radicar la solicitud sin
      programa." para `error` y para `[]`) y que el registro se completa **sin** la clave
      `program`.
      Fallo esperado: hoy no hay ningún texto ni manejo de estos tres casos.
      Líneas de test estimadas: ~15-20.
      GREEN: agregar el texto estático (`text-xs text-muted-foreground`, sin `role="alert"`,
      regla 7 de `revisar-frontend-next`) en las dos vistas no disponibles, y que
      `programCatalogAvailability` trate `[]` como `unavailable` (ya cubierto en 2.2, aquí solo el
      texto).
      Líneas de producción estimadas: ~8-10.
      Mutante: tratar `[]` como `available`, o bloquear el envío mientras no hay catálogo → N4
      falla; revertir.
      Criterio de aceptación: `spec.md`, escenario "El catálogo no disponible no bloquea el
      registro sin programa" (P2 de `proposal.md`, decisión por defecto abierta a veto — no
      bloqueante para esta tarea).
- [ ] 2.6 RED — N5: «Reintentar» vuelve a pedir el catálogo (segunda llamada a
      `listPublicPrograms`) y, si la segunda respuesta trae nombres, el `<select>` pasa a
      `available` con esas opciones.
      Fallo esperado: hoy no existe el botón.
      Líneas de test estimadas: ~10-12.
      GREEN: `Button` del proyecto (`type="button"`, `variant="outline"`, `size="sm"`, texto
      «Reintentar»), `onClick={catalog.retry}`, visible solo en la vista `unavailable`.
      Líneas de producción estimadas: ~6-8.
      Mutante: `onClick` sin `retry` → N5 falla; revertir.
      Criterio de aceptación: `spec.md`, mismo escenario que 2.5; decisión 2 de `design.md`,
      "Reintentar" (Preguntas abiertas §2 de `proposal.md`, por defecto incluido).
- [ ] 2.7 Caracterización — N6: un rechazo del registro (400 con `invalidFields: ["program"]`)
      se muestra en el aviso general del formulario (`errors.form`) y **no** marca
      `aria-invalid` en ningún campo. Sin cambio de producción — `problemMessage`
      (`lib/api.ts:163-174`) y el render de `errors.form` (`page.tsx:127,167-177`) ya lo hacen.
      Líneas de test estimadas: ~12-15.
      Mutante: marcar `aria-invalid` en `program` cuando llega este error → N6 falla; revertir.
      Criterio de aceptación: `spec.md`, escenario "Un programa fuera del catálogo se rechaza
      como error general, no de campo".
- [ ] 2.8 RED — S1 (nivel store). En `lib/store.test.ts`, `describe('createRequest', …)`: llamar
      a `createRequest({ …, program: undefined })` y afirmar `'program' in body` es `false` sobre
      el cuerpo capturado por el mock de `apiFetch`.
      **RED especial**: antes de tocar la interfaz, `NewRequestInput.program` sigue siendo
      `string` (obligatorio), así que asignar `undefined` en la llamada de la prueba es un error
      de tipos. Vitest no comprueba tipos (esbuild solo los quita) y `JSON.stringify` ya omite las
      claves `undefined` sea cual sea el tipo declarado — por eso la prueba **pasaría en runtime
      incluso sin el cambio**. El RED observable es de `tsc`, no de Vitest.
      Comando de RED: `pnpm exec tsc --noEmit` con la prueba ya escrita — fallo esperado: error de
      tipos asignando `undefined` a un parámetro `string` en la llamada de la prueba.
      Líneas de test estimadas: ~10-12.
      GREEN: `NewRequestInput.program?: string` en `lib/store.tsx:37`.
      Comando de GREEN: `pnpm exec tsc --noEmit` (verde) y luego
      `pnpm exec vitest run lib/store.test.ts` (verde, confirma el comportamiento en runtime).
      Líneas de producción estimadas: ~1 (agregar `?`).
      Mutante: `program: input.program ?? ''` en `lib/store.tsx:379` → `pnpm exec vitest run
      lib/store.test.ts` debe fallar S1 (el cuerpo pasa a tener `program: ''`); revertir.
      Criterio de aceptación: `spec.md`, escenario "Registrar sin programa omite la clave del
      cuerpo", observado en la capa del store (decisión 5 de `design.md`).
- [ ] 2.9 Caracterización — S2 (nivel store). Con `program` informado (nombre con tilde, el mismo
      valor de 2.4), el cuerpo lo lleva idéntico (`toBe`). Sin cambio de producción adicional.
      Líneas de test estimadas: ~8-10.
      Mutante: `input.program?.normalize('NFD')` en la construcción del cuerpo → S2 falla;
      revertir.
      Criterio de aceptación: `spec.md`, escenario "Registrar con un programa elegido lo envía
      idéntico", capa del store.
- [ ] 2.10 Borrar `PROGRAMS` de `lib/ui-constants.ts:33-39`. Verificación:
      `rg -n '\bPROGRAMS\b' app components lib` (excluyendo `openspec/`) → 0 coincidencias.
      Líneas estimadas: -8 (solo eliminación).
      Criterio de aceptación: `proposal.md`, Success Criteria, "Una búsqueda de `\bPROGRAMS\b`…
      devuelve 0 coincidencias".
- [ ] 2.11 **Compuerta de PR-B1** (unidades 1+2 juntas):
      `pnpm test`;
      `rm -rf .next && pnpm exec tsc --noEmit`;
      `pnpm lint` — **medir en frío antes de usarlo como criterio**: `openspec/config.yaml`
      registra código 0 el 2026-09-16, pero `revisar-frontend-next/SKILL.md` declara "`pnpm lint`
      está roto (declara `eslint .` sin ESLint instalado)". Correr el comando y usar el resultado
      observado ahora, no ninguno de los dos registros previos, como criterio de esta PR;
      `pnpm build`;
      medir tamaño real: `git diff --shortstat main` (rama `feat/catalogo-programas-formulario-interno`
      contra `main`), excluyendo archivos generados — comparar contra la estimación de ~263-323 de
      este documento y, si supera 400, partir el commit 1 (unidad de la Fase 1) en su propio
      PR-B1a antes de abrir, tal como prevé `design.md` §6.
- [ ] 2.12 **Puerta en vivo** (la corre el orquestador con permiso del usuario, en Chrome, contra
      el backend local con la feature 009 servida). Conflicto de puerto: el checkout de `main`
      corre `next dev` en el puerto 3000; para este worktree hay dos opciones — (a) `pnpm dev -p
      3001` dentro de este worktree, sin tocar el `next dev` de `main`; o (b) detener el `next dev`
      de `main` y correr `pnpm dev` normal aquí. La decisión la toma el orquestador antes de esta
      tarea. Pasos: abrir `/requests/new`; confirmar que el catálogo carga y «Sin programa» queda
      seleccionado; registrar sin elegir programa y confirmar que el body no lleva la clave (Red
      del navegador o log del backend); registrar eligiendo un nombre del catálogo y confirmar que
      llega idéntico; simular el catálogo caído (parar el backend o bloquear la petición en
      DevTools) y confirmar el texto de no disponibilidad y que «Radicar solicitud» sigue
      funcionando sin programa; pulsar «Reintentar» con el backend de vuelta y confirmar que las
      opciones aparecen.
- [ ] 2.13 Commit:
      `git add app/requests/new/page.tsx app/requests/new/page.test.tsx lib/store.tsx lib/store.test.ts lib/ui-constants.ts` y
      `git commit -m "feat(solicitudes): elige el programa del catálogo en el formulario interno"`.
      Push de `feat/catalogo-programas-formulario-interno` (cortada de `main` tras el merge de
      PR-0) y apertura de PR-B1 con «Relacionado: #74».

## Fase 3 — PR-B2, commit 3: tipos y mapeo de `annexRequirement`

**Objetivo**: el store mapea `annexRequirement` cuando el backend lo envía, lo conserva tras una
transición, y nunca lo inventa cuando la clave falta. Decisión 4 de `design.md`.

- [ ] 3.1 Agregar a `lib/types.ts`, antes de `AcademicRequest` (`:133-178`): la interfaz
      `AnnexRequirement { documentName: string; sourceHint: string }` con el comentario JSDoc
      `/** Hecho derivado de la configuración del trámite (009); no afirma que el anexo se adjuntó (FR-012). */`
      (tarea de documentación de este commit); y `annexRequirement?: AnnexRequirement` en
      `AcademicRequest`, junto a `program` (`:170`). Sin comportamiento observable todavía —
      habilita 3.2.
      Líneas estimadas: ~10-14.
- [ ] 3.2 RED — S3 y S5 juntas (comparten el mismo fallo de raíz; conviene escribirlas y
      observarlas en rojo antes de un único cambio de producción).
      - S3, `describe('baseRequest', …)` (o el describe existente que lo ejercite vía
        `refreshRequest`/`getRequest`): construir un objeto de cable **con** la clave
        `annexRequirement`, ejercer el mapeo, afirmar que el `AcademicRequest` resultante trae
        `annexRequirement` igual al del cable.
      - S5, `describe('transition', …)` nuevo (hoy 0 coincidencias de `transition` en
        `lib/store.test.ts`, confirmado en `exploration.md`). Agregar el tipo `ApiRequest.annexRequirement?: AnnexRequirement | null`
        (`lib/store.tsx:54-69`, tolerante en el cable) antes de escribir la prueba. Helper
        `detailRoutes(detail)` que responde por ruta (patrón de `lib/store.test.ts:20-25`): `GET
        /requests/{id}` con `detail` (con `availableTransitions` hacia `EN_FACULTAD`);
        `/timeline` y `/documents` con `[]`; `POST /requests/{id}/transitions` con 200; cualquier
        otra ruta con 500. Fase 1 (dentro de `act`): `refreshRequest(id)` con un `detail` **sin**
        la clave `annexRequirement`. Fase 2 (dentro de `act`): cambiar la implementación del mock
        a un `detail` **con** la clave y llamar `transition(id, 'EN_FACULTAD')`. Afirmar que la
        solicitud resultante en el store conserva `annexRequirement`.
      Comando: `pnpm exec vitest run lib/store.test.ts`.
      Fallo esperado en ambas: `baseRequest` todavía no mapea el campo, así que el resultado tiene
      `annexRequirement === undefined` en los dos casos.
      Líneas de test estimadas: S3 ~10-12, S5 (con el helper `detailRoutes`) ~30-35.
- [ ] 3.3 GREEN — agregar `annexRequirement: apiRequest.annexRequirement ?? undefined,` a
      `baseRequest`, junto al mapeo de `program` (`lib/store.tsx:~203`), con un comentario breve
      explicando que el cable tolera `null` pero el backend en realidad omite la clave por
      `@JsonInclude(NON_NULL)` a nivel de clase (`RequestResponse.java:45`) — el dominio nunca
      lleva `null`, solo `undefined` (tarea de documentación de este commit).
      Comando: `pnpm exec vitest run lib/store.test.ts` → S3 y S5 verdes.
      Líneas de producción estimadas: ~5-7 (mapeo + comentario).
      Mutante (a): borrar la línea del mapeo → S3 y S5 fallan; revertir.
      Mutante (b): agregar `annexRequirement: item.annexRequirement,` a los overrides de
      `transition()` (`lib/store.tsx:414-420`) — `item` es el objeto previo a la transición, así
      que esta línea **sobrescribiría** el valor correcto que ya trae el spread de `updated`
      (`:412`) con el valor viejo/ausente de `item`. Confirmar que S5 falla exactamente porque las
      dos fases usan valores distintos de `annexRequirement`; revertir.
      Criterio de aceptación: requisito "Detalle de una solicitud" §"Requisito de anexo" de
      `spec.md`, y el escenario "El aviso sigue visible después de una transición" observado en la
      capa del store (S5 es su contraparte de datos; el escenario de UI equivalente es D-algo en
      la Fase 4).
- [ ] 3.4 Caracterización — S4: con un objeto de cable construido **sin** la clave
      `annexRequirement` (el `summary` de `lib/store.tsx:36-43`, nunca `null`), el resultado tiene
      `annexRequirement === undefined`. Ya pasa tras 3.3, sin código nuevo.
      Comando: `pnpm exec vitest run lib/store.test.ts`.
      Líneas de test estimadas: ~8-10.
      Mutante: cambiar el mapeo a `apiRequest.annexRequirement ?? { documentName: '', sourceHint: '' }`
      → S4 falla; revertir.
      Criterio de aceptación: `spec.md`, "El sistema MUST NOT mostrar ningún aviso ni contenedor
      vacío cuando la clave `annexRequirement` está ausente" — observado en la capa del store,
      distinguiendo ausencia de `null`.
- [ ] 3.5 Verify: `pnpm test` completo; `rm -rf .next && pnpm exec tsc --noEmit`.
- [ ] 3.6 Commit: `git add lib/types.ts lib/store.tsx lib/store.test.ts` y
      `git commit -m "feat(solicitudes): mapea el requisito de anexo desde el detalle"`.

## Fase 4 — PR-B2, commit 4: aviso de anexo en el detalle

**Objetivo**: `app/requests/[id]/page.tsx` muestra el aviso de anexo entre las acciones de
transición y `CurrentStateBlock`, sin afirmar que se adjuntó, y sin nada cuando la clave falta.
Decisión 3 de `design.md`; texto acordado en P1 de `proposal.md`.

- [ ] 4.1 RED — D1: en `app/requests/[id]/page.test.tsx`, con el fixture `request` +
      `mockTramita` (`:23-74`) y `annexRequirement` presente: esperar a que "Ana Pérez" aparezca
      (convención 4, la carga terminó) y luego afirmar `getByRole('region', { name: 'Anexo
      requerido' })`; su posición con `compareDocumentPosition` frente al enlace "Ver documento
      PDF" y frente a la región "Estado actual"; que el texto no coincide con
      `/adjuntad[oa]|se adjuntó|recibid[oa]/i` (no bloquea el imperativo "adjunte"); que no hay
      `role="alert"` ni `aria-live` en el aviso.
      Comando: `pnpm test -- 'app/requests/[id]/page.test.tsx'`.
      Fallo esperado: hoy no existe ningún aviso ni región "Anexo requerido".
      Líneas de test estimadas: ~20-25.
- [ ] 4.2 GREEN — crear `components/annex-requirement-notice.tsx`, sin `'use client'` (igual que
      `current-state-block.tsx`, sin hooks): `export function AnnexRequirementNotice({
      documentName, sourceHint }: AnnexRequirement)`; `<section
      aria-labelledby="annex-requirement-heading">`, `h3` "Anexo requerido", párrafo "Para
      reenviar a la facultad, adjunte: {documentName}. {sourceHint}."; clases `rounded-xl border
      p-5 shadow-sm border-primary/30 bg-primary/5`; sin `role` ni `aria-live` explícitos (el
      `section` con nombre ya expone `region`).
      Líneas estimadas: ~25-30.
- [ ] 4.3 GREEN — en `app/requests/[id]/page.tsx`, importar `AnnexRequirementNotice` y renderizar
      entre `:294` y `:296`:
      ```tsx
      {req.annexRequirement ? (
        <AnnexRequirementNotice
          documentName={req.annexRequirement.documentName}
          sourceHint={req.annexRequirement.sourceHint}
        />
      ) : null}
      ```
      con un comentario breve anotando que la posición es deliberada (decisión P1: entre las
      acciones de transición y el bloque de estado, no en «Datos del estudiante») y que el texto
      nunca afirma que el anexo se adjuntó, se recibió ni se pidió (FR-012) — tarea de
      documentación de este commit.
      Comando: `pnpm test -- 'app/requests/[id]/page.test.tsx'` → D1 verde.
      Líneas de producción estimadas: ~8-10.
      Mutante: quitarlo del render; moverlo debajo de `CurrentStateBlock`; agregar `role="status"`
      → D1 falla en cada caso; revertir a la versión correcta.
      Criterio de aceptación: `spec.md`, escenario "El aviso de anexo se muestra junto a las
      acciones de transición".
- [ ] 4.4 Caracterización — D2: sin la clave `annexRequirement`, al terminar la carga no aparece
      la región "Anexo requerido" ni su texto. Ya pasa tras 4.3, sin código nuevo.
      Líneas de test estimadas: ~8-10.
      Mutante: renderizar el componente siempre, con cadenas vacías → D2 falla; revertir.
      Criterio de aceptación: `spec.md`, escenario "Sin la clave, no hay aviso ni contenedor
      vacío".
- [ ] 4.5 Caracterización — D3: con `currentState.isFinal === true` y `annexRequirement`
      presente, el aviso se sigue mostrando (FR-009, "en cualquier estado"). Ya pasa tras 4.3, sin
      rama por estado.
      Líneas de test estimadas: ~8-10.
      Mutante: agregar `!req.currentState.isFinal &&` al contenedor de 4.3 → D3 falla; revertir.
      Nota: es una decisión por defecto abierta a veto (Preguntas abiertas §3 de `design.md`); si
      el responsable la veta, esta tarea se reabre con la rama de `isFinal` y el delta de
      `spec.md` cambia en consecuencia — no bloquea esta fase.
      Criterio de aceptación: requisito "Detalle de una solicitud" §"Requisito de anexo" de
      `spec.md` ("MUST mostrarse… en cualquier estado — incluido un estado final").
- [ ] 4.6 Caracterización — D4: un programa heredado fuera del catálogo (por ejemplo «Ing») se
      sigue mostrando tal cual en la fila "Programa" de «Datos del estudiante»; si esa solicitud
      no trae `annexRequirement`, se comporta igual que cualquier otra ausencia (D2). Sin código
      nuevo — la fila «Programa» (`:319`) no cambia.
      Líneas de test estimadas: ~8-10.
      Mutante: filtrar u ocultar el programa si no está en una lista conocida → D4 falla;
      revertir.
      Criterio de aceptación: `spec.md`, escenario "Un programa heredado fuera del catálogo se
      muestra tal cual".
- [ ] 4.7 **Compuerta de PR-B2** (unidades 3+4 juntas):
      `pnpm test`;
      `rm -rf .next && pnpm exec tsc --noEmit`;
      `pnpm lint` — mismo criterio de 2.11: medir en frío, no confiar en el registro de
      `config.yaml` ni en la declaración de `revisar-frontend-next`;
      `pnpm build`;
      medir tamaño real: `git diff --shortstat main` (rama `feat/catalogo-programas-anexo-detalle`
      contra `main`, ya con PR-B1 mergeado), comparar contra la estimación de ~148-181.
- [ ] 4.8 **Puerta en vivo** (la corre el orquestador con permiso del usuario, en Chrome, contra
      el backend local con la 009; mismo conflicto de puerto y mismas dos opciones que 2.12).
      Pasos: registrar o localizar una solicitud cuyo trámite/programa tenga requisito de anexo
      configurado en el backend de la 009; abrir su detalle y confirmar el aviso entre las
      acciones y "Estado actual"; ejecutar una transición disponible y confirmar que el aviso
      sigue visible tras la actualización, sin recargar la página; abrir el detalle de una
      solicitud sin `annexRequirement` y confirmar que no aparece nada en su lugar.
- [ ] 4.9 Commit:
      `git add lib/types.ts components/annex-requirement-notice.tsx app/requests/[id]/page.tsx app/requests/[id]/page.test.tsx` y
      `git commit -m "feat(solicitudes): muestra el requisito de anexo en el detalle"`.
      Push de `feat/catalogo-programas-anexo-detalle` (cortada de `main` tras el merge de PR-B1) y
      apertura de PR-B2 con `Closes #74`; el cuerpo declara el desvío del test 4 del issue frente
      al SC-006 del backend, con referencia al issue #52 (decisión 2 de `design.md`, §2).

## Fase 5 — Cierre

- [ ] 5.1 Tras el merge de PR-B1 y PR-B2 en `main`: `gh issue view 74 --json state` — confirma
      `CLOSED`. Si sigue `OPEN`, revisar la redacción de `Closes #74` en el cuerpo del PR-B2 y
      cerrarlo manualmente con referencia a los commits de merge.
- [ ] 5.2 Archivar el cambio (`sdd-archive`): fusionar el delta de
      `specs/workflow-requests/spec.md` en `openspec/specs/workflow-requests/spec.md`, y mover
      `openspec/changes/catalogo-programas-y-anexo/` a
      `openspec/changes/archive/YYYY-MM-DD-catalogo-programas-y-anexo/` (fecha real del archivo).
- [ ] 5.3 Confirmar que ningún seguimiento nuevo hace falta más allá de los ya abiertos y citados
      (#10, #50, #52) — este cambio no introduce deuda adicional no declarada en
      `proposal.md`/`design.md`.
