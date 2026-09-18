# Apply Progress: Formulario público del DO-FR-100

## Batch

- Scope: cumulative Phase 1 plus completed Phase 2 work and its pre-Phase-3 correction (tasks 1.1–1.12 and 2.1–2.15)
- Delivery mode: single-pr + size:exception (maintainer-authorized)
- Artifact store: OpenSpec, per current native SDD status
- Previous progress: Phase 1 history, guard reclassification, accepted review correction, and evidence preserved below
- Status: success for 27/49 tasks; Phase 2 and the pre-Phase-3 correction are complete

## Result Contract

- status: success
- executive_summary: Phase 1 public-route and regression-guard history is preserved; Phase 2 signature capture and its pre-Phase-3 correction are complete with automated checks, maintainer-confirmed desktop Chrome mouse drawing on the correct URL, mobile finger drawing, keyboard image upload/clear, and canonical build evidence.
- artifacts: `tasks.md` records 27/49 completed tasks; this cumulative `apply-progress.md` preserves all Phase 1 and Phase 2 evidence in OpenSpec.
- next_recommended: Phase 3 remains pending and must be separately authorized and applied.
- risks: The maintainer confirmed desktop Chrome mouse drawing on the correct URL, mobile finger drawing, and keyboard image upload/clear. No browser version or device details were recorded, so no broader compatibility claim is inferred. jsdom cannot prove browser canvas pixels or native file-picker behavior. Phase 3 remains dependent on the public backend endpoint for end-to-end proof.
- skill_resolution: paths-injected
## Completed Tasks

- [x] 1.1 Route test RED evidence captured.
- [x] 1.2 Public route and static presentational blocks created.
- [x] 1.3 Complete Phase 1 source-boundary guard passed.
- [x] 1.4 Official block-order and field-label test captured as RED, then implemented.
- [x] 1.5 Checkbox-absence regression guard passed.
- [x] 1.6 Combobox-absence regression guard passed.
- [x] 1.7 Contract-control and single-textarea regression guard passed.
- [x] 1.8 Eleven displayed contract fields and an empty signature block added.
- [x] 1.9 Definition-code guard RED evidence captured.
- [x] 1.10 One page-local `ADICION_CREDITOS` literal added.
- [x] 1.11 Full suite and protected internal-form check passed.
- [x] 1.12 Typecheck and lint passed.

## Guard Reclassification History

- The first attempt recorded no fabricated RED history for 1.3 and 1.5–1.7: their initial negative assertions ran green after production code already existed.
- The maintainer explicitly selected Option 1 and reclassified those tasks as `GUARD` tasks. They now protect the delivered behavior and are correctly recorded as first-run-green regression evidence, not historical RED evidence.
- Task 1.2 explicitly requires the page to be created **without `AppShell`**. The absence of request-store consumption comes from the public-page specification. The absence of checkboxes, comboboxes, and subject/credit controls comes from the broader format specification and the minimal Phase 1 presentation; those constraints were not all literal sub-requirements of task 1.2.

## TDD Cycle Evidence

| Tasks | RED evidence | GREEN evidence | REFACTOR |
|---|---|---|---|
| 1.1–1.2 | `pnpm test -- app/solicitud/creditos-adicionales/page.test.tsx` failed: `Failed to resolve import "./page"` | Same command passed: 13 files / 78 tests | Extracted `PublicRequestSections` as a presentational component. |
| 1.4, 1.8 | Field-label test failed: `Unable to find a label with the text of: Nombres completos del solicitante` | `pnpm test -- app/solicitud/creditos-adicionales/page.test.tsx` passed: 13 files / 82 tests | Removed duplicate client directive and narrowed the block-title query to its `data-slot`. |
| 1.3 | First execution was green by design after the page without `AppShell` existed. | Reclassified by explicit maintainer decision as a source-boundary GUARD; focused Phase 1 tests passed: 14 files / 83 tests. | The guard recursively scans both Phase 1 implementation directories for `AppShell`, `useTramita`, and `@/lib/store`. |
| 1.5–1.7 | First execution was green by design after the minimal presentation existed. | Reclassified by explicit maintainer decision as rendered-tree GUARDs; focused Phase 1 tests passed: 14 files / 83 tests. | Guards assert no checkboxes/comboboxes, exact control IDs, no subject/credit control names, exactly one `textarea`, and a non-editable signature placeholder. |
| 1.9–1.10 | `pnpm test -- app/solicitud/creditos-adicionales/definition-code.test.ts` failed: expected 1 literal, got 0 | Same command passed: 14 files / 83 tests | Page-local exported constant keeps the sole literal ready for Phase 3 route construction. |

## Work Unit Evidence

| Evidence | Result |
|---|---|
| Focused Phase 1 tests | `pnpm test -- app/solicitud/creditos-adicionales/page.test.tsx app/solicitud/creditos-adicionales/definition-code.test.ts` → 14 files / 83 tests passed. |
| Full suite | `pnpm test` → 14 files / 83 tests passed. |
| Typecheck | `rm -rf .next && pnpm exec tsc --noEmit` → exit 0. |
| Lint | `pnpm lint` → `eslint .`, exit 0. |
| Protected internal form | `rg -c '^\s*it\(' app/requests/new/page.test.tsx` → `2`; `git diff -- app/requests/new/page.tsx app/requests/new/page.test.tsx` → empty. |
| Runtime harness | Parent-rerun evidence: `pnpm dev` started Next.js 16.3.5 on `localhost:3000`; `GET /solicitud/creditos-adicionales` returned `HTTP/1.1 200 OK` without a `Location` header, its body contained `Solicitud de matrícula de créditos adicionales` and `Matrícula créditos adicionales`, and it contained no checkbox or combobox markers. The server was intentionally terminated. |
| Build | `pnpm build` with network access exited 0; Next compiled, TypeScript passed, 9/9 static pages generated, and `/solicitud/creditos-adicionales` was emitted as a static route. The generated `next-env.d.ts` change was restored to its tracked content. |
| Rollback boundary | Remove the public-route files and revert Phase 1 OpenSpec progress. `app/requests/new/**`, `components/app-shell.tsx`, `lib/api.ts`, and `lib/types.ts` remain outside this unit. |

