# Tasks: Pantalla del formato DO-FR-100 — matrícula de créditos adicionales

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~750–950 (6 archivos nuevos: `page.tsx`, `sections.tsx`, `motivos.ts`, `checkbox.tsx`, 2 archivos de test) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 esqueleto+guardas → PR 2 envío+validación |
| Delivery strategy | ask-on-risk — consultada y resuelta antes de `apply` |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

PR 1 se abre contra `main` y se mergea antes de empezar PR 2, que sale de `main` ya
actualizado. Sin rebases ni PRs apuntando a ramas de feature: no hay revisores
concurrentes que justifiquen esa ceremonia. PR 1 es demostrable por sí solo —la pantalla
se ve aunque todavía no registre—, que es lo que habilita pedir feedback temprano.

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Esqueleto fiel al papel + guardas de código único | PR 1 | `pnpm test -- do-fr-100` | Abrir `/formatos/do-fr-100` con sesión y backend activos | Revierte 6 archivos nuevos; sin huella en `requests/new`, `lib/`, `app-shell.tsx` |
| 2 | Envío real, validación de obligatoriedad/límites y errores | PR 2 | `pnpm test -- do-fr-100` | Registrar una solicitud real con `ADICION_CREDITOS` sembrado | Revierte solo el envío; el esqueleto de PR 1 queda visible y de solo lectura |

## Fase 1 (PR 1) — Esqueleto y guardas

- [ ] 1.1 RED `page.test.tsx`: orden y rótulos de las 6 tablas — falla, la ruta no existe.
- [ ] 1.2 GREEN: crear `app/formatos/do-fr-100/page.tsx` (monta `AppShell`) + `components/do-fr-100/sections.tsx`, 6 tablas estáticas.
- [ ] 1.3 RED `page.test.tsx`: tabla 2 — 4 checkboxes, 3 `disabled` sin marcar, 1 `disabled` marcada, dentro de `fieldset`+`legend`; click en las 3 no marca ninguna.
- [ ] 1.4 GREEN: crear `components/ui/checkbox.tsx`; tabla 2 con `fieldset`/`legend`/nota `aria-describedby`.
- [ ] 1.5 RED `page.test.tsx`: tabla 4 — 14 checkboxes de motivo + "Otro: ¿cuál?".
- [ ] 1.6 RED `page.test.tsx`: guarda `workflow-requests` (a) — `queryAllByRole('combobox')` = 0.
- [ ] 1.7 GREEN: crear `components/do-fr-100/motivos.ts` (14 rótulos); tablas 4 y 6 (firmas, solo espacio) en `sections.tsx`.
- [ ] 1.8 RED: crear `definition-code.test.ts` — guarda `workflow-requests` (b): lee `page.tsx` con `node:fs`, cuenta `ADICION_CREDITOS`, espera 1.
- [ ] 1.9 GREEN: ajustar `page.tsx` a un único literal.
- [ ] 1.10 Verificar `pnpm test` completo; `app/requests/new/page.test.tsx` **sin editar** y con todos sus `it(...)` verdes — contar con `rg -c '^\s*it\(' app/requests/new/page.test.tsx` al ejecutar, no citar el número.
- [ ] 1.11 Verificar `rm -rf .next && pnpm exec tsc --noEmit` sin errores.

## Fase 2 (PR 2) — Envío, validación y errores

- [ ] 2.1 RED `page.test.tsx`: envío con los 5 campos → cuerpo = 5 campos + `definitionCode`; `semester` viaja `"8"` sin transformar.
- [ ] 2.2 GREEN: estado + `handleSubmit` en `page.tsx`; `createRequest` con el allowlist de `lib/api.ts:180`.
- [ ] 2.3 RED `page.test.tsx`: llenar los 8 campos no persistidos y enviar → el cuerpo no los contiene.
- [ ] 2.4 GREEN: confirmar que `sections.tsx` no los propaga al estado enviado (el allowlist ya lo impide).
- [ ] 2.5 RED `page.test.tsx`: `program`/`semester`/`reason` vacíos tras `trim()`, y los 5 campos sobre su límite (120/20/120/50/2000) → inválidos sin POST (Decisión 4, +3 tests).
- [ ] 2.6 GREEN: extender `validate()` con obligatoriedad y límites de los 5 campos.
- [ ] 2.7 RED `page.test.tsx`: `422` → error atado a `definitionCode`; otro error → banner de formulario.
- [ ] 2.8 GREEN: `catch` en `handleSubmit` con `ApiError`/`apiErrorMessages`, patrón de `app/requests/new/page.tsx:96-104`.
- [ ] 2.9 Verificar `pnpm test` completo; `rm -rf .next && pnpm exec tsc --noEmit` sin errores.
- [ ] 2.10 Verificar manual: registrar una solicitud real contra el backend levantado.

## Cierre — Success Criteria (medidos)

- [ ] Pantalla reconocible para quien usa el formato en papel (juicio de la Coordinación).
- [ ] Registra una solicitud real con los 5 campos que persisten.
- [ ] Test confirma que ningún campo no persistido llega al cuerpo (tarea 2.3).
- [ ] `pnpm test` verde con los tests nuevos; `pnpm exec tsc --noEmit` sin errores (con `rm -rf .next` antes).
- [ ] `app/requests/new/page.test.tsx` intacto y con todos sus `it(...)` verdes. El conteo se mide al cerrar con `rg -c '^\s*it\(' app/requests/new/page.test.tsx`: el «9» de esta change venció al integrar `ede7bc3`, que redujo esa suite.
- [ ] Cero datos personales reales en cualquier archivo del repo.
- [ ] Las cinco preguntas a la Coordinación (`proposal.md`) quedan formuladas, con respuesta registrada o explícitamente pendientes.
