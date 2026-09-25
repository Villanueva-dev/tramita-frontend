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

- [ ] 1.1 RED→GREEN `components/do-fr-100/steps.ts` + `.test.ts`: `STEPS` (5, orden fijo),
      `FIELD_STEP`, `isFormField`, `errorsOfStep`, `firstStepWithError`, `stepsWithErrors`, per
      `design.md:144-155`. Sin JSX, sin import de `page.tsx`.
- [ ] 1.2 Verify: `pnpm exec vitest run components/do-fr-100/steps.test.ts`; `pnpm test` (las 19
      definiciones de `page.test.tsx` intactas); `rm -rf .next && pnpm exec tsc --noEmit`.
- [ ] 1.3 Commit: `feat(do-fr-100): modelo puro de pasos del asistente`.

## Slice 2 — PR-3b: helpers de test nivel-estudiante (sin cambio de comportamiento)

- [ ] 2.1 REFACTOR `page.test.tsx`: agregar `fillPublicRequestForm(values)` /
      `submitForm()` (hoy: llenan los once campos y pulsan «Enviar solicitud») y migrar las 12
      reescritas de `design.md` *Testing Strategy* (líneas 89,153,163,174,185,197,216,231,245,
      272,301,340) a llamarlos. Mismas aserciones; suite verde antes y después.
- [ ] 2.2 Verify: `pnpm exec vitest run app/solicitud/creditos-adicionales/page.test.tsx`;
      `pnpm test`; `rm -rf .next && pnpm exec tsc --noEmit`.
- [ ] 2.3 Commit: `test(do-fr-100): helpers de nivel estudiante antes del asistente`.

## Slice 3 — PR-3c: módulos presentacionales sin cablear

- [ ] 3.1 RED→GREEN `components/do-fr-100/wizard.tsx` + test: `StepPanel` (`hidden` por
      `active`), `StepProgress` (labels + marca de `stepsWithErrors`, sin elemento interactivo —
      «la barra no permite saltar»), `StepNavigation`. No lo importa `page.tsx` todavía.
- [ ] 3.2 RED→GREEN `components/do-fr-100/review-summary.tsx` + test: resumen por bloque,
      botón «Cambiar» con el bloque en su nombre accesible (`onEdit`).
- [ ] 3.3 REFACTOR `sections.tsx`: extraer franja fija + grupos de campos por `FIELD_STEP`
      (`design.md` decisión 1); `PublicRequestSections` sigue renderizando todo en una pasada —
      cero cambio de comportamiento, `page.test.tsx` queda verde sin tocarlo.
- [ ] 3.4 Verify: `pnpm exec vitest run components/do-fr-100/`; `pnpm test`;
      `rm -rf .next && pnpm exec tsc --noEmit`. Medir `git diff --stat`; si >400, dividir en
      3c-i/3c-ii (ver forecast) antes de abrir el PR.
- [ ] 3.5 Commit: `feat(do-fr-100): módulos presentacionales del asistente, sin cablear`.

## Slice 4 — PR-3d: cableado (el cambio de comportamiento)

- [ ] 4.1 RED→GREEN `page.tsx`: estado `step`, `handleContinue`/`handleBack`/`goToStep`
      (`flushSync` + foco al encabezado, decisión 6), `<form onSubmit>` con despacho único
      (decisión 4), rama de correo en `validate` (decisión 3). Escenarios: Continuar avanza con
      paso válido; Volver conserva lo escrito; Continuar no avanza con campo inválido; correo sin
      `@`/dominio impide continuar; foco al encabezado en cada cambio sin moverse al cargar;
      Enter en paso 1 avanza sin enviar.
- [ ] 4.2 RED→GREEN: componer `page.tsx` con `wizard.tsx` + `review-summary.tsx` (`onEdit` →
      `goToStep`) + los grupos de `sections.tsx` de 3.3; «Cambiar» recorre los pasos siguientes
      hasta volver a la revisión.
- [ ] 4.3 RED→GREEN: 422 → `goToStep(firstStepWithError)` + `StepProgress` marca
      `stepsWithErrors`; 404/413/429/422-sin-campos-propios en la revisión; atajo «Ir a la
      firma» del 413 (texto de hoy — PR-4 lo cambia).
- [ ] 4.4 RED→GREEN: la firma sobrevive a Volver/Cambiar (`hidden` no desmonta `CanvasFirma`,
      decisión 7); reescribir con los helpers de 2.1 las pruebas de firma existentes para llegar
      al paso «Firma».
- [ ] 4.5 GREEN: apuntar `fillPublicRequestForm`/`submitForm` (slice 2) a navegación real por
      paso; sumar `{ hidden: true }` en las ausencias (`:121,129`) y actualizar la lista cerrada
      mecánica (`:75`).
- [ ] 4.6 Verify: `pnpm test` completo; `app/requests/new/page.test.tsx` intacto;
      `rm -rf .next && pnpm exec tsc --noEmit`; `pnpm lint`; `pnpm build`. Mutantes: quitar
      `flushSync` o el despacho de `onSubmit` debe romper al menos una prueba.
- [ ] 4.7 **Puerta en vivo** (el orquestador la corre con permiso del usuario): firmar con el
      dedo en «Firma», navegar y volver, confirmar que el trazo sobrevive.
- [ ] 4.8 Medir `git diff --stat main`; si >400, reportar el número exacto y pedir
      `size:exception` (ver ⚠️ del forecast).
- [ ] 4.9 Commit: `feat(do-fr-100): asistente cableado — navegación, envío y errores por paso`.

## Slice 5 — PR-4: pulido visual

- [ ] 5.1 RED→GREEN `canvas-firma.tsx` + test: `CANVAS_HEIGHT` 200 (`h-50`), guía y texto
      superpuestos (`pointer-events: none`), botón «Borrar y firmar de nuevo» con el `Button`
      del proyecto (puede cerrar #27); actualizar las 5 consultas de «Limpiar firma» y `h-11`.
- [ ] 5.2 RED→GREEN `page.tsx`: texto del 413 → «...Bórrela y fírmela de nuevo.»; encabezado
      con `Logo` + «Formato DO-FR-100»; panel Ayuda (`<details>`) con «+57 315 2966601» y enlace
      `wa.me` (`target="_blank" rel="noopener noreferrer"`); aviso de errores por paso sin
      duplicar los `role="alert"` de campo — resolver una sola región viva (Open Question de
      `design.md`).
- [ ] 5.3 RED→GREEN `sections.tsx`: ejemplo por campo (datos sintéticos, #14), contador «N de
      2000» en `reason`, 17px en `<main>`, controles 52–56px.
- [ ] 5.4 RED→GREEN `page.tsx`: el acuse destaca `studentEmail` diligenciado (sin reinicio, D5).
- [ ] 5.5 Verify: `pnpm test`; `rm -rf .next && pnpm exec tsc --noEmit`; `pnpm lint`;
      `pnpm build`.
- [ ] 5.6 **Puerta en vivo**: firmar con el dedo en el recuadro de 200px con la guía.
- [ ] 5.7 Commit: `feat(do-fr-100): pulido visual del asistente`.

## Cierre

- [ ] 6.1 Grep dirigido: ninguna pieza descartada (radicado, línea de tiempo, «le avisaremos»,
      adjuntos, «Volver al inicio», equivalencia con firma escaneada, «5 minutos») en pantalla.
- [ ] 6.2 Archivar el cambio solo tras PR-4 en `main`.