## Next Step

Phase 1 is complete. The next implementation slice is Phase 2 signature capture; it remains outside this assignment. Phase 3 remains dependent on the public backend endpoint for end-to-end proof.

## Accepted Review Correction Batch

- Scope: Phase 1 tasks 1.4 and 1.8 only; no Phase 2 or Phase 3 behavior was implemented.
- Delivery mode: single-pr + size:exception (maintainer-authorized).
- Status: success.

### Completed Corrections

- [x] 1.4 The `program` field now exposes the official label `Programa académico en el que se encuentra`, and `Semestre cursado y aprobado` precedes `Modalidad` in DOM and control order.
- [x] 1.8 The empty signature placeholder is now a named `<figure>` with an unnamed visual `<div>` and `figcaption`; the planned Phase 2 canvas can replace the visual child without losing the semantic wrapper.

### TDD Cycle Evidence

| Tasks | Test file and layer | Safety net | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|
| 1.4, 1.8 | `app/solicitud/creditos-adicionales/page.test.tsx` — integration | `pnpm exec vitest run app/solicitud/creditos-adicionales/page.test.tsx` → 1 file / 5 tests passed | Same focused command → 1 file / 6 tests, 3 failed: missing official program label, reversed semester/modalidad IDs, and no named figure | Same focused command → 1 file / 6 tests passed | Three independently failing behavior assertions cover label, DOM order, and accessible placeholder semantics | Split the signature semantic assertion into its own behavioral test; no production refactor was needed beyond the minimal markup correction. |

### Work Unit Evidence

| Evidence | Result |
|---|---|
| Focused test command | `pnpm exec vitest run app/solicitud/creditos-adicionales/page.test.tsx` → 1 file / 6 tests passed. |
| Full suite | `pnpm test` → 14 files / 84 tests passed. |
| Typecheck | `pnpm exec tsc --noEmit` → exit 0. |
| Lint | `pnpm lint` → `eslint .`, exit 0. |
| Runtime harness | N/A — this correction changes static rendered labels, DOM order, and placeholder semantics only; it introduces no runtime boundary or interaction. |
| Rollback boundary | Revert `components/do-fr-100/sections.tsx`, `app/solicitud/creditos-adicionales/page.test.tsx`, and this correction section; no Phase 2 or Phase 3 file is involved. |

### Remaining Work

- Phase 2 signature capture (tasks 2.1–2.9) is complete.
- Phase 3 submission, validation, and acknowledgment (tasks 3.1–3.19) remains pending.

## Phase 2 Signature Capture Batch

- Scope: completed Phase 2 tasks 2.1–2.9, including the maintainer-confirmed manual task 2.8.
- Delivery mode: single-pr + size:exception (maintainer-authorized).
- Artifact store: OpenSpec, per current native SDD status.
- Status: complete for Phase 2 tasks 2.1–2.9.

### Completed Tasks

- [x] 2.1 `CanvasFirma` exposes `SignatureCapture` (`dataUrl`, `hayFirma`) and reports the unsigned initial state.
- [x] 2.2 `components/firma/canvas-firma.tsx` uses Pointer Events, pointer capture, and device-pixel-ratio canvas sizing.
- [x] 2.3 A valid blank-PNG response is not treated as a signature.
- [x] 2.4 Signature state is owned separately and becomes signed on the first pointer down.
- [x] 2.5 A drawn signature reports a PNG data URL; `Limpiar firma` resets both values.
- [x] 2.6 Midpoint smoothing uses `quadraticCurveTo` and the clear action is available in the public form.
- [x] 2.7 The canvas declares `touch-action: none`; this is an automated declaration guard, not touch-gesture proof.
- [x] 2.8 Maintainer-confirmed manual check: the corrected canvas allows finger drawing on a real mobile device. No device/browser details were provided or inferred.
- [x] 2.9 Full tests, typecheck, and lint completed successfully.

### TDD Cycle Evidence

