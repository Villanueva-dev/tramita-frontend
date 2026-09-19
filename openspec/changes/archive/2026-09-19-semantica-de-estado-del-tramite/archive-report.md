# Archive Report: Semántica del estado del trámite

**Fecha de archivo**: 2026-09-19
**Rama**: `chore/archiva-semantica-de-estado-del-tramite`
**Merge precedente**: PR #37 (`fix/estado-inicial-renombrado-15`, 7 commits), mergeado a `main` el `2026-09-19T12:49:13Z`
**Artefactos persistidos**: `BRIEF.md`, `proposal.md`, `design.md`, `tasks.md` (actualizado), `specs/`, `apply-progress.md`, `verify-report.md`

---

## Resumen Ejecutivo

La change cierra con toda la implementación ya en `main`, el delta fusionado en la capability
principal y el diagnóstico de verificación completo. Los siete escenarios del requisito nuevo
tienen respaldo directo en código y tests. Las 157 pruebas pasan; `tsc`, `eslint` y `pnpm build`
terminan sin errores. **La change se archiva sin bloqueos.**

---

## Sincronización de Especificaciones

| Dominio | Acción | Detalles |
|---------|--------|---------|
| `workflow-requests` | Anexado | Un requisito nuevo («Interpretación de la semántica del estado»), siete escenarios y una limitación declarada. Anexado a `openspec/specs/workflow-requests/spec.md` tras el requisito «Responsable del estado actual». |

**Comando ejecutado**:

```sh
gentle-ai sdd-archive-compose \
  --canonical openspec/specs/workflow-requests/spec.md \
  --delta openspec/changes/semantica-de-estado-del-tramite/specs/workflow-requests/spec.md \
  --output openspec/specs/workflow-requests/spec.md.compose-tmp \
&& mv openspec/specs/workflow-requests/spec.md.compose-tmp openspec/specs/workflow-requests/spec.md
```

**Resultado**: exit 0.

**Naturaleza del merge**: estrictamente aditivo, verificado con `git diff --numstat HEAD` →
`78 0` (78 líneas agregadas, **cero borradas**). Los cinco requisitos vigentes quedan intactos;
el archivo pasa de 252 a 330 líneas. Por eso la regla `archive: avisar antes de mergear deltas
destructivos` de `openspec/config.yaml` no se disparó.

---

## Contenidos del Archivo

| Artefacto | Estado | Observación |
|-----------|--------|------------|
| `BRIEF.md` | presente | Auditoría que originó la change; registra el orden real de los hechos. |
| `proposal.md` | presente | Problema, alternativas descartadas y justificación del alcance. |
| `design.md` | presente | Decisiones con sus trade-offs y ejes de alternativa. |
| `tasks.md` | presente | 18 tareas en 4 fases; 17/18 marcadas al archivar. |
| `specs/workflow-requests/spec.md` | presente | Delta con un requisito y siete escenarios, ya anexado al spec principal. |
| `apply-progress.md` | presente | Snapshot previo al merge; 7 commits y la verificación de equivalencia del refactor. |
| `verify-report.md` | presente | Diagnóstico: 0 CRITICAL, 2 WARNING, 2 SUGGESTION; 7/7 escenarios cubiertos. |
| `archive-report.md` | creado | Este documento. |

---

## Estado del Trabajo al Archivar

### Tareas

| Fase | Completadas |
|---|---|
| 0 — La regresión previa | 2/2 |
| 1 — El módulo | 2/2 |
| 2 — El modelo | 4/4 |
| 3 — Los consumidores | 6/6 |
| 4 — Cierre | 3/4 |

- [x] **4.1** Artefactos de la change, escritos antes del merge.
- [x] **4.2** Verificación diagnóstica contra la spec.
- [x] **4.3** Archivar tras el merge, fusionando el delta en la capability.
- [ ] **4.4** Cerrar #15 y #35 una vez mergeado, no antes. — #35 ya cerrado
      (`2026-09-19T13:28:23Z`); #15 lo cierra el orquestador inmediatamente después de este
      archivado.

**Total**: 17/18. La 4.4 se cierra fuera de esta fase, según su propio enunciado.

