# Verify Report: Formulario público del DO-FR-100 — matrícula de créditos adicionales

> Reporte diagnóstico. No certifica ni bloquea archive. Todas las afirmaciones sobre el
> repo se acompañan del comando que las midió, ejecutado el 2026-09-18 sobre el HEAD
> `59f6e98` (árbol de trabajo limpio, 5 commits locales sin push).

## Alcance

- Change: `formulario-do-fr-100-creditos-adicionales`.
- Artefactos leídos: `proposal.md`, `tasks.md` (63/63 marcadas completas por el dispatcher
  nativo), `specs/do-fr-100-form/spec.md`, `specs/workflow-requests/spec.md`,
  `apply-progress.md` (acumulativo, 8 lotes).
- TDD estricto activo (`openspec/config.yaml:17`, `strict_tdd: true`); se aplicó
  `strict-tdd-verify.md`.
- Implementación inspeccionada directamente (no solo el reporte): `app/solicitud/creditos-adicionales/page.tsx`,
  `components/do-fr-100/sections.tsx`, `components/firma/canvas-firma.tsx`, `lib/api.ts`,
  `lib/types.ts`, `lib/public-request-limits.ts`, `lib/fixtures/mock-requests.ts`,
  `docs/deployment-checklist.md`.

## Corrección del estado de build (reemplaza al snapshot de apply-progress)

El último lote registrado en `apply-progress.md` reporta `status: partial` porque
`pnpm build` falló en el sandbox del agente con el error de Turbopack "creating new
process → binding to a port → Operation not permitted". Esa fue una limitación del
entorno de ejecución del agente, no un veredicto sobre el código.

**Hecho corregido**: el maintainer ejecutó `pnpm build` localmente el 2026-09-17 a las
22:21 y terminó con código 0: Next.js 16.3.5 compiló, TypeScript terminó sin errores, se
generaron 9/9 páginas estáticas y `/solicitud/creditos-adicionales` se emitió como ruta
estática. Esta evidencia se registra como aportada por el maintainer, no como un comando
que este verify haya ejecutado — este verify no reintentó `pnpm build` porque se sabe
bloqueado en este mismo sandbox por la misma razón ambiental.

## Progreso observado

`tasks.md` marca **63/63** tareas completas, incluida la Fase 0 (decisión Next ≥16.3.3,
CORS), Fases 1–3 (ruta pública, firma, envío/validación/acuse) y el bloque de corrección
de issues #24/#26/#30. No se reescribió ningún checkbox. `apply-progress.md` documenta 8
lotes acumulativos con evidencia RED/GREEN, incluida una reclasificación honesta de
tareas GUARD (1.3, 1.5–1.7, 4.2) donde la primera ejecución corrió en verde por diseño en
vez de fabricar un RED histórico — buena práctica, no un hallazgo.

## Checks ejecutados (comandos y resultados observados en esta sesión)

| Comando | Resultado |
|---|---|
| `pnpm test` | Exit 0 — **16 archivos, 125 tests en verde**. Coincide con la última medición registrada en `apply-progress.md`. |
| `rm -rf .next && pnpm exec tsc --noEmit` | Exit 0, sin salida. |
| `pnpm lint` (`eslint .`) | Exit 0, sin hallazgos. |
| `pnpm build` | **No ejecutado**, por instrucción explícita: se sabe bloqueado en este sandbox por la limitación de Turbopack ya documentada; se usa la evidencia local del maintainer (arriba) como prueba canónica. |
| `git diff --check` (rutas de la change) | Exit 0 — sin problemas de espacios en blanco. |
| `rg -c '^\s*it\(' app/requests/new/page.test.tsx` | `2` — coincide con lo registrado. |
| `git status` | Árbol limpio; `main` adelantado a `origin/main` por 5 commits (no verificados por push, según instrucción). |

## Cumplimiento TDD (Strict TDD Mode)

| Verificación | Resultado | Detalle |
|---|---|---|
| Evidencia TDD reportada | ✅ | Tablas "TDD Cycle Evidence" presentes en los 8 lotes de `apply-progress.md`. |
| Archivos de test existen | ✅ | Confirmados en disco: `page.test.tsx`, `definition-code.test.ts`, `canvas-firma.test.tsx`, `lib/api.test.ts`, `lib/fixtures/mock-requests.test.ts`. |
| GREEN confirmado (pasan ahora) | ✅ | `pnpm test` → 125/125 en verde en esta sesión. |
| Triangulación | ✅ | Casos independientes por comportamiento (p. ej. toque vs. movimiento significativo vs. carga por imagen en la firma; 404/413/422/429 por separado en el envío). |
| Safety net en archivos modificados | ✅ | Cada lote registra el comando de safety net antes de modificar. |
| Reclasificación GUARD | ✅, declarada explícitamente | 1.3, 1.5–1.7 y 4.2 se documentan como primera-corrida-verde por diseño, no como RED fabricado — es la conducta correcta ante ese escenario. |

**Cumplimiento TDD**: 6/6 verificaciones pasadas.

### Distribución por capa de test