| Tasks | Test file and layer | Safety net | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|
| 2.1–2.2 | `components/firma/canvas-firma.test.tsx` — integration | N/A (new production and test files) | `pnpm exec vitest run components/firma/canvas-firma.test.tsx` failed: `Failed to resolve import "./canvas-firma"` | Same command passed: 1 file / 1 test | Initial unsigned state and disabled clear control independently verify the callback contract and control state | Extracted the `SignatureCapture`, `Point`, and midpoint helpers; kept the public callback surface minimal. |
| 2.3–2.6 | `components/firma/canvas-firma.test.tsx` — integration | `pnpm exec vitest run components/firma/canvas-firma.test.tsx` → 1 file / 1 test passed before extending it | The drawn-signature tests first failed in jsdom because Pointer Capture APIs are absent, revealing an environment gap rather than product behavior; test-local standards-compatible stubs were added. The blank-PNG assertion first ran green because the initial unsigned contract already prevented `toDataURL()` inference; recorded as a GUARD, not fabricated RED evidence. | `pnpm exec vitest run components/firma/canvas-firma.test.tsx` → 1 file / 4 tests passed | Blank versus drawn PNG, one-point capture versus movement smoothing, and clear reset exercise distinct paths | `onPointerMove` refreshes the emitted PNG after each stroke so the parent receives the drawn bytes, not only the initial point. |
| 2.7 | `components/firma/canvas-firma.test.tsx` + `app/solicitud/creditos-adicionales/page.test.tsx` — integration/source guard | Page safety net: `pnpm exec vitest run app/solicitud/creditos-adicionales/page.test.tsx` → 1 file / 6 tests passed before edits | Integration test failed: missing canvas and new `Limpiar firma` control. The expanded public source-boundary guard first ran green after including `components/firma/canvas-firma.tsx`, so it is correctly a GUARD, not invented RED evidence. | `pnpm exec vitest run components/firma/canvas-firma.test.tsx app/solicitud/creditos-adicionales/page.test.tsx` → 2 files / 10 tests passed | The integration test proves placement in the named figure; the canvas test proves CSS declaration and pointer behavior | Replaced only the visual child of the established named figure, preserving its accessible name. |
| 2.9 | Phase 2-focused and workspace commands | Covered by focused Phase 2 tests | N/A — verification task | `pnpm test` → 15 files / 88 tests; `pnpm exec tsc --noEmit` → exit 0; `pnpm lint` → exit 0 | Full suite complements the focused interaction cases | No code refactor required after final verification. |

### Work Unit Evidence

| Evidence | Result |
|---|---|
| Focused signature tests | `pnpm exec vitest run components/firma/canvas-firma.test.tsx` → 1 file / 4 tests passed. |
| Focused Phase 2 integration | `pnpm exec vitest run components/firma/canvas-firma.test.tsx app/solicitud/creditos-adicionales/page.test.tsx` → 2 files / 10 tests passed. |
| Full suite | `pnpm test` → 15 files / 88 tests passed. |
| Typecheck | `pnpm exec tsc --noEmit` → exit 0. `.next` was not removed because no cleanup was necessary and a live server must never be disrupted. |
| Lint | `pnpm lint` → `eslint .`, exit 0. |
| Runtime harness | Under a brief local `pnpm dev` server, `curl -fsS -D /tmp/phase2-signature-headers.txt http://127.0.0.1:3000/solicitud/creditos-adicionales -o /tmp/phase2-signature-page.html` returned `HTTP/1.1 200 OK`; HTML contained one `Área para dibujar la firma` and one `Limpiar firma`. This validates server rendering and public-page integration only. |
| Real touch proof | The maintainer explicitly confirmed that the corrected canvas allows finger drawing on a real mobile device. No device/browser details were provided or inferred. |
| Rollback boundary | Revert `components/firma/canvas-firma.tsx`, `components/firma/canvas-firma.test.tsx`, the signature integration in `components/do-fr-100/sections.tsx` and `app/solicitud/creditos-adicionales/page.tsx`, the focused page test guard, and this Phase 2 section. Phase 1 static fields and all Phase 3 API/submission work remain outside the boundary. |

## Phase 2 Mobile Signature Correction

- Scope: correct the reported unusable touch drawing interaction only; Phase 3 was not changed.
- Delivery mode: single-pr + size:exception (maintainer-authorized).
- Artifact store: OpenSpec, per native SDD status.
- Status: correction and real-device confirmation complete; task 2.8 is complete.

### Root-Class Evidence

- Reported symptom: a real-phone manual attempt could not produce a usable signature stroke.
- Reproduction boundary: no device/browser-specific reproduction is claimed. A regression test that removes Pointer Capture APIs failed before the correction: `setPointerCapture` threw and `pointermove` could not draw because it was gated on `hasPointerCapture`.
- Additional regression: a second `pointerdown` resized the canvas again, which clears earlier pixels. The new test failed before the correction because `scale` was called twice.
- Correction: Pointer Events remain primary and `touch-action: none` remains. Pointer capture is guarded as progressive enhancement, movement depends on an active stroke rather than capture support, and canvas sizing occurs only before the first stroke.

### TDD Cycle Evidence

| Tasks | Test file and layer | Safety net | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|
| Phase 2 mobile correction (2.2 behavior) | `components/firma/canvas-firma.test.tsx` — integration | `pnpm exec vitest run components/firma/canvas-firma.test.tsx` → 1 file / 4 tests passed | After adding two behavior tests, the same command failed: 2 of 6 failed; missing Pointer Capture produced `TypeError: canvas.setPointerCapture is not a function`, and the second-stroke assertion observed `scale` twice. | Same command → 1 file / 6 tests passed after the smallest production correction. | The no-capture stroke and second-stroke preservation cases exercise independent paths; existing available-capture, blank, and clear cases remain covered. | Extracted guarded capture/release helpers and a one-time canvas-preparation ref; behavior is unchanged when capture is available. |

### Work Unit Evidence