### Comprobaciones mecánicas

| Comando | Resultado |
|---------|-----------|
| `pnpm test` | exit 0 — **157/157 en 21 archivos** |
| `pnpm exec tsc --noEmit` | exit 0 |
| `pnpm lint` (`eslint .`) | exit 0 |
| `pnpm build` (Next.js 16.3.5) | exit 0 — 9/9 páginas generadas |

**Fuente**: mediciones del 2026-09-19 sobre `main` = `5b61a4e`, registradas en
`verify-report.md`. Ninguna de las cuatro comprobaciones modificó el árbol de trabajo.

### Evidencia de implementación

Según `apply-progress.md`:

- Siete commits que cierran las fases 0–3 (regresión previa, módulo, modelo, consumidores).
- Cada tarea abre con su RED observado, documentado en `tasks.md`.
- Dos refactores sin cobertura previa (`requests-table`, `app-shell`) verificados por
  equivalencia: sus tests se corrieron **también contra la versión anterior** y pasan en ambas.
- El test de regresión de #35 llegó después, con el PR #40.

---

## Hallazgos de Verificación

**Cobertura de escenarios: 7/7.**

| Escenario | Evidencia en código | Evidencia en test |
|-----------|---------------------|-------------------|
| El cierre se deriva del contrato, no de la etiqueta | `lib/request-state.ts:77-79` — `isClosed` devuelve `currentState.isFinal` sin consultar ningún código | `lib/request-state.test.ts:55-67` |
| Un cierre negado no se cuenta como cumplido | `lib/request-state.ts:82-84` — `isSuccessfullyClosed` | `components/dashboard/summary-cards.test.tsx:35-45`; `app/dashboard/page.test.tsx:121-155` (regresión de #35) |
| Un cierre negado no se presenta como devolución | `lib/request-state.ts:87-89` — `isReturnedForCorrection` consulta `returned`, no el cierre | `lib/request-state.test.ts:86-94` |
| La devolución se reconoce donde el motor la modela como estado | `lib/request-state.ts:54` — `DEVUELTA: { returned: true }` en `adicion_creditos` | `lib/request-state.test.ts:82-85`; `components/dashboard/summary-cards.test.tsx:72-82` |
| La devolución no se inventa donde el motor la modela como transición | `lib/request-state.ts:58-65` — `novedad_notas` declara su estado inicial y **ningún** estado de devolución ni de rechazo, con el comentario que explica por qué | `lib/request-state.test.ts:96-101` — recorre los seis estados reales del trámite y asserta `false` en todos |
| Cada trámite reconoce su propio inicio | `lib/request-state.ts:92-94` — `isInitialState` resuelve por trámite | `lib/request-state.test.ts:106-125`; `lib/store.test.ts:56-78` |
| Un estado que el cliente no reconoce no rompe la pantalla | `lib/request-state.ts:70,73` — `SIN_SEMANTICA` como valor por defecto de `semanticsOf` | `lib/request-state.test.ts:127-141` — dos casos separados: no se le atribuye semántica, y `isClosed` sigue respondiendo |

### Diagnóstico

**CRITICAL: 0.**

**WARNING: 2.**

1. No hay test de componente que ejercite un rechazo contra `WorkflowStepper`
   (`app/requests/[id]/page.tsx:327`). El stepper está **fuera del alcance declarado** (#9), así
   que la ausencia es coherente con el recorte, no una brecha oculta.
2. `components/app-shell.test.tsx:54` se acopla a la clase CSS `.bg-brand-red`. Es deuda de
   accesibilidad **preexistente**, ya registrada como hallazgo 4 de `apply-progress.md`: el
   contador de urgentes es un punto con un número, sin nombre accesible, y no hay otra forma de
   consultarlo desde un test.

**SUGGESTION: 2.**

1. `components/pdf-document.tsx:3` importa `isClosed` y lo usa en la línea 7. Es un **noveno**
   consumidor, fuera de los ocho sitios que enumera `apply-progress.md`, y sin test propio. El
   predicado está probado en su origen, pero el conteo del reporte de implementación quedó corto.
2. La evidencia TDD de `apply-progress.md` y `tasks.md` está en prosa y no en la plantilla
   tabular de `strict-tdd-verify.md`. Equivalente en contenido, distinta en forma.

**Cumplimiento TDD (Strict Mode)**: satisfactorio en las cuatro verificaciones — RED documentado,
GREEN observado, triangulación y red de seguridad por equivalencia.

**Sobre las limitaciones declaradas**: ninguna de las dos es una ceguera silenciosa. La de
`novedad_notas` está fijada por un test que la nombra y recorre los seis estados reales del
trámite; la degradación segura tiene su propio bloque, que verifica por separado las dos mitades
de la garantía.

---

## Reconciliación con los Snapshots Intermedios

`apply-progress.md` reporta 153/153 sobre 20 archivos. **Esa medición es correcta para el momento
en que se escribió**, anterior al PR #40. Después:

- El PR #40 (`6f9568e`) agregó el test de regresión de #35 (`app/dashboard/page.test.tsx:121-155`).
- Medición al cierre, 2026-09-19: **157/157 en 21 archivos**.

La diferencia no es una discrepancia: es progreso posterior, trazable en el log de commits.
`apply-progress.md` y `verify-report.md` son snapshots válidos de su momento; este reporte
registra el estado al cierre.

---

## Issues Relacionados

- **#35** («El dashboard cuenta los trámites rechazados como Completadas»): **cerrado** el
  `2026-09-19T13:28:23Z`, con su test de regresión en el PR #40.
- **#15** («El backend renombra REGISTRADA a EN_COORDINACION y `lib/store.tsx` deja de reconocer
  el estado inicial»): **abierto al momento de archivar**; lo cierra el orquestador
  inmediatamente después, según el enunciado de `tasks.md` 4.4. GitHub no lo cerró solo al
  mergear el PR #37 porque su cuerpo dice «Cierra #15» y la plataforma únicamente reconoce las
  palabras clave de cierre en inglés (`closes`, `fixes`, `resolves`).

---

## Fuera de Alcance, con su Destino

- **El stepper y el colapso de siete estados** → **#9**.
- **El criterio de «completada» respecto de `APROBADA_FACULTAD`** → **#36**.
- **El candado de la pantalla del documento** → issue pendiente de abrir. El cliente gatea por
  estado; el backend documenta que el DO-FR-100 se emite en cualquier momento de la vida de la
  solicitud.
- **Pedirle al contrato que exponga si el trámite fue devuelto** → siguiente change. Es lo que
  destrabaría la limitación de `novedad_notas`.

---

## Operación de Archivado

**Comando**:

```sh
git mv openspec/changes/semantica-de-estado-del-tramite \
       openspec/changes/archive/2026-09-19-semantica-de-estado-del-tramite
```

**Resultado**: exit 0. Git registra los seis archivos como renombrados, no como un borrado más un alta.

**Readback**: `diff -r` entre el snapshot previo y el destino → sin diferencias.

---

## Observaciones en Engram

- `sdd/semantica-de-estado-del-tramite/verify-report`
- `sdd/semantica-de-estado-del-tramite/archive-report` — observación **#2222**

---

## Aprendizajes

1. La limitación de `novedad_notas` —la devolución modelada como transición de retorno y no como
   estado— está fijada por un test que la nombra, en lugar de manifestarse como una coincidencia
   que nunca ocurre.
2. Los dos refactores sin cobertura previa se validaron corriendo sus tests nuevos **contra la
   versión anterior del código**. Un test escrito mirando el código nuevo puede pasar por estar
   moldeado a él; correrlo contra el viejo es lo que descarta esa posibilidad.
3. El orden real de los hechos —la implementación precedió a la redacción de los artefactos, que
   se escribieron antes del merge— queda registrado en lugar de simular una secuencia que no
   ocurrió.
4. Medir el estado al cierre y no confiar en el snapshot intermedio cambió el conteo de 153/153 a
   157/157. Un reporte de implementación envejece en cuanto se mergea el siguiente PR.
5. El análisis de blast radius encontró un consumidor de `isClosed` que el conteo manual del
   reporte de implementación no incluía. Enumerar sitios a mano subestima; la herramienta que
   sigue las referencias, no.
