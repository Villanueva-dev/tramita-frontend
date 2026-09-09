# Archive Report — Cliente HTTP: alinear `createRequest` al contrato 003

**Change**: `cliente-http-contrato-003`  
**Date**: 2026-09-08  
**Status**: ✅ Archived and closed  
**Store**: OpenSpec (files)  
**Review Gate**: Disabled (RDD off by user decision, 2026-09-08)

---

## Executive Summary

Change `cliente-http-contrato-003` ha sido archivada exitosamente tras completar su ciclo SDD
completo: propuesta aprobada → especificación delta → diseño con decisiones trazables → 12 tasks
TDD ejecutadas (todas ✅) → verificación independiente (verdict: PASS, 0 blockers) → merge de
delta spec e integración de commit con código.

El cambio es **pequeño y quirúrgico**: una sola función y un solo tipo, plenamente retrocompatible,
que amplía el cliente HTTP de tres a seis campos, alineándolo con la capacidad que el backend
(contrato 003) ya exponía. **Cero defectos identificados.** El consumidor existente permanece sin
modificar y funciona correctamente.

---

## Artifact Inventory

### Definición y Cambio

| Artefacto | Ubicación | Observaciones |
|---|---|---|
| **Proposal** | `proposal.md` | Justificación del cambio y alcance explícito (in/out). Nota la errata del BRIEF heredada (cinco vs. seis campos) — pendiente precisar. |
| **Spec Delta** | `specs/workflow-requests/spec.md` | Reemplaza el requisito US1 de `openspec/specs/workflow-requests/spec.md`. Distingue dos razones de exclusión: *sin fuente en contrato* vs. *fuera de alcance*. |
| **Design** | `design.md` | Tres decisiones clave documentadas: (1) allowlist como destructuración, sin abstracción nueva; (2) guarda estructural diferida a la pantalla DO-FR-100; (3) actualización solo del comentario de cabecera en types.ts. |
| **Tasks** | `tasks.md` | 12 items en formato checklist TDD (rojo→verde→refactor). Todos completados (✅). Orden TDD estricto (config.yaml:14). |

### Ejecución y Verificación

| Artefacto | Ubicación | Resultado |
|---|---|---|
| **Verify Report** | `verify-report.md` | **Verdict: PASS**. 1/1 requisitos verificados, 8/8 escenarios cubiertos. Cero blockers, cero critical findings. |
| **Evidence** | verify-report.md §Evidencia | `evidence_revision` reproducible desde tres blobs de git (api.ts, types.ts, api.test.ts). Ciclo TDD observado con rojo registrado. |
| **Code Artifacts** | — | Commit `feat(cliente-http)`: 6 campos nuevos en `CreateRequestBody`, destructuración ampliada en `createRequest`, comentario de guarda, tres pruebas nuevas. |

---

## Merge of Delta Spec

La delta spec reemplazó el requisito US1 en `openspec/specs/workflow-requests/spec.md` vigente:

**Cambios principales**:
- Ampliación de 3 a 6 campos: se agregaron `program`, `semester`, `reason` (todos opcionales).
- Nueva sección que enumera límites y fuentes de cada campo según contrato 003.
- Prohibición explícita de construcción por *spread* — enumerar campo por campo (allowlist).
- Dos nuevos escenarios que ponen en evidencia la guarda (`Un campo no declarado no alcanza la petición`, `El semestre viaja como ordinal`).
- Conservación de escenarios preexistentes (retrocompatibilidad).

**Verificación del merge**:
```
$ diff openspec/specs/workflow-requests/spec.md openspec/changes/archive/2026-09-08-cliente-http-contrato-003/specs/workflow-requests/spec.md
(empty — merge correctly applied)
```

---

## Archiving

**Move Operation**:
```bash
git mv openspec/changes/cliente-http-contrato-003 \
        openspec/changes/archive/2026-09-08-cliente-http-contrato-003
```

**Integrity Check — MD5 Hashes (Before/After)**:
```
design.md:                    59baa1a3f640d57b514d9450fccc46bc ✓
proposal.md:                  f3e02e2bb036f8b06e645fe48f97743a ✓
specs/workflow-requests/spec: 6311b3db47ffb9039eb810e31f2f2e02 ✓
tasks.md:                     e5dc841383909b8be5170d2dd7b473de ✓
verify-report.md:             e824bb0950b159d3c6066fbf5eecd5dd ✓
```

**Git Status**:
```
R openspec/changes/cliente-http-contrato-003/… → openspec/changes/archive/2026-09-08-cliente-http-contrato-003/…
```

Todos los archivos se movieron preservando byte-a-byte su contenido. Cero cambios involuntarios.

---

## State at Archive

### Completeness

| Métrica | Valor |
|---|---|
| Tasks (TDD checklist) | 12/12 complete (✅) |
| Requirements verified | 1/1 (Registro de una solicitud, US1) |
| Scenarios covered | 8/8 |
| **Verdict** | **PASS** (0 blockers, 0 critical) |