| Evidence | Result |
|---|---|
| Focused regression/component test | `pnpm exec vitest run components/firma/canvas-firma.test.tsx` → 1 file / 6 tests passed. |
| Focused Phase 2 integration | `pnpm exec vitest run components/firma/canvas-firma.test.tsx app/solicitud/creditos-adicionales/page.test.tsx` → 2 files / 12 tests passed. |
| Full suite | `pnpm test` → 15 files / 90 tests passed. |
| Typecheck | `pnpm exec tsc --noEmit` → exit 0. |
| Lint | `pnpm lint` → `eslint .`, exit 0. |
| Runtime harness | N/A — jsdom validates the pointer-event regression surface but cannot provide finger-on-device proof. |
| Manual proof | The prior real-phone attempt was unusable. After the correction, the maintainer explicitly confirmed that the corrected canvas allows finger drawing on a real mobile device. No device/browser details or broader usability claims are recorded. Task 2.8 is complete. |
| Rollback boundary | Revert `components/firma/canvas-firma.tsx`, `components/firma/canvas-firma.test.tsx`, and this correction section; Phase 1, the signature integration wiring, and all Phase 3 work remain untouched. |

### Next Step

Phase 2 is complete. Phase 3 remains pending and was not implemented in this bounded update.

## Corrección crítica pre-Fase 3 de firma

- Scope: corrige los hallazgos #20, #22, #23, #25, #26, #28 y #29 sin implementar envío, API,
  validación o acuse de la Fase 3.
- Delivery mode: single-pr + size:exception (maintainer-authorized).
- Artifact store: OpenSpec, per current native SDD status.
- Status: success — las correcciones 2.10–2.15 están completas. La evidencia canónica de build
  del maintainer resuelve la verificación requerida; los fallos de sandbox y webpack se conservan
  como historial ambiental/no canónico, no como resultado del código fuente.

### Result Contract

- status: success
- executive_summary: La corrección de firma está completa: el trazo exige 4 píxeles CSS, el
  callback vigente no reinicia la captura, la carga PNG/JPEG es una alternativa accesible y el
  nombre de la figura es exacto. La evidencia canónica local del maintainer confirmó dos builds
  exitosos y la verificación manual final confirmó mouse, dedo y carga/limpieza por teclado.
- artifacts: `tasks.md` marca 2.10–2.15 como completas; este reporte conserva las pruebas,
  mutaciones, diagnósticos y evidencia de build.
- next_recommended: La Fase 3 continúa pendiente y no fue implementada por esta corrección.
- risks: jsdom no demuestra píxeles de canvas, gestos táctiles reales ni el selector nativo de
  archivos, pero el maintainer verificó manualmente el alcance requerido. No se registraron
  versiones de navegador ni detalles de dispositivo; no se infieren afirmaciones más amplias.
- skill_resolution: paths-injected

### Root-Class Evidence

- Un `pointerdown` seguido de `pointerup`, o un desplazamiento menor de 4 píxeles CSS desde el
  origen del gesto, ya no emite una firma. Al alcanzar el umbral, el canvas dibuja, emite PNG y
  marca `hayFirma`.
- La inicialización de la captura ocurre solo al montar. Una referencia actualizada por efecto
  conserva la captura al cambiar la identidad de `onChange` y entrega los eventos posteriores al
  callback vigente.
- El canvas sigue disponible; un control nativo de archivo, etiquetado y enfocable por teclado,
  admite PNG/JPEG como alternativa accesible y produce el mismo `SignatureCapture`.
- La figura deja de exponer el nombre obsoleto `Espacio para firma` y se llama
  `Firma del solicitante`.
- Las pruebas ahora exigen `beginPath`, `moveTo`, `quadraticCurveTo`, `stroke` y
  `toDataURL('image/png')`. No demuestran píxeles del navegador: jsdom no implementa ese nivel
  de canvas.
- Las mutaciones temporales confirmaron la guarda: quitar todos los `stroke()` dejó 1 fallo de 9
  en `canvas-firma.test.tsx`; cambiar PNG por JPEG dejó 1 fallo de 9. Ambas mutaciones se
  restauraron antes de la verificación final.
- La prueba que sustituye `window.devicePixelRatio` restaura el descriptor original en `finally`;
  `vi.restoreAllMocks()` no restaura propiedades redefinidas directamente.
- Verificación manual final del maintainer: con la URL correcta, el dibujo con mouse funciona en
  Chrome de escritorio; el dibujo con dedo funciona en móvil; y la carga de imagen por teclado y
  su limpieza funcionan. No se registraron versiones de navegador ni detalles de dispositivo.
  La aparente regresión de escritorio y su error HMR WebSocket provenían de una URL de desarrollo
  incorrecta, no del canvas.

### Completed Tasks

- [x] 2.10 Umbral determinista de 4 píxeles CSS para un trazo significativo, con casos de toque,
  movimiento menor y trazo válido PNG.
- [x] 2.11 Estabilidad de captura y entrega al callback vigente tras cambiar `onChange`.
- [x] 2.12 Alternativa de imagen PNG/JPEG nativa, etiquetada y reiniciable con el mismo contrato.
- [x] 2.13 Nombre accesible actualizado a `Firma del solicitante`.
- [x] 2.14 Guardas de comandos de dibujo, codificación PNG y restauración de descriptor DPR.
- [x] 2.15 Documentación y verificación completadas con evidencia canónica del maintainer.

### TDD Cycle Evidence

