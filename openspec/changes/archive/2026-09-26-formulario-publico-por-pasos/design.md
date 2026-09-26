# Design: Formulario público DO-FR-100 por pasos

> **Qué decide.** El cómo de PR-3 (asistente) y PR-4 (pulido). D1–D5 y el catálogo están cerrados
> en `odd/tasks/adopcion-diseno-do-fr-100.md:35-141`; aquí se citan por id. **Medición**: árbol de
> trabajo sobre `9c40acc`, 2026-09-25; `node_modules` en sus versiones instaladas (react-dom 19.2.4,
> `node_modules/react-dom/package.json:3`).

## Technical Approach

`page.tsx` sigue siendo el único dueño del estado, la validación y el envío
(`app/solicitud/creditos-adicionales/page.tsx:79-122`); lo demás es presentacional y sin estado.
Un `<form>` contiene los cinco pasos montados, el inactivo con `hidden` (D2). Un módulo puro,
`components/do-fr-100/steps.ts`, es la única fuente de la estructura; toda navegación pasa por
`goToStep`, que también mueve el foco. Sin dependencias nuevas. Los pasos son la estructura del
papel, no estados del motor: no chocan con la regla 1 del checklist
(`.claude/skills/revisar-frontend-next/SKILL.md:25-38`).

## Architecture Decisions

### 1 — El container compone cuatro módulos presentacionales

**Elegido**: `components/do-fr-100/` se reparte en `steps.ts` (datos y funciones puras),
`sections.tsx` (franja de «Lugar y fecha» y «Tipo de solicitud», y los campos de cada paso; conserva
`TextField`), `wizard.tsx` (`StepPanel`, `StepProgress`, `StepNavigation`) y `review-summary.tsx`.
**Alternativa**: un asistente presentacional único, como hoy `PublicRequestSections`
(`components/do-fr-100/sections.tsx:22-29,72`), que llegaría a unas catorce props; o una librería,
que cinco pasos lineales no justifican. **Defensa**: elegí componer en el container frente a un
componente único, sabiendo que el costo es más JSX de composición en `page.tsx`.

### 2 — `useState` con un `step` más

**Elegido**: los seis `useState` actuales (`page.tsx:80-85`) más `step: StepId`, con transiciones
con nombre (`handleContinue`, `handleBack`, `goToStep`, `handleSubmit`). Lo derivable no se guarda:
pasos con error, errores del paso, contador. **Alternativas**: `useReducer`, cuyo reducer dejaría
fuera igual el foco y el envío asíncrono; y el paso en la URL (`?paso=`), inviable porque los datos
no pueden viajar en ella y una recarga mostraría un paso con los campos vacíos. **Defensa**: elegí
`useState` frente a `useReducer`, sabiendo que el costo es probar las transiciones solo a través de
la página. Se reconsidera si aparece un paso condicional.

### 3 — Una sola fuente para el mapa campo → paso

**Elegido**: `FIELD_STEP: Record<FormField, FieldStepId>`. La validación por paso filtra el
`validate` existente (`page.tsx:56-77`) con `errorsOfStep`; `FORM_FIELDS` (`:28`) se deriva del
mapa, y el type guard `isFormField` reemplaza los `as FormField` (`:47,50`). Tipar sobre `FormField`
hace que el compilador rechace un campo sin paso, como en `lib/public-request-limits.ts:16-17,24`.
**Alternativa**: reglas propias por paso, o listas `Record<StepId, FormField[]>`, que no detectan un
campo omitido ni repetido. **Defensa**: elegí filtrar `validate` frente a reglas por paso, sabiendo
que el costo es validar los once campos en cada «Continuar», despreciable.

- **Correo**: rama nueva en `validate` con `EMAIL_PATTERN`, junto a `PHONE_PATTERN` (`:36`). Fuente:
  `format: email` (`odd/…:72-73`) y `@Email` en `Tramita/…/dto/PublicRequestBody.java:40` (`main`,
  `0cf3fa3`). No más estricta que el backend: `^[^\s@]+@[^\s@]+$`, que no exige punto en el
  dominio y coincide con el delta de spec («sin `@` o sin dominio después de él»).
- **«Continuar» reemplaza solo los errores de su paso**: las marcas de un 422 en pasos posteriores
  sobreviven hasta que el estudiante los recorre. Un error del servidor sobre un campo que el
  cliente da por válido se borra al pasar su paso; si persiste, el siguiente envío lo remarca.

### 4 — Un `<form>` cuyo envío despacha según el paso