### Compliance

- ✅ Proposal accepted (alignment with project charter + RFC process)
- ✅ Spec written as delta (merged into active spec)
- ✅ Design decisions documented and defendable (3 decisions, each with tradeoff analysis)
- ✅ Tasks executed in strict TDD order (rojo → verde → refactor observed and logged)
- ✅ Verification independent (gentle-ai sdd-verify, not self-signed)
- ✅ No regression (117 tests, build clean, types clean)
- ✅ Backward compatible (3 new fields optional; existing consumer unchanged)

### Code Artifacts (Committed)

| Commit | Message | Change |
|---|---|---|
| `feat(cliente-http)` | Amplía createRequest a los seis campos del contrato 003 | +`program?`, +`semester?`, +`reason?` en `CreateRequestBody`; destructuración y guarda de privacidad en `createRequest` |
| `docs(verify)` | Verify report | (in branch, already verified) |

**No se cometieron cambios** en:
- `app/requests/new/page.tsx` (prueba de retrocompatibilidad)
- `openspec/project.md`
- `CLAUDE.md`
- Otros archivos de unidades de trabajo sin commitear

### Build & Verification

| Comando | Resultado |
|---|---|
| `pnpm test --run` | ✅ 117 passed / 10 files (baseline: 114) |
| `pnpm build` | ✅ exit 0 |
| `rm -rf .next && pnpm exec tsc --noEmit` | ✅ exit 0 (obligatorio vaciar .next primero) |
| Consumidor existente | ✅ `app/requests/new/page.tsx` sin modificar, 8 tests verdes |

---

## Decisions Finalized

| Decision | Resolution |
|---|---|
| **Response type amplification** | Option A (negated): solo `CreateRequestBody` se amplía. La respuesta no cambia en esta change; se amplía cuando alguna pantalla necesite leerla. |
| **Allowlist abstraction** | Decidido no abstraer: la destructuración + `toEqual` ya entregan la garantía; agregar estructura sería cargo sin problema. El escenario 2 (campo no declarado) **ya pasaba en verde** con la convención existente, prueba de que la abstracción es innecesaria. |
| **Timestamp convention (semester)** | Fijada como ordinal (`"8"`), **no** como periodo (`"2026-2"`). El contrato lo declara sin `pattern`; ambas formas son válidas en el servidor. El `example` del contrato induce a lo contrario — se documenta la convención. |

---

## Risks & Mitigations

| Riesgo | Prob. | Mitigación | Estado |
|---|---|---|---|
| Alguien simplifica el allowlist en una refactorización futura | Media | Prueba exacta (`toEqual`) + comentario de guarda. Falla si aparece *spread*. | ✅ En código |
| La convención de `semester` se pierde | Media | Fijada en spec; prueba propia. `example` del contrato induce a lo contrario. | ✅ En spec + test |
| Romper consumidor existente | Baja | Campos nuevos son opcionales (contrato, 003). Consumidor no se toca. | ✅ Verificado: sin cambios |
| Deuda planificada para next change | **Info** | `app/requests/new/page.test.tsx` afirma `queryAllByRole('textbox')` = 2. Fallará cuando DO-FR-100 agregue campos. Se debe actualizar, no eliminar. | ✅ Registrada en verify-report |

---

## Artifacts Observation IDs (Engram)

**Nota**: Esta change usa **openspec** (archivos), no engram (observaciones). Los artefactos están en
`openspec/changes/archive/2026-09-08-cliente-http-contrato-003/`, versionados en git. No hay
topic_keys de memoria Engram a registrar salvo este reporte (archive-report).

**Memory Observation IDs**:
- *Pending*: Archive report será guardado en mem con `topic_key: sdd/cliente-http-contrato-003/archive-report`

---

## Closure

Change `cliente-http-contrato-003` completó su ciclo:
1. ✅ Propuesta: alcance explícito, riesgos mitigados, criterios de éxito claros
2. ✅ Especificación: delta spec integrada, requisito US1 ampliado con ocho escenarios
3. ✅ Diseño: decisiones documentadas con tradeoffs y alternativas descartadas
4. ✅ Tareas: 12 items TDD (rojo → verde → refactor), todas completadas
5. ✅ Aplicación: código implementado, tres pruebas nuevas, consumidor retrocompatible
6. ✅ Verificación: independent verdict PASS, 0 blockers, 117 tests, build clean
7. ✅ Integración: delta spec mergeada en spec vigente, cambios en main
8. ✅ Archivo: carpeta movida a `openspec/changes/archive/2026-09-08-cliente-http-contrato-003/`

**Review Gate**: Disabled (RDD apagado por decisión del usuario, 2026-09-08). Archivado bajo política
ordinaria del repositorio.

**Siguiente paso**: ninguno. Change cerrada. Si se necesita documentación adicional o auditoría,
revisar este reporte + los artefactos en la carpeta archivada.