| Tasks | Test file and layer | Safety net | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|
| 2.10–2.14 | `components/firma/canvas-firma.test.tsx` and `app/solicitud/creditos-adicionales/page.test.tsx` — integration | `pnpm exec vitest run components/firma/canvas-firma.test.tsx app/solicitud/creditos-adicionales/page.test.tsx` → 2 files / 12 tests passed | After adding the correction cases, the same command failed: 2 files, 6 failed / 9 passed. The failures exposed tap-as-signature, duplicate `stroke()`, callback reset, missing upload control, stale figure name, and missing control ID. | After the production correction: the same command → 2 files / 15 tests passed. | Tap/sub-threshold versus meaningful movement, initial versus latest callback, canvas versus uploaded PNG, and current versus stale figure name exercise separate paths. | Replaced the reset-on-callback effect with a latest-callback ref effect; extracted emit/clear helpers and the 4-pixel constant. The focused suite stayed green after the lint-driven ref adjustment. |

### Work Unit Evidence

| Evidence | Result |
|---|---|
| Focused correction tests | `pnpm exec vitest run components/firma/canvas-firma.test.tsx app/solicitud/creditos-adicionales/page.test.tsx` → 2 files / 15 tests passed. |
| Full suite | `pnpm test` → 15 files / 93 tests passed. |
| Mutation checks | Sin `stroke()`: 1 file / 1 failed, asertando el conteo de `context.stroke`; PNG→JPEG: 1 file / 1 failed, asertando `toDataURL('image/png')`. Las fuentes se restauraron inmediatamente. |
| Typecheck | `pnpm exec tsc --noEmit` → exit 0. |
| Lint | First run failed on a render-time ref write; after moving it to an effect, `pnpm lint` → exit 0. |
| Historial del sandbox | En este sandbox, `pnpm build` falló dos veces: Turbopack no pudo crear un proceso que enlace un puerto, `Operation not permitted`. Es una limitación de ese entorno, no un diagnóstico del código fuente. |
| Diagnóstico webpack (no canónico) | `pnpm exec next build --webpack` se ejecutó una vez y falló: `Could not parse output from TypeScript's --showConfig.` No sustituye ni aprueba el comando canónico. |
| Build canónico del maintainer | El maintainer ejecutó `pnpm build` localmente con código 0 en 8.4142 s: Next.js 16.3.5 compiló, TypeScript terminó, 9/9 páginas estáticas se generaron y `/solicitud/creditos-adicionales` se emitió estática. Una segunda corrida de `next build` también compiló, terminó TypeScript, generó 9/9 páginas y emitió el mismo inventario de rutas. Esta evidencia resuelve la verificación requerida. |
| Límites de jsdom | jsdom ejercita los límites de Pointer Events e input nativo, pero no demuestra píxeles de canvas, gesto táctil real ni selector de archivos nativo. |
| Verificación manual final | El maintainer confirmó mouse en Chrome de escritorio con la URL correcta, dedo en móvil, y carga/limpieza de imagen por teclado. No se registraron versiones ni detalles de dispositivo. El error HMR WebSocket correspondía a la URL de desarrollo incorrecta, no al canvas. |
| Rollback boundary | Revert `components/firma/canvas-firma.tsx`, `components/firma/canvas-firma.test.tsx`, `components/do-fr-100/sections.tsx`, `app/solicitud/creditos-adicionales/page.test.tsx`, and this correction section. Existing Phase 1 evidence and all Phase 3 source remain outside the boundary. |

### Next Step

La corrección crítica pre-Fase 3 está completa. La Fase 3 de envío/API sigue pendiente y no se
implementó.

## Phase 3 — Submission, validation, error handling, and receipt

- Scope: public DO-FR-100 submission only. The internal `createRequest` flow and
  `app/requests/new/**` were not changed.
- Delivery mode: single PR + maintainer-authorized `size:exception`.
- Artifact store: OpenSpec, per native SDD status.
- Status: implementation and local verification complete for 3.1–3.18. Task 3.19 remains
  pending because no backend was reachable at `127.0.0.1:8080`; no synthetic submission was made.

### Completed Tasks

- [x] 3.1–3.3 Added `submitPublicRequest` with route-scoped definition code and an explicit
  eleven-field allowlist; added `PublicRequestBody` and the intentionally identifier-free receipt.
- [x] 3.4–3.7 Added trimmed required-field and contract-limit UX validation for all eleven fields.
- [x] 3.8 Preserved the semester as its submitted string value.
- [x] 3.9–3.13 Added in-place error handling: 404 does not disclose definition state, 413 directs
  the student to clear and redraw the signature, RFC 9457 422 field arrays attach errors to named
  controls, and 429 reuses `apiErrorMessages` / `Retry-After` text without resetting entered data.
- [x] 3.14–3.16 Replaced the form in the same route after 201; the receipt contains neither an ID,
  state, nor query link and says Coordination will reply to the supplied email.
- [x] 3.17 Verified the new screen and receipt make no claim of signature legal validity.
- [x] 3.18 Ran focused, full, type, lint, build, diff, and route-protection checks below.
- [ ] 3.19 Real synthetic public submission: blocked. `curl --connect-timeout 2` to
  `127.0.0.1:8080/api/public/requests/ADICION_CREDITOS` returned connection failure / HTTP 000.
  The backend was not started or altered; therefore no request was created.

### TDD Cycle Evidence

