# Proposal: Formulario público DO-FR-100 por pasos

> **Qué es.** El resto de la adopción del rediseño del formulario público: el asistente de cinco
> pasos (PR-3) y el pulido visual (PR-4). Los campos numéricos ya salieron en #57 (`9c40acc`).
> El catálogo de decisiones —D1 a D5, adoptados, ajustados, descartados y por decidir— vive en
> `odd/tasks/adopcion-diseno-do-fr-100.md:35-141` y **no se reabre aquí**.
>
> **Cómo se midió.** Las citas del front son del árbol de trabajo sobre `9c40acc`, leídas el
> 2026-09-25. Las del backend no se releyeron en esta fase: vienen del documento ODD, que las
> rehízo contra `main` del backend (`412a5e0`) (`odd/tasks/adopcion-diseno-do-fr-100.md:281-286`).

## Intent

Hoy el formulario es una sola página con una tarjeta por bloque del papel
(`components/do-fr-100/sections.tsx:72-176`). En un teléfono eso tiene un costo concreto: el
recuadro de firma declara `touch-action: none` (`components/firma/canvas-firma.tsx:207-209`), así
que un dedo que cae sobre él al desplazar la página dibuja en vez de desplazar
([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action)). Además, el estudiante
envía sin ver un resumen de lo que diligenció.

El usuario decidió el 2026-09-25 partir el formulario en cinco pasos (D1): cada paso cabe en el
teléfono, la firma queda aislada y hay una revisión antes de enviar. El pulido visual completa la
adopción con piezas que ya pasaron el filtro del contrato y de la spec.

**Éxito**: el estudiante diligencia, firma y revisa paso a paso sin perder lo escrito, el cuerpo
enviado no cambia y ninguna pieza descartada llega a la pantalla.

## Scope

### In Scope

**PR-3 — Asistente** (mecánica y estructura):

- Cinco pasos con barra de progreso: «Sus datos», «Datos académicos», «Motivo de la solicitud»,
  «Firma» y «Revisar y enviar». «Lugar y fecha» y «Tipo de solicitud» quedan como franja arriba
  del progreso. Los campos conservan el orden del papel.
- Los cinco pasos siempre montados; el inactivo, oculto con el atributo `hidden` (D2).
- Validación por paso: «Continuar» valida solo los campos del paso; «Volver» conserva lo escrito.
- Revisión con un resumen por bloque, el botón «Cambiar» y la nota «La fecha de radicación se
  registra al enviar la solicitud».
- Un 422 lleva al primer paso con errores y marca los pasos afectados en la barra (D4). 404, 413
  y 429 se muestran en la revisión con los textos de hoy; el 413 suma «Ir a la firma».
- Foco en el encabezado del paso a cada cambio de paso; tras un error («Continuar» fallido o 422),
  en el primer campo con error (#58).
- El correo incompleto impide continuar desde el paso 1 (resolución 1, abajo).

**PR-4 — Pulido visual** (presentación y textos):

- Encabezado con `public/tramita-logo.jpeg`, el código «Formato DO-FR-100» y un panel de Ayuda
  con el WhatsApp institucional de la Coordinación Cali, **+57 315 2966601**, como texto y como
  enlace (`https://wa.me/573152966601`).
- Aviso de errores arriba del paso; complementa el mensaje de cada campo, no lo reemplaza.
- Letra de 17 px, controles de 52 a 56 px, ejemplos en cada campo, mensajes que dicen qué falta y
  contador «N de 2000 caracteres» en «Compromisos adquiridos».
- Recuadro de firma de 200 px con línea guía y el texto «Firme aquí con el dedo o con el mouse»;
  «Borrar y firmar de nuevo» reemplaza a «Limpiar firma». Puede cerrar #27 (el botón actual es un
  `<button>` sin tamaño táctil, `canvas-firma.tsx:229-231`); se comprueba al abrir el PR.
- Acuse con confirmación visual y el correo diligenciado destacado.

### Out of Scope

| Queda fuera | Por qué |
|---|---|
| Todo lo **descartado** en el ODD: radicado, línea de tiempo, «le avisaremos», adjuntos, «Volver al inicio», equivalencia con la firma escaneada, «5 minutos» | Contradice el contrato o la spec; el motivo de cada uno está en `odd/tasks/adopcion-diseno-do-fr-100.md:112-134` |
| Nota de privacidad del pie | Afirmación institucional sin confirmar por la Coordinación (`…:138-139`) |
| Rango de 6 a 12 dígitos del formulario interno | Otra pantalla y otra pregunta abierta (`…:140-141`) |
| Campos numéricos | Entregados en #57 |
| Lógica de `CanvasFirma`: trazo mínimo, suavizado, validación PNG/JPEG | Se conserva (ajustado en el ODD, `…:100-101`); PR-4 solo toca su presentación |
| Contrato y transporte (`lib/api.ts`, `lib/types.ts`) | El cuerpo sigue siendo el mismo allowlist de once campos |

