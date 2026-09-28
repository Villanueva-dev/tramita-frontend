# Tasks: Formulario público DO-FR-100 por pasos

> Solo apply: PR-3 (asistente, en cuatro slices por presupuesto) y PR-4 (pulido). PR-2 lo
> entrega el orquestador. Prosa de fondo en `proposal.md` y `design.md`; aquí solo lo accionable.
> Base medida: `page.tsx` 158 líneas, `sections.tsx` 177, `canvas-firma.tsx` 234, `page.test.tsx`
> 354 líneas / 19 `it(`.

## Review Workload Forecast

| Slice | Contenido | Est. líneas | Riesgo |
|---|---|---|---|
| 3a | `steps.ts` puro | 180–220 | Low |
| 3b | Helpers de test nivel-estudiante, sin cablear (mueve el grueso de la reescritura fuera de 3d) | 200–280 | Low–Medium |
| 3c | `wizard.tsx` + `review-summary.tsx`, sin cablear, con sus tests; `sections.tsx` extraído sin cambiar su salida | 380–450 | Medium–High |
| 3d | Cableado: estado, navegación, envío, foco, 422 — el único cambio de comportamiento | 450–550 | **High** |
| 4 | Pulido visual | 300–400 | Medium |

Delivery strategy: auto-chain · Chain strategy: stacked-to-main

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

⚠️ **3d es la única unidad sin corte honesto adicional**: es el cambio de comportamiento atómico
(pasar de una página a un asistente funcional); cualquier corte interno deja en `main` un paso
sin destino o una revisión sin resumen, un estado que no cumple la spec bajo `stacked-to-main`
(solo cabría con `feature-branch-chain`, que no es la estrategia fijada). Si la medición real de
3d supera 400, repórtese el número exacto y pídase `size:exception` **al llegar a esa unidad**;
no bloquea el arranque de 3a–3c. 3c es la segunda candidata a exceder: si la medición real pasa
de 400, repórtese y divídase en 3c-i (`wizard.tsx`) / 3c-ii (`review-summary.tsx` + `sections.tsx`)
antes de abrir el PR — no se fuerza aquí porque ninguna de las dos partes cambia comportamiento.

### Suggested Work Units

| Unit | Goal | PR | Focused test command | Runtime harness | Rollback boundary |
|---|---|---|---|---|---|
| 1 | Modelo puro de pasos | 3a | `pnpm exec vitest run components/do-fr-100/steps.test.ts` | N/A — módulo puro, nadie lo importa aún | Revierte `steps.ts`/`.test.ts` |
| 2 | Helpers de test nivel-estudiante | 3b | `pnpm exec vitest run app/solicitud/creditos-adicionales/page.test.tsx` | N/A — mismo comportamiento, solo refactor de test | Revierte el refactor; los tests vuelven a inline |
| 3 | Módulos presentacionales sin cablear | 3c | `pnpm exec vitest run components/do-fr-100/` | N/A — nada los renderiza en producción aún | Revierte los tres archivos nuevos/refactor |
| 4 | Cableado del asistente | 3d | `pnpm exec vitest run app/solicitud/creditos-adicionales/page.test.tsx` | Firmar con el dedo en «Firma», navegar y volver | `git revert`; `page.tsx` vuelve a una sola página |
| 5 | Pulido visual | 4 | `pnpm exec vitest run app/solicitud/creditos-adicionales/page.test.tsx components/firma/canvas-firma.test.tsx` | Firmar con el dedo en el recuadro de 200px con guía | Revierte solo presentación; 3d intacto |

## Slice 1 — PR-3a: modelo puro

- [x] 1.1 RED→GREEN `components/do-fr-100/steps.ts` + `.test.ts`: `STEPS` (5, orden fijo),
      `FIELD_STEP`, `isFormField`, `errorsOfStep`, `firstStepWithError`, `stepsWithErrors`, per
      `design.md:144-155`. Sin JSX, sin import de `page.tsx`.
