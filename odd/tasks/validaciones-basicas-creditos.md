# Basic Validation Improvements for Additional Credits

## Objective

Reduce preventable submission errors in the public additional-credits form without inventing institutional rules.

## Problem

The form currently accepts unnormalized text and a permissive email shape, while the academic program is free text even though the backend exposes an authoritative public catalog and validates membership in that catalog.

## Why

Prevent malformed or ambiguous data from reaching Coordination and reduce avoidable correction cycles.

## Scope

- Normalize submitted single-line text according to the maintainer-confirmed whitespace policy.
- Validate email addresses consistently with the backend contract, without requiring an institution-specific domain.
- Load `GET /api/public/programs` and make the academic program selectable from that authoritative catalog.
- Preserve the existing five-step flow, field-level errors, review summary, and backend error handling.
- Update the active specification and focused tests with the implemented behavior.

## Out of Scope

- Hardcoded catalogs for campus, faculty, modality, or semester.
- Cross-field academic consistency rules without an authoritative backend source.
- Changes to annex rules or backend behavior.
- Any normalization or restructuring of `reason` / “Compromisos adquiridos”.

## Constraints

- Strict TDD is enabled by repository instructions.
- Test runner: `pnpm test` (Vitest + Testing Library).
- Do not hardcode the program list or depend on its order.
- Preserve user-entered data when catalog loading or submission fails.
- Technical artifacts remain in English; existing user-facing copy remains in the project's language.
- Per-task authored-line target is approximately 400 lines and is advisory only.

## Delivery

- Strategy: `ask-on-risk`.
- Forecast: approximately 250–350 authored changed lines, excluding generated files.
- Expected delivery: one pull request; push and PR creation require a separate user decision.
- Branch: `feat/validaciones-basicas-creditos`.

## Tasks

- [x] **VAL-1 — Normalize text and strengthen email validation**
  - Route: delegated.
  - Trigger: implementation and tests require coordinated non-trivial edits in at least two files.
  - Acceptance criteria:
    - Trim surrounding whitespace and collapse repeated internal whitespace in single-line fields before validation and submission.
    - Preserve `reason` exactly as entered.
    - Reject malformed email addresses using the repository's existing complete-address convention (`local@domain.suffix`).
    - Accept any well-formed domain; do not require an institutional provider.
    - Preserve field-level accessible errors and step navigation.
    - Add focused RED → GREEN → REFACTOR coverage.
  - Checks:
    - `pnpm test -- app/solicitud/creditos-adicionales/page.test.tsx`
    - `pnpm exec tsc --noEmit`
  - Evidence:
    - Strict TDD RED: incomplete-domain email and normalization tests failed before implementation; the incremental typing regression test then reproduced whitespace loss (`EstudianteSintético`).
    - GREEN: `pnpm test -- app/solicitud/creditos-adicionales/page.test.tsx` — 27 files, 328 tests passed.
    - TypeScript: `pnpm exec tsc --noEmit` — passed with no diagnostics.
    - Independent verification: PASS after one scoped correction; no remaining findings.
    - Parent spot check: focused test command passed with 27 files and 328 tests.
    - RDD: clone-local mode is off. Native assessment was unassessable because this task document was untracked, so it was treated as high risk and independently verified.
    - Runtime boundary: N/A; the behavior is local form normalization and validation covered through the page integration tests.
    - Rollback boundary: revert the VAL-1 commit to remove normalization, stricter email validation, their tests, and the matching specification scenarios without affecting the program-catalog task.
    - Commit: pending.

- [ ] **VAL-2 — Replace free-text program with the public catalog**
  - Route: delegated.
  - Trigger: API, types, form components, page state, tests, and specification require coordinated edits.
  - Acceptance criteria:
    - Load programs from `GET /api/public/programs` without authentication.
    - Render a required accessible select whose value comes only from the loaded catalog.
    - Do not hardcode values or rely on response order.
    - Explain loading and failure states; prevent invalid submission without discarding other fields.
    - Preserve backend `422` field mapping and review-summary behavior.
    - Add focused RED → GREEN → REFACTOR coverage and update the active specification.
  - Checks:
    - `pnpm test -- app/solicitud/creditos-adicionales/page.test.tsx lib/api.test.ts components/do-fr-100/review-summary.test.tsx`
    - `pnpm exec tsc --noEmit`
  - Evidence: pending.

## Progress

- Branch created from clean `main`.
- The maintainer confirmed that normalization applies only to single-line fields; `reason` remains untouched.
- The maintainer confirmed that any well-formed email domain is accepted; institutional domains are not required.
- VAL-1 is implemented and independently verified after correcting a controlled-input whitespace regression.

## Next Step

Commit VAL-1 as a reviewable work unit, then begin VAL-2 with an observed failing test.
