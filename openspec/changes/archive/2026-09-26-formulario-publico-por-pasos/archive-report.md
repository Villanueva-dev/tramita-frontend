# Archivo: Formulario público DO-FR-100 por pasos

**Fecha**: 2026-09-26
**Cambio**: `formulario-publico-por-pasos`
**Rama de trabajo**: `docs/archiva-formulario-publico-por-pasos` (creada desde `origin/main` en `70de563`)
**Ruta del archivo**: `openspec/changes/archive/2026-09-26-formulario-publico-por-pasos/`

## Resumen ejecutivo

El cambio se archiva como completado: el asistente de cinco pasos (PR-3) y el pulido visual (PR-4) están implementados, verificados y mergeados a `main` (`70de563`, 2026-09-26 08:25 UTC). La especificación se actualizó con cuatro requisitos modificados y uno nuevo. Ninguna pieza descartada figura en el código de producción.

## Qué se entregó

| Slice | PR | Commits | Merge | Contenido |
|---|---|---|---|---|
| 3a | #65 | `c6e3bf2` | `6693811` | Modelo puro: `steps.ts`, `steps.test.ts`, mapa de campos a pasos, funciones puras |
| 3b | #66 | `4165b63`, `09c6b58` | `bd1b69d` | Helpers de test: `fillPublicRequestForm()`, `submitForm()`, refactor de 12 pruebas |
| 3c-i | #67 | `b6d2418` | `09078d0` | Módulos presentacionales (parte 1): `wizard.tsx`, `StepPanel`, `StepProgress`, `StepNavigation` |
| 3c-ii | #68 | `7e18017`, `35fedcb` | `ff4b6ab` | Módulos presentacionales (parte 2): `review-summary.tsx`, extracción de `sections.tsx` |
| 3d | #70 | `1fb9de9`, `72e40f7` | `55c9ede` | Cableado del asistente: navegación, validación por paso, manejo de errores (422/404/413/429), foco |
| 4 | #72 | `020429a`, `81777a6` | `70de563` | Pulido visual: logo, Ayuda, ejemplos, contador, firma de 200px, texto del 413, acuse destacado |
| Planificación | #60, #61, #62, #64 | — | — | Proposal (#60), spec (#61), design+tasks (#62), enmienda de foco (#64) |

## Evidencia TDD y verificación

Modo: **Strict TDD** (config `openspec/config.yaml`).

| Slice | RED→GREEN | Suites | Puertas en vivo | Notas |
|---|---|---|---|---|
| 3a | 18 tests, `steps.test.ts` | `pnpm test` 265/265 ✓ | N/A | Modelo puro, sin JSX ni estado |
| 3b | Refactor puro (approval testing) | `pnpm test` 265/265 ✓ | N/A | Migración de 9 de 12 pruebas de navegación; 3 sin helpers todavía |
| 3c-i | 16 tests `wizard.test.tsx` | `pnpm test` 292/292 ✓ | N/A | `StepPanel`, `StepProgress` sin interacción, `StepNavigation` |
| 3c-ii | 10 tests `review-summary.test.tsx` | `pnpm test` 292/292 ✓ | N/A | Resumen por bloque, botón «Cambiar» con `onEdit` |
| 3c-extract | Approval testing (refactor) | `pnpm test` 292/292 ✓ | N/A | `sections.tsx` extracción: salida `innerHTML` byte-idéntica |
| 3d | 50 tests, `page.tsx` | `pnpm test` 303/303 ✓; `tsc`, `lint`, `build` ✓ | Firma con el mouse en el paso 4; el trazo sobrevive a Volver/Continuar/Cambiar; foco en el encabezado y, tras un fallo de Continuar, en el primer campo inválido | Navegación, salto del 422, validación del correo, persistencia de la firma, gestión del foco; validador de contexto limpio en PASS 5/5 |
| 4 | 20 tests nuevos (`canvas-firma`, `review-summary`, `page`) | 27 archivos / 323 tests ✓; `tsc`, `lint`, `build` ✓ | Con el mouse: la guía no bloquea el trazo ni entra en la imagen; borrado a cero; contador de `reason`; aviso por paso sin región viva; letra en rem | Corrección de la revisión (letra de 17 px en rem en los puntos de uso); validador de contexto limpio en PASS 5/5 |