- [x] 1.2 Verify: `pnpm exec vitest run components/do-fr-100/steps.test.ts`; `pnpm test` (las 19
      definiciones de `page.test.tsx` intactas; la lista cerrada de `:78-82` suma `steps.ts`,
      porque el guardián enumera los archivos de producción del directorio y se rompe en el
      slice que crea el archivo, no en 4.5); `rm -rf .next && pnpm exec tsc --noEmit`.
- [x] 1.3 Commit: `feat(do-fr-100): modelo puro de pasos del asistente`.

## Slice 2 — PR-3b: helpers de test nivel-estudiante (sin cambio de comportamiento)

- [x] 2.1 REFACTOR `page.test.tsx`: agregar `fillPublicRequestForm(values)` /
      `submitForm()` (hoy: llenan los once campos y pulsan «Enviar solicitud») y migrar las 12
      reescritas de `design.md` *Testing Strategy* (líneas 89,153,163,174,185,197,216,231,245,
      272,301,340) a llamarlos. Mismas aserciones; suite verde antes y después. De las 12, 9
      tenían fill/submit para migrar (8 a ambos helpers, 1 solo a `submitForm()` porque
      depende de no firmar); las 3 restantes (`:90`,`:154`,`:164` actuales) no llenan ni
      envían hoy y quedan para su reescritura de navegación en el Slice 4 — ver
      `apply-progress.md` para el detalle y la razón.
- [x] 2.2 Verify: `pnpm exec vitest run app/solicitud/creditos-adicionales/page.test.tsx`;
      `pnpm test`; `rm -rf .next && pnpm exec tsc --noEmit`.
- [x] 2.3 Commit: `test(do-fr-100): helpers de nivel estudiante antes del asistente`.

## Slice 3 — PR-3c: módulos presentacionales sin cablear

- [x] 3.1 RED→GREEN `components/do-fr-100/wizard.tsx` + test: `StepPanel` (`hidden` por
      `active`), `StepProgress` (labels + marca de `stepsWithErrors`, sin elemento interactivo —
      «la barra no permite saltar»), `StepNavigation`. No lo importa `page.tsx` todavía.
- [x] 3.2 RED→GREEN `components/do-fr-100/review-summary.tsx` + test: resumen por bloque,
      botón «Cambiar» con el bloque en su nombre accesible (`onEdit`).
- [x] 3.3 REFACTOR `sections.tsx`: extraer franja fija + grupos de campos por `FIELD_STEP`
      (`design.md` decisión 1); `PublicRequestSections` sigue renderizando todo en una pasada —
      cero cambio de comportamiento, `page.test.tsx` queda verde sin tocarlo.
- [x] 3.4 Verify: `pnpm exec vitest run components/do-fr-100/`; `pnpm test` (la lista cerrada de
      `page.test.tsx:78-82` suma `wizard.tsx` y `review-summary.tsx`, por la misma razón que en
      1.2); `rm -rf .next && pnpm exec tsc --noEmit`. Medir `git diff --stat`; **646 líneas
      medidas tras las correcciones de revisión, supera 400** → dividir en 3c-i (`wizard.tsx`,
      282 líneas)/3c-ii (`review-summary.tsx` + `sections.tsx`, 364 líneas) antes de abrir el PR
      — ver `apply-progress.md` para el detalle de la medición y de las correcciones.
- [x] 3.5 Commit: `feat(do-fr-100): módulos presentacionales del asistente, sin cablear`.
      Entregado como dos commits por la medición de 3.4: `b6d2418` (3c-i, `wizard.tsx`, PR #67,
      merge `09078d0`) y `7e18017` (3c-ii, `review-summary.tsx` + `sections.tsx`, PR #68, merge
      `ff4b6ab`), en ramas apiladas a `main`. Corrección: `b0bb338` era el hash de 3c-ii antes de
      que GitHub reescribiera el commit al reencauzar la rama contra el `main` actualizado por
      3c-i; el hash que vive en `main` es `7e18017`.

## Slice 4 — PR-3d: cableado (el cambio de comportamiento)