| Tasks | Test layer | Safety net | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|
| 3.1–3.3 | `lib/api.test.ts` unit | Existing API suite passed before this cycle | `pnpm exec vitest run lib/api.test.ts` → 2 failures: `submitPublicRequest is not a function` | Same focused command → 27/27 passed after API/types implementation | Route, exact eleven-field allowlist, absent `definitionCode`, and preserved semester exercise separate contract paths | Explicit destructuring isolates the body from UI state. |
| 3.4–3.8, 3.14–3.16 | `page.test.tsx` integration | Existing page suite was present; new baseline was 6 passing Phase 1/2 tests | After adding submit/validation tests, focused page command → 22 failures because no submit action existed | Focused API+page command → 58/58 passed after validation, submit, and in-place receipt implementation | Each field is tested blank, all ten limited strings are tested over-limit, signature has its own absence path, and 201 preserves semester | Centralized limits and validation reduce repeated UI rules. |
| 3.9–3.13, 3.17 | `page.test.tsx` integration | Same focused suite | **FAILED ordering:** error-specific regression tests were added after the initial production handler. They passed, but they are not represented as RED-first evidence. | 58/58 focused tests passed; 404, 413, 422, and 429 preserve populated inputs and display the specified outcome | Separate status paths and a real `parseProblem` extension-array unit test | `ApiError.fieldNames` retains RFC 9457 extension arrays instead of parsing Spanish detail text. |
| 3.18 | Workspace verification | N/A | N/A — verification task | All listed checks passed | Focused and workspace commands cover separate layers | None needed. |

### Work Unit Evidence

| Evidence | Result |
|---|---|
| Focused RED/GREEN API command | `pnpm exec vitest run lib/api.test.ts`: RED 2 failed, then GREEN 27/27 passed. |
| Focused Phase 3 command | `pnpm exec vitest run lib/api.test.ts app/solicitud/creditos-adicionales/page.test.tsx` → 2 files / 58 tests passed. |
| Full suite | `pnpm test` → 15 files / 121 tests passed. |
| Typecheck | `pnpm exec tsc --noEmit` → exit 0. `.next` was not deleted because it may belong to a live user dev server. |
| Lint | `pnpm lint` (`eslint .`) → exit 0. |
| Build | `pnpm build` → exit 0; Next 16.3.5 generated 9/9 static pages including `/solicitud/creditos-adicionales`. |
| Internal-route protection | `rg -c '^\s*it\(' app/requests/new/page.test.tsx` → `2`; `git diff -- app/requests/new/page.tsx app/requests/new/page.test.tsx` → empty. |
| Runtime/public-route harness | No backend was reachable: GET and POST probes to local `127.0.0.1:8080` returned connection failure / HTTP 000. No backend process, config, or source was changed. |
| Diff hygiene | `git diff --check --` limited to Phase 3 paths → exit 0. Before/after status preserved unrelated staged `next.config.mjs` and unstaged OpenSpec/configuration work. |
| Rollback boundary | Revert `lib/api.ts`, `lib/api.test.ts`, `lib/types.ts`, `app/solicitud/creditos-adicionales/page.tsx`, `app/solicitud/creditos-adicionales/page.test.tsx`, and `components/do-fr-100/sections.tsx`; retain Phase 1/2 signature work and internal request pages. |

### Result Contract

- status: partial
- executive_summary: Phase 3 source and verification are complete through 3.18; 3.19 is honestly pending because the local backend was unavailable. Strict TDD evidence records the late test-ordering defect for 3.9–3.13 and 3.17 rather than inventing RED evidence.
- artifacts: tasks.md marks 3.1–3.18 complete and leaves 3.19 pending; this cumulative apply-progress preserves Phase 1, Phase 2, corrections, and Phase 3 evidence.
- next_recommended: make a single synthetic submission only after a local backend is already reachable, then run SDD verification.
- risks: a live public submission has not been observed; browser-level signature behavior retains the previously recorded maintainer evidence. No submission was attempted against a remote or unavailable local host.
- skill_resolution: paths-injected

## Task 3.19 and closing criteria — real end-to-end submission

- [x] 3.19 A real public submission was executed on 2026-09-18 through the browser, with Postgres
  (host port 5433), the backend (8080) and the Next dev server (3000) all running. The earlier block
  is lifted: the backend change has all 47 of its tasks marked, and `PUBLIC_CAPTURE_ENABLED` is
  `true` for `ADICION_CREDITOS`, which was checked before submitting because a missing flag returns
  404 and would look like a frontend failure.

### Database evidence

| Evidence | Result |
|---|---|
| Persisted row | `request` `a571f358-608d-4d2c-833c-b0f3ab910973`, `created_at 2026-09-18 00:52:17` |
| Definition and state | `ADICION_CREDITOS`, initial state `EN_COORDINACION` |
| Contract fields | All ten text fields stored intact, including the five added by migration `V3.3.0` |
| Semester | Stored as `'8'`, untransformed, as task 3.8 requires |
| Signature encoding | `student_signature` is 9774 characters starting `data:image/png;base64,iVBORw0KGg` — the base64 PNG header, not a JPEG |
| Audit trail | `request_transition_log` row with actor `portal-publico@tramita.local`, `active = false`, no `from_state_id` |
| Receipt | Screen showed «Solicitud recibida» with no identifier, state or lookup link, and the URL never changed |

### Closing criteria

Eight of the ten criteria are now met and recorded in `tasks.md` with the command that measured each
one. Verification was re-run with the cache cleared: `rm -rf .next && pnpm exec tsc --noEmit` exit 0,
`pnpm lint` exit 0, `pnpm test` 122 passing across 15 files, `pnpm build` compiled with
`/solicitud/creditos-adicionales` as a static route.

Two criteria remain open, deliberately:

- **Zero real personal data in the repository.** Still unmet. `lib/mock-data.ts` holds six records
  with realistic full names and addresses under the real institutional domain
  un dominio estudiantil institucional, and `ORDEN.md` is still tracked. Issue #14 owns this; closing it
  here would claim work that was not done.
- **Deployment checklist note about the public origin in the CORS allowlist** (task 0.3). Not
  written yet. No test fails because of it, which is exactly why it is easy to lose.

### Result Contract

- status: success
- executive_summary: The public capture channel works end to end against a live backend. Task 3.19 is closed with database evidence rather than a claimed submission, and eight of ten closing criteria are met.
- artifacts: `tasks.md` records 3.19 and the measured closing criteria; this cumulative `apply-progress.md` preserves every phase.
- next_recommended: Resolve issue #14 for the personal-data criterion, and write the deployment note for task 0.3.
- risks: `pnpm audit` still reports 13 vulnerabilities (3 moderate, 10 high) in transitive dependencies; none are in `next` and none are critical. Signature legal validity and the biometric-data question remain open with the Coordination.

## Confirmed issue correction batch — #24, #26, #30

**Scope:** Only behavior reproduced from current code. No GitHub issue, remote, staging, or commit was changed. Delivery remains a single PR with maintainer-approved `size:exception`.

### Completed tasks

- [x] 4.1 #24: deferred PNG serialization until the end of a meaningful stroke; each drawn segment has an independent path that starts at the prior rendered endpoint; cancellation now emits the visible signature.
- [x] 4.2 #26 (confirmed subset only): added an assertion that canvas preparation ends with `lineWidth = 2`, `lineCap = 'round'`, and `lineJoin = 'round'` from a `1`/`butt`/`miter` mock.
- [x] 4.3 #30: retained separate `missingFields` and `invalidFields` in `ApiError`; the public form maps known missing fields to required, known invalid fields to review, gives missing precedence, filters unknown names, and renders a generic form error for unknown-only 422 responses.
- [ ] 4.4 #26 remainder: pending independent verification. No broader mutation-survivor claim was implemented or marked complete.

### TDD Cycle Evidence

| Task | RED | GREEN | REFACTOR |
| --- | --- | --- | --- |
| 4.1 #24 | `pnpm test components/firma/canvas-firma.test.tsx lib/api.test.ts app/solicitud/creditos-adicionales/page.test.tsx` → failed: `beginPath` was called once instead of twice; PNG was emitted on move; cancellation did not emit. | Same focused command → 71 passing. | Extracted the rendered-endpoint ref, retaining separate raw and rendered points to make each midpoint segment continuous. |
| 4.2 #26 confirmed subset | The new assertion was written against the existing `1`/`butt`/`miter` mock, but it passed immediately because `resizeCanvas` already sets all three required values. No production correction was warranted, so there is no honest RED result. | Focused command → 71 passing. | None; the scope was an already-satisfied invariant, not a new code path. |
| 4.3 #30 | Focused command → failed: `missingFields` was undefined and the page neither differentiated messages nor surfaced unknown-only 422 errors. | Same focused command → 71 passing. | Preserved the legacy flattened `fieldNames` property for existing consumers while adding separate typed arrays. |

### Work Unit Evidence

| Evidence | Result |
| --- | --- |
| Focused test command | `pnpm test components/firma/canvas-firma.test.tsx lib/api.test.ts app/solicitud/creditos-adicionales/page.test.tsx` → 3 files, 71 passing. |
| Runtime harness | N/A: the corrections are canvas event and mocked RFC 9457 error-boundary behavior; this workspace has no E2E runner. |
| Full test suite | `pnpm test` → 15 files, 124 passing. |
| Type checking | `pnpm exec tsc --noEmit` → exit 0. |
| Linting | `pnpm lint` → exit 0. |
| Build | N/A — not required for this correction batch: it changes existing client behavior and tests without adding a route or build-time integration boundary. |
| Diff whitespace | `git diff --check -- <changed paths>` → exit 0. |
| Rollback boundary | Revert only `components/firma/canvas-firma.{tsx,test.tsx}`, `lib/api.{ts,test.ts}`, `app/solicitud/creditos-adicionales/page.{tsx,test.tsx}`, and this correction's OpenSpec entries; earlier public-form work remains intact. |

### Result Contract

- status: success
- executive_summary: Implemented and verified only the current-code-confirmed portions of #24, #26, and #30. The unverified #26 remainder remains explicitly pending.
- artifacts: `tasks.md` marks 4.1–4.3 complete and keeps 4.4 unchecked; this append-only cumulative `apply-progress.md` records RED/GREEN and work-unit evidence.
- next_recommended: Run SDD verification or independently reproduce the remaining #26 claims before authorizing any further correction.
- risks: Canvas behavior is covered in jsdom pointer-event tests, not a real device. The broader #26 mutation-survivor report remains unverified and intentionally unimplemented.
- skill_resolution: paths-injected

## Issue #26 final guard — task 4.4

### Completed task

- [x] 4.4: Audited the confirmed remaining local-state-reset survivor. Of 12 applied mutants, 11 were previously killed and one survivor remained; the clear-button disabled-state assertion now kills that exact survivor. No production source change was required because the base behavior was already correct.

### TDD Cycle Evidence

