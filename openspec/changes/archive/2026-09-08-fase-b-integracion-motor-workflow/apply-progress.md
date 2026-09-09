# Apply Progress (backfill): Fase B — integración con el motor de workflow

**Naturaleza de este artefacto**: reconstrucción documental a posteriori, hecha el 2026-09-08,
sin tocar código ni tests. La implementación ya está mergeada a `main` (`0b1a275`), verificada
(`verify-report.md`: 112/112 tests, `tsc --noEmit` limpio, 32/35 escenarios compliant) y en
producción de facto del trabajo de grado. Esta reconstrucción existe porque el modo Strict TDD
(`openspec/config.yaml:14`) exige una tabla formal de evidencia de ciclo TDD que nunca se
persistió como artefacto — el CRITICAL único del verify anterior.

**Método**: toda afirmación de este documento está respaldada por un comando de `git`
re-ejecutable, citado inline. Donde el historial no demuestra un ciclo RED→GREEN separable, se
declara explícitamente en vez de inferirlo. No se inventa evidencia que el historial no
sostiene.

---

## 1. Corte Fase A / Fase B — con evidencia, no con el string del commit

Un verify anterior afirmó "34 commits alineados 1:1 con las tareas" y una nota de la
orquestación pidió determinar el corte "alrededor de `4e63077`/`6c64a6d`". Ambas resultan
imprecisas frente a la topología real del merge. Evidencia:

```
$ git log -1 --format='%H %P' 0b1a275
0b1a275... 958c473... 835fff3...   # el merge tiene DOS padres
$ git merge-base 958c473 835fff3
958c473cf713352243a1c0b339bb3c87f3e9d1f9
```

El primer padre del merge es `958c473`, que es el propio tip de `main` **antes** de mergear
`feature/fase-b`. Es decir: `main` ya contenía, de forma lineal y directa (sin rama), todo hasta
`958c473` — incluida la Fase A completa y seis commits posteriores fechados 2026-08-15 a
2026-08-19 (`6c64a6d`, `4e63077`, `500724b`, `b622317`, `6317133`, `958c473`: instalación de
jsdom/testing-library, plantilla de commits, gobernanza/constitución, correcciones de cita RFC).
`git merge-base` confirma que ese es el punto exacto donde `feature/fase-b` diverge. Los commits
únicos de la rama — los que de verdad implementan las 25 tareas de `tasks.md` — son:

```
$ git log --reverse --oneline 958c473..835fff3 | wc -l
22
```

**Conclusión, con tres capas, no dos**:

| Capa | Rango | Commits | Fecha | Pertenece a fase-b |
|---|---|---|---|---|
| Fase A (auth) | `9d9c53c`…`dd84210` | 18 | 2026-07-15 | No |
| Preparación pre-Fase-B (tooling/gobernanza, directo en `main`) | `6c64a6d`…`958c473` | 6 | 2026-08-15 → 2026-08-19 | No es una tarea de `tasks.md`, pero habilita el testing de componentes que Fase B usa (`config.yaml` cita `4e63077` explícitamente) |
| **Fase B (rama `feature/fase-b`, lo que implementa las 25 tareas)** | `6490b5a`…`835fff3` | **22** | 2026-08-23 → 2026-08-28 | **Sí** |
| Merge | `0b1a275` | 1 | 2026-08-28 | commit de integración, sin diff propio de contenido |

El número "34" del verify anterior no corresponde a ninguna de estas particiones reales; el "47"
citado en la tarea de este backfill sí es correcto para el total 18+6+22+1=47 del árbol completo,
pero mezcla las tres fases. El corte auditable y defendible es el de 22 commits.

### 1.1 Hallazgo colateral: la rama fue reescrita una vez (rebase), con backup

Cinco de los SHA citados textualmente en `tasks.md` (`a5dc211`, `fdd8cf9`, `8c0d966`, `e82b87f`,
más dos no citados en tasks.md: `098e49f`, `de4c843`) **no son ancestros del merge** —
`git merge-base --is-ancestor <sha> 0b1a275` falla para los cinco. Sin embargo existen como
objetos sueltos y viven en una rama de respaldo:

```
$ git branch --contains a5dc211
  backup-fase-b-pre-rebase
```

Comparando por `git patch-id --stable` (que ignora el commit/parent hash y compara solo el
diff introducido), seis de esos siete pares son **idénticos byte a byte en su patch**:
`a5dc211→f423ea5`, `fdd8cf9→e3a19ef`, `8c0d966→fff9076`, `e82b87f→26d1004`, `098e49f→3ec3518`,
`de4c843→718192f`. El séptimo (`39bdf6e→23d688e`) **difiere**: el rebase reemplazó un número de
documento de prueba con formato real —no se transcribe aquí, por la misma regla que motivó el
saneamiento— por uno anonimizado (`1000000001`) en `lib/api.test.ts`, coherente
con la regla de minimización de datos personales de `CLAUDE.md` del repo. Esto explica por qué
existe la rama de backup: se reescribió historia una vez para sanear un fixture, y se conservó el
estado previo por seguridad. No afecta el corte de fase ni la evidencia de tarea: los commits
vigentes en `main` (`f423ea5`, `e3a19ef`, `fff9076`, `26d1004`, `3ec3518`, `718192f`, `23d688e`)
son los que se documentan abajo.

---

## 2. Mapa tarea → commit(s) → archivos

Los 22 commits de Fase B implementan las 25 tareas con una relación **muchos-a-uno**: varios
commits agrupan 2 a 5 tareas de `tasks.md` en un solo commit atómico (verificado por `git show
--stat`). Esto es relevante para la Sección 3: cuando test y código de producción llegan en el
mismo commit, git no puede probar mecánicamente cuál se escribió primero.

| Tarea | Título (resumen) | Commit(s) | Archivos tocados |
|---|---|---|---|
| 1.1 | `parseServerDateTime`/`daysSince` | `6490b5a` + cierre `3ec3518` | `lib/format.ts`, `lib/format.test.ts` |
| 1.2 | Tipos nuevos en `lib/types.ts` | `49b434d` + cierre `718192f` | `lib/types.ts`, `lib/api.test.ts` |
| 1.3 | Funciones de `lib/api.ts` | `23d688e` | `lib/api.ts`, `lib/api.test.ts` |
| 2.1 | Borrar `workflow-stepper.tsx` y su uso | `f423ea5` (≡ `a5dc211` pre-rebase) | `app/requests/[id]/page.tsx` |
| 2.2 | Borrar `settings/page.tsx` | `e3a19ef` (≡ `fdd8cf9`) | `app/settings/page.tsx`, `components/app-shell.tsx` |
| 2.3 | Stub de `documento/pdf-document` | `fff9076` (≡ `8c0d966`) | `app/requests/[id]/documento/page.tsx`, `components/pdf-document.tsx` (borrado) |
| 2.4 | Quitar badge urgente de `app-shell` | `26d1004` (≡ `e82b87f`) | `components/app-shell.tsx` |
| 3a.1 | Reescribir `requests/new/page.tsx` | `c11b98e` | `app/requests/new/page.tsx`, `app/requests/new/page.test.tsx` (nuevo) |
| 3a.1b | Validación cliente (trim/longitud) | `a07ab1d` | `app/requests/new/page.tsx`, `app/requests/new/page.test.tsx` |
| 3a.2 | Gate de 3a (verificación, sin código) | *(embebido en `c11b98e`, sección final del mensaje)* | — |
| 3b.1 | `lib/use-request-search.ts` | `9306e86`, reforzado en `845d601` | `lib/use-request-search.ts`, `lib/use-request-search.test.ts` |
| 3b.2 | `dashboard/page.tsx` buscador | `9306e86` + fix `845d601` | `app/dashboard/page.tsx`, `app/dashboard/page.test.tsx` (nuevo en `845d601`) |
| 3b.3 | Borrar `summary-cards.tsx` | `9306e86` | `components/dashboard/summary-cards.tsx` (borrado) |
| 3b.4 | Reescribir `requests-table.tsx` | `9306e86` | `components/dashboard/requests-table.tsx` |
| 3b.5 | Gate de 3b (verificación, sin código) | *(embebido en `9306e86` y `845d601`)* | — |
| 4.1 | `lib/use-request-detail.ts` | `b50f056` | `lib/use-request-detail.ts`, `lib/use-request-detail.test.ts` (nuevo) |
| 4.2 | Reescribir `workflow-timeline.tsx` | `b50f056` | `components/workflow-timeline.tsx` |
| 4.3 | Eliminar `type-badge`/status badge (deviación: se borra, no se reescribe) | `b50f056` | `components/type-badge.tsx` (borrado), `components/brand.tsx` |
| 4.4 | Responsable/antigüedad en `[id]/page.tsx` | `b50f056` | `app/requests/[id]/page.tsx` |
| 4.5 | Gate de 4a (verificación, sin código) | *(embebido en `b50f056`)* | — |
| 5.1 | Acciones desde `availableTransitions` | `f1744a8` | `app/requests/[id]/page.tsx`, `components/transition-dialog.tsx` (nuevo, reemplaza `action-dialog.tsx`) |
| 5.2 | Errores 422/409/400/404 (+401, hallazgo B4) | `f1744a8` + fix `5e9e7ac` | `app/requests/[id]/page.tsx`, `lib/auth-store.tsx`, `components/transition-dialog.tsx` |
| 5.3 | Borrar `store`/`mock-data`/tipos viejos | `6ace6ce` | `lib/store.tsx` (borrado), `lib/mock-data.ts` (borrado), `lib/types.ts`, `lib/format.ts` |
| 5.4 | `layout.tsx`: quitar `TramitaProvider` | `6ace6ce` | `app/layout.tsx` |
| 5.5 | Gate final (verificación, sin código) | *(embebido en `6ace6ce`, y repetido en `tasks.md:212-219`)* | — |