| Capa | Tests | Archivos | Herramienta |
|---|---|---|---|
| Unit | ~59 (estimado por archivo: `lib/api.test.ts`, `lib/fixtures/mock-requests.test.ts`, `lib/public-request-limits` implícito) | 2 | vitest |
| Integration | ~66 (`page.test.tsx`, `canvas-firma.test.tsx`, `definition-code.test.ts`) | 3 | vitest + @testing-library/react (jsdom) |
| E2E | 0 | 0 | No instalado (`openspec/config.yaml` lo declara `available: false`) |
| **Total** | **125** (suite completa) | 16 | |

E2E real contra el backend público no existe como automatización; la Fase 3 cerró su
prueba real (tarea 3.19) con **una corrida manual en navegador** y **evidencia en base de
datos** (fila persistida), no con un test automatizado repetible. Es evidencia de runtime
válida una sola vez, no una prueba de regresión.

### Calidad de aserciones (Assertion Quality Audit)

Escaneados los cinco archivos de test de esta change (1055 líneas): sin tautologías
(`expect(true).toBe(true)`), sin bucles fantasma (`forEach`/`for...of` sobre
`queryAll`/`filter` con aserciones dentro — no se encontró ninguno), proporción
mock/assert muy por debajo del umbral 2× en los cuatro archivos con mocks (p. ej.
`lib/api.test.ts`: 18 mocks / 53 asserts). El `it.each(Object.keys(completeValues))` de
`page.test.tsx:174` itera sobre un objeto literal fijado en el propio test, no sobre una
colección obtenida en runtime que pudiera venir vacía — no es un bucle fantasma en el
sentido de la guía.

**Calidad de aserciones**: ✅ No se encontraron violaciones CRITICAL ni WARNING.

## Cobertura requisito por requisito (`specs/do-fr-100-form/spec.md`)

| Requisito | Estado | Evidencia |
|---|---|---|
| Acceso sin sesión, sin `AppShell` | ✅ | `page.tsx` no importa `AppShell` ni `useTramita`/`@/lib/store`; guarda de frontera en `page.test.tsx`. |
| Orden y rótulos oficiales de los bloques | ✅ | `sections.tsx` sigue el orden lugar/tipo/datos/motivo/compromisos/firma; rótulos verificados contra la corrección de la tarea 1.4. |
| Tipo afirmado, sin las otras casillas ni las 13 de motivo | ✅ | Sin `checkbox`/`combobox` en el árbol (confirmado con `rg` en esta sesión). |
| Once campos obligatorios, `trim()`, límites de longitud | ✅ | `validate()` en `page.tsx:44-53` recorre los 10 campos de texto más la firma; `PUBLIC_REQUEST_FIELD_LIMITS` en `lib/public-request-limits.ts` coincide exactamente con los límites del spec (120/20/255/30/120/120/120/50/50/2000). |
| El backend sigue siendo autoridad | ✅ | El `catch` de `ApiError` nunca asume éxito; conserva `values`/`signature`. |
| Trámite en la ruta, no en el cuerpo; allowlist explícito | ✅ | `submitPublicRequest` en `lib/api.ts:260-295` destructura explícitamente los 11 campos; el literal `ADICION_CREDITOS` aparece **una sola vez** en `page.tsx:11` (confirmado por `definition-code.test.ts` y por `rg`). |
| Semestre viaja como string sin transformar | ✅ | Sin transformación de `semester` en ningún punto del flujo. |
| Sin campo de asignatura/código/créditos | ✅ | Confirmado por `rg` — 0 ocurrencias en el árbol de producción. |
| Firma trazada + alternativa por imagen, mismo contrato | ✅ | `canvas-firma.tsx` expone `{ dataUrl, hayFirma }` desde ambas vías (canvas y `<input type="file">`); `clearSignature` reinicia ambas. |
| Umbral de 4px para trazo significativo | ✅ | `MINIMUM_STROKE_LENGTH = 4` en `canvas-firma.tsx:21`, ejercitado por tests dedicados. |
| Sin afirmación de validez legal | ✅ | Sin ocurrencias de esa afirmación en el texto de pantalla ni acuse (confirmado por lectura directa). |
| Acuse sin identificador/estado/enlace | ✅ | El bloque `submitted` de `page.tsx:99-108` solo muestra el título y que la Coordinación responderá al correo. |
| Manejo de errores 404/413/422/429 | ✅ | Mensajes específicos y no reveladores para 404 (`page.tsx:84-85`), orientación de firma para 413 (`:86-87`), campo atado vía `fieldErrorsFromProblem` con precedencia de "faltante" sobre "inválido" para 422 (`:80-83`, `:30-42`), y reutilización de `apiErrorMessages`/`Retry-After` para 429 y demás (`:88-93`). |

## Cobertura del delta `workflow-requests`

El literal de trámite aparece **exactamente una vez** en el código de la pantalla
(`page.tsx:11`) y arma la ruta, no el cuerpo — cumple el delta revisado. Sin selector de
trámites en la pantalla pública. Cumplido.