## Capabilities

### New Capabilities

Ninguna. El requisito nuevo vive dentro de `do-fr-100-form`.

### Modified Capabilities

- `do-fr-100-form`: la pantalla pasa de una página a un asistente. Impacto para la fase de spec:

| Requisito | Operación | Qué cambia |
|---|---|---|
| «Reproducción del formato con repliegue declarado» | MODIFY | El orden del papel se conserva **a lo largo de los pasos**, no de arriba a abajo en una página; franja de «Lugar y fecha» y «Tipo de solicitud»; «Motivo de la solicitud» titula el paso 3 |
| «Todos los campos son obligatorios» | MODIFY | La obligatoriedad se exige **por paso** al continuar, y otra vez sobre los once campos antes de emitir la petición; un correo sin `@` o sin dominio impide continuar |
| «Firma trazada en pantalla con alternativa accesible» | ADD escenario | La firma sobrevive a la navegación entre pasos |
| «Manejo de errores del backend» | ADD escenario | Un 422 lleva al primer paso con errores, sin perder el mensaje de cada campo |
| «Diligenciamiento por pasos» | ADD requisito | Cinco pasos, avance y retroceso, revisión con «Cambiar», foco en el encabezado del paso, 404/413/429 en la revisión y el atajo «Ir a la firma» |

Un escenario agregado a un requisito existente viaja, según la convención de deltas de OpenSpec,
como bloque `MODIFIED` con el requisito completo. PR-4 no cambia requisitos vigentes: el acuse ya
exige mencionar el correo (`openspec/specs/do-fr-100-form/spec.md:219-240`) y el botón renombrado
sigue siendo «una acción para limpiar el trazo» (`:169-171`).

## Approach

El par container/presentational que ya existe se mantiene: `page.tsx` orquesta estado, validación
y envío (`app/solicitud/creditos-adicionales/page.tsx:79-122`), y la presentación se reparte en
pasos sin que sus componentes adquieran estado propio. Ninguna dependencia npm nueva: cinco pasos
lineales no justifican una librería de asistentes.

