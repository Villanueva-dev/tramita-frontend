# Archive Report: Formulario público del DO-FR-100 — matrícula de créditos adicionales

- **Cambio**: `formulario-do-fr-100-creditos-adicionales`
- **Archivado en**: `openspec/changes/archive/2026-09-18-formulario-do-fr-100-creditos-adicionales/`
- **Fecha de cierre**: 2026-09-18
- **Estado final**: ✅ Completado y verificado

---

## Resumen Ejecutivo

El cambio **Formulario público del DO-FR-100** ha completado el ciclo SDD. Todas las 63 tareas están marcadas como completadas. La pantalla pública para diligeniar solicitudes de adición de créditos se implementó con firma capturada en canvas, validación en cliente y envío contra el endpoint público del backend. El build compila exitosamente, los 125 tests pasan, y la verificación confirma cobertura de todos los requisitos declarados en las especificaciones.

Dos hallazgos WARNING de precisión documental (no bloqueantes) se registran en esta clausura.

---

## Artefactos Leídos

| Artefacto | Presente | Observación |
|-----------|----------|------------|
| `proposal.md` | ✅ | Reorientada el 2026-09-16 hacia una pantalla pública sin sesión. Decisiones de producto tomadas con la Coordinación y registradas con fechas. |
| `BRIEF.md` | ✅ | Valores sintéticos para TDD estricto. Generados el 2026-09-16, usados en fixtures y guardas. |
| `design.md` | ✅ | Completado el 2026-09-17. Describe la firma con canvas, gestión de errores y acuse en lugar. |
| `tasks.md` | ✅ | 63 tareas totales, todas marcadas como completadas (`[x]`). Incluye Fase 0 (decisiones críticas), Fases 1–3 (implementación), y bloque de corrección de issues. |
| `specs/do-fr-100-form/spec.md` | ✅ | Delta spec (nuevo dominio). Sincronizado a `openspec/specs/do-fr-100-form/spec.md` (no existía antes). |
| `specs/workflow-requests/spec.md` | ✅ | Delta spec (modificaciones). Fusionado a `openspec/specs/workflow-requests/spec.md` usando `gentle-ai sdd-archive-compose`. |
| `apply-progress.md` | ✅ | 8 lotes acumulativos con evidencia RED/GREEN de TDD estricto. Último lote reporta `status: partial` por error ambiental de Turbopack (sandbox), no por defecto de código. |
| `verify-report.md` | ✅ | Verificación en 2026-09-18. Reemplaza el estado parcial de apply-progress con evidencia de build local del maintainer (código 0), tests verdes (125/125), y cobertura de requisitos sin CRITICAL. |

---

## Sincronización de Especificaciones

### Resumen de Cambios

| Dominio | Acción | Detalles |
|---------|--------|---------|
| `do-fr-100-form` | **Creada** | Spec nueva para la pantalla pública. Copia mecánica desde delta a `openspec/specs/do-fr-100-form/spec.md`. |
| `workflow-requests` | **Fusionada** | Delta aplicada a spec existente usando `gentle-ai sdd-archive-compose`. Cambio menor: el literal de trámite pasa de viajar en cuerpo (`definitionCode`) a armar la ruta pública (`POST /api/public/requests/ADICION_CREDITOS`). |

### Verificación Mecánica

- ✅ `openspec/specs/do-fr-100-form/spec.md`: diff vacío (copia idéntica a delta)
- ✅ `openspec/specs/workflow-requests/spec.md`: fusión exitosa (comando retornó 0)

---

## Autoridad de Estado Final

Per **Section 2 (Final-State Authority)** del skill `sdd-archive`:

**Los siguientes hechos de estado final, proporcionados por el orquestador en la sesión actual (2026-09-18), reemplazan cualquier afirmación anterior en `apply-progress.md` o `verify-report.md`:**

1. **Build verificado, NO bloqueado.** `apply-progress.md:lote8` reportó `status: partial` porque `pnpm build` falló dentro del sandbox del agente con error de Turbopack (limitación de enlace a puerto). El maintainer ejecutó `pnpm build` localmente el 2026-09-17 a las 22:21 con código de salida 0: Next.js 16.3.5 compiló, TypeScript terminó sin errores, se generaron 9/9 páginas estáticas, y `/solicitud/creditos-adicionales` se emitió como ruta estática.