| Task | Safety Net | RED / GUARD | GREEN | TRIANGULATE | REFACTOR |
| --- | --- | --- | --- | --- | --- |
| 4.4 #26 local-state reset | `pnpm exec vitest run components/firma/canvas-firma.test.tsx` → 10 passing before the assertion. | Conventional RED is N/A: the assertion first ran green against correct current behavior. Mutation RED/GUARD: a disposable copy replaced `setHayFirma(capture.hayFirma)` with `if (capture.hayFirma) setHayFirma(true)`; the focused test failed exactly at the post-clear disabled-button assertion (1 failed, 9 passed). | `pnpm exec vitest run components/firma/canvas-firma.test.tsx` → 10 passing. | One state transition is in scope: meaningful draw enables the control, clear disables it. The disposable mutant proves the reset branch is exercised. | None; production source was not changed. |

### Audit disposition

- The historical `19/23` count and the `pointerMove`/`onChange` claim are obsolete.
- jsdom does not rasterize real canvas pixels; manual Chrome/mobile evidence remains runtime evidence, not automated raster proof.
- The broader audit result is now 12 applied mutants, 11 previously killed, and one confirmed survivor killed by this regression guard.

### Work Unit Evidence

| Evidence | Result |
| --- | --- |
| Focused test command | `pnpm exec vitest run components/firma/canvas-firma.test.tsx` → 10 passing. |
| Disposable mutation proof | Temporary copy under `/tmp/canvas-mutation-proof.*`; exact local-state-reset mutant applied and verified at its changed line; focused run → 1 failed, 9 passed at the post-clear disabled-button assertion. |
| Runtime harness | N/A: this is a jsdom component-state regression guard; existing manual Chrome/mobile evidence is runtime evidence but not automated raster proof. |
| Full test suite | `pnpm test` → 15 files, 124 passing. |
| Type checking | `pnpm exec tsc --noEmit` → exit 0. |
| Linting | `pnpm lint` → exit 0. |
| Build | N/A — not required for this correction batch: it changes an existing client regression guard without adding a route or build-time integration boundary. |
| Diff whitespace | `git diff --check -- components/firma/canvas-firma.test.tsx openspec/changes/formulario-do-fr-100-creditos-adicionales/tasks.md openspec/changes/formulario-do-fr-100-creditos-adicionales/apply-progress.md` → exit 0. |
| Rollback boundary | Revert `components/firma/canvas-firma.test.tsx` and this task-4.4 OpenSpec evidence only; production behavior is unchanged. |

### Result Contract

- status: success
- executive_summary: Added the final #26 local-state-reset regression guard, proved it kills the confirmed survivor, and completed the required repository checks.
- artifacts: `tasks.md` marks 4.4 complete and this cumulative `apply-progress.md` records the guard and mutation validation.
- next_recommended: Proceed to SDD verification or archive; only the unrelated task 0.3 and zero-real-PII criterion remain open.
- risks: jsdom cannot prove raster pixels; manual Chrome/mobile evidence is retained as runtime evidence only.
- skill_resolution: paths-injected

## Final closure batch — deployment checklist and fixture hygiene

### Completed tasks

- [x] 0.3: Added `docs/deployment-checklist.md`; cross-origin deployments must allowlist the exact public frontend origin, never a wildcard.
- [x] Zero-real-PII criterion: moved `ORDEN.md` to ignored `notas-locales/`, split UI constants into `lib/ui-constants.ts`, and moved anonymized role-based fixtures to `lib/fixtures/mock-requests.ts`.

### TDD / GUARD Evidence

| Task | RED / GUARD | GREEN |
| --- | --- | --- |
| Fixture hygiene | RED: `pnpm exec vitest run lib/fixtures/mock-requests.test.ts` failed because the fixture module did not exist. | Focused fixtures plus impacted store/new-request tests: 6 passing. |
| Deployment checklist | GUARD: structural readback confirmed the exact-origin/no-wildcard instruction. | Readback passed. |
| Tracked-tree scan | GUARD: current-worktree scan for the known institutional domain and six original names returned no paths; `ORDEN.md` is absent and `notas-locales/ORDEN.md` is ignored. | Criteria satisfied locally. |

### Work Unit Evidence

| Evidence | Result |
| --- | --- |
| Focused tests | `pnpm exec vitest run lib/fixtures/mock-requests.test.ts lib/store.test.ts app/requests/new/page.test.tsx` → 6 passing. |
| Full suite | `pnpm test` → 16 files, 125 passing. |
| Type checking | `pnpm exec tsc --noEmit` → exit 0. |
| Linting | `pnpm lint` → exit 0. |
| Build | Repeated bounded `pnpm build` attempts, including escalated execution, were blocked by Turbopack `creating new process → binding to a port → Operation not permitted` at `app/globals.css`; exit 1 is not a code verdict. |
| Diff whitespace | `git diff --check` → exit 0. |
| Task A rollback | Revert `docs/deployment-checklist.md` and task evidence. |
| Task B rollback | Revert `lib/ui-constants.ts`, `lib/fixtures/`, importer changes, ignored-note move, and hygiene evidence together. |

### Result Contract

- status: partial
- executive_summary: Both final task criteria are complete locally; all tests, type checking, linting, scans, and diff checks passed. Build is environment-blocked by Turbopack port permission.
- artifacts: tasks and cumulative apply-progress updated; deployment checklist, separated UI constants, anonymized fixture, and fixture test added.
- next_recommended: SDD verification may treat the build as an environment blocker and confirm it in a permitted build environment before archive.
- risks: Build remains unavailable in this runtime; no remote issue was changed.
- skill_resolution: paths-injected