## Sincronización de la especificación

**Comando ejecutado**:
```bash
gentle-ai sdd-archive-compose \
  --canonical "openspec/specs/do-fr-100-form/spec.md" \
  --delta "openspec/changes/formulario-publico-por-pasos/specs/do-fr-100-form/spec.md" \
  --output "openspec/specs/do-fr-100-form/spec.md.compose-tmp"
mv "openspec/specs/do-fr-100-form/spec.md.compose-tmp" "openspec/specs/do-fr-100-form/spec.md"
```

**Resultado**: ✓ Composición completada sin errores.

### Requisitos sintetizados

| # | Requisito | Acción | Cambio |
|---|---|---|---|
| 1 | Acceso sin sesión | — | Sin cambios (preservado) |
| 2 | Reproducción del formato con repliegue declarado | MODIFICADO | Orden a lo largo de los pasos; franja fija con «Lugar y fecha» y «Tipo de solicitud»; paso 3 titulado «Motivo de la solicitud»; nuevo escenario de navegación |
| 3 | Todos los campos son obligatorios | MODIFICADO | Obligatoriedad por paso (Continuar no avanza con error); revalidación antes de emitir; correo debe tener `@` y dominio; nuevo escenario de validación por paso |
| 4 | El trámite viaja en la ruta, no en el cuerpo | — | Sin cambios (preservado) |
| 5 | La asignatura no se captura como campo propio | — | Sin cambios (preservado) |
| 6 | Firma trazada en pantalla con alternativa accesible | MODIFICADO | Nuevo escenario: firma sobrevive a navegación entre pasos |
| 7 | Acuse de recibo sin identificador | — | Sin cambios (preservado) |
| 8 | Manejo de errores del backend | MODIFICADO | Nuevo escenario de 422: salta al primer paso con error, marca barra de progreso, foco al primer campo inválido; 404/413/429 en revisión |
| 9 | Diligenciamiento por pasos | AGREGADO | Nuevo requisito: cinco pasos montados, uno visible, validación por paso, barra de progreso, resumen con «Cambiar», foco en encabezado de cada cambio, sin petición antes de enviar |

**Conteo de requisitos**: 9 headings `### Requirement:` en la especificación final (8 originales + 1 nuevo).

**Verificación de escenarios por requisito MODIFICADO**:

- **Reproducción**: ✓ «Orden y rótulos de los bloques», ✓ «No hay casillas de tipo», ✓ «Lugar, fecha y tipo visibles en todos los pasos», ✓ «El paso 3 se titula Motivo»
- **Todos los campos**: ✓ «Un campo vacío impide», ✓ «Espacios no cuentan», ✓ «Excede límite impide», ✓ «Backend es autoridad», ✓ «Pegar separadores», ✓ «Teléfono sin 10 dígitos», ✓ «Continuar no avanza con inválido», ✓ «Correo sin @/dominio»
- **Firma**: ✓ «La firma sobrevive a navegación entre pasos»
- **Manejo de errores**: ✓ «Un 422 lleva al primer paso con errores y marca la barra»

**Prosa previa sobre una sola página**: La introducción del documento (`openspec/specs/do-fr-100-form/spec.md:1-17`, sección Purpose y Criterion) describe el formulario como pantalla reproductora del formato. **No se reescribió la prosa introductoria**, conforme al procedimiento: es contenido fuera de los bloques de requisitos y escenarios. El contexto del cambio en `proposal.md:14-26` documenta la transición de sola página a asistente.

## Estado al cierre

### Completado

