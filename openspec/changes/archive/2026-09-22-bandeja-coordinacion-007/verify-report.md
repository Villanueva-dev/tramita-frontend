# Verify Report: bandeja-coordinacion-007

> Diagnostics only — findings here do not gate archive. HEAD `9731963` (branch
> `feat/bandeja-007-a5-bandeja`), containing C1–C7 on top of `main`/`origin/main` `9bf95a4`,
> delivered as five stacked PRs.

## Practical checks at HEAD

| Command | Result |
|---|---|
| `pnpm lint` | exit 0, no output (`eslint .`) |
| `pnpm exec tsc --noEmit` (no live dev server found; `rm -rf .next` intentionally skipped per phase instructions) | exit 0, no errors |
| `pnpm test` | **24 files, 231 tests, all green** — matches the orchestrator's last observation and the cumulative total reported across apply-progress.md (165 baseline → 231 after C1–C7) |
| `pnpm build` | Compiled with Turbopack, TypeScript clean, 9 routes listed (`/`, `/_not-found`, `/account/password`, `/assistant`, `/dashboard`, `/requests/[id]`, `/requests/[id]/documento`, `/requests/new`, `/solicitud/creditos-adicionales`) — identical to every route count reported throughout apply-progress.md, which itself labels this same list "8 rutas" (excluding the framework-reserved `/_not-found`). Consistent with the expected baseline, not a new discrepancy. |

