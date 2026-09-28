# Proposal: Catálogo de programas en el formulario interno y requisito de anexo en el detalle

> **Qué es.** Lo que queda del issue #74, la contraparte en el frontend de la feature 009 del
> backend (`Tramita/specs/009-program-catalog-annex/`). Son sus puntos 2 y 3 y las pruebas
> correspondientes del punto 4: el formulario interno elige el programa del catálogo público, y el
> detalle de una solicitud recuerda el anexo que la facultad exige para su programa. El punto 1
> (selector del formulario público) ya está en `main` desde la PR #76.
>
> **Cómo se midió.** Las citas del frontend salen del worktree
> `tramita-frontend-worktrees/catalogo-programas-y-anexo`, rama `sdd/catalogo-programas-y-anexo`,
> en `main` = `ae4ee11`. El commit lo midió el orquestador; esta fase no tiene shell y no lo
> repitió. Las búsquedas y lecturas se hicieron con las herramientas Grep/Read sobre ese árbol, y se
> citan con su patrón y su alcance. Las citas del backend salen de
> `../Tramita/specs/009-program-catalog-annex/{spec.md,contracts/openapi.yaml}` y de
> `RequestResponse.java:45`, releídos en esta fase. Las sondas en vivo contra el backend local son
> del orquestador (2026-09-26) y se citan como tales. El análisis de alternativas está en
> `exploration.md`: su primera sección, «Estado 2026-09-26 (tarde)», prevalece sobre las
> históricas.

## Intent

**Qué cerró #76 y qué queda.** #76 (`ae4ee11`) entregó el selector del formulario público: un
`<select>` nativo alimentado por `GET /api/public/programs`, que envía el valor tal como llega y
falla cerrado con «Reintentar». También dejó `listPublicPrograms()` y `PublicProgram { name }` en
`lib/api.ts:239-247`. La spec viva `do-fr-100-form` ya tiene el requisito «El programa académico
procede del catálogo público» (`openspec/specs/do-fr-100-form/spec.md:207`). Con eso, la condición
de despliegue del canal público quedó resuelta.

**Problema pendiente.** #76 no tocó el formulario interno ni el detalle:

- **El formulario interno ofrece una lista fija que el backend ya no acepta.** `PROGRAMS`
  (`lib/ui-constants.ts:33-39`) tiene cinco nombres, y uno de ellos, «Psicología» (`:38`), no está
  en el catálogo. Desde la 009, el canal interno rechaza un programa fuera del catálogo con 400 e
  `invalidFields: ["program"]` (FR-003, `Tramita/.../spec.md:74`; issue #74, «Qué devuelve ya el
  backend»).
- **El formulario interno declara un programa que nadie eligió.** `useState(PROGRAMS[0])`
  (`app/requests/new/page.tsx:61`) preselecciona «Ingeniería de Sistemas» (`lib/ui-constants.ts:34`),
  así que la clave nunca se omite. Con la 009 esto pasa de detalle cosmético a defecto de datos: el
  tipo por defecto es `adicion_creditos` (`app/requests/new/page.tsx:55`), y esa combinación es
  exactamente la única regla de anexo de la base de desarrollo (sonda del orquestador). Una
  coordinadora que no toque el selector registra un programa que el estudiante no declaró. Si el
  literal coincide byte a byte con el del catálogo (no se verificó en esta fase), el backend además
  deriva de ese valor accidental un requisito de anexo.
- **El detalle no conoce el anexo.** Una búsqueda de `annex|anexo`, sin distinguir mayúsculas, en
  `lib`, `app` y `components` devuelve 0 archivos. El backend ya lo expone «desde el registro y en
  cualquier estado» (FR-009, `Tramita/.../spec.md:80`), y ninguna pantalla lo muestra.

**Por qué ahora.** El issue #74 sigue abierto y solo se cierra con estos dos puntos. «Psicología»
produce hoy un 400 frente al `main` del backend. Además, la preselección silenciosa contaminaría el
aviso de anexo en cuanto el detalle empiece a mostrarlo, así que los dos puntos se entregan juntos.

**Éxito.**