- [x] 4.1 RED→GREEN `page.tsx`: estado `step`, `handleContinue`/`handleBack`/`goToStep`
      (`flushSync` + foco al encabezado o, tras un error, al primer campo inválido; decisión 6),
      `<form onSubmit>` con despacho único (decisión 4), rama de correo en `validate`
      (decisión 3). Escenarios: Continuar avanza con paso válido; Volver conserva lo escrito;
      Continuar no avanza con campo inválido y enfoca el primer campo inválido (en «Firma», el
      encabezado); correo sin `@`/dominio impide continuar; foco al encabezado en cada cambio
      sin moverse al cargar; Enter en paso 1 avanza sin enviar.
- [x] 4.2 RED→GREEN: componer `page.tsx` con `wizard.tsx` + `review-summary.tsx` (`onEdit` →
      `goToStep`) + los grupos de `sections.tsx` de 3.3; «Cambiar» recorre los pasos siguientes
      hasta volver a la revisión.
- [x] 4.3 RED→GREEN: 422 → `goToStep(firstStepWithError, 'firstInvalid')` (foco al primer campo
      con error) + `StepProgress` marca `stepsWithErrors`; 404/413/429/422-sin-campos-propios en
      la revisión; atajo «Ir a la firma» del 413 (texto de hoy — PR-4 lo cambia).
- [x] 4.4 RED→GREEN: la firma sobrevive a Volver/Cambiar (`hidden` no desmonta `CanvasFirma`,
      decisión 7); reescribir con los helpers de 2.1 las pruebas de firma existentes para llegar
      al paso «Firma».
- [x] 4.5 GREEN: apuntar `fillPublicRequestForm`/`submitForm` (slice 2) a navegación real por
      paso; sumar `{ hidden: true }` en las ausencias (`:121,129`). La lista cerrada (`:75`) ya
      quedó al día en 1.2 y 3.4.
- [x] 4.6 Verify: `pnpm test` completo; `app/requests/new/page.test.tsx` intacto;
      `rm -rf .next && pnpm exec tsc --noEmit`; `pnpm lint`; `pnpm build`. Mutantes: quitar
      `flushSync` o el despacho de `onSubmit` debe romper al menos una prueba.
- [x] 4.7 **Puerta en vivo** (el orquestador la corre con permiso del usuario): firmar con el
      dedo en «Firma», navegar y volver, confirmar que el trazo sobrevive. Corrida el 2026-09-26
      en Chrome contra `next dev`, con el mouse (el dedo solo lo confirma el usuario en un
      celular): el trazo sobrevive a Volver, a Continuar y a «Cambiar», y llega a la revisión
      como imagen; el foco va al encabezado en cada cambio y al primer campo inválido cuando
      Continuar falla; sin enviar. Evidencia en `apply-progress.md`. Hallazgo: el aviso
      «1 issue» del overlay de Next es un `img src=""` de `review-summary.tsx` (Slice 3),
      diferido a 5.5 por decisión del usuario.
- [x] 4.8 Medido `git diff --numstat` sobre los tres archivos tocados (código, sin `openspec/`):
      **607 líneas** (327 `page.test.tsx` + 203 `page.tsx` + 77 `sections.tsx`), por encima del
      pronóstico de 450–550 y del presupuesto de 400 — ver `apply-progress.md` para el detalle.
      Se reporta el número exacto tal como indica la ⚠️ del forecast; no se dividió ni se
      recortó nada para acercarlo al presupuesto. `size:exception` concedido por el responsable
      el 2026-09-26, junto con el «aprobado» del diff.
- [x] 4.9 Commit: `feat(do-fr-100): asistente cableado — navegación, envío y errores por paso`.
      Entregado como `1fb9de9` tras el «aprobado» del diff y el `size:exception`; el hash se
      registró en el commit de docs que cierra el corte, como en 3c.

## Slice 5 — PR-4: pulido visual