- [x] **Todos los commits mergeados a `main`**: Slices 3a–4 entregados en 6 PRs secuenciales, mergeadas en orden (`6693811` → `bd1b69d` → `09078d0` → `ff4b6ab` → `55c9ede` → `70de563`).
- [x] **Suites de prueba en verde**: 27 archivos, 323 tests en `main` (`70de563`); `tsc --noEmit`, `pnpm lint`, `pnpm build` sin errores.
- [x] **Puertas en vivo superadas con el mouse en Chrome** (4.7 y 5.7): la firma sobrevive a la navegación entre pasos, el foco va al encabezado de cada paso y al primer campo inválido tras un error, y la guía del recuadro de 200 px no bloquea el trazo ni entra en la imagen. Firmar con el dedo no se confirmó.
- [x] **Grep dirigido de descartes**: Ninguna pieza descartada (radicado, línea de tiempo, «le avisaremos», adjuntos, «Volver al inicio», firma escaneada, «5 minutos») en código de producción.
- [x] **Especificación sincronizada**: 9 requisitos (8 originales + 1 nuevo); 40 escenarios; todos los escenarios del delta presentes en la principal.

### Pendientes (no parte de este cambio)

- [ ] **Firma con el dedo en un celular**: las puertas 4.7 y 5.7 se corrieron con el mouse; la confirmación con el dedo queda para el responsable, en un teléfono real.
- [ ] **Issues abiertos relacionados**: #19 (canvas en rotación), #33 (pointer capture) — quedan abiertos; no son de este cambio.
- [ ] **Tres decisiones del ejecutor para veto** (`apply-progress.md`, Slice 5): encabezado y Ayuda solo en la vista del formulario (no en el acuse), redacción del acuse, texto de ejemplo de `reason` — quedan abiertas tras el merge de #72; cualquiera es un cambio de una línea.
- [ ] **Pregunta abierta de diseño** (design.md:271-272): Botón Atrás del navegador — sale de la página y pierde lo diligenciado, fuera de scope.

## Trazabilidad

**Artefactos archivados**:
- `openspec/changes/archive/2026-09-26-formulario-publico-por-pasos/proposal.md` — propuesta original
- `openspec/changes/archive/2026-09-26-formulario-publico-por-pasos/specs/do-fr-100-form/spec.md` — delta spec antes de composición
- `openspec/changes/archive/2026-09-26-formulario-publico-por-pasos/design.md` — decisiones arquitectónicas
- `openspec/changes/archive/2026-09-26-formulario-publico-por-pasos/tasks.md` — plan de trabajo con checkboxes de completitud
- `openspec/changes/archive/2026-09-26-formulario-publico-por-pasos/apply-progress.md` — evidencia de ejecución intermedia
- `openspec/changes/archive/2026-09-26-formulario-publico-por-pasos/archive-report.md` — este archivo

**Especificación principal actualizada**: `openspec/specs/do-fr-100-form/spec.md` (9 requisitos, 40 escenarios).

**Rama de entrega**: todos los commits están en `main`; la rama `docs/archiva-formulario-publico-por-pasos` solo lleva este archivo y la fusión de la spec.

**Verificación de integridad (lectura del orquestador)**: cada artefacto archivado (`proposal.md`, `design.md`, `apply-progress.md`, `specs/do-fr-100-form/spec.md`) se comparó con su versión en `origin/main` (`git show origin/main:<ruta> | diff - <archivado>`) sin diferencias; `tasks.md` difiere solo en las marcas de 6.1 y 6.2; la carpeta original ya no existe; en la spec principal los cuatro requisitos no modificados y la introducción son byte-idénticos a `origin/main`, y ninguna línea `#### Scenario:` del delta falta.

## Key Learnings

1. El modelo puro de pasos (`steps.ts`) permitió separar la estructura de datos de su presentación, facilitando las pruebas y la composición de componentes.
2. El uso de `hidden` en lugar de desmontar componentes conservó el estado de la firma a lo largo de la navegación, evitando redibujos innecesarios.
3. `flushSync` fue necesario para que el cambio de paso estuviera en el DOM antes de mover el foco.
4. La composición nativa `gentle-ai sdd-archive-compose` garantiza byte-to-byte fidelidad de la especificación al fusionar deltas sin riesgo de truncación.
5. La validación por paso separó responsabilidades y permitió bloqueos de navegación más precisos, mejorando la experiencia de usuario en formularios largos.

