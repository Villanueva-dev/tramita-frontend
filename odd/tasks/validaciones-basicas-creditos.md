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
- Measured (2026-09-26, excluding `odd/`): VAL-1 130 lines, VAL-2 365 lines, 495 combined — above the 400-line policy.
- Decision (maintainer, 2026-09-26): two stacked pull requests, `stacked-to-main`. #75 carries VAL-1 (`90175e1`) against `main`; #76 carries VAL-2 (`8c9389e`) on top of #75's branch and is retargeted to `main` once #75 merges. Both were pushed and opened on 2026-09-26 after the maintainer's explicit approval.
- Branches: `feat/validaciones-basicas-creditos-1` (#75, cut at `90175e1`) and `feat/validaciones-basicas-creditos` (#76).

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
    - RDD: clone-local mode is off; delivery is `disabled/unmanaged`. The pre-commit assessment was unassessable because this task document was untracked, so it was treated as high risk and independently verified.
    - Runtime boundary: N/A; the behavior is local form normalization and validation covered through the page integration tests.
    - Rollback boundary: revert the VAL-1 commit to remove normalization, stricter email validation, their tests, and the matching specification scenarios without affecting the program-catalog task.
    - Commit: `90175e1` (`feat(formulario): normalizar datos y validar correo`).

- [x] **VAL-2 — Replace free-text program with the public catalog**
  - Route: delegated.
  - Trigger: API, types, form components, page state, tests, and specification require coordinated edits.
  - Acceptance criteria:
    - Load programs from `GET /api/public/programs` without authentication.
    - Render a required accessible select whose value comes only from the loaded catalog.
    - Do not hardcode values or rely on response order.
    - Explain loading and failure states; prevent invalid submission without discarding other fields.
    - On catalog failure, block program selection and offer a Retry action; never fall back to free text.
    - Preserve backend `422` field mapping and review-summary behavior.
    - Add focused RED → GREEN → REFACTOR coverage and update the active specification.
  - Checks:
    - `pnpm test -- app/solicitud/creditos-adicionales/page.test.tsx lib/api.test.ts components/do-fr-100/review-summary.test.tsx`
    - `pnpm exec tsc --noEmit`
  - Evidence:
    - Handoff: Codex implemented VAL-2 and stopped before recording evidence (token limit). The orchestrator session (Claude) reviewed the diff, gathered the evidence below and committed after the maintainer's explicit approval on 2026-09-26.
    - Strict TDD RED: with the VAL-2 test files applied on top of `90175e1` in a separate worktree, `pnpm test -- app/solicitud/creditos-adicionales/page.test.tsx lib/api.test.ts` failed 38 tests, including the six new catalog tests (loading, options without preselection, byte-for-byte value, failure + Retry, StrictMode replay, `listPublicPrograms`).
    - GREEN: `pnpm test` — 27 files, 334 tests passed (2026-09-26 16:30, on the committed tree).
    - TypeScript: `pnpm exec tsc --noEmit` — exit 0. Lint: `pnpm lint` — no findings.
    - Live check in Chrome against the local backend with feature 009: the select lists the 13 real programs in backend order with no preselection; «Continuar» with no program blocks the step, marks the select invalid and focuses it; a selected program passes validation and appears in the review summary. Not exercised live: catalog failure and Retry (covered by tests).
    - Independent verification: the orchestrator review found no behavioral defect; non-blocking follow-ups are listed under Progress.
    - RDD: clone-local mode is off; delivery is `disabled/unmanaged`.
    - Runtime boundary: `GET /api/public/programs` verified live (200, 13 programs, no session).
    - Rollback boundary: reverting the VAL-2 commit restores the free-text field, which backend `main` already rejects with 422; fixing forward is preferred.
    - Commit: `8c9389e` (`feat(formulario): elegir el programa del catálogo público`).

## Progress

- Branch created from clean `main`.
- The maintainer confirmed that normalization applies only to single-line fields; `reason` remains untouched.
- The maintainer confirmed that any well-formed email domain is accepted; institutional domains are not required.
- VAL-1 is implemented and independently verified after correcting a controlled-input whitespace regression.
- The maintainer approved block-and-retry when the program catalog is unavailable, with no free-text fallback.
- VAL-2 is implemented (Codex) and verified by the orchestrator session: RED observed against `90175e1`, GREEN 334/334, live check against the backend with feature 009.
- Review follow-ups, not blocking: an empty catalog (`[]` with status `ready`) blocks only through the generic required-field message, with no test or scenario; the byte-for-byte test uses double spaces rather than an accented name; the Retry control is a plain `<button>` while the wizard uses the project `Button`.
- Authored size vs `main` (excluding `odd/`): VAL-1 130 lines, VAL-2 365 lines, 495 combined — above the 400-line review policy for a single pull request.

## Next Step

Review and merge #75, then retarget #76 to `main` and merge it; confirm each merge with `gh pr view <N> --json state`. The non-blocking follow-ups listed under Progress stay open.
