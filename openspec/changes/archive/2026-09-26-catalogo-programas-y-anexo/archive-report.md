# Archivo: Catálogo de programas en el formulario interno y requisito de anexo en el detalle

**Fecha**: 2026-09-26
**Cambio**: `catalogo-programas-y-anexo`
**Ruta del archivo**: `openspec/changes/archive/2026-09-26-catalogo-programas-y-anexo/`

## Resumen ejecutivo

El cambio entrega los puntos 2 y 3 de #74, la contraparte en el front de la feature 009 del backend.
El punto 1, el selector del formulario público, entró antes con #76. El formulario interno elige el
programa del catálogo público y el detalle anuncia el requisito de anexo. Todo entró en `main` con
la PR #79 (merge `bf096f8`, 2026-09-27T02:44:46Z UTC) y el issue #74 se cerró automáticamente.

## Qué se entregó

| Unidad | Commit | Contenido |
|---|---|---|
| Contrato SDD | `28344a2` (PR #78) | Propuesta, spec delta, diseño y tareas |
| 1 | `3687ac4` | Extrae la carga del catálogo a `lib/use-program-catalog.ts`, sin cambiar el comportamiento público |
| 2 | `29cbbd2` | Formulario interno: catálogo, «Sin programa» sin preselección y omisión de la clave `program` |
| 3 | `07a4c13` | Tipo `AnnexRequirement` y su mapeo en `baseRequest` |
| 4 | `f529175` | Aviso «Anexo requerido» entre las acciones de transición y el estado actual |
| Documentación | `8f8c03b`, `7bed73e` | Avance, replanteo y prueba en vivo |

Las unidades 1 a 4 se entregaron en una sola PR, la #79. El diseño preveía dos PRs encadenadas; el
responsable aceptó la excepción de tamaño (436 líneas de código y pruebas) en el replanteo del
2026-09-26, que figura al inicio de `tasks.md`.

## Evidencia TDD y verificación

Modo: **TDD estricto**, con Vitest como runner.

| Unidad | RED observado | Prueba en vivo |
|---|---|---|
| 1 | La guarda de frontera del hook fallaba con `ENOENT`; la suite pública queda en verde sin tocar sus aserciones | No aplica: es un refactor |
| 2 | N1-N5 en la página y S1 en el store (el RED de S1 fue de `tsc`) | Sí |
| 3 | S3 y S5 fallaban con `expected undefined to deeply equal {…}` | Sí |
| 4 | D1 fallaba con `Unable to find an accessible element with the role "region" and name "Anexo requerido"` | Sí |

**Compuerta de la PR** (4.7): `pnpm test` con 347/347, `tsc` en frío, `pnpm lint` y `pnpm build`
limpios; 436 líneas de código y pruebas contra `main`. Sobre la unidad 2 se aplicaron seis mutantes
de producción, y cada uno lo atrapa su prueba. El detalle está en `apply-progress.md`.

**Prueba en vivo** (4.8), en Chrome contra el backend local con la 009 y con datos sintéticos:

- sin programa, el cuerpo no lleva la clave `program`;
- con un nombre del catálogo, el nombre viaja idéntico;
- el aviso aparece con los datos reales de la 009 y en su posición;
- el aviso sigue visible tras una transición sin recargar la página;
- sin la clave, no hay aviso.

**Retiradas en el replanteo**, con su motivo en `tasks.md`: N6, S2, S4, D3 y D4. Dos escenarios
quedan sin prueba dedicada: «Un programa fuera del catálogo se rechaza como error general, no de
campo» y «Un programa heredado fuera del catálogo se muestra tal cual». Tampoco tiene prueba la
cláusula «en cualquier estado» del aviso.

## Sincronización de la especificación

El delta `specs/workflow-requests/spec.md` se fusionó en `openspec/specs/workflow-requests/spec.md`.

### Requisitos sintetizados

| Requisito | Acción | Escenarios |
|---|---|---|
| Registro de una solicitud (US1) | MODIFIED | 13 |
| Detalle de una solicitud | MODIFIED | 10 |

**Verificación**: el orquestador comparó con un script cada requisito de la spec viva con su bloque
del delta: los dos son idénticos. La spec viva no conserva encabezados de delta, y los otros cuatro
requisitos no cambiaron.

## Estado al cierre

### Completado

- [x] PR #79 mergeada en `bf096f8`, con `Closes #74`
- [x] Issue #74 en estado `CLOSED` (2026-09-27T02:44:47Z UTC), verificado con `gh issue view 74`
- [x] Spec viva sincronizada y cambio movido al archivo con `git mv`

### Pendientes (no parte de este cambio)

- [ ] **Texto del aviso, abierto a veto**: «Para reenviar a la facultad» no aplica en un trámite
      cerrado (`proposal.md`, preguntas abiertas). La prueba en vivo mostró que tampoco encaja con la
      solicitud «En facultad».
- [ ] **Seguimientos no bloqueantes de #76**, del formulario público:
  - un catálogo vacío bloquea sin explicar que la lista llegó vacía;
  - la prueba de identidad no usa un nombre con tilde;
  - «Reintentar» es un `<button>` crudo.
- [ ] **Issues abiertos ya citados en la propuesta**:
  - #10: `lib/store.tsx` reimplementa la capa de datos de `lib/api.ts`;
  - #50: el selector de trámite de `/requests/new` usa dos tipos fijos;
  - #52: tests de la 007 y el mock de `transition` que no ejerce el estado posterior.

## Trazabilidad

- `proposal.md`, `design.md`, `exploration.md`, `specs/workflow-requests/spec.md` (el delta),
  `tasks.md` y `apply-progress.md`, en esta carpeta.
- Spec viva: `openspec/specs/workflow-requests/spec.md`.
- PRs: #78 (contrato), #79 (implementación) y la PR de este archivo.

## Key Learnings

1. `expect.objectContaining({ program: undefined })` de Vitest exige que la clave exista, así que
   una prueba de «no se envía `""`» escrita así rechaza un refactor correcto que omite la clave. Se
   afirma el comportamiento con `.toBeUndefined()`.
2. Un `node_modules` enlazado por symlink desde otro checkout rompe `next build` con Turbopack,
   aunque Vitest y `tsc` pasen: cada worktree necesita su propio `pnpm install --frozen-lockfile`.
3. El backend solo admite el origen `http://localhost:3000`: en otro puerto, el proxy de Next
   reenvía el `Origin` del navegador y Spring responde 403 «Invalid CORS request».
4. Medir el alcance contra el issue redujo el plan de 40 a 34 tareas sin perder las garantías que
   #74 pedía: una prueba por garantía, en la costura donde está el riesgo.