- Ninguna solicitud del formulario interno lleva un programa fuera del catálogo ni un programa que
  la coordinadora no eligió.
- Sin elección, la clave `program` se omite; nunca viaja `""`.
- El detalle muestra el requisito de anexo cuando el backend lo envía, también después de una
  transición, y no muestra nada cuando la clave falta.

## Scope

### In Scope

**Punto 2: formulario interno** (`app/requests/new`):

- El catálogo se obtiene con `listPublicPrograms()` (`lib/api.ts:243`). No se agrega ninguna función
  de API.
- El control es el mismo `Select` de hoy (`app/requests/new/page.tsx:293-303`). Primero viene la
  opción «Sin programa», que es la inicial, y después los nombres del catálogo en el orden recibido,
  con el valor tal como llegó.
- `NewRequestInput.program` pasa a ser opcional (`lib/store.tsx:37`). Sin selección, la página pasa
  `undefined` y la clave desaparece del cuerpo.
- Si el catálogo está cargando, falla o llega vacío, un texto lo explica y el registro sin programa
  sigue disponible (P2).
- Se borra `PROGRAMS`. Su único consumidor es `app/requests/new/page.tsx:29,61,298`: Grep de
  `\bPROGRAMS\b` en el worktree, excluyendo `openspec/`, da 4 coincidencias en 2 archivos.

**Punto 3: anexo en el detalle** (`app/requests/[id]`):

- `AnnexRequirement { documentName; sourceHint }` en `lib/types.ts` (los dos son `required` en
  `openapi.yaml:262`), y `AcademicRequest.annexRequirement?` junto a `program` (`lib/types.ts:170`).
- `ApiRequest.annexRequirement?` (`lib/store.tsx:54-69`) y su mapeo en `baseRequest` (`:172-208`).
- Un aviso visible entre los botones de transición y `CurrentStateBlock` (P1).

**Punto 4: pruebas** del formulario interno, del mapeo y del detalle (Approach §3).

### Out of Scope