## Hallazgos

### WARNING — El invariante declarado "`app/requests/new/** sin tocar`" no se sostuvo

`proposal.md` declara en su tabla *Affected Areas* que `app/requests/new/**` y
`components/app-shell.tsx` quedan **"Sin tocar — Invariante"**, y el criterio de cierre
del 2026-09-18 midió `git diff 94a49f3 HEAD` sobre esa pantalla y su test como vacío.

El commit posterior `88a63b4` (lote final de higiene de fixtures, mismo día) sí modificó
`app/requests/new/page.tsx`: cambió el origen del import de `PROGRAMS`/`REQUEST_TYPE_LABELS`
(de un módulo que mezclaba datos de ejemplo con constantes de producción, a uno separado
solo de constantes) y reemplazó un `placeholder` de correo que citaba el dominio
institucional real por uno genérico. El test del archivo (`page.test.tsx`) no cambió — se
confirmó con `git diff` en esta sesión — y la suite completa sigue en verde, así que el
comportamiento no se rompió. Pero la afirmación literal "sin tocar" del proposal y el
criterio de cierre ya medido quedaron desactualizados por un trabajo posterior legítimo
que no volvió a actualizar esa constancia.

Impacto: bajo (cambio mínimo, motivado por higiene de datos personales, tests verdes),
pero es exactamente el tipo de deriva entre lo declarado y lo implementado que un jurado
podría señalar si compara `proposal.md` con el diff real.

### WARNING — El criterio "cero datos personales reales en cualquier archivo del repo" mide menos de lo que afirma

El criterio de cierre en `tasks.md` se marca `[x]` con el texto "cero datos personales
reales **en cualquier archivo del repo**", pero la evidencia citada ("un escaneo acotado
del árbol de trabajo") midió solo los archivos que este change tocó (los fixtures movidos
y `ORDEN.md`). Un escaneo más amplio de esta sesión encontró referencias al dominio
institucional real en varios archivos que **preexisten** a esta change (fechados entre
2026-07-15 y 2026-09-13, todos antes del inicio de esta change el 2026-09-16): documentación
de integración de auth, dos pantallas de Fase A/B y sus fixtures de test, y un módulo de
identidad con sus tests. Ninguno de esos archivos está en el alcance declarado de esta
change (`proposal.md` → *Affected Areas*), y el propio reporte ya aclara que el issue #14
que los rastrea **no se cerró** por este trabajo — así que no hay una promesa incumplida
de fondo, solo una redacción del criterio de cierre más amplia que lo que en verdad se
verificó. No transcribo aquí el dominio ni los archivos exactos por la restricción de
minimización de datos personales de este mismo reporte; quien retome el issue #14 puede
reproducir el hallazgo con una búsqueda acotada sobre el dominio institucional conocido.

Impacto: bajo para esta change específica (su propio alcance sí quedó limpio), pero la
redacción del checkbox sobreclama alcance frente a lo medido — vale la pena corregir el
texto del criterio o abrir explícitamente el issue #14 con este hallazgo.

## Sugerencias (SUGGESTION)

- `components/firma/canvas-firma.tsx:229` — el botón "Limpiar firma" se habilita con
  `disabled={!hayFirma && !uploadStatus}`. Si el usuario sube un archivo de tipo inválido,
  `uploadStatus` queda con el mensaje de error (no vacío) y el botón se habilita aunque no
  haya ninguna firma que limpiar. No afecta la validación de envío (que depende de
  `hayFirma`/`dataUrl` en `validate()`, no del estado del botón), así que es solo una
  inconsistencia de UX menor, no un hallazgo de comportamiento requerido por el spec.
- El `pnpm audit` reportado en `apply-progress.md` (13 vulnerabilidades: 3 moderate, 10
  high, ninguna crítica, ninguna en `next`) no se volvió a ejecutar en esta sesión por no
  ser parte de los comandos de verificación pedidos; sigue siendo informativo, no
  bloqueante.
- Preguntas 5 y 6 a la Coordinación (validez legal de la firma; si el trazo es dato
  biométrico bajo la Ley 1581) siguen explícitamente pendientes, tal como las declara
  `proposal.md`. No es un hallazgo de esta verificación — es una decisión de negocio fuera
  del alcance técnico.

## Resumen

- **CRITICAL**: 0
- **WARNING**: 2 (deriva entre el invariante declarado de `app/requests/new/**` y el
  código; redacción del criterio de "cero PII en el repo" más amplia que lo medido)
- **SUGGESTION**: 3

Los 125 tests pasan, `tsc --noEmit` y `eslint` terminan sin errores, y el build canónico
—aportado por el maintainer, no reproducido en este sandbox— compiló exitosamente con la
ruta pública emitida como estática. La implementación cubre, con evidencia directa de
código y no solo del reporte de apply, la totalidad de los requisitos y escenarios de
`specs/do-fr-100-form/spec.md` y el delta de `specs/workflow-requests/spec.md`. Los dos
hallazgos WARNING son de precisión documental/alcance, no de comportamiento roto.

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