2. **Checks finales confirmados (2026-09-18):**
   - `pnpm test` → Exit 0, **125 tests en verde** (16 archivos)
   - `pnpm exec tsc --noEmit` → Exit 0, sin salida
   - `pnpm lint` → Exit 0, sin hallazgos
   - `git status` → Árbol limpio, main adelantado 5 commits (no pusheados per instrucción)

3. **Trabajo comprometido; árbol limpio.** `main` contiene 5 commits no pusheados:
   - `ecd1e0b` fix(firma): serializa el trazo al soltar, no en cada movimiento
   - `f7b9050` fix(api): distingue campos faltantes de campos inválidos en el 422
   - `88a63b4` refactor(fixtures): separa constantes de interfaz de los datos de prueba
   - `22cfb1c` docs(despliegue): exige el origen exacto del front en la allowlist de CORS
   - `59f6e98` docs(openspec): registra los tres lotes de cierre del formulario público

4. **Hallazgos a registrar honestamente (0 CRITICAL, 2 WARNING, 3 SUGGESTION):**

   **WARNING 1 — Invariante declarado no sostenido:**

   `proposal.md` declara `app/requests/new/**` como "Sin tocar — Invariante". El commit `88a63b4` modificó `app/requests/new/page.tsx` (cambio de origen del import para higiene de PII + reemplazo de placeholder de correo). El test intacto sigue en verde, así que no hay regresión de comportamiento. Impacto: bajo, pero es la clase de deriva que un jurado podría señalar.

   **WARNING 2 — Alcance de medición sobreclaimado:**

   La tarea de cierre `tasks.md` afirma "cero datos personales reales **en cualquier archivo del repo**", pero la evidencia se limitó a los archivos que esta change tocó. Un escaneo más amplio encontró ocurrencias del dominio institucional en archivos que preexisten a esta change (fechados 2026-07-15 a 2026-09-13). Ese issue (#14) fue explícitamente dejado abierto por este trabajo. Impacto: bajo para esta change (su alcance sí quedó limpio), pero la redacción del checkbox sobreclaima.

---

## Contenidos del Archivo

**Estructura preservada:**
```
2026-09-18-formulario-do-fr-100-creditos-adicionales/
├── proposal.md                    (17 KB)
├── BRIEF.md                       (12 KB)
├── design.md                      (18 KB)
├── tasks.md                       (16 KB, 63/63 completas)
├── apply-progress.md              (44 KB, 8 lotes)
├── verify-report.md               (14 KB)
├── archive-report.md              (este archivo)
└── specs/
    ├── do-fr-100-form/
    │   └── spec.md               (delta archivada)
    └── workflow-requests/
        └── spec.md               (delta archivada)
```

**Verificación de integridad:** diff recursivo contra snapshot pre-movimiento → vacío ✓

---

## Fuente de Verdad Actualizada

Las siguientes especificaciones ahora reflejan el comportamiento implementado:

- **`openspec/specs/do-fr-100-form/spec.md`** — Especificación completa de la pantalla pública: acceso sin sesión, once campos obligatorios, firma trazada con canvas, alternativa por imagen, acuse in-place, manejo de errores 404/413/422/429.

- **`openspec/specs/workflow-requests/spec.md`** — Actualizada con el ajuste de rutas: el literal `ADICION_CREDITOS` arma la ruta pública en lugar de viajar en el cuerpo del request.

---

## Ciclo SDD Completado

| Fase | Estado |
|------|--------|
| **Explore** | ✅ Completada |
| **Propose** | ✅ Completada (reorientada 2026-09-16) |
| **Spec** | ✅ Completada |
| **Design** | ✅ Completada |
| **Tasks** | ✅ 63/63 tareas completadas |
| **Apply** | ✅ Completada (8 lotes, evidencia RED/GREEN) |
| **Verify** | ✅ Completada (125/125 tests verdes, build 0, lint 0) |
| **Archive** | ✅ En esta sesión |

---

## Hallazgos de Verificación

*Per `verify-report.md`, mediciones en 2026-09-18:*

### CRITICAL
- **Ninguno identificado.**

### WARNING (2)
1. Invariante `app/requests/new/**` modificado en `88a63b4` (cambio mínimo, tests verdes, pero desactualiza el invariante declarado).
2. Alcance de "cero PII en el repo" sobreclaimado en `tasks.md` (la change sí quedó limpia, pero el issue #14 relacionado no se cerró).

### SUGGESTION (3)
1. UX menor: botón "Limpiar firma" puede habilitarse si sube archivo inválido (no afecta validación de envío).
2. `pnpm audit` no se re-ejecutó esta sesión (13 vulns: 3 moderate, 10 high, ninguna crítica, ninguna en `next`).
3. Preguntas #5 y #6 a la Coordinación siguen pendientes (validez legal de firma, dato biométrico bajo Ley 1581).

---

## Issues Relacionados

| Issue | Estado | Nota |
|-------|--------|------|
| `tramita-frontend#2` | Será cerrado por PR de merge | Es el issue de esta change; la última PR de la cadena lo cierra con `Closes #2`. |
| `tramita-frontend#7` | ✅ Cerrado | Subida de Next.js a 16.3.3+ resuelta (hoy 16.3.5). |
| `Tramita#20` | ✅ Corregido | Allowlist de CORS ajustada en backend PR #32; empíricamente verificado en 2026-09-18. |
| `Tramita#14` | ⏳ Abierto | Datos personales previos fuera de alcance de esta change; se documentó hallazgo en verify-report. |

---

## Rollback

La change es aditiva en el front (archivos nuevos + dos funciones en `lib/`). Un `git revert` retira la pantalla limpiamente.

⚠️ El backend incluyó migraciones (ALTER TABLE) que no se revierten automáticamente con Flyway. El rollback del front es trivial; el del backend sigue sus reglas.

---

## Próximo Paso Recomendado

**`none`** — El cambio está archivado y cerrado. La implementación está verificada, las especificaciones sincronizadas, y los artefactos preservados en el archivo.

La siguiente acción es de operaciones/entrega: integración a la rama de entrega, despliegue, validación en producción (que exige autorización de seguridad y de negocio sobre la firma digitalizada, per preguntas abiertas #5 y #6).

---

## Observaciones de Auditoría

- Artefactos archivados sin editar más allá de la sincronización de specs.
- Tareas NO reescritas; historial de `tasks.md` preservado tal como fue registrado.
- Hallazgos WARNING documentados sin reclamo falso de completitud.
- Trabajos posteriores (commit `88a63b4`) que afectaron invariantes declarados se registran aquí en lugar de silenciarse.
- Preguntas abiertas a la Coordinación se mantienen como están, sin cierre presunto.

---

## Enmienda del 2026-09-18 — reescritura de los commits posterior a este reporte

Este reporte se midió sobre el HEAD `59f6e98`, que **ya no existe**. Después de escribirlo, un
code review con agente limpio sobre el mismo rango encontró dos afirmaciones falsas en los
mensajes de commit, y corregirlas exigió reescribir el historial local (ningún commit estaba
publicado). El cuerpo del reporte **no se editó**: lo que midió, lo midió sobre los hashes
viejos, y alterarlo ahora sería fabricar evidencia retroactiva.

**Las mediciones siguen siendo válidas.** `git diff backup-pre-reword main --stat` devuelve vacío:
el árbol final es byte-idéntico al que este reporte examinó. Solo cambiaron los mensajes y el
reparto de un cambio entre dos commits.

| Hash en este reporte | Hash vigente | Qué cambió |
| --- | --- | --- |
| `ecd1e0b` | `a8f9a79` | Mensaje corregido: afirmaba que antes de este cambio un `pointercancel` perdía la firma visible. Era falso — la emisión ocurría en cada movimiento, así que el padre ya tenía el PNG. El mensaje nuevo da la razón real (coste cuadrático y una codificación PNG por muestra, según el issue #24) y aclara que el manejo de `pointercancel` pasa de redundante a obligatorio por el diseño nuevo. |
| `f7b9050` | `751caea` | Sin cambios. |
| `88a63b4` | `833bc05` | Deja de incluir el reemplazo del placeholder de correo. |
| — | `85b2ff9` | **Commit nuevo**: el reemplazo del placeholder, separado porque cambia copy visible y un refactor no cambia comportamiento. |
| `22cfb1c` | `f300330` | Sin cambios. |
| `59f6e98` | `2df2dba` | Sin cambios. |

**Afirmación de este reporte que queda superada**: donde dice que el commit del refactor de
fixtures modificó `app/requests/new/page.tsx` con un cambio de import **y** un reemplazo de
placeholder, hoy ese commit solo cambia el import. El reemplazo vive en `85b2ff9`. La deriva
respecto del invariante declarado en `proposal.md` **no desaparece** —`app/requests/new/**` sigue
tocado por el rango—, pero ya no la causa un commit tipado `refactor`.
