# Exploration: catalogo-programas-y-anexo

> Fase `sdd-explore` del cambio, ejecutada el 2026-09-26 sobre `main` `06a0f8c` del frontend y
> `main` `d8e031d` del backend (feature 009 mergeada). El agente de exploración no dispone de
> herramienta de escritura, así que devolvió este contenido al orquestador, que lo persistió aquí
> sin alterar su fondo. Copia de recuperación en Engram: `sdd/catalogo-programas-y-anexo/explore`.

## Estado 2026-09-26 (tarde): la slice A ya está en `main`

> Nota del orquestador al reanudar el cambio. El contenido de abajo se conserva como registro
> histórico de la exploración del 2026-09-26 (mañana) sobre `main` `06a0f8c`.

- Las PRs #75 (`ea0d978`) y #76 (`ae4ee11`) de la feature ODD `validaciones-basicas-creditos`
  se mergearon en `main`. #76 entrega el selector del catálogo en el formulario público: cubre
  la **Approach 1** completa y el punto 1 del issue #74.
- Lo que #76 dejó en `main` y esta slice reutiliza: `listPublicPrograms()` y el tipo
  `PublicProgram { name }` en `lib/api.ts`; el catálogo se carga con un `useEffect` inline en
  `app/solicitud/creditos-adicionales/page.tsx` (flag `ignore` y contador de reintento), **sin
  hook compartido en `lib/`**; `AcademicFields` pinta un `<select>` nativo mediante
  `components/ui/select.tsx`; la spec viva `do-fr-100-form` ya tiene el requisito «El programa
  académico procede del catálogo público».
- **Este cambio queda reducido a la slice B** (Approaches 2 y 3): el formulario interno con el
  catálogo y el aviso de anexo en el detalle. La Approach 1, el delta de `do-fr-100-form` y el
  corte A/B de la Approach 5 quedan superados.
- Decisión de diseño que se abre al reducirse: para el formulario interno, extraer a `lib/` el
  efecto inline que #76 dejó en la página pública (y hacer que ambas pantallas lo consuman) o
  repetirlo. La Approach 1 recomendaba el hook compartido; #76 no lo creó.
- Seguimientos no bloqueantes que #76 declaró y esta slice no resuelve: catálogo vacío sin
  explicación en el público, prueba de identidad sin tilde, botón «Reintentar» fuera del `Button`
  del proyecto.

## Current State

**Backend (009, ya mergeado en `Tramita` main, `d8e031d`)**: contrato verificado en `Tramita/specs/009-program-catalog-annex/{spec,plan,contracts/openapi.yaml}` y confirmado con pruebas en vivo el 2026-09-26 (ver «Hechos medidos» al final). `GET /api/public/programs` devuelve `[{name}]`, sin sesión; los dos canales de captura ahora exigen que `program` sea exactamente un nombre del catálogo (comparación byte a byte, FR-004); `GET /requests/{id}` y las respuestas de registrar/transicionar suman `annexRequirement: {documentName, sourceHint}`, **ausente** (no `null`) cuando no aplica, por `@JsonInclude(NON_NULL)` a nivel de clase en `RequestResponse.java:45`.

**Frontend (main `06a0f8c`)**: tres pantallas tocan `program` y ninguna conoce el catálogo:

1. **Formulario público** (`app/solicitud/creditos-adicionales/page.tsx` + `components/do-fr-100/{sections,steps}.tsx`): `program` es un `TextField` libre dentro de `AcademicFields` (`components/do-fr-100/sections.tsx:172`), validado solo por `PUBLIC_REQUEST_FIELD_LIMITS.program: 120` (`lib/public-request-limits.ts:29`). Hoy, cualquier programa escrito a mano que no calce byte a byte con el catálogo recibe 422 del backend — **condición de despliegue activa**, no hipotética: el backend con la 009 ya está en `main` del repo hermano.
2. **Formulario interno** (`app/requests/new/page.tsx`): `program` sale de una constante local `PROGRAMS` (`lib/ui-constants.ts:33-39`, cinco valores, uno de ellos «Psicología», que **no está** en el catálogo de trece programas del backend) y se preselecciona con `useState(PROGRAMS[0])` (`app/requests/new/page.tsx:61`), así que el campo nunca se omite. El envío real pasa por `useTramita().createRequest` (`lib/store.tsx:370-393`), **no** por el `createRequest` de `lib/api.ts` (el issue #10 ya documenta esta duplicación): `lib/store.tsx:379` siempre manda `program: input.program` como string.
3. **Detalle** (`app/requests/[id]/page.tsx`): lee `useTramita().getRequest`/`refreshRequest` (store), pinta `program` con un `InfoRow` dentro de la tarjeta «Datos del estudiante» (`:319`). No hay ningún concepto de anexo en el modelo (`lib/types.ts`) ni en el mapeo (`lib/store.tsx:172-208`).

**Precedente de arquitectura reutilizable**: el repo ya tiene el patrón exacto que este cambio necesita — un hook en `lib/` que hace *fetch-on-mount* con el flag `ignore` en el cleanup del efecto (regla 6 de `revisar-frontend-next/SKILL.md`), documentado y probado: `lib/use-request-detail.ts:36-72` y `lib/use-coordination-inbox.ts` (este último sí consumido, por `components/dashboard/coordination-inbox.tsx` y `app/dashboard/page.tsx`; `use-request-detail.ts` está escrito y probado pero no lo consume ninguna pantalla real — dato lateral, no bloqueante para este cambio).

## Affected Areas

| Archivo | Por qué |
|---|---|
| `lib/api.ts` | Necesita una función nueva, `GET /api/public/programs` — no existe hoy ninguna llamada a ese endpoint |
| `lib/types.ts` | Necesita un tipo `Program` (o similar, `{name: string}`) y un tipo para `AnnexRequirement`; `AcademicRequest` (`:133-178`) gana `annexRequirement?` |
| `lib/use-*.ts` (nuevo) | Hook compartido de catálogo, si se elige esa opción (ver Approach 1) |
| `components/do-fr-100/sections.tsx:172` | `AcademicFields` — el `TextField` de `program` pasa a un control cerrado |
| `app/solicitud/creditos-adicionales/page.tsx` | Cablear el catálogo, bloquear `Continuar`/`Enviar` sin catálogo cargado |
| `app/solicitud/creditos-adicionales/page.test.tsx` | Tres roturas concretas identificadas (ver Approach 1) |
| `lib/ui-constants.ts:33-39` | Se borra `PROGRAMS` |
| `app/requests/new/page.tsx:61,293-303` | Reemplazar `PROGRAMS`/preselección por el catálogo |
| `lib/store.tsx:37,172-208,395-421` | `NewRequestInput.program` opcional; `ApiRequest`/`baseRequest` mapean `annexRequirement` |
| `app/requests/[id]/page.tsx:307-332` | Dónde y cómo mostrar el requisito de anexo |
| `openspec/specs/do-fr-100-form/spec.md` | Delta MODIFY del campo `program` en el formulario público |
| `openspec/specs/workflow-requests/spec.md` | Delta sobre «Registro de una solicitud (US1)» y «Detalle de una solicitud» |
| `app/requests/new/page.test.tsx`, `app/requests/[id]/page.test.tsx`, `lib/store.test.ts` | Nuevos tests de catálogo/omisión/anexo |

## Approaches

### 1. Selector público — dónde vive el fetch y qué control se usa

**Dónde se pide el catálogo:**

| Opción | Pros | Contras | Esfuerzo |
|---|---|---|---|
| **A. Hook compartido en `lib/` (`useProgramCatalog`)** | Sigue el precedente exacto y ya probado del repo (`use-request-detail.ts`, `use-coordination-inbox.ts`); una sola implementación para el formulario público y el interno; el hook no importa `useTramita`/`@/lib/store`, así que no rompe el guard de frontera del público (`page.test.tsx:198-213`, que solo escanea `app/solicitud/creditos-adicionales`, `components/do-fr-100` y `components/firma`) | Un archivo nuevo + su test nuevo (~50 y ~90 líneas) | Bajo-Medio |
| **B. `useEffect` + `useState` inline en cada página** | Cero archivos nuevos | Duplica la lógica de `ignore`/loading/error en dos páginas; si algún día se corrige un bug de carrera, hay que corregirlo dos veces; el propio repo ya decidió no hacerlo así para la bandeja y el detalle | Bajo (hoy), Medio (mantenimiento) |

**Recomendación**: A. Es el patrón que el repo ya adoptó para exactamente este problema (fetch-on-mount, compartido entre pantallas) y `config.yaml` pide «seguir los patrones existentes del repo» explícitamente.

**Qué control:**

| Opción | Pros | Contras | Esfuerzo |
|---|---|---|---|
| **A. `<select>` nativo vía `components/ui/select.tsx`** | Ya existe y ya se usa para `program` en el formulario interno (`app/requests/new/page.tsx:293-303`) y para el tipo de firma en el detalle; consistente con el resto del repo; cero CSS nuevo | El rol ARIA implícito de un `<select>` sin `multiple` es `combobox` (`node_modules/@testing-library/dom/dist/@testing-library/dom.umd.js:2363-2367`, confirmado en el bundle instalado): rompe el test `page.test.tsx:253` (`expect(screen.queryAllByRole('combobox')).toHaveLength(0)`), que hoy asevera cero comboboxes | Bajo |
| **B. `radiogroup` (trece `<input type="radio">`)** | Ningún rol `combobox` que rompa ese test puntual; toda la lista visible sin abrir un desplegable | Trece opciones en radios es una lista larga para un paso de un asistente pensado para celular (el design.md de la feature anterior optimiza para pantalla chica); no hay ningún precedente de radiogroup en el repo para listas cerradas; ese mismo test también asevera `queryAllByRole('checkbox')` en 0 — un radiogroup no lo rompe, pero cambia la superficie de accesibilidad sin necesidad | Medio |

**Recomendación**: A (`<select>`). El costo es un test que **ya sabemos exactamente cómo se rompe y por qué** (línea citada del bundle instalado), no una incertidumbre — es la clase de cambio mecánico que la fase de tareas puede prever con precisión. Un radiogroup evita esa única línea a costa de introducir un patrón de control nuevo en el repo y una superficie más grande en el paso «Datos académicos» del asistente, sin que nadie lo haya pedido.

**Qué bloquea el envío si el catálogo falla:**

Sin alternativa real aquí — la spec del backend y el issue #74 son explícitos: «si la lista no carga, el formulario **no** cae a texto libre: muestra el error y no permite el envío» (fallo cerrado, caso borde «Catálogo vacío» de la spec). Esto se traduce en: mientras el catálogo esté en `loading` o en `error`, el `<select>` se deshabilita (o se reemplaza por un aviso) y `handleContinue()`/`handleSubmit()` para el paso `academic` deben considerar el estado del catálogo, no solo `validate()`. `errorsOfStep`/`FIELD_STEP` (`components/do-fr-100/steps.ts`) no necesitan cambiar de forma — `program` sigue siendo un campo del paso `academic`; lo que cambia es que el paso completo queda bloqueado por una fuente de datos externa además de por errores de campo. La regla 7 de la skill de revisión aplica directo: «Un estado que bloquea debe explicar por qué» — el aviso debe decir que no se pudo cargar la lista de programas, no solo deshabilitar el botón en silencio.

**Impacto en tests concretos de `page.test.tsx` (fuente citada, no supuesta):**

- `:253` (`queryAllByRole('combobox')` → 0): pasa a 1 tras el cambio. Cambio mecánico de una aserción.
- `:230` (`getByLabelText('Programa académico en el que se encuentra').id).toBe('program')`): con un `<select id="program">` envuelto en el mismo `<Label htmlFor="program">`, `getByLabelText` sigue encontrando el control — no debería requerir cambio.
- `:264-276` (lista cerrada de ids `input, textarea, select` en orden): `program` sigue siendo un control con `id="program"` en la misma posición — el `<select>` matchea el mismo selector CSS. No debería requerir cambio.
- `:439` (`['program', 121]` en el `it.each` de límites de longitud): se vuelve **imposible de alcanzar por la UI** con un `<select>` cerrado — hay que quitar esa fila del `it.each` (exactamente lo que el issue #74 ya anticipa).
- `completeValues.program: 'Programa de Prueba'` (`:26`): no está en el catálogo de trece programas del backend — hay que cambiarlo a un valor real y, siguiendo el pedido explícito del issue («con un nombre con tilde»), algo como `'Ingeniería de Sistemas'`.
- Nuevo test necesario: catálogo vacío/en error bloquea `Continuar` en el paso `academic` y `Enviar` en la revisión, sin caer a texto libre.
- Nuevo test necesario: el valor enviado en el `body` de `submitPublicRequest` es **idéntico** al recibido de la lista mockeada (identidad, no solo presencia) — es el punto central del test 1 del issue.

### 2. Formulario interno — mismo endpoint, comportamiento distinto de «sin programa»

| Decisión | Opción elegida (sin alternativa real de peso) | Por qué |
|---|---|---|
| **Fuente del catálogo** | Reutilizar el mismo hook de la Approach 1 | El propio issue #74 lo pide explícitamente («El formulario interno usa el mismo endpoint») y evita una segunda implementación |
| **Valor por defecto** | Sin preselección — opción «Sin programa» o similar, no el primero alfabético | El propio plan del backend lo recomienda con su razón («el primero de la lista es un accidente del orden alfabético, no una elección», `Tramita/specs/009.../plan.md:265-267`) |
| **Omitir vs. cadena vacía** | `NewRequestInput.program` pasa de `string` a `string \| undefined`; si no hay selección, no se asigna la clave antes de llamar a `createRequest` | El backend rechaza `program: ""` con 400 (`invalidFields: ["program"]`); solo la **ausencia** de la clave cuenta como «no declarado» (FR-003 del backend) |

**Punto de bajo costo**: `lib/store.tsx:373-384` construye el cuerpo con `JSON.stringify({..., program: input.program, ...})`. `JSON.stringify` **ya omite las claves con valor `undefined`** — es comportamiento estándar de la especificación ([MDN, `JSON.stringify()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#description)). Con `NewRequestInput.program?: string` y `program: program || undefined` en la página, **no hace falta tocar la construcción del `body` en `store.tsx`**: el cambio se reduce al tipo de la interfaz y a cómo la página decide el valor. Esto también aplica sin cambios a `lib/api.ts:284-296` (`createRequest`), que ya tiene `program?: string` (`:277`) y el mismo patrón de destructuring — ese archivo no necesita ningún cambio para este comportamiento, solo confirma que ya estaba bien tipado.

**Qué pasa si el catálogo no carga (decisión de producto, no técnica — ver «Product Decisions»)**: a diferencia del público, en el interno `program` es opcional en el backend. Cabe registrar la solicitud sin programa aunque el catálogo esté caído. Es un trade-off de producto real (bloquear vs. degradar), no una cuestión técnica con una sola respuesta correcta.

**No se toca**: issue #10 (duplicación `lib/store.tsx`/`lib/api.ts`) e issue #50 (dos tipos fijos en vez de `GET /workflow-definitions`) — ninguno de los dos es parte de este cambio; solo se señala que la spec `workflow-requests` documenta el comportamiento del `createRequest` de `lib/api.ts` (con el comentario «NO reemplazar por spread — ver design.md, Decisión 1» citado ahí), mientras que la pantalla real usa la versión de `lib/store.tsx`. Si la fase de `sdd-spec` modifica el requisito «Registro de una solicitud (US1)» de `workflow-requests`, debe ser explícita sobre cuál de los dos caminos de código documenta — hoy la spec describe el que la pantalla **no** ejecuta.

### 3. Anexo en el detalle — tipos, mapeo y ubicación visual

**Tipos y mapeo** (sin alternativa real: se sigue el patrón ya existente de campos opcionales del backend):

- `lib/types.ts`: nuevo `AnnexRequirement { documentName: string; sourceHint: string }`; `AcademicRequest.annexRequirement?: AnnexRequirement` junto a `program` (`:170`).
- `lib/store.tsx`: `ApiRequest.annexRequirement?: {documentName: string; sourceHint: string} | null` (mismo patrón que los demás campos opcionales de esa interfaz, `:54-69`); `baseRequest` (`:172-208`) mapea `annexRequirement: apiRequest.annexRequirement ?? undefined`.
- **Hallazgo de bajo costo en `transition` (`lib/store.tsx:395-421`)**: el objeto que sobrescribe campos «que el backend todavía no persiste» (`:411-421`) hace `{...updated, priority: item.priority, studentCode: item.studentCode, ...}` — **spreadea `updated` primero**, así que `annexRequirement` (que sí viene en `updated` porque `loadRequest`→`baseRequest` ya lo mapea) **sobrevive sin que haya que agregarlo a esa lista de overrides**. No hace falta ninguna línea nueva en esa función para que el anexo se vea después de una transición.

**Dónde mostrarlo en `app/requests/[id]/page.tsx`:**

| Opción | Pros | Contras | Esfuerzo |
|---|---|---|---|
| **A. Un `InfoRow` más, dentro de la tarjeta «Datos del estudiante» junto a «Programa»** | Cero componentes nuevos; consistente con el patrón de hechos ya existente | El encuadre del producto (`project.md:82-100`) dice que el sistema debe **recordarle** a la Coordinación que pida el documento antes de reenviar — un dato más entre seis en una grilla `dl` es fácil de no ver justo en el momento en que importa (antes de pulsar la transición hacia la facultad) |
| **B. Aviso/callout distinguible, cerca de los botones de acción de transición (arriba, junto al header o a `transitionActions`)** | Coincide con el verbo del sistema («recordar», FR-009); visible en el momento en que la Coordinación decide reenviar | Un componente/bloque de presentación nuevo (pequeño) |
| **C. Ambas** | Máxima cobertura: dato consistente en la ficha + aviso saliente en el momento de decidir | Más líneas; sobre-ingeniería si nadie lo pidió así |

**Recomendación**: B. El propio contrato del backend deja la decisión explícitamente al cliente («Dónde y cuándo destacarlo lo decide el cliente», `openapi.yaml` de la 009, descripción de `annexRequirement`) y el encuadre de producto de este repo (verbo REGISTRAR, dato central «de quién depende ahora», recordatorio antes de reenviar) apunta a un aviso visible cerca de la acción, no a un dato pasivo en una grilla. Es una decisión de UI con trade-off real, no puramente técnica: queda para el responsable.

**Redacción propuesta** (sin afirmar que se adjuntó, por FR-012): *«Para reenviar a la facultad, adjunte: {documentName}. {sourceHint}.»* — evita «anexo adjuntado» o cualquier verbo que implique que el sistema lo sabe.

**Transiciones**: el flujo actual de `transition()` **siempre vuelve a consultar** `GET /requests/{id}` (`loadRequest`, `lib/store.tsx:410`) en vez de usar la respuesta del propio `POST .../transitions` — esto **contradice** la premisa del test 4 del issue #74 («La respuesta de la transición lo trae sin volver a consultar») y la ganancia declarada por el backend en SC-006 («sin ninguna consulta adicional»). Adoptar la respuesta del POST directamente es un cambio de mayor riesgo (toca el manejo de errores y la concurrencia de `transition`, no solo el mapeo de un campo) y **no es necesario** para que el anexo se vea correctamente después de una transición: gracias al hallazgo de arriba, el re-fetch ya lo trae. Se recomienda **no tocar el flujo de re-consulta en este cambio** y escribir el test como «después de una transición, el detalle sigue mostrando el requisito» (verificable con el flujo actual), dejando la adopción de la respuesta del POST (issue #52, ya relacionado) fuera de alcance. Es una decisión técnica de bajo riesgo, no una pregunta al responsable.

### 4. Ubicación del delta de spec

| Dominio | Requisito afectado | Operación | Por qué este dominio y no otro |
|---|---|---|---|
| `openspec/specs/do-fr-100-form/spec.md` | «Todos los campos son obligatorios» (líneas ~91-112, cita `program` como campo de texto con límite 120) | MODIFY | Es la spec del formulario público; el campo deja de ser texto libre |
| `openspec/specs/workflow-requests/spec.md` | «Registro de una solicitud (US1)» (tabla de seis campos, `program` ≤120) | MODIFY (acotado) | Rige el envío del formulario interno hacia `POST /requests`; ver la advertencia de la Approach 2 sobre a cuál camino de código describe hoy |
| `openspec/specs/workflow-requests/spec.md` | «Detalle de una solicitud» | ADD escenario | Ya rige qué campos del detalle se muestran (`definition`, `studentName`, `studentDocument`, `currentState`, `createdAt`); el anexo es un campo más del mismo detalle |

**Alternativa descartada**: un dominio nuevo (`program-catalog` o similar). `config.yaml` pide explorar al menos una alternativa en un eje distinto y documentar el trade-off, y el precedente de cambios previos (`fase-b-integracion-motor-workflow` tocó tres dominios existentes en un solo cambio) confirma que este repo prefiere ampliar dominios existentes antes que fragmentar en uno nuevo para una feature acotada (trece programas, un anexo). Un dominio nuevo solo se justificaría si el catálogo ganara comportamiento propio más allá de alimentar dos selectores — no es el caso aquí.

**No se toca** `request-transitions/spec.md`: ese dominio rige las *acciones* (qué transición, quién es responsable, nota obligatoria, conflicto 409) — el anexo es un dato del detalle que sobrevive a cualquier acción, no una propiedad de la transición misma.

### 5. Slicing en dos PRs (verificado con las convenciones del repo, no supuesto)

Conteo por archivo, cruzando los dos cortes propuestos por el orquestador:

| Archivo | Slice A (selector público) | Slice B (interno + anexo) | Solapa |
|---|---|---|---|
| `lib/api.ts` | + función nueva (`getPublicPrograms` o similar, ~15-20 líneas) | Sin cambios (ya está bien tipado, ver Approach 2) | No — A la crea, B la usa sin tocarla |
| `lib/types.ts` | + tipo `Program` (~8 líneas) | + tipo `AnnexRequirement` y `AcademicRequest.annexRequirement` (~10 líneas) | Mismo archivo, secciones distintas — riesgo de conflicto de merge bajo si B se abre después de A mergeado |
| `lib/use-*.ts` (nuevo hook) | Se crea en A (~45-60 líneas + ~80-110 de test) | Lo reutiliza sin tocarlo | No |
| `components/do-fr-100/sections.tsx` | Modifica `AcademicFields` | No toca | No |
| `app/solicitud/creditos-adicionales/{page.tsx,page.test.tsx}` | Sí (grande — ver detalle abajo) | No toca | No |
| `lib/ui-constants.ts`, `app/requests/new/page.tsx` | No toca | Sí | No |
| `lib/store.tsx`, `app/requests/[id]/page.tsx` | No toca | Sí | No |
| `openspec/specs/do-fr-100-form/spec.md` | Sí | No | No |
| `openspec/specs/workflow-requests/spec.md` | No | Sí | No |

**El corte no se solapa en código de producción** — el único archivo compartido es `lib/types.ts`, y en secciones distintas (bajo riesgo). Es un corte sano.

**Estimación de líneas (aditivas + eliminadas, aproximado por lo medido en cada archivo):**

- **Slice A**: `lib/api.ts` (+20), `lib/types.ts` (+10), hook nuevo + su test (+50/+100), `sections.tsx` (±20), `page.tsx` (+30/-10), `page.test.tsx` (fixture, aserción del combobox, quitar fila del `it.each`, tests nuevos de bloqueo por catálogo y de identidad del valor con tilde: +60/-15). **Total aproximado: 320-380 líneas** — cerca del techo de 400 sin contar el archivo de spec delta. Si la fase de tareas suma el archivo `openspec/specs/do-fr-100-form/spec.md` al mismo PR de código, probablemente **supera** el presupuesto; el precedente del cambio anterior (`formulario-publico-por-pasos`) resolvió esto entregando el bundle de OpenSpec (`proposal`+`spec`+`design`+`tasks`) como **su propio PR** separado del código (su PR-2), y encima partió el código del asistente en cuatro cortes encadenados (3a-3d) porque una sola pasada excedía el presupuesto. `sdd-tasks` debe pronosticar esta slice con el mismo cuidado — es la más grande de las dos y la más cerca del límite.
- **Slice B**: `lib/ui-constants.ts` (-8), `app/requests/new/page.tsx` (+25/-10), `lib/store.tsx` (+15), `lib/types.ts` (+10), `app/requests/[id]/page.tsx` (+15/-5, según la opción de la Approach 3), tests (`store.test.ts`, `page.test.tsx` del interno y del detalle: +90). **Total aproximado: 150-220 líneas** — cómodamente bajo el presupuesto.

**Conclusión sobre el corte**: se sostiene como lo propuso el orquestador (A = bloqueante de despliegue, B = resto), pero **Slice A probablemente necesita su propio sub-corte** (por ejemplo: hook + tipos primero, cableado de la página después, como ya hizo el cambio anterior con `steps.ts` antes del cableado) — queda como pronóstico para `sdd-tasks`, no como decisión aquí.

## Recommendation

1. Hook compartido en `lib/` (no duplicar `useEffect` en cada página).
2. `<select>` nativo vía `components/ui/select.tsx` para el programa, en ambos formularios — asumiendo el costo ya cuantificado del test `combobox`.
3. Formulario interno: sin preselección, `NewRequestInput.program` opcional, omitir la clave (no `''`); `lib/api.ts` no necesita cambios.
4. Anexo: aviso visible cerca de las acciones de transición (no solo un `InfoRow` pasivo), sin tocar el flujo de re-consulta de `transition()`.
5. Delta de spec en `do-fr-100-form` (MODIFY) y `workflow-requests` (MODIFY acotado + ADD escenario) — sin dominio nuevo.
6. Slicing A/B como lo definió el orquestador, con la advertencia de que A puede necesitar partirse otra vez en la fase de tareas.

## Risks

En orden:

1. **Riesgo de despliegue (alto, ya activo)**: el backend con la 009 está en `main` del repo hermano. Mientras el selector público no esté en `main` del frontend, cualquier programa escrito a mano en el formulario público recibe 422. No es un riesgo hipotético — es una condición ya vigente.
2. **Presupuesto de 400 líneas en Slice A (medio-alto)**: la estimación (320-380 líneas de código, sin contar el delta de spec) deja poco margen; el precedente inmediato del repo (`formulario-publico-por-pasos`) tuvo que partir un trabajo de tamaño comparable en cuatro cortes.
3. **Anonimización de fixtures (medio)**: `openspec/` es público. Los fixtures nuevos deben usar nombres de programas reales del catálogo (son datos públicos de la oferta académica, no datos personales) pero cualquier dato de estudiante debe seguir sintético, como ya lo exige `config.yaml` y como ya hacen los fixtures actuales (`'Estudiante Sintético'`, `'estudiante.sintetico@example.test'`).
4. **Ambigüedad de qué código documenta «Registro de una solicitud (US1)» en `workflow-requests` (medio)**: la spec describe el `createRequest` de `lib/api.ts`, que la pantalla real no usa (issue #10). Si la fase de spec no es explícita sobre esto, el delta puede terminar describiendo un camino de código que no se ejecuta.
5. **Catálogo provisional (bajo, ya declarado por el backend)**: los trece programas no están confirmados por escrito por la Coordinación (`Tramita/specs/009.../spec.md:108`). No es un riesgo del frontend, pero cualquier fixture de test que use nombres de programas hereda esa provisionalidad — vale citarla si el jurado pregunta por qué el catálogo no está «cerrado».

## Product Decisions (para el responsable, con recomendación)

1. **¿El formulario interno debe bloquear todo el registro si el catálogo de programas no carga, o permitir enviar «sin programa» como resultado degradado?** Recomendación: permitir enviar sin programa — a diferencia del público, el campo ya es opcional en el backend y el trabajo de la Coordinación (bitácora, no aprobación) no debería depender de la disponibilidad de un catálogo para registrar un trámite.
2. **¿Dónde debe aparecer el requisito de anexo en el detalle: como fila pasiva en «Datos del estudiante», como aviso visible cerca de las acciones de transición, o ambos?** Recomendación: aviso visible cerca de las acciones — es el momento en que la Coordinación decide reenviar, y el propio backend deja esta decisión explícitamente al cliente.

## Verified Facts vs. Assumptions

**Verificado con comando/línea citada en este documento**: el rol ARIA implícito de `<select>` (`@testing-library/dom.umd.js:2363-2367`); que `JSON.stringify` omite claves `undefined` (MDN); que `createRequest`/`CreateRequestBody.program` de `lib/api.ts` ya es opcional y no necesita cambios; que `transition()` en `lib/store.tsx` spreadea `updated` antes de los overrides locales, por lo que `annexRequirement` sobrevive sin código nuevo; que `use-request-detail.ts` no tiene consumidores reales (solo su propio test) mientras que `use-coordination-inbox.ts` sí; que no hay ningún cambio activo en `openspec/changes/` que colisione con este nombre; el inventario completo de los tres contratos backend (`spec.md`, `plan.md`, `openapi.yaml` de la 009).

**Heredado del orquestador, no re-medido en esta fase**: los conteos de la base de datos dev y las pruebas en vivo contra el backend local (ver «Hechos medidos por el orquestador»).

## Hechos medidos por el orquestador (2026-09-26, insumo de esta exploración)

Sondas en vivo contra el backend local con la 009:

- `GET /api/public/programs` → 200, 13 programas `[{ name }]`, sin sesión, sin CSRF, sin caché; el orden sigue la intercalación de la base, así que el cliente no debe depender de una posición.
- `POST /api/public/requests/ADICION_CREDITOS` con un programa escrito a mano → 422 «Formato inválido», `invalidFields: ["program"]`, sin repetir el valor.
- `POST /api/requests` con `program: ""` → 400 «Petición inválida», `invalidFields: ["program"]`, sin persistir nada. Para no declarar programa el cliente debe OMITIR la clave (o mandar `null`).
- `GET /api/requests/{id}`: `annexRequirement: { documentName, sourceHint }` presente solo cuando hay regla (la base dev tiene una: ADICION_CREDITOS × «Ingeniería de Sistemas» → «Hoja de vida académica» / «La descarga el estudiante desde CLASS»). Sin regla, la clave está AUSENTE (no `null`). `RequestResponse.java:45` lleva `@JsonInclude(NON_NULL)` a nivel de clase, así que todo campo nulo del detalle viaja ausente (`program`, `semester`, `reason`, `studentEmail`, `studentPhone`; `studentCode` nunca aparece). Los mocks del front deben simular clave ausente.
- Base dev: 68 solicitudes; 37 sin programa; 22 «Ingeniería de Sistemas» (18 con la definición de la regla); 7 con valores heredados fuera del catálogo («Ing», «Sistemas», «Programa de Prueba», «Ingenieria de sistemas») que el backend conserva tal cual (FR-005) y que el detalle debe seguir pintando.

## Ready for Proposal

**Sí**, con una condición: `sdd-propose` debe partir de las dos preguntas de producto de «Product Decisions» ya resueltas por el responsable — son trade-offs reales, no detalles de implementación.