| Queda fuera | Por qué |
|---|---|
| Cualquier cambio de comportamiento del formulario público y cualquier delta de `do-fr-100-form` | Lo cerró #76. Si el design elige extraer el hook (§4), la página pública cambia solo por dentro: su suite MUST seguir en verde sin modificar sus aserciones |
| Los seguimientos no bloqueantes que #76 declaró: catálogo vacío sin explicación en el público, prueba de identidad sin tilde, «Reintentar» fuera del `Button` del proyecto | Son del formulario público. Resolverlos aquí reabriría `do-fr-100-form` (exploración, «Estado 2026-09-26 (tarde)») |
| Usar la respuesta del `POST .../transitions` en lugar de volver a consultar el detalle (issue #52) | Toca el manejo de errores y la concurrencia de `transition()` (`lib/store.tsx:395-422`), y no hace falta para ver el anexo después de una transición (§2). Es un desvío declarado |
| Unificar los `createRequest` de `lib/store.tsx` y `lib/api.ts` (issue #10), incluidos los campos que el camino del store envía además de los seis de la spec (`lib/store.tsx:377-378,382-383`) | Es deuda previa. Este cambio solo vuelve opcional `program` en el camino que la pantalla ejecuta |
| Poblar el tipo de trámite desde `GET /workflow-definitions` (issue #50) | Es otro selector y otro contrato |
| Asociar al campo el 400 del formulario interno por un programa que sale del catálogo entre la carga y el envío | Con una lista cerrada, solo ocurre si el catálogo cambia en esa ventana. El aviso general existente (`errors.form`, `app/requests/new/page.tsx:127,174`) ya lo muestra |
| Mostrar el anexo en la bandeja o en la búsqueda | El backend no lo envía en esas respuestas (issue #74, «Qué devuelve ya el backend») |
| Cualquier marca local de «adjuntado» | El sistema no sabe si el anexo se adjuntó (FR-012, `Tramita/.../spec.md:83`) |
| Ocultar o variar el aviso según el código del estado | La regla 1 de `revisar-frontend-next` prohíbe fijar códigos del motor en el cliente. La única variante admisible usa `currentState.isFinal` (Preguntas abiertas §2) |
| Reordenar el catálogo en el cliente | Se muestra en el orden recibido. El orden sigue la intercalación de la base (sonda del orquestador) |
| Tocar el backend | La 009 ya está en su `main`. Ningún PR de este cambio lo modifica |

## Capabilities

### New Capabilities

Ninguna. Se descartó un dominio `program-catalog`, porque el catálogo no tiene comportamiento propio
más allá de alimentar dos selectores (exploración, Approach 4).

### Modified Capabilities

- `workflow-requests` (`openspec/specs/workflow-requests/spec.md`):

| Requisito | Operación | Qué cambia |
|---|---|---|
| «Registro de una solicitud (US1)» (`:81`) | MODIFY (acotado) | `program` sale del catálogo, se envía idéntico, sigue siendo opcional y, sin elección, **se omite la clave**: nunca `""` y sin preselección. El delta MUST dejar explícito que `app/requests/new` ejecuta el `createRequest` de `lib/store.tsx` (`:370-393`), no el de `lib/api.ts` (`:295-307`), que es el que el requisito describe hoy. Las cláusulas nuevas sobre `program` se atan al camino del store. El delta MUST NOT afirmar que ese camino cumple el allowlist de seis campos, porque no lo cumple (`lib/store.tsx:377-378,382-383`; issue #10) |
| «Detalle de una solicitud» (`:211`) | MODIFY (escenarios nuevos) | Aviso del requisito de anexo cuando llega `annexRequirement`, con un texto que no afirma que se adjuntó; ningún aviso ni contenedor vacío cuando la clave falta; el aviso sigue visible después de una transición; un programa heredado fuera del catálogo se muestra tal cual (FR-005, `Tramita/.../spec.md:76`) |

Según la convención de deltas, un escenario agregado viaja como un bloque `MODIFIED` con el
requisito completo. **`do-fr-100-form` no se toca.** `request-transitions` tampoco, porque el anexo
es un dato del detalle y no una propiedad de la transición.

## Decisiones tomadas

Estas decisiones no se reabren aquí.

| # | Decisión | Fuente | Por qué |
|---|---|---|---|
| P1 | El requisito de anexo es un aviso visible junto a las acciones de transición. Va entre la tarjeta de encabezado con los botones (`app/requests/[id]/page.tsx:273-294`) y `CurrentStateBlock` (`:296-301`), no en una fila de «Datos del estudiante» (`:319`). Texto propuesto: «Para reenviar a la facultad, adjunte: {documentName}. {sourceHint}.» | Responsable, 2026-09-26 | Es el momento en que la Coordinación decide reenviar. El contrato deja al cliente dónde destacarlo (`openapi.yaml:321-322`). El texto nunca afirma que se adjuntó (FR-012) |
| P2 | El formulario interno permite registrar **sin programa** cuando el catálogo no carga, y explica la falla | Orquestador, por defecto y abierta a veto | En el canal interno `program` es opcional (FR-003), y la bitácora no debe depender del catálogo para registrar |
| T2 | `<select>` nativo mediante `components/ui/select.tsx` | Exploración, Approach 1; #76 | El formulario interno ya lo usa para `program`, y #76 lo adoptó en el público |
| T3 | Sin preselección silenciosa: la opción inicial es «Sin programa», `NewRequestInput.program` es opcional y la clave se omite | Exploración, Approach 2; issue #74, punto 2 | Un `""` responde 400 (sonda del orquestador). `JSON.stringify` descarta las claves con valor `undefined` ([MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#description)), así que la construcción del cuerpo en `lib/store.tsx:373-384` no cambia. `lib/api.ts` ya tipa `program?: string` (`:288`) y no se toca |
| T4 | `annexRequirement` se mapea en `baseRequest`, y se conserva la nueva consulta que hace `transition()` | Exploración, Approach 3 | `...updated` se aplica primero (`lib/store.tsx:412`), y los overrides (`:414-420`) no nombran el campo, así que sobrevive sin tocar esa función. Usar la respuesta del `POST` queda en el issue #52 |
| T5 | Delta solo en `workflow-requests`, sin un dominio nuevo y sin cambios en `do-fr-100-form` | Exploración, Approach 4 y «Estado… (tarde)» | Ver Capabilities |

La **T1** de la versión de la mañana (un hook compartido en `lib/`) se reabre como pregunta de
diseño (§4), porque #76 no lo creó.

## Approach

Se mantiene el par container/presentational. Las páginas orquestan los datos y los componentes
presentan. No se agrega ninguna dependencia npm.

### §1 Formulario interno

- **Opciones.** La primera es «Sin programa», con valor `""` en el control, y es la inicial.
  Después vienen los nombres de `listPublicPrograms()`, cada uno con `value` igual al nombre
  recibido, sin `trim()` ni `normalize()`.
- **Envío.** La página pasa `program: program || undefined`. El cuerpo de `lib/store.tsx:373-384`
  omite la clave sin modificar su construcción (T3).
- **Carga, error y lista vacía.** Rige P2. El selector conserva «Sin programa», un texto explica
  que la lista no está disponible y el botón «Radicar solicitud» no se bloquea. La regla 7 de
  `revisar-frontend-next` exige explicar el estado; un control deshabilitado sin texto no basta.
  Qué más ofrece la pantalla (por ejemplo, «Reintentar») es una decisión por defecto abierta a veto
  (Preguntas abiertas §2).
- **Estados de la colección.** Cargando, lista y error se distinguen (regla 3 de la skill). En el
  formulario interno, una lista vacía se trata como un error.

### §2 Anexo en el detalle

- **Mapeo:** `annexRequirement: apiRequest.annexRequirement ?? undefined`. En el cable la clave
  llega **ausente**, no con valor `null`, porque `RequestResponse.java:45` aplica
  `@JsonInclude(NON_NULL)` a toda la clase (releído en esta fase; `openapi.yaml:324-327`).
- **Aviso:** texto estático, sin región viva, con los dos campos del contrato y la redacción de P1.
  No depende del estado ni de ningún código del motor. La fila «Programa» (`:319`) no cambia, así
  que un valor heredado se sigue mostrando tal cual.
- **Desvío declarado respecto del test 4 del issue y del SC-006 del backend**
  (`Tramita/.../spec.md:102`, «sin ninguna consulta adicional»). `transition()` consulta el detalle
  antes (`lib/store.tsx:398`) y después (`:410`) del `POST`, y la segunda consulta ya trae el campo.
  La Coordinación ve el requisito antes y después de la acción, pero no «sin volver a consultar».
  La adopción de la respuesta del `POST` queda en el issue #52.

### §3 Pruebas: en qué capa vive cada garantía

Dos hechos de la suite actual deciden dónde va cada prueba:

- La prueba del detalle simula `useTramita` (`app/requests/[id]/page.test.tsx:7-16`), así que ve
  objetos `AcademicRequest` ya mapeados, nunca el cable. La ausencia de la clave en el cable y su
  supervivencia a `transition()` solo se pueden probar en `lib/store.test.ts`. Ese archivo reemplaza
  solo `apiFetch` y controla cada ruta (`lib/store.test.ts:20-25`). Hoy no tiene ninguna prueba de
  `transition()`: un Grep de `transition` en ese archivo da 0 coincidencias.
- La prueba del formulario interno simula el store y `AppShell`
  (`app/requests/new/page.test.tsx:7-11`), pero no `@/lib/api`. Necesitará simular el catálogo.

| Test del issue #74 (punto 4) | Cómo se cubre |
|---|---|
| 1. La lista viene de un endpoint mockeado y el valor enviado es idéntico, con tilde | Público: lo entregó #76. Interno: `toBe` sobre `program` en el cuerpo que emite el `createRequest` del store, con un nombre con tilde |
| 2. Con la lista vacía o en error, el envío se bloquea y no hay texto libre | Público: lo entregó #76. Interno: **no se bloquea**, por P2. Se prueba que la falla se explica y que se registra sin la clave. Es una diferencia declarada, no un hueco |
| 3. El detalle muestra el requisito, y nada cuando falta | Store: `baseRequest` con la clave presente y con la clave **ausente** del objeto (no `null`). Página: el aviso con los dos textos, y su ausencia comprobada después de que termina la carga (convención de test 4 de la skill) |
| 4. La respuesta de la transición lo trae sin volver a consultar | Desvío declarado (§2). Store: después de `transition()`, cuya consulta posterior mockeada trae la clave, la solicitud del store conserva `annexRequirement` |

### §4 Pregunta de diseño abierta: ¿hook compartido o efecto repetido?

#76 dejó la carga del catálogo como un efecto dentro de la página pública: la unión
`ProgramCatalog` en `app/solicitud/creditos-adicionales/page.tsx:85-88`, y el estado, el efecto con
`ignore` y el contador de reintento en `:186-213`. El formulario interno necesita la misma carga.
**La elección final la toma `sdd-design`.**

| Opción | A favor | En contra |
|---|---|---|
| **A. Extraer un hook a `lib/`** (nombre tentativo `use-program-catalog.ts`) que consumen las dos pantallas | Una sola implementación de `ignore` y del reintento. Es el patrón del repo para cargar al montar (`lib/use-coordination-inbox.ts`, `lib/use-request-detail.ts`), y `config.yaml` pide seguir los patrones existentes. Cada pantalla aplica su política encima del mismo estado: el público falla cerrado y el interno degrada. Si el hook devuelve la misma forma que hoy (`ProgramCatalog` más `retry`), la llamada de `page.tsx:378` y `components/do-fr-100/` no cambian | Toca una pantalla recién mergeada, aunque sin cambio de comportamiento. Frente a la opción B, suma unas 40 a 50 líneas netas al PR, o de 100 a 140 con una prueba propia del hook (tabla de Entrega). La guarda de frontera del público solo escanea `app/solicitud/creditos-adicionales`, `components/do-fr-100` y `components/firma` (`page.test.tsx:176-184`), con una lista exacta (`:314-321`), así que un hook en `lib/` queda fuera de su vigilancia (`:324`) |
| **B. Repetir el efecto en la página interna** | No toca la página pública y deja el PR más chico | Quedan dos copias de la misma lógica de concurrencia: un defecto de carrera habría que corregirlo dos veces. Contradice el precedente del repo para la bandeja |

**Recomendación: A**, con tres condiciones:

1. La extracción no cambia comportamiento. Va en su propio commit y la suite pública sigue en verde
   sin modificar sus aserciones.
2. El hook MUST NOT importar `@/lib/store` ni `AppShell`. El design decide cómo se vigila, por
   ejemplo sumando el hook a la lista de la guarda o afirmándolo en su propia prueba.
3. La simulación de `@/lib/api` en la prueba pública (`page.test.tsx:11-13`) debe seguir
   interceptando la llamada cuando la hace el hook. Vitest simula por módulo, así que debería
   hacerlo, pero la confianza es media hasta ver la suite en verde.

La razón de fondo: con dos consumidores, extraer es el patrón del repo, y en seis meses se entiende
mejor un hook con dos consumidores que dos efectos casi iguales. El costo es tamaño y el riesgo de
tocar la pantalla pública. Si el pronóstico de `sdd-tasks` supera el presupuesto, B es el repliegue
legítimo, siempre que se registre como deuda con su motivo.

## Affected Areas

| Área | Impacto | Detalle |
|---|---|---|
| `lib/ui-constants.ts` | Modified | Se borra `PROGRAMS` (`:33-39`) |
| `app/requests/new/page.tsx` y `page.test.tsx` | Modified | Catálogo, «Sin programa», omisión de la clave, explicación de la falla |
| `lib/store.tsx` y `lib/store.test.ts` | Modified | `NewRequestInput.program?` (`:37`), `ApiRequest.annexRequirement?` (`:54-69`), mapeo en `baseRequest` (`:172-208`). Pruebas nuevas de omisión, del mapeo y de `transition()` |
| `lib/types.ts` | Modified | `AnnexRequirement` y `AcademicRequest.annexRequirement?` (`:133-178`) |
| `app/requests/[id]/page.tsx` y `page.test.tsx` | Modified | Aviso del requisito de anexo entre `:294` y `:296` |
| `lib/use-program-catalog.ts` (y su prueba, si el design la pide) | New, solo con la opción A de §4 | Hook de carga del catálogo |
| `app/solicitud/creditos-adicionales/page.tsx` | Modified, solo con la opción A de §4 | Se reemplaza el efecto de `:186-213` por el hook, sin cambio de comportamiento |
| `lib/api.ts` | Sin tocar | `listPublicPrograms` (`:243`) y `program?: string` (`:288`) ya sirven |
| `openspec/specs/workflow-requests/spec.md` | Modified al archivar | Delta descrito en Capabilities |
| `openspec/specs/do-fr-100-form/spec.md` | Sin tocar | Lo cerró #76 |
| `../Tramita` (backend) | Sin tocar | — |

## Risks

Ordenados por prioridad.

| Riesgo | Prob. | Mitigación |
|---|---|---|
| **Presupuesto de 400 líneas en la PR-B.** El pronóstico va de 270 a 360 líneas con la opción B de §4, y de 310 a 500 con la A (tabla de Entrega) | Media (B) / Alta (A) | `sdd-tasks` pronostica con el diseño elegido. Si pasa del presupuesto, `auto-chain` parte por el eje natural: B1 = punto 2 (y la extracción del hook, si se elige) y B2 = punto 3. En código de producción solo comparten `lib/store.tsx`, en secciones distintas |
| **Verde vacío en la prueba de «visible después de una transición».** La prueba del detalle simula `useTramita`, así que la fusión real de `lib/store.tsx:411-421` no se ejecuta | Alta si se prueba solo en la página | La garantía se prueba en `lib/store.test.ts`, contra el `transition()` real. Se verifica con un mutante que borra el mapeo en `baseRequest` (convención de test 6 de la skill) |
| **Mocks con `null` en lugar de la clave ausente** darían verde con una forma que el backend no produce | Media | Los fixtures de cable del store se construyen **sin** la clave (`RequestResponse.java:45`). Los de página usan `undefined` en `AcademicRequest` |
| **Regresión del formulario público** al extraer el hook | Media (solo con la A) | Commit propio que no cambia comportamiento, y suite pública sin modificar sus aserciones, incluidos carga, error, reintento e identidad (`page.test.tsx:194-258`) |
| **Punto ciego de la guarda de frontera**: el hook en `lib/` no se escanea | Baja-media (solo con la A) | El hook MUST NOT importar el store ni `AppShell`. El design fija cómo se vigila |
| **La spec US1 describe un camino que la pantalla no ejecuta**, y ese camino envía campos de más (issue #10) | Media | El delta ata las cláusulas de `program` al `createRequest` del store y no afirma que ese camino cumpla el allowlist |
| **Desvío del test 4 del issue y del SC-006 del backend** | Media | El cuerpo de la PR-B lo declara y remite al issue #52 |
| **El texto de P1 se lee raro en un trámite cerrado** («Para reenviar…» cuando ya no hay nada que reenviar) | Baja-media | Decisión por defecto abierta a veto (Preguntas abiertas §2) |
| **El catálogo es provisional**: la Coordinación no lo confirmó por escrito | Baja | Las pruebas usan una lista mockeada, y ningún código de producción fija nombres de programa una vez borrado `PROGRAMS` |
| **Anonimización**: `openspec/` es público | Baja | Los datos de estudiante siguen siendo sintéticos. Los nombres de programa son oferta académica pública, no datos personales |

## Rollback Plan

- **PR-0 (bundle de OpenSpec).** Solo agrega archivos bajo
  `openspec/changes/catalogo-programas-y-anexo/`, y revertirlo los retira.
- **PR-B (o B1 y B2, si `sdd-tasks` la parte).** Un `git revert` quita el aviso y restaura
  `PROGRAMS`, con «Psicología», que el backend rechaza con 400, y con la preselección silenciosa de
  `PROGRAMS[0]`. El backend sigue enviando `annexRequirement`, y el cliente lo ignora porque el campo
  es aditivo (FR-013, `Tramita/.../spec.md:84`). Con la opción A de §4, la reversión también
  devuelve el efecto a la página pública, con el mismo comportamiento. B1 y B2 son independientes en
  producción, así que cada una se revierte por separado; con `stacked-to-main`, en orden inverso.
- **Spec viva.** Solo cambia al archivar. Si una reversión llega después del archivo, también se
  revierte el commit de archivo para que la spec y el código coincidan.
- **Backend.** Ningún PR de este cambio lo toca.

## Dependencies

- La feature 009 del backend en su `main` (`d8e031d`, según el orquestador). No hace falta ningún
  cambio de backend.
- #75 y #76 mergeadas en `main` (`ae4ee11`): aportan `listPublicPrograms()` (`lib/api.ts:243`).
- Los issues #10, #50 y #52 siguen abiertos y no bloquean. Su estado no se volvió a consultar en
  esta fase, que no tiene `gh`.
- La pregunta §4 la resuelve `sdd-design` antes de `sdd-tasks`, porque cambia el pronóstico de
  líneas.

## Preguntas abiertas

Ninguna bloquea las fases de spec y design.

**§1 P2, por defecto y abierta a veto del responsable.** El formulario interno registra sin
programa si el catálogo no carga. Alternativa: bloquear el registro hasta que cargue. Eso respeta el
espíritu de fallo cerrado del público, pero hace que la bitácora dependa de un catálogo para
registrar un campo que el contrato declara opcional.

**§2 Decisiones por defecto nuevas, abiertas a veto.**

- **(a) «Reintentar» también en el formulario interno.** Es coherente con #76. Recargar la página
  pierde lo diligenciado, porque el estado vive en memoria (`app/requests/new/page.tsx:55-67`). Con
  la opción A de §4 viene incluido en el hook; con la B, son unas 5 líneas más y una prueba.
- **(b) El aviso de anexo se muestra siempre que llega el campo, también en estados finales.**
  Respeta FR-009 («en cualquier estado») y no necesita una rama por estado. Tiene una tensión: el
  texto de P1 empieza con «Para reenviar a la facultad», que en un trámite cerrado no aplica. Hay dos
  alternativas: ocultar el aviso cuando `currentState.isFinal` es verdadero, que es un dato del
  contrato y cuesta una rama y una prueba, o usar un texto neutro para todos los estados, que
  cambiaría la redacción aprobada en P1.
- **(c) Etiqueta de la opción vacía: «Sin programa».**

**§3 Hook compartido o efecto repetido.** Es una pregunta técnica, no de producto. La decide
`sdd-design` con el análisis de §4. La recomendación es la A.

## Entrega

La estrategia es `auto-chain`, con cadena `stacked-to-main`. El presupuesto de revisión es de 400
líneas de autoría (adiciones más eliminaciones). Las ramas salen de `main`.

| PR | Contenido | Tamaño | Vínculo con #74 |
|---|---|---|---|
| PR-0 | Bundle de OpenSpec: addendum de la exploración, `proposal`, delta de spec, `design`, `tasks` | Solo documentación | «Relacionado: #74» |
| PR-B | Código de los puntos 2 y 3 con sus pruebas | Estimación (tabla siguiente) | `Closes #74` |
| Archivo | Fusión del delta en la spec viva | Solo documentación | — |

**Pronóstico de la PR-B.** Es una **estimación**, no una medición: sale de leer cada archivo afectado.

| Archivo | Opción B (repetir) | Opción A (hook) |
|---|---|---|
| `lib/ui-constants.ts` | 8 | 8 |
| `lib/types.ts` | 8-10 | 8-10 |
| `lib/store.tsx` | 6-8 | 6-8 |
| `app/requests/new/page.tsx` | 55-70 | 30-40 |
| `app/requests/[id]/page.tsx` | 15-20 | 15-20 |
| `lib/use-program-catalog.ts` | — | 35-45 |
| `app/solicitud/creditos-adicionales/page.tsx` | — | 30-35 |
| `app/requests/new/page.test.tsx` | 70-90 | 70-90 |
| `lib/store.test.ts` (omisión, mapeo, `transition()`) | 70-90 | 70-90 |
| `app/requests/[id]/page.test.tsx` | 40-60 | 40-60 |
| `lib/use-program-catalog.test.ts` (si el design la pide) | — | 60-90 |
| **Total** | **~270-360** | **~310-410 sin prueba propia del hook; ~370-500 con ella** |

- **Calibración.** La slice equivalente del canal público (VAL-2: selector, efecto y pruebas) midió
  365 líneas (`odd/tasks/validaciones-basicas-creditos.md:43`).
- **Por qué sube respecto de la mañana.** La estimación de la mañana, 150-220 líneas, suponía unas
  90 líneas de pruebas. No contaba la prueba de `transition()` en el store, que hoy no existe, ni la
  simulación del catálogo en la prueba del formulario interno.
- **Si el pronóstico supera las 400 líneas**, `sdd-tasks` parte la PR-B en B1 (punto 2) y B2
  (punto 3), y `Closes #74` viaja en la última que se mergee.
- **Por qué el bundle va en su propio PR**, como en el cambio anterior: así la historia de git
  muestra que la especificación precedió al código (`CLAUDE.md`, «Proceso»), y no consume
  presupuesto de la PR de código.
- **Después del merge** se verifica el cierre con `gh issue view 74 --json state`, que es la
  convención del repo. El cuerpo de la PR que cierra #74 declara el desvío del test 4 y remite al
  issue #52.

## Success Criteria

**Formulario interno**

- [ ] Arranca con «Sin programa» seleccionado. Las demás opciones son exactamente los nombres del
      mock de `listPublicPrograms`, en el orden recibido.
- [ ] Una búsqueda de `\bPROGRAMS\b` en `app`, `components` y `lib` devuelve 0 coincidencias.
- [ ] Al registrar con «Sin programa», el cuerpo que emite el `createRequest` de `lib/store.tsx` no
      tiene la clave `program` (`'program' in body` es falso). Nunca contiene `""`.
- [ ] Al registrar con un nombre con tilde, el `program` del cuerpo es idéntico (`toBe`) al nombre
      mockeado.
- [ ] Con el catálogo en error, y también con `[]`, un texto explica que la lista no está
      disponible y el registro se completa sin la clave `program` (P2). Si no se veta §2(a),
      «Reintentar» vuelve a pedir el catálogo.

**Anexo en el detalle**

- [ ] `baseRequest` mapea `annexRequirement` cuando llega. Con un objeto de cable construido **sin**
      la clave, el resultado tiene `annexRequirement === undefined`.
- [ ] Si llega `annexRequirement`, el detalle muestra `documentName` y `sourceHint` entre las
      acciones y el bloque del estado actual. Ningún texto afirma que el anexo se adjuntó.
- [ ] Si la clave falta, no aparece ningún aviso ni un contenedor vacío. Se comprueba después de
      que la carga termina.
- [ ] Después de `transition()`, cuya consulta posterior mockeada trae la clave, la solicitud del
      store conserva `annexRequirement`. La prueba se pone en rojo con un mutante que borra el
      mapeo.
- [ ] Un programa heredado fuera del catálogo (por ejemplo «Ing») se muestra tal cual en «Datos del
      estudiante».

**Transversal**

- [ ] TDD estricto (`strict_tdd: true`): en cada tarea se observa el RED antes del cambio de
      producción. Los mutantes de la omisión y de la clave ausente se verifican aplicados.
- [ ] Con la opción A de §4, la suite del formulario público sigue en verde sin modificar sus
      aserciones, y el hook no importa `@/lib/store` ni `AppShell`.
- [ ] `pnpm test` y `pnpm exec tsc --noEmit` en verde, y `pnpm build` en verde.
- [ ] Antes de usar `pnpm lint` como criterio, se vuelve a medir. `config.yaml` registra código 0 el
      2026-09-16, pero `revisar-frontend-next` lo declara roto.
- [ ] Solo hay datos sintéticos de estudiante en pruebas y ejemplos.

## Historial

- **2026-09-26, mañana.** La propuesta cubría dos slices: A, el selector del formulario público, y
  B, el formulario interno y el anexo. Quedó en pausa por el solapamiento con la feature ODD
  `validaciones-basicas-creditos`.
- **2026-09-26, tarde.** La slice A se entregó como #76 (`ae4ee11`) dentro de esa feature. Esta
  versión reescribe la propuesta para la slice B.