`git status --short` shows only `M public/tramita-logo.jpeg` (human's uncommitted change, untouched, not evaluated as a defect per instructions).

PR chain confirmed live via `gh pr list`: #44 (A-1→main) ← #45 (A-2) ← #46 (A-3) ← #47 (A-4) ← #48 (A-5), all `OPEN`, none merged. Issue `#9` confirmed `OPEN` (`gh issue view 9 --json state,closedAt`), consistent with tasks.md 8.7 marked pending ("se cierra cuando #46 llegue a main").

## Spec coverage

50 scenarios across three deltas (`coordination-inbox`: 23, `workflow-requests`: 22, `request-timeline`: 5), counted with `rg -c '^#### Scenario:'`.

### coordination-inbox (23/23 scenarios have a named test or documented mutant-evidence trace)

| Requirement | Scenario | Test |
|---|---|---|
| Carga automática al entrar | La bandeja aparece sin buscar | `app/dashboard/page.test.tsx` — `'la sección de la bandeja aparece al entrar, sin que el usuario busque'` |
| | `responsible`/`limit` explícitos | `lib/api.test.ts` — `'pide GET /api/requests/inbox con responsible y limit explícitos y devuelve el arreglo tal cual'`; `lib/use-coordination-inbox.test.ts` — `'consulta con responsible=COORDINACION y limit=50 al montar'` |
| Orden del servidor se conserva | DOM respeta el orden | `components/dashboard/coordination-inbox.test.tsx` — `'las filas aparecen en el orden exacto del fixture, sin recalcular'`; `lib/use-coordination-inbox.test.ts` — `'transiciona loading → ready con las entradas en el orden exacto del servidor'` |
| | Mutante "reordenar" en rojo | apply-progress.md, mutantes 2a/2b — observado y revertido (7.29/7.30, 6.16) |
| Antigüedad desde `waitingSince` | Antigüedad sale de `waitingSince` | `components/dashboard/coordination-inbox.test.tsx` — `'la espera sale de waitingSince, no de createdAt'` |
| | Mutante 1 en rojo | apply-progress.md, mutante 1 — observado y revertido (7.29) |
| Origen en tres casos | público / Coordinación / null | `components/dashboard/coordination-inbox.test.tsx` — los tres `it('origen por...')`/`'origen nulo se presenta como...'` |
| Contenido de fila, sin documento | Cinco datos / sin documento | `components/dashboard/coordination-inbox.test.tsx` — `'una fila muestra sus cinco datos...'` / `'ninguna fila expone número de documento'` |
| Lista vacía legítima | Bandeja vacía | `components/dashboard/coordination-inbox.test.tsx` — `'bandeja vacía: muestra un mensaje explicado, no un error'` |
| Aviso de truncamiento | Presente / ausente | `components/dashboard/coordination-inbox.test.tsx` — `'aviso presente...'` / `'sin aviso...'`; `lib/use-coordination-inbox.test.ts` — `mayHaveMore` true en 50 / false en 49 |
| 401 termina sesión | 401 cierra sesión | `lib/use-coordination-inbox.test.ts` — `'un 401 llama a sessionExpired exactamente una vez y no produce mensaje'` |
| Convive con la búsqueda | Buscar sigue funcionando | `app/dashboard/page.integration.test.tsx` — `'cargar la bandeja al montar no consume las respuestas encoladas de la búsqueda'` / `'buscar después de que la bandeja cargó sigue funcionando...'` |
| Encabezado cuenta la bandeja | Plural/singular/"o más"×2/sin prioridad | `app/dashboard/page.test.tsx` — 5 `it(...)` matching each scenario by name, plus an extra `'ausente mientras la bandeja carga'` not required by a named spec scenario but reasonable |
| Ausencia de vencimiento | Ninguna pantalla afirma vencimiento / mutante 3 | Distributed: `components/dashboard/summary-cards.test.tsx`, `app/requests/[id]/page.test.tsx` ("no muestra vencimiento..."), `components/dashboard/requests-table.test.tsx` (renamed), `app/dashboard/page.test.tsx` ("sin indicadores..."), `components/dashboard/coordination-inbox.test.tsx` ("ningún texto de la bandeja menciona vencimiento"); mutante 3 observed in apply-progress.md Fase 1 |

### workflow-requests (22 scenarios; all traced, one pre-existing gap noted below)

- **Catálogo data-driven** (5 scenarios): the 4 pre-existing scenarios (selector poblado, trámite nuevo sin recompilar, ausencia de códigos hardcodeados, pantalla DO-FR-100) predate this delta and were not re-verified test-by-test in this pass — out of this change's touched scope except for the 5th. The new scenario "Un código de definición desconocido no se presenta como adición de créditos (#9b)" is covered in three layers: `lib/store.test.ts` (source), `app/requests/[id]/page.test.tsx` — `'un código de definición desconocido no se presenta como adición de créditos (#9b)'`, and `app/dashboard/page.test.tsx` — `'filtrar por Adición de Créditos excluye una solicitud de definición desconocida (#9b)'`. Mutante 4 observed in apply-progress.md Fase 3.
- **Detalle de una solicitud** (6 scenarios): "Dos estados intermedios se distinguen (#9a)" → `app/requests/[id]/page.test.tsx` — `'dos estados intermedios se distinguen: cada uno con su propio nombre y responsable (#9a)'`. "Sin recorrido lineal" → `components/current-state-block.test.tsx` — `'nunca renderiza «paso», un número de paso ni una lista de estados'`. "Detalle con transiciones disponibles" and "El detalle muestra los datos de identificación" are pre-existing, plausibly covered by `'carga el detalle desde el store'` and `'abre el diálogo para la transición que entrega el backend'`, not independently re-verified here. **"Trámite en estado final sin acciones" and "Solicitud inexistente" (404) have no dedicated test found in `app/requests/[id]/page.test.tsx`** at page level — see Findings.
- **Responsable del estado actual** (4 scenarios): `lib/request-state.test.ts` — `'responsable único en las transiciones salientes'`, `'responsables divergentes no eligen uno'`, `'un estado final no tiene responsable'`; `app/requests/[id]/page.test.tsx` — `'no muestra una fila «Asignado a»: el bloque de estado es la única respuesta a quién depende'`.
- **Interpretación de la semántica del estado** (7 scenarios): all traced to `lib/request-state.test.ts` titles (`'cierra exactamente los estados...'`, `'no confunde el rechazo definitivo con una devolución'`, `'reconoce la devolución de adición de créditos...'`, `'no puede reconocer la devolución de novedad de notas...'`, `'reconoce el inicio propio de cada trámite'` + 3 companion tests, `'un estado que el cliente no reconoce... igual se presenta como pendiente...'`). Mutante extra ("`isInitialState` vuelve a la tabla") observed in Fase 2.

### request-timeline (5/5 scenarios traced)

`components/current-state-block.test.tsx` — `'«Lleva 1 día» en singular'`, `'«Lleva N días» en plural'`, `'«Lleva 30 días» se presenta con el mismo estilo...'`, `'oculta la antigüedad del estado cuando el estado es final'`; `app/requests/[id]/page.test.tsx` — `'la antigüedad del estado sale de la última entrada del timeline, no de createdAt (mutante P1/P2)'` (mutante observed in Fase 4). **"Consistencia con la antigüedad de la bandeja" has no single cross-screen test** asserting the inbox N and the detail N are literally equal for the same request — see Findings (minor).

## Success Criteria (proposal.md) — verified against HEAD, not against the unchecked `[ ]` boxes in the file

All 17 bullets checked with fresh commands run in this pass:

| # | Bullet | Evidence |
|---|---|---|
| 1 | Bandeja carga al entrar, `COORDINATION_RESPONSIBLE`+`limit` explícitos | `getInbox`/hook tests above |
| 2 | Orden del DOM es el del servidor, mutante 2 en rojo | order tests + apply-progress mutant evidence |
| 3 | Antigüedad de `waitingSince`, mutante 1 en rojo | coordination-inbox test + apply-progress mutant evidence |
| 4 | Origen en tres casos | 3 origin tests |
| 5 | "Puede haber más" con `length===limit`, no con `limit-1` | aviso tests + `mayHaveMore` hook tests |
| 6 | Lista vacía explicada; 401 termina sesión | tests above |
| 7 | Búsqueda sigue funcionando | 24/231 green, incl. pre-existing search tests |
| 8 | Sin vencimiento: `rg -n -i 'venc(...)...' app components lib -g '!*.test.*'` → 0 | **verified**: 0 results |
| 9 | Sin stepper/etapas: `rg -n 'WorkflowStepper\|stageFromState\|currentStage' app components lib` → 0 | **verified**: 0 results |
| 10 | #9(a) dos estados intermedios distinguibles | test above |
| 11 | #9(b) definición desconocida no muestra "Adición de créditos" | mutante 4 + 3-layer tests |
| 12 | `isInitialState` lee `currentState.isInitial`; `rg 'initial: true' lib/request-state.ts` → 0; comentario dice qué tercio se pagó | **verified**: 0 results; comment at `lib/request-state.ts:1-16` explicitly states "un tercio pagado" |
| 13 | Configuración retirada: `app/settings/` no existe; `rg` de las 5 claves → 0 | **verified**: dir absent, 0 results |
| 14 | `rg "'COORDINACION'" app components lib -g '!*.test.*'` → 1 | **verified**: exactly 1, `lib/use-coordination-inbox.ts:14` |
| 15 | `git diff main -- lib/format.ts` no toca `HAS_OFFSET` ni `parseServerDateTime` | **verified**: diff only removes `addBusinessDays`/`businessDaysUntil`/`isOverdue`; `main` == `9bf95a4` == `origin/main` |
| 16 | `pnpm lint`/`tsc`/`test`/`build` en verde, resumen vitest reportado | **verified** this pass (see Practical checks) |
| 17 | `gh issue view 9` → `CLOSED` tras merge | **not yet** — issue `#9` is `OPEN`; correctly reported as pending in tasks.md 8.7, no PR merged yet |

All 17 bullets pass or are correctly disclosed as pending (17). None fail.

## Tasks (tasks.md)

Fases 1–7 (all `[x]`) each have matching evidence in `apply-progress.md`: TDD Cycle Evidence tables with observed RED messages, GREEN diffs, mandatory mutant observations (reverted, never committed), and a Verification block (`pnpm lint`/`tsc`/`test`/`build`) per unit. Cross-checked against HEAD: the cumulative `pnpm test` count (231) and all constraint greps match what each phase's apply-progress entry claims for its closing state.

Two honestly-disclosed deviations from strict RED→GREEN, both documented rather than fabricated:
- C5 tasks 5.1/5.2: "RED no observable" — the mocked keys were already dead before this unit touched them (a C4 side effect); before/after runs shown instead of a fabricated red.
- C7b: 2 of 7 new `page.test.tsx` tests passed vacuously against the old code (no "o más" text existed to find absent); disclosed instead of hidden.

Fase 8: 8.1–8.5 `[x]` with evidence distributed across PR bodies #44–#48 (not independently verified here — PR body content is outside repo state); **8.6** (live backend session check) and **8.7** (post-merge issue closure) remain `[ ]`, both correctly stated as pending on the project owner and on merge, respectively. This matches the live state: issue `#9` is `OPEN`, all five PRs are `OPEN`.

`proposal.md` Success Criteria checkboxes remain all unchecked `[ ]` in the file despite the functional state being satisfied (bullet 17 excepted, genuinely pending) — a cosmetic staleness, not a functional gap; verify does not rewrite it.

## Constraint spot-checks (all verified at HEAD)

| Check | Result |
|---|---|
| `dueDate\|addBusinessDays\|businessDaysUntil\|isOverdue` outside tests | 0 |
| `WorkflowStepper\|stageFromState\|currentStage` | 0 |
| `app/settings` | does not exist |
| `workflowConfig` | 0 |
| `inbox\|Inbox` in `lib/store.tsx` | 0 |
| `parseServerDateTime`/`daysSince` vs `9bf95a4` | unchanged — diff only deletes the three helpers |
| `WorkflowDefinition` shape | `{code, name, version}` — no `states` |
| `State` shape | `{code, name, isInitial, isFinal}` — `isInitial` required |

## Strict TDD Compliance

| Check | Result |
|---|---|
| TDD Evidence reported | ✅ Found — every phase in apply-progress.md has a "TDD Cycle Evidence" table |
| All tasks have tests | ✅ 7/7 phases |
| RED confirmed (test files exist) | ✅ verified — all referenced test files exist at HEAD with matching titles |
| GREEN confirmed (tests pass now) | ✅ 231/231 pass at HEAD |
| Triangulation adequate | ✅ — most behaviors have 2+ cases; a few single-scenario items (`➖ Single`) are explicitly marked, matching genuinely single-scenario spec requirements |
| Safety Net for modified files | ✅ — every phase records a pre-change safety-net run (e.g. "2 archivos, 21 tests, todos verdes" before C2) |
| Mandatory mutants | ✅ all 7 (1, 2a, 2b, 3, 4, P1/P2, extra×2) observed red and reverted, never committed |

**TDD Compliance**: 7/7 checks passed.

### Assertion Quality Audit

Scanned all new/modified test files (`coordination-inbox.test.tsx`, `use-coordination-inbox.test.ts`, `current-state-block.test.tsx`, `request-state.test.ts`, `api.test.ts`, `page.test.tsx`, `page.integration.test.tsx`) for banned patterns: no tautologies (`expect(true).toBe(true)`), no ghost loops (`forEach` over `getAllBy*`/`queryAllBy*`), mock/assertion ratio in the hook test 11:19 (well under the 2× threshold).

**Assertion quality**: ✅ No CRITICAL or WARNING findings from the automated scan.

### Test Layer Distribution

| Layer | Files (this change) |
|---|---|
| Unit | `lib/api.test.ts` (getInbox), `lib/use-coordination-inbox.test.ts`, `lib/request-state.test.ts`, `lib/store.test.ts` |
| Integration | `components/dashboard/coordination-inbox.test.tsx`, `components/current-state-block.test.tsx`, `app/dashboard/page.test.tsx`, `app/dashboard/page.integration.test.tsx`, `app/requests/[id]/page.test.tsx`, `app/requests/[id]/documento/page.test.tsx` |
| E2E | None — not installed (`openspec/config.yaml`), consistently disclosed as N/A in every apply-progress entry |

## Findings

| Severity | Finding | Evidence |
|---|---|---|
| WARNING | Two `workflow-requests` scenarios under "Detalle de una solicitud" have no dedicated page-level test: "Trámite en estado final sin acciones" and "Solicitud inexistente" (404). Both are pre-existing (unchanged by this delta) behaviors, not new scope — production code exists (`Solicitud no encontrada` string at `app/requests/[id]/page.tsx:120`; `availableTransitions` empty on close), and 404 is tested at a lower layer (`lib/api.test.ts` `'lanza ApiError 404...'`, `lib/use-request-detail.test.ts` `'un 404 es notFound...'` — the latter on a hook the design doc says has no production consumer), but neither is asserted at the page component level. | `app/requests/[id]/page.test.tsx` (9 top-level `it`s, none matching); `lib/api.test.ts:365`; `lib/use-request-detail.test.ts:81` |
| WARNING | `request-timeline` scenario "Consistencia con la antigüedad de la bandeja" (inbox N == detail N for the same request) has no single cross-screen test proving equality; both screens correctly derive from the same underlying instant by construction (`daysSince` over `waitingSince`/last timeline entry), but no test asserts the two rendered strings match for one shared fixture. | grep across `coordination-inbox.test.tsx` and `page.test.tsx` — no shared-fixture cross-check found |
| SUGGESTION | `components/type-badge.tsx` keeps a decorative icon map keyed by `ADICION_CREDITOS`/`NOVEDAD_NOTAS` (`lib/store.tsx`'s allowlist also cites both literals as its single source of truth, and `app/solicitud/creditos-adicionales/page.tsx` declares one literal for its DO-FR-100 screen). This is design.md D2's explicit, justified exception ("el mapa no decide nada... no reabre el #9(b)"), not a regression — flagged only because a literal reading of the `workflow-requests` scenario "Ausencia de códigos hardcodeados fuera de las pantallas de formato oficial" (`rg` over `app/`, `components/`, `lib/` excluding fixtures and DO-FR-100 screens) would surface these three sites if run generically; the scenario's actual scope (selector-population screens) is narrower than that literal reading. | `rg -n "ADICION_CREDITOS\|NOVEDAD_NOTAS" app components lib -g '!*.test.*' -g '!lib/fixtures/*'` |
| SUGGESTION | `proposal.md` Success Criteria checkboxes are all `[ ]` in the file even though 16/17 are functionally satisfied at HEAD (the 17th, post-merge issue closure, is genuinely pending). Cosmetic only — verify does not rewrite it per the phase's hard rules. | `proposal.md` "Success Criteria" section |
| SUGGESTION | Pre-existing "Catálogo data-driven" scenarios (selector poblado desde el catálogo, trámite nuevo sin recompilar, `app/requests/new` no listea `GET /workflow-definitions`) were not independently re-verified in this pass; `app/requests/new/page.test.tsx` confirms the page uses `REQUEST_TYPE_LABELS`, not the catalog, which the proposal explicitly names as **known, out-of-scope debt** ("el formulario nuevo rotula con `REQUEST_TYPE_LABELS` y no con el catálogo"), so the literal spec requirement ("MUST poblar su selector exclusivamente desde `GET /workflow-definitions`") is not met by that screen — a pre-existing gap this change did not introduce and explicitly disclosed. | `app/requests/new/page.test.tsx:21` (`'renderiza el formulario usando REQUEST_TYPE_LABELS, no el catálogo del store'`); `proposal.md`, "Out of Scope" |

No CRITICAL findings.

## Summary

CRITICAL: 0 · WARNING: 2 · SUGGESTION: 3. All four practical checks pass at HEAD (lint clean, tsc clean, 24 files/231 tests green, build 9/8 routes as historically reported). All 16 immediately-checkable Success Criteria bullets verified with fresh commands; the 17th (post-merge issue closure) correctly pending. All constraint spot-checks pass with 0 residual matches. Strict TDD evidence is complete and honest, including disclosed RED-not-observable deviations. The two WARNINGs are pre-existing, unchanged-by-this-delta test gaps at the page level, not regressions.