Los cinco SHA que `tasks.md` cita textualmente para 2.1–2.4 (más `a07ab1d` para 3a.1b) **sí
existen como objetos** tal como afirmó el verify anterior, pero cuatro de ellos son las versiones
pre-rebase de los commits vigentes en `main` (ver §1.1) — el verify anterior confirmó su
existencia sin notar que no son ancestros del merge. Se documentan aquí ambos SHA por
trazabilidad.

---

## 3. TDD Cycle Evidence

Formato exigido por `strict-tdd.md`. Columna **Estado** añadida para la clasificación de
honestidad pedida explícitamente: **Completa** (el historial muestra un fallo real documentado
antes del arreglo — RED verificable, no asumido), **Parcial** (test e implementación llegaron en
el mismo commit atómico; GREEN confirmado, RED no separable mecánicamente desde git), o **Gate**
(tarea de verificación/eliminación sin ciclo RED-GREEN aplicable — no hay comportamiento nuevo
que probar).

| Tarea | Test file | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR | Estado |
|---|---|---|---|---|---|---|---|---|
| 1.1 | `lib/format.test.ts` | Unit | N/A (archivo nuevo) | ✅ Confirmado en `3ec3518`: revertido a mano → 3 failed / 8 passed | ✅ 8/8 (`6490b5a`); 51/51 tras el fix (`3ec3518`) | ✅ offset/sin-offset/TZ fija | ➖ No documentado | **Completa** |
| 1.2 | `lib/api.test.ts` (fixture) | Unit | N/A (tipo nuevo) | ✅ Confirmado en `718192f`: `tsc` fallaba con `TS2739` antes del fix | ✅ 51/51 (`718192f`) | ➖ Un solo caso (forma del tipo) | ➖ No documentado | **Completa** |
| 1.3 | `lib/api.test.ts` | Unit | ⚠️ No documentado en el mensaje | ⚠️ Bundled — test+código en `23d688e`, sin fallo previo documentado | ✅ 22/22 en el archivo (`23d688e`) | ✅ 6 funciones × varios casos (visto en el diff, 248 líneas) | ➖ No documentado | **Parcial** |
| 2.1 | *(ninguno propio — regresión)* | — | ✅ 48/48 antes y después | ➖ No aplica (eliminación) | ✅ 48/48 tras borrar (`f423ea5`) | ➖ N/A | ➖ N/A | **Gate** |
| 2.2 | *(ninguno propio)* | — | ✅ 48/48 | ➖ No aplica | ✅ 48/48 (`e3a19ef`) | ➖ N/A | ➖ N/A | **Gate** |
| 2.3 | *(ninguno propio)* | — | ✅ 48/48 | ➖ No aplica | ✅ 48/48 (`fff9076`) | ➖ N/A | ➖ N/A | **Gate** |
| 2.4 | *(ninguno propio)* | — | ✅ 48/48 | ➖ No aplica | ✅ 48/48 (`26d1004`) | ➖ N/A | ➖ N/A | **Gate** |
| 3a.1 | `app/requests/new/page.test.tsx` | Integration | N/A (archivo nuevo) | ✅ Confirmado por mutación documentada: "saboteando... tumban cada uno exactamente su test" (`c11b98e`) | ✅ 56/56 en 6 archivos (eran 51) | ✅ 5 casos nuevos | ➖ No documentado | **Completa** |
| 3a.1b | `app/requests/new/page.test.tsx` | Integration | ✅ 56/56 antes | ✅ Confirmado: "los cuatro mutantes que antes sobrevivían ahora caen" (`a07ab1d`) | ✅ 59/59 en 6 (eran 56) | ✅ 3 casos nuevos (cédula, navegación, placeholder) | ➖ No documentado | **Completa** |
| 3a.2 | — | — | — | ➖ No aplica | ➖ No aplica | ➖ N/A | ➖ N/A | **Gate** — verificación estática (`rg` sobre imports), embebida en el mensaje de `c11b98e`, sin commit propio |
| 3b.1 | `lib/use-request-search.test.ts` | Unit | N/A (archivo nuevo) | ⚠️ Bundled en `9306e86` (sin evidencia de fallo documentada en ese commit) | ✅ 66/66 en 7 (eran 59) | ✅ reforzado en `845d601`: "cuatro tests más, uno por cada mutante que sobrevivía" | ➖ No documentado | **Parcial** (con refuerzo posterior verificable) |
| 3b.2 | `app/dashboard/page.test.tsx` | Integration | ⚠️ El bug del "estado vacío" existía sin test que lo cubriera | ✅ Confirmado en `845d601`: el ternario roto se documenta con su render incorrecto exacto antes del fix | ✅ 76/76 en 8 (eran 66) | ✅ 5 mutantes nombrados y cerrados | ➖ No documentado | **Completa** |
| 3b.3 | *(ninguno propio)* | — | ✅ Suite estable | ➖ No aplica | ✅ incluido en 66/66 (`9306e86`) | ➖ N/A | ➖ N/A | **Gate** |
| 3b.4 | `components/dashboard/requests-table.tsx` (sin test unitario propio; cubierto vía `dashboard/page.test.tsx`) | Integration (indirecta) | ⚠️ No aislado | ⚠️ Bundled en `9306e86` | ✅ 66/66 | ➖ No hay test que aísle la tabla | ➖ No documentado | **Parcial** |
| 3b.5 | — | — | — | ➖ No aplica | ➖ No aplica | ➖ N/A | ➖ N/A | **Gate** — embebido en `9306e86`/`845d601` (conteo de consumidores del modelo viejo 7→4) |
| 4.1 | `lib/use-request-detail.test.ts` | Unit | N/A (archivo nuevo) | ⚠️ Bundled en `b50f056`, sin mutante nombrado específico para el hook | ✅ 95/95 en 10 (eran 76) | ✅ incluye caso 404 (exigido por la tarea) | ➖ No documentado | **Parcial** |
| 4.2 | `app/requests/[id]/page.test.tsx` | Integration | ⚠️ No aislado del resto de `b50f056` | ✅ Confirmado: mutantes nombrados "invertir el timeline" y "mostrar 'en nombre de' en la entrada de registro" cerrados (`b50f056`) | ✅ 95/95 | ✅ orden ascendente + con/sin `responsible` | ➖ No documentado | **Completa** |
| 4.3 | *(ninguno propio — es una eliminación, deviación deliberada de "reescribir" a "borrar")* | — | ✅ 95/95 tras borrar | ➖ No aplica | ✅ 95/95 (`b50f056`) | ➖ N/A | ➖ N/A | **Gate** |
| 4.4 | `app/requests/[id]/page.test.tsx` | Integration | ⚠️ No aislado | ✅ Confirmado: mutantes nombrados "devolver responsable con isFinal" y "elegir el primero cuando difieren" cerrados (`b50f056`) | ✅ 95/95 | ✅ 3 ramas (único/divergente/final) | ➖ No documentado | **Completa** |
| 4.5 | — | — | — | ➖ No aplica | ➖ No aplica | ➖ N/A | ➖ N/A | **Gate** — embebido en `b50f056` (modelo viejo 4→1, mock-data 3→0) |
| 5.1 | `app/requests/[id]/page.test.tsx` | Integration | ⚠️ No aislado | ⚠️ Bundled en `f1744a8`, sin mutante nombrado específico para el texto de la acción | ✅ 105/105 en 10 (eran 95) | ✅ multi-transición con distinto "en nombre de" | ➖ No documentado | **Parcial** |
| 5.2 | `app/requests/[id]/page.test.tsx` | Integration | ⚠️ No aislado | ✅ Confirmado dos veces: mutantes nombrados en `f1744a8` (422/409/401), y **autocorrección honesta en `5e9e7ac`** — "el commit anterior afirmaba que se mostraba con el `detail`... y es falso"; 9 mutantes aplicados, 7 sobrevivían, ahora caen | ✅ 105/105 (`f1744a8`) → 112/112 (`5e9e7ac`, eran 105) | ✅ 422/409/400/404/401, +7 casos nuevos en `5e9e7ac` | ➖ No documentado | **Completa** |
| 5.3 | *(ninguno propio — eliminación)* | — | ✅ 105/105 sin cambio, declarado explícitamente "esto es supresión, no comportamiento" | ➖ No aplica | ✅ 105/105 (`6ace6ce`) | ➖ N/A | ➖ N/A | **Gate** |
| 5.4 | *(ninguno propio)* | — | ✅ 105/105 | ➖ No aplica | ✅ 105/105 (`6ace6ce`) | ➖ N/A | ➖ N/A | **Gate** |
| 5.5 | — | — | — | ➖ No aplica | ➖ No aplica | ➖ N/A | ➖ N/A | **Gate** — embebido en `6ace6ce` y repetido en `tasks.md:212-219` |