- [x] 5.1 RED→GREEN `canvas-firma.tsx` + test: `CANVAS_HEIGHT` 200 (`h-50`), guía y texto
      superpuestos (`pointer-events: none`), botón «Borrar y firmar de nuevo» con el `Button`
      del proyecto (puede cerrar #27); actualizar las 5 consultas de «Limpiar firma» y `h-11`.
      RED→GREEN observado (13/13 tras GREEN); ver `apply-progress.md`, Slice 5.
- [x] 5.2 RED→GREEN `page.tsx`: texto del 413 → «...Bórrela y fírmela de nuevo.»; encabezado
      con `Logo` + «Formato DO-FR-100»; panel Ayuda (`<details>`) con «+57 315 2966601» y enlace
      `wa.me` (`target="_blank" rel="noopener noreferrer"`); aviso de errores por paso sin
      duplicar los `role="alert"` de campo — resolver una sola región viva (Open Question de
      `design.md`). RED→GREEN observado (65/65 tras GREEN); ver `apply-progress.md`, Slice 5.
- [x] 5.3 RED→GREEN `sections.tsx`: ejemplo por campo (datos sintéticos, #14), contador «N de
      2000» en `reason`, 17px en `<main>`, controles 52–56px. RED→GREEN observado (60/60 tras
      GREEN); ver `apply-progress.md`, Slice 5.
- [x] 5.4 RED→GREEN `page.tsx`: el acuse destaca `studentEmail` diligenciado (sin reinicio, D5).
      Cubierto por el mismo RED→GREEN de 5.2; ver `apply-progress.md`, Slice 5.
- [x] 5.5 RED→GREEN `review-summary.tsx` + test: no renderizar la `<img>` de la firma mientras
      `signature.hayFirma` sea falso. Hallazgo de la puerta en vivo de 3d (4.7): D2 monta la
      revisión oculta con `dataUrl: ''` desde la carga y React avisa «An empty string ("") was
      passed to the src attribute» (el aviso «1 issue» del overlay de `next dev`). En el DOM el
      atributo no llega a emitirse, así que no hay petición de red: es ruido de desarrollo que
      tapa avisos reales. Diferido a este corte por decisión del usuario (2026-09-26). RED→GREEN
      observado (10/10 tras GREEN); ver `apply-progress.md`, Slice 5.
- [x] 5.6 Verify: `pnpm test`; `rm -rf .next && pnpm exec tsc --noEmit`; `pnpm lint`;
      `pnpm build`. Sin el `rm -rf .next` (dev server vivo, per environment cautions):
      `pnpm exec tsc --noEmit` directo. 27 archivos/322 pruebas verdes; `tsc` código 0; `lint`
      exit 0; `build` 9 rutas. Dos mutantes aplicados y revertidos con `diff` limpio (ver
      `apply-progress.md`, Slice 5).
- [x] 5.7 **Puerta en vivo**: firmar con el dedo en el recuadro de 200px con la guía. Corrida el
      2026-09-26 en Chrome con el mouse (el dedo solo lo confirma el usuario en un celular): el
      trazo atraviesa el texto y la línea de la guía sin que el overlay lo bloquee, la imagen de
      la revisión muestra solo el trazo, «Borrar y firmar de nuevo» deja el lienzo en cero, el
      aviso por paso aparece sin `role`/`aria-live` con el foco en el primer campo inválido, el
      contador de `reason` cambia al escribir y la consola ya no muestra el aviso de `src=""`.
      Evidencia en `apply-progress.md`, Slice 5.
- [x] 5.8 Commit: `feat(do-fr-100): pulido visual del asistente`. Entregado tras la puerta en
      vivo y la corrección de la revisión (389 líneas, dentro del presupuesto) como `020429a`;
      el hash se registró en el commit de docs que cierra el corte, como en 3c y 3d.

## Cierre

- [x] 6.1 Grep dirigido: ninguna pieza descartada (radicado, línea de tiempo, «le avisaremos»,
      adjuntos, «Volver al inicio», equivalencia con firma escaneada, «5 minutos») en pantalla.
      Corrido el 2026-09-26 sobre `main` en `70de563` (merge de PR-4, #72): `git grep -n -i -E
      "radicado|línea de tiempo|le avisaremos|adjunto|Volver al inicio|firma escaneada|5 minutos"`
      en `app/solicitud`, `components/do-fr-100` y `components/firma`, sin salida en código de
      producción; la única coincidencia es la prueba que afirma su ausencia (`page.test.tsx:467`).
- [x] 6.2 Archivar el cambio solo tras PR-4 en `main` — archivado en `openspec/changes/archive/2026-09-26-formulario-publico-por-pasos/`.
