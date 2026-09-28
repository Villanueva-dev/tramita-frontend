# Request detail density

## Objective
Use the current-state banner's desktop width efficiently and avoid an empty student-code field without hiding existing data.

## Problem and why
At 1920 × 1080, the current-state block is 1152 × 242.5 px, with roughly 586 px unused to the right of its content. The public request form no longer sends `studentCode`, so the detail displays an empty “Código” row for those requests; the backend still supports optional values.

## Authorized scope and constraints
- Adjust only the current-state banner layout and the student-code row in request detail, with focused tests.
- Preserve state and responsibility prominence, semantic headings, accessibility, and responsive stacking.
- Show student code when non-empty; do not change the subject-table code column or backend contract.
- No remote delivery, PR, or merge is authorized.

## Tasks
- [x] RD-1 — Rebalance the current-state banner at desktop widths while preserving narrow-screen behavior. Route: delegated; visual/layout analysis and component tests require multiple non-trivial files. Acceptance: less wasted horizontal/vertical space at 1920 × 1080; no overflow at 1024, 768, 390, or 320 px; current state, responsible party, and age remain readable. Verification: observed RED then GREEN focused test; full `pnpm test` passed (29 files, 383 tests); typecheck passed; focused ESLint passed; full `pnpm lint` timed out after 60 s; live 1920 × 1080 banner is 1152 × 118.5 px (was 1152 × 242.5 px), with no section/document horizontal overflow at 1280, 1024, 768, 390, or 320 px. Commit: pending.
- [ ] RD-2 — Conditionally render the student's “Código” only for non-empty values. Route: delegated; page logic and tests require multiple non-trivial files. Acceptance: blank code row absent for public requests, populated code remains visible for legacy/direct records, other student fields and subject code unchanged. Verification: RED → GREEN focused tests, `pnpm test`, typecheck, lint, and live sample check. Commit: pending.

## Execution and delivery
- TDD: strict, enabled by project configuration (`openspec/config.yaml` and global marker); runner: `pnpm test`. Each task requires observed RED → GREEN → REFACTOR.
- Forecast: approximately 120–220 authored changed lines for both tasks; advisory only.
- Delivery strategy: `ask-on-risk`; no chain decision needed under the current forecast. Work-unit commits will be counted after each task.
- Reviewed boundary: branch point `main` at `67861a5`; native RDD assessment pending after each work-unit commit.
- Current progress: RD-1 implemented and visually verified; full lint remains unavailable due to a 60-second timeout, while focused ESLint passed. RD-2 not started.
- Next step: commit RD-1 on `fix/request-detail-density`, then implement RD-2 with strict TDD.