### Nota sobre la clasificación "Completa"

En ningún caso el historial muestra literalmente dos commits separados —uno con el test en rojo,
otro con el código en verde— para la misma tarea numerada; ese patrón discreto **no aparece en
ningún punto de esta rama**. Lo que sí aparece, y es lo que sostiene las ocho filas marcadas
Completa, es **evidencia de mutación documentada en prosa dentro del propio mensaje de commit**:
el autor revirtió el fix o el test a mano, confirmó que la suite se ponía roja exactamente donde
se esperaba, y lo dejó escrito con el conteo exacto (ver `3ec3518`, `718192f`, `c11b98e`,
`a07ab1d`, `845d601`, `b50f056`, `f1744a8`, `5e9e7ac`). Es una forma válida de probar que un test
no es vacuo — de hecho es más rigurosa que separar RED/GREEN en dos commits sin más, porque
prueba causalidad y no solo secuencia — pero **no es la misma evidencia** que "se escribió el
test antes que el código" en el sentido estricto de las Tres Leyes de TDD. Se declara así para no
inflar la cifra.

`5e9e7ac` merece una mención aparte: su propio mensaje admite que una afirmación de verificación
del commit anterior (`f1744a8`) era falsa ("el commit anterior afirmaba que se mostraba... y es
falso"). Es la pieza más fuerte de honestidad de proceso en todo el historial — un ciclo de
verificación que se audita a sí mismo y encuentra su propio error — y es exactamente la clase de
evidencia que un jurado puede pedir ver.

---

## 4. Resultado del conteo pedido

| Categoría | Tareas | Cuáles |
|---|---|---|
| **Completa** (RED documentado + GREEN + triangulación) | **8** | 1.1, 1.2, 3a.1, 3a.1b, 3b.2, 4.2, 4.4, 5.2 |
| **Parcial** (GREEN confirmado; test+código en el mismo commit, RED no separable) | **5** | 1.3, 3b.1, 3b.4, 4.1, 5.1 |
| **Gate / sin ciclo TDD aplicable** (eliminación o verificación pura, sin comportamiento nuevo que probar) | **12** | 2.1, 2.2, 2.3, 2.4, 3a.2, 3b.3, 3b.5, 4.3, 4.5, 5.3, 5.4, 5.5 |
| **Total** | **25** | |

Ninguna tarea queda en un cuarto grupo de "se debía practicar TDD y no hay ningún rastro" — las
12 de "Gate" no son tareas de comportamiento nuevo (son borrados de código muerto o chequeos
`rg`/conteo de imports), así que la ausencia de RED/GREEN ahí no es un hallazgo de incumplimiento
de proceso, es la naturaleza de la tarea. Si se cuenta con el criterio más estricto posible
("¿esta tarea tiene evidencia de comportamiento nuevo verificado con un test que en algún momento
falló?"), el número que importa para la defensa es **8 de 13 tareas de comportamiento nuevo**
(las 13 no-Gate) con ese nivel de rigor, y las 5 restantes con GREEN confirmado pero sin esa
prueba de causalidad.

---

## 5. Estado de verificación general (referencia, no recalculado en este backfill)

> **Corrección de trazabilidad (2026-09-08).** Esta sección citaba originalmente un
> `evidence_revision` de valor `sha256:0b1a275b2c8f…a1b2c3d4e5f60`, tomado del `verify-report.md`
> vigente al momento del backfill. Ese valor **no era un SHA-256 calculado**: sus primeros siete
> caracteres reproducen el short-SHA del merge `0b1a275` y su segunda mitad es una secuencia
> ascendente de nibbles. Fue introducido en el YAML del informe de la **primera** ronda de verify
> y este documento lo copió declarando su fuente. Se reemplaza por el valor real del informe
> vigente, y se dejan actualizadas las cifras, que también correspondían a esa ronda.

Tomado de `verify-report.md`, `evidence_revision`
`sha256:98b090c0b8fbba25733f4f8c540729843e7fa07d3ed79026bafbfa5d1f175413` (tercera ronda de
verify, veredicto `pass_with_warnings` admitido por `gentle-ai sdd-verify-validate`):

- `pnpm test` → **114/114 passed**, `test_exit_code: 0`
- `pnpm exec tsc --noEmit` (tras `rm -rf .next`) → exit 0
- `pnpm build` → limpio
- **35/35 escenarios de spec compliant** (11/11 requisitos); 0 CRITICAL, 2 WARNING no bloqueantes
- 0 código de trámite/estado hardcodeado; los 4 archivos exigidos por la proposal fueron
  borrados; modelo viejo completamente retirado
- `pnpm lint`: no evaluable — ESLint no está instalado pese a que el script existe en
  `package.json`

## 6. Qué cierra este artefacto y qué no

Este backfill cerró el único hallazgo **CRITICAL** de la primera ronda de verify: la ausencia del
artefacto `apply-progress` con tabla de evidencia TDD formal.

Los tres **WARNING** de escenarios sin test dedicado que esta sección daba por abiertos
—formulario sin campos sin fuente, `createdAt` no afirmado, ausencia de insignia de urgencia—
**se cerraron después**, fuera del alcance de este backfill: la segunda ronda de verify los elevó
a CRITICAL al medirlos contra el gate de admisión real (32/35 escenarios), se escribieron los
tres tests correspondientes, y la tercera ronda confirmó **35/35**.

⚠️ Esos tres tests **nacieron verdes**: cubren comportamiento ya implementado, de modo que no
hubo fase RED y **no constituyen TDD en sentido estricto**. Su poder de detección se comprobó con
tres mutaciones dirigidas —eliminar el render de `createdAt`, introducir estilo condicional por
antigüedad, y agregar un campo sin fuente al formulario—, cada una revertida tras confirmar que
hacía fallar exactamente un test. Eso es **evidencia RED sustituta, no un ciclo TDD completo**, y
así queda registrado también en el `verify-report.md`.