**Elegido**: un único botón `type="submit"` («Continuar», o «Enviar solicitud» en la revisión);
`onSubmit` llama a `handleContinue` o a `handleSubmit` según `step`. «Volver», «Cambiar» e «Ir a la
firma» son `type="button"`. Hoy Enter en un campo envía (`sections.tsx:74,166-173`) por el
[envío implícito](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#implicit-submission):
sin despacho, Enter en el paso 1 emitiría la petición. **Alternativa**: un `<form>` o botones por
panel, que dejan botones por defecto dentro de paneles ocultos. **Defensa**: elegí un formulario
con despacho frente a uno por paso, sabiendo que el costo es una bifurcación que hay que probar.

### 5 — 422 y avisos del formulario

**Elegido**: `fieldErrorsFromProblem` (`page.tsx:42-54`) no cambia. Con campos reconocidos,
`goToStep(firstStepWithError(…))` asigna los errores y salta; la barra marca
`stepsWithErrors(errors)`, derivado. Sin ellos, el aviso queda en la revisión, como 404, 413 y 429.
`formError` pasa de `string | null` (`:83`) a `FormError | null`, con `offerSignatureStep` para el
413; `goToStep` lo limpia, para que no siga a la vista tras volver a firmar. La revalidación de
«Enviar» usa el mismo salto. **Alternativa**: guardar el status HTTP y decidir el atajo en la
vista. **Defensa**: elegí un aviso tipado frente al status, sabiendo que el costo es un tipo más; a
cambio, la vista no interpreta HTTP (regla 5, `SKILL.md:60-67`).

### 6 — Foco: `flushSync`, una ref al encabezado activo y el primer campo inválido

**Elegido**: `goToStep` ejecuta `flushSync(() => { setStep(target); … })`, con los estados que
acompañan el salto, y después `activeHeadingRef.current?.focus()`. Cada panel titula con
`<h2 tabIndex={-1}>` y solo el activo recibe la ref. El encabezado usa el nombre oficial del
bloque del papel cuando existe («Datos del solicitante», «Motivo de la solicitud», «Firma del
solicitante»); la barra, el nombre corto del paso que fija la spec («Sus datos», «Firma»), como en
el prototipo revisado por el usuario el 2026-09-25. Alternativa: el nombre corto en los dos
lugares, que borraría del encabezado el nombre del bloque del formato; costo: dos nombres por paso
en `STEPS`. Antes del render, el destino sigue con `hidden`
(no enfocable) y la ref apunta al encabezado anterior;
[`flushSync`](https://react.dev/learn/manipulating-the-dom-with-refs#flushing-state-updates-synchronously-with-flush-sync)
aplica el render antes de enfocar, y `focus()` desplaza el encabezado a la vista
([MDN](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus)).
**Alternativa**: `useEffect` sobre `step`, que reacciona a un estado y no al evento (criterio de la
regla 6, `SKILL.md:73-78`) y necesita una bandera para no robar el foco al cargar. **Defensa**:
elegí `flushSync` frente al efecto, sabiendo que el costo es su primer uso en el repo (0
coincidencias en `app/`, `components/`, `lib/`), con un comentario. Existe en la versión instalada
(`node_modules/@types/react-dom/index.d.ts:22`). Verificado con Context7 el 2026-09-25: la guía de
react.dev usa este mismo patrón para mover la vista tras un cambio de estado, y la
[referencia](https://react.dev/reference/react-dom/flushSync) pide usarlo con moderación.

**Enmienda del 2026-09-25 (#58): tras un error, el foco va al campo.** Un «Continuar» fallido
aplica los errores con `flushSync` y llama a `focusFirstInvalid()`; el salto del `422` usa
`goToStep(target, 'firstInvalid')`. `focusFirstInvalid()` enfoca el primer `[aria-invalid="true"]`
del panel activo, en orden del DOM (`sections.tsx:64,138`), y si no hay ninguno, el encabezado.
Es el caso de la firma: ningún control suyo marca `aria-invalid` (`sections.tsx:152-158`), el lienzo
no es enfocable (`canvas-firma.tsx:204-213`, sin `tabIndex`) y la carga de imagen (`:216-223`) es
una alternativa, no el campo. El DOM da el orden visual sin mantener una lista aparte (ninguna
clase de `order` ni `*-reverse` en `components/do-fr-100/` ni en la página), y `focus()` desplaza
el campo a la vista. La versión aprobada no movía el foco tras un
«Continuar» fallido y confiaba el aviso a los `role="alert"` de campo (`sections.tsx:67`): el
lector de pantalla lo anuncia, pero el campo puede quedar fuera de la vista. En la prueba en vivo
de #58, sobre el formulario de una sola página, quedó a −395 px con una ventana de 857 px; cada
paso del asistente es más corto, pero en un celular «Continuar» puede seguir lejos del primer
campo. **Alternativa**: enfocar el aviso de errores de PR-4 (T6), que no existe en PR-3 y dejaría
el hueco abierto hasta entonces. **Defensa**: elegí el primer campo inválido frente al encabezado,
sabiendo que el costo es un segundo destino de foco y que un lector de pantalla puede anunciar el
error dos veces: el `role="alert"` y la descripción del campo enfocado. Para la firma, la
alternativa es marcar la carga de imagen con `aria-invalid` y asociarle el error; cambiaría
`CanvasFirma`, que la decisión 7 deja intacto.

### 7 — `hidden` (D2) deja intacto `CanvasFirma`

Tailwind fuerza `display: none !important` sobre `[hidden]`
(`node_modules/tailwindcss/preflight.css:391-393`). `CanvasFirma` se monta una vez: emite la firma
vacía al cargar, no al cambiar de paso (`canvas-firma.tsx:47-49`); se dimensiona en el primer toque
(`:110-115`), que solo ocurre con el paso visible; y asigna `width` y `height` una sola vez
(`:76-77,112-114`), así que el trazo sigue ahí al volver. La firma que viaja vive en el container
(`page.tsx:81`). **Alternativa**: montar un paso a la vez y redibujar la firma desde su URL de datos
(descartada en D2). **Defensa**: elegí `hidden` frente al montaje por paso, sabiendo que el costo
es tener los cinco pasos en el DOM; a cambio `CanvasFirma` y sus diez pruebas no cambian.

### 8 — PR-4: presentación sin tocar la lógica

- **Firma**: `CANVAS_HEIGHT` 160 → 200 (`canvas-firma.tsx:20`), `h-40` → `h-50` (`:207`). Guía y
  «Firme aquí con el dedo o con el mouse» van superpuestas con `pointer-events: none`, no dibujadas:
  así no entran en el PNG (`:86-88`) ni las borra `clearRect` (`:163-169`). «Borrar y firmar de
  nuevo» pasa del `<button>` crudo (`:229-231`) al `Button` del proyecto (puede cerrar #27), junto
  con el texto del 413 (resolución 4). **Alternativa**: dibujar la guía en el canvas. **Defensa**:
  elegí superponerla, sabiendo que el costo es un elemento posicionado más sobre el recuadro.
- **17 px en el `<main>`, no en `html`**: el espaciado de Tailwind está en `rem`
  (`node_modules/tailwindcss/theme.css:325`); subir la raíz agrandaría cada `h-*` y la app interna.
  (Enmendado el 2026-09-26, en PR-4: `Input`, `Label` y `Textarea` fijan `text-sm`, así que el
  tamaño del `<main>` no les llega; se aplica también en sus puntos de uso en `sections.tsx`, sin
  tocar las primitivas, y en rem —`1.0625rem`, 17 px con la raíz por omisión— para respetar el
  tamaño de letra que el estudiante configure en el navegador, cosa que un valor en px ignoraría.)
- **Logo**: se reutiliza `Logo` (`components/brand.tsx:8-32`). Los cinco módulos del proyecto que
  importa (`:1-5`) no mencionan `store`, `app-shell` ni `useTramita` (0 coincidencias), así que la guarda
  de frontera de `page.test.tsx:75-87` sigue en pie.
- **Ayuda**: `<details>` nativo, sin estado. El enlace a WhatsApp abre en otra pestaña
  (`target="_blank" rel="noopener noreferrer"`): en la misma se perdería lo diligenciado.
- **Aviso, contador y acuse**, derivados: `errorsOfStep(errors, step)`, `values.reason.length`
  contra `PUBLIC_REQUEST_FIELD_LIMITS.reason` (`lib/public-request-limits.ts:34`) y
  `values.studentEmail`, que sigue en estado tras el 201 (`page.tsx:124-133`). Sin reinicio (D5).

## Data Flow

    <form onSubmit> ─► step ≠ review ? handleContinue : handleSubmit
      handleContinue: errorsOfStep(validate(…), step) ─► vacío ? goToStep(siguiente)
                      : flushSync(marca) → focusFirstInvalid()
      handleSubmit:   validate(…) ─► submitPublicRequest ─► 201 acuse
                      · con errores (defensa: cada paso ya se validó) → goToStep(firstStepWithError,
                        'firstInvalid'), sin enviar
                      · 422 con campos → goToStep(firstStepWithError, 'firstInvalid')
                      · resto → formError en revisión
      goToStep:       flushSync(setStep …) → encabezado, o focusFirstInvalid() con 'firstInvalid'
      focusFirstInvalid: primer [aria-invalid="true"] de activePanelRef, o activeHeadingRef
    props ▼ StepProgress · StepPanel ×5 (hidden) · campos · ReviewSummary(onEdit) · StepNavigation

## Interfaces / Contracts

```ts
// components/do-fr-100/steps.ts — sin JSX ni estado
export type StepId = 'applicant' | 'academic' | 'reason' | 'signature' | 'review'
export type FieldStepId = Exclude<StepId, 'review'>
export type FormField = keyof PublicRequestFormValues | 'signature' // sale de page.tsx:26-27
export type FormErrors = Partial<Record<FormField, string>>
export const STEPS: readonly { id: StepId; label: string; heading: string }[]
// label: barra de progreso (nombres del delta de spec); heading: encabezado (bloque del papel)
export const FIELD_STEP: Record<FormField, FieldStepId>
export function isFormField(name: string): name is FormField
export function errorsOfStep(errors: FormErrors, step: StepId): FormErrors
export function firstStepWithError(errors: FormErrors): FieldStepId | null
export function stepsWithErrors(errors: FormErrors): ReadonlySet<StepId>
// page.tsx
interface FormError { message: string; offerSignatureStep: boolean }
// flushSync(setStep…) y foco: al encabezado por omisión, o al primer campo inválido (decisión 6)
function goToStep(target: StepId, focus?: 'heading' | 'firstInvalid'): void
// Primer [aria-invalid="true"] del panel activo; si no hay, su encabezado (decisión 6)
function focusFirstInvalid(): void
// Presentacionales: StepPanel({ step, active, headingRef, panelRef, children }) · StepProgress({
// current, stepsWithErrors }), sin controles (resolución 2) · StepNavigation({ step, isSubmitting,
// onBack })
// · ReviewSummary({ values, signature, onEdit }), cada «Cambiar» con su bloque en el nombre accesible
```

El cuerpo enviado no cambia (`page.tsx:98`).

## Testing Strategy

TDD estricto (`openspec/config.yaml:17`), `pnpm test`. Regla contra el verde falso:

| Se asevera | Consulta | Por qué |
|---|---|---|
| Presencia, paso visible | `*ByRole` (p. ej. `heading`, nivel 2) | Excluye ancestros `hidden` (`@testing-library/dom/dist/role-helpers.js:33-35,70-75`) |
| Ausencia | `*ByRole(…, { hidden: true })` o `querySelectorAll` | Cubre los pasos ocultos (`queries/role.js:16,185`) |
| Escritura | `fillField(id, value)`, que falla con un ancestro `[hidden]` | `*ByLabelText` y `getElementById` no filtran |

Testing Library lee `element.hidden` directamente (`role-helpers.js:34`), sin depender del CSS en
jsdom. Helpers: `fillField`, `signCanvas` (de `page.test.tsx:36-45`), `expectStep`, `continueTo` y
`reachReview`. Las 19 definiciones de `page.test.tsx`, por línea de su `it(`:

| Grupo | Definiciones | Cambio |
|---|---|---|
| Sin cambio (4) | `:69`, `:291`, `:316`, `:330` | Tocan el `h1` o el paso 1, visible al cargar |
| Mecánico (1) | `:75` | La lista cerrada suma los tres archivos nuevos |
| Ausencia (2) | `:121`, `:129` | `{ hidden: true }`; `:129` se acota a `input, textarea, select` |
| Reescritas (12) | `:89`, `:153`, `:163`, `:174`, `:185`, `:197`, `:216`, `:231`, `:245`, `:272`, `:301`, `:340` | Navegan con los helpers; los bloqueos, con «Continuar» en el paso del campo; `:245` vuelve a la revisión para el 429; `:340` escribe los separadores en el paso 1 |

Nuevas en PR-3: la firma sobrevive a «Volver» y «Cambiar» y viaja; Enter en el paso 1 avanza sin
enviar; tras «Cambiar», «Continuar» recorre los pasos siguientes; el foco va al encabezado nuevo y no
se mueve al cargar; un «Continuar» fallido enfoca el primer campo inválido y, en «Firma», el
encabezado; un 422 abre el primer paso con errores, enfoca su primer campo con error y marca la
barra; la barra no tiene controles; el correo incompleto impide continuar; el 413 ofrece «Ir a la
firma». Las pruebas del foco aseveran `document.activeElement`. Mutantes: quitar `flushSync` o el
despacho de `onSubmit` debe poner su prueba en rojo, y también quitar el `flushSync` que aplica los
errores antes de `focusFirstInvalid()`: sin él, el DOM va un render atrás, así que en un primer
intento fallido no hay ningún `aria-invalid` y el foco cae en el encabezado. Por eso la prueba
parte de un formulario sin errores previos. El gesto táctil, y que el campo enfocado quede a la
vista (jsdom no desplaza), se prueban en vivo antes de cada PR.

## Entrega

- **PR-3**: decisiones 1–7 con el estilo actual (tarjetas, `h-11`, «Limpiar firma», texto del 413
  de hoy). Cumple el delta **salvo el texto exacto del 413**, que cambia en PR-4 junto con el botón
  que nombra, para que el mensaje nunca remita a un botón que no existe; por eso el cambio se
  archiva después de PR-4. Verificación: `pnpm test`, `tsc --noEmit`, `pnpm lint`, `pnpm build` y
  firma en vivo. Se entrega en cuatro cortes encadenados a `main` (`tasks.md`, *Review Workload
  Forecast*): **3a**, el modelo puro de pasos (`steps.ts`); **3b**, los helpers de prueba sobre la
  página actual, en verde antes y después; **3c**, los módulos presentacionales sin cablear;
  **3d**, el cableado, el único cambio de comportamiento. Un corte dentro de 3d dejaría un estado
  fuera de la spec y solo cabe con `feature-branch-chain`. (Enmendado el 2026-09-26: la versión
  aprobada describía dos cortes, 3a helpers y 3b asistente, anteriores al desglose de `tasks.md`.)
- **PR-4**: decisión 8 y el texto del 413; con él, el delta queda cumplido por completo. No cambia
  requisitos vigentes (proposal, `:89-91`). Verificación: las mismas cinco comprobaciones que PR-3. Toca las cinco consultas
  de «Limpiar firma» (`canvas-firma.test.tsx:17,176,180,230`; `page.test.tsx:160`) y `h-11`
  (`page.test.tsx:171`).

## File Changes

| Archivo | Acción | Detalle |
|---|---|---|
| `app/solicitud/creditos-adicionales/page.tsx` | Modify | PR-3: paso, despacho, 422, foco, correo. PR-4: encabezado, Ayuda, acuse |
| `app/solicitud/creditos-adicionales/page.test.tsx` | Modify | Helpers, 15 de 19 definiciones, pruebas nuevas |
| `components/do-fr-100/steps.ts`, `wizard.tsx`, `review-summary.tsx` | Create (PR-3) | Ver *Interfaces* |
| `components/do-fr-100/sections.tsx` | Modify | PR-3: franja y campos por paso. PR-4: ejemplos y contador |
| `components/firma/canvas-firma.tsx` y su prueba | Modify (PR-4) | 200 px, guía y botón |
| `lib/api.ts`, `lib/types.ts`, `lib/public-request-limits.ts` | Sin tocar | Mismo contrato |

## Threat Matrix

N/A — sin enrutamiento, shell, subprocesos, automatización de VCS/PR, clasificación de ejecutables
ni integración de procesos.

## Migration / Rollout

No requiere migración. Reversión por PR según la proposal (*Rollback Plan*).

## Open Questions

- [x] **Patrón del correo**: alineado con el delta de spec; no exige punto en el dominio (ver 3).
- [ ] **Botón Atrás del navegador**: sale de la página y pierde lo diligenciado, igual que hoy. Queda
      fuera de este cambio; que retroceda un paso sería una decisión de producto posterior.
- [x] **PR-4, región viva**: el aviso y los `role="alert"` de campo (`sections.tsx:67`) se
      anunciarían dos veces; PR-4 elige una sola. Resuelto el 2026-09-26: el aviso por paso no es
      región viva (sin `role` ni `aria-live`) y los `role="alert"` de campo se conservan, porque
      la decisión 6 ya lleva el foco al primer campo inválido y el lector de pantalla anuncia ese
      campo con su descripción. Costo aceptado: el lector no anuncia cuántos campos faltan.
