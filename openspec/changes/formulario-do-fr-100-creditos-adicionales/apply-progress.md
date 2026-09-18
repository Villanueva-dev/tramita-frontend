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