| Pieza | Enfoque | Por qué |
|---|---|---|
| Visibilidad | Todos los pasos montados; el inactivo con `hidden` (D2) | `CanvasFirma` emite una firma vacía al montarse (`canvas-firma.tsx:47-49`): desmontar el paso la borraría. El preflight de Tailwind 4 fuerza `display: none !important` sobre `[hidden]` (`node_modules/tailwindcss/preflight.css:391-393`), así que `flex` o `grid` no lo anulan |
| Validación por paso | Un mapa de campo a paso sobre el `validate` actual (`page.tsx:56-77`) | Una sola fuente de reglas; «Enviar» vuelve a validar los once campos |
| Salto del 422 | Los errores de `fieldErrorsFromProblem` (`page.tsx:42-54`) eligen el primer paso con error | El 422 sigue atado al campo; hoy el aviso general aparece debajo del formulario (`page.tsx:154`) |
| Foco | Al encabezado del paso en cada cambio; tras un error, al primer campo con error | Un lector de pantalla anuncia dónde está el estudiante, y el campo por corregir queda a la vista (#58) |
| Firma (PR-4) | 200 px en vez de 160 (`canvas-firma.tsx:20,207`), línea guía y texto | La lógica ajustada no se toca |

**Entrega.** PRs secuenciales contra `main` (`odd/tasks/adopcion-diseno-do-fr-100.md:145-152`):
este cambio OpenSpec (PR-2), el asistente (PR-3) y el pulido (PR-4). Presupuesto de revisión de
400 líneas con estrategia `auto-chain`: si el pronóstico de tareas supera el presupuesto en PR-3,
se parte en unidades con verificación propia.

## Affected Areas

| Área | Impacto | Detalle |
|---|---|---|
| `app/solicitud/creditos-adicionales/page.tsx` | Modified | PR-3: paso, validación por paso, salto del 422, foco. PR-4: encabezado, Ayuda, aviso, acuse |
| `app/solicitud/creditos-adicionales/page.test.tsx` | Modified | Pruebas que navegan por pasos (ver *Risks*) |
| `components/do-fr-100/sections.tsx` | Modified | Se reparte en pasos; sigue siendo presentacional |
| `components/do-fr-100/` | New (probable) | Barra de progreso y resumen de revisión; el design decide la partición |
| `components/firma/canvas-firma.tsx` y su prueba | Modified (PR-4) | Alto, línea guía y texto del botón |
| `openspec/specs/do-fr-100-form/spec.md` | Modified al archivar | Delta descrito en *Capabilities* |
| `lib/api.ts`, `lib/types.ts`, `lib/public-request-limits.ts` | Sin tocar | Mismo contrato; el contador lee el tope existente |

## Preguntas resueltas

La fase de propuesta levantó cuatro preguntas. Las tres primeras las responde el diseño adoptado
(Claude Design), y el prototipo que el usuario revisó el 2026-09-25 se comporta así; la cuarta es
un ajuste de redacción.

| # | Pregunta | Resolución |
|---|---|---|
| 1 | El aviso de correo incompleto, ¿impide continuar o solo advierte? | **Impide continuar**: en el diseño, `validate()` marca el correo sin `@` o sin dominio y `next()` no avanza con errores. Coherente con `format: email` del contrato. Va en PR-3 como escenario de «Todos los campos son obligatorios» |
| 2 | La barra de progreso, ¿solo indica o permite saltar a un paso? | **Solo indica**: sus elementos no tienen manejador. Marca los pasos con errores tras un 422 |
| 3 | Tras «Cambiar», ¿«Continuar» regresa a la revisión o recorre los pasos siguientes? | **Recorre los pasos siguientes**: «Cambiar» fija el paso y «Continuar» avanza de uno en uno, validando cada paso |
| 4 | El 413 dice «Límpiela y fírmela de nuevo» (`page.tsx:112`) y el botón pasará a «Borrar y firmar de nuevo» | **Se alinea**: «La firma es demasiado pesada. Bórrela y fírmela de nuevo.» Sigue orientando a limpiar y volver a trazar, como pide la spec. Texto de PR-4 |

## Risks

| Riesgo | Prob. | Mitigación |
|---|---|---|
| **Verde falso en pruebas**: `*ByRole` excluye todo lo que tiene un ancestro con `hidden` (`node_modules/@testing-library/dom/dist/role-helpers.js:33-35,70-75`), pero `*ByLabelText` no filtra por accesibilidad (sin coincidencias de `hidden` en `queries/label-text.js`): una prueba puede escribir en un paso que el estudiante no ve | Alta | Las pruebas navegan como el estudiante («Continuar», «Volver», «Cambiar») y aseveran qué paso está visible |
| **Reescritura de pruebas mayor que la estimada**: el ODD estimó 10 de 14 definiciones (`odd/…:47-49`) antes de #57; hoy `page.test.tsx` tiene 19 (`rg -c '^\s*it(\.each)?\(' app/solicitud/creditos-adicionales/page.test.tsx`) | Media | La fase de tareas re-mide y pronostica contra el presupuesto de 400 líneas |
| **jsdom no reproduce el conflicto entre desplazar y dibujar**, que es el motivo de D1 | Media | Prueba en vivo en un dispositivo táctil antes de cada PR (puerta del ODD, `odd/…:162-163`) |
| **Deriva entre spec y código** si se revierte PR-3 después de archivar | Baja | Ver *Rollback Plan* |

## Rollback Plan

- **PR-2** solo agrega `openspec/changes/formulario-publico-por-pasos/`; revertirlo lo retira.
- **PR-3 y PR-4** tocan solo el front, sin cambios de contrato ni de backend: un `git revert` de
  cada PR restaura la pantalla anterior. PR-4 depende de PR-3, así que se revierten en orden
  inverso.
- La spec viva cambia solo al archivar. Si la reversión llega después del archivo, se revierte
  también el commit de archivo para que spec y código coincidan.

## Dependencies

- **Ninguna del backend**: el endpoint y el cuerpo no cambian, y la 004 en `main` ya acepta el
  teléfono de diez dígitos (`odd/tasks/adopcion-diseno-do-fr-100.md:169-170`).
- El logo ya existe: `public/tramita-logo.jpeg` (idéntico al del diseño, `odd/…:66-67`).

## Success Criteria

- [ ] Se ve un paso a la vez con los cinco montados; una prueba comprueba que la firma sobrevive a
      «Volver» y «Cambiar» y viaja en el cuerpo.
- [ ] «Continuar» no avanza si un campo del paso falla, y no se emite ninguna petición antes de
      «Enviar» en la revisión.
- [ ] Un 422 muestra el primer paso con errores, con el foco en su encabezado y el mensaje de cada
      campo.
- [ ] 404, 413 y 429 aparecen en la revisión y conservan los datos; el 413 ofrece «Ir a la firma».
- [ ] La prueba del cuerpo sigue en verde: exactamente once campos y sin `definitionCode`.
- [ ] La Ayuda muestra +57 315 2966601 como texto y como enlace a `https://wa.me/573152966601`.
- [ ] Ninguna pieza descartada aparece en pantalla; el acuse no muestra identificador, estado,
      enlace de consulta ni botón para volver a empezar.
- [ ] La firma se traza con el dedo en el paso 4, en un dispositivo táctil real.
- [ ] `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm lint` y `pnpm build` en verde.
- [ ] Solo datos sintéticos en pruebas y ejemplos (#14).
