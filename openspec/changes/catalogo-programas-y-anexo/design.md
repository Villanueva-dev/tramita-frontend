# Design: Catálogo de programas en el formulario interno y requisito de anexo en el detalle

> **Qué decide.** El cómo de la slice B del issue #74: los puntos 2 y 3 y sus pruebas del punto 4.
> P1, P2 y T2–T5 están cerrados en `proposal.md` («Decisiones tomadas») y aquí se citan por id. La
> pregunta §4 de la proposal (hook o efecto repetido) se resuelve en la decisión 1. El delta de spec
> ya redactado (`specs/workflow-requests/spec.md`) se cita por línea y este diseño lo cumple.
>
> **Medición.** Lecturas con Read/Grep sobre el worktree `tramita-frontend-worktrees/catalogo-programas-y-anexo`,
> rama `sdd/catalogo-programas-y-anexo`, en `main` = `ae4ee11` (el commit lo midió el orquestador;
> esta fase no tiene shell). Contrato del backend releído en `Tramita/specs/009-program-catalog-annex/`
> y en `GlobalExceptionHandler.java`. Los tamaños por archivo son **estimaciones** hechas leyendo
> cada archivo, no mediciones de un diff.

## Technical Approach

Tres piezas, cada una con una responsabilidad y con el par container/presentational de siempre:

1. **`lib/use-program-catalog.ts`** (nuevo). Es el efecto de carga que #76 dejó dentro de la página
   pública (`app/solicitud/creditos-adicionales/page.tsx:186-213`), movido sin cambios a un hook con
   la misma forma de retorno. Lo consumen la página pública, que falla cerrado como hoy, y el
   formulario interno, que degrada (P2). La política vive en cada pantalla; el hook solo carga.
2. **Formulario interno** (`app/requests/new/page.tsx`). Usa el mismo `Select` de hoy (T2), con
   «Sin programa» primero y seleccionado, los nombres del catálogo en el orden recibido, un texto que
   explica la carga y la no disponibilidad, «Reintentar» con el `Button` del proyecto y
   `program: program || undefined` hacia el store (T3). Se borra `PROGRAMS`.
3. **Detalle** (`app/requests/[id]/page.tsx`). `AnnexRequirement` entra en `lib/types.ts`, se mapea
   en `baseRequest` (T4) y un componente presentacional nuevo,
   `components/annex-requirement-notice.tsx`, se pinta entre la cabecera con las acciones y
   `CurrentStateBlock` (P1), solo cuando llega la clave.

No se agregan dependencias. `lib/api.ts` y `components/do-fr-100/` no cambian. Ninguna rama decide
por un código de estado del motor (regla 1 de `.claude/skills/revisar-frontend-next/SKILL.md`).

## Architecture Decisions

### 1 — La carga del catálogo se extrae a un hook en `lib/`

**Elegido**: la opción A de la proposal §4. `useProgramCatalog()` contiene el efecto de #76 tal cual
(`page.tsx:192-209`): estado inicial `loading`, `listPublicPrograms()`, `ready` con los nombres en el
orden recibido o `error`, y el flag `ignore` en el cleanup (regla 6 de la skill). El reintento es un
contador en estado con un `retry` estable por `useCallback`, el mismo mecanismo que
`lib/use-request-detail.ts:31-34,72` (`reloadToken`). Devuelve un objeto plano
`{ status, programs, retry }`, que es exactamente la prop que `AcademicFields` ya espera
(`components/do-fr-100/sections.tsx:170-176`). Así, la llamada de `page.tsx:378` pasa a
`programCatalog={programCatalog}` y `sections.tsx` no cambia. La unión conserva `programs` en sus
tres variantes, como la de #76 (`page.tsx:85-88`): ajustarla cambiaría el tipo de la prop de
`AcademicFields`, que está dentro de la frontera pública.

**Por qué la simulación de la suite pública sigue interceptando la llamada.** Vitest simula por
módulo. `vi.mock('@/lib/api', …)` (`page.test.tsx:11-15`) y el `import { listPublicPrograms } from './api'`
del hook resuelven al mismo archivo, `lib/api.ts`. El repo ya depende de esa equivalencia:
`app/dashboard/page.integration.test.tsx:25-33` simula `'@/lib/auth-store'`, y el `TramitaProvider`
real lo consume como `'./auth-store'` (`lib/store.tsx:16`). Si la simulación no alcanzara la
importación relativa, esa suite fallaría por falta de `AuthProvider`. Confianza: alta, por el
precedente. En esta fase no se consultó Context7 porque no hay shell. La confirmación definitiva es
la suite pública en verde en el commit de la extracción.

**Guarda de frontera.** La guarda pública solo recorre tres carpetas y afirma una lista exacta
(`page.test.tsx:176-184,314-321`). La proposal exige que la suite pública siga sin cambios en sus
aserciones (Out of Scope, primera fila). Por eso la guarda del hook va en su propio archivo,
`lib/use-program-catalog.test.ts`, con una sola prueba: lee el fuente del hook y afirma que no
coincide con `/app-shell|useTramita|['"](?:@\/lib\/|\.\/)store['"]/i`. Es la expresión pública
(`:324`) más la forma relativa `./store`, que es la natural dentro de `lib/`. No coincide con
`'./auth-store'`.

El comportamiento del hook (carga, error, reintento, `ignore` bajo StrictMode) **no** se vuelve a
probar en ese archivo. La suite pública ya lo cubre (`page.test.tsx:193-271`) y el formulario
interno lo cubre otra vez; una tercera copia sería cobertura sin información nueva. Para demostrar
que la suite pública ejercita el hook, el commit de la extracción verifica dos mutantes aplicados:
quitar `if (!ignore)` pone en rojo `:250`, y quitar el incremento del contador en `retry` pone en
rojo `:233`.

**Alternativas**:

- *Mismo eje, dónde vive el código*: B, repetir el efecto en la página interna. Cuesta unas 25 líneas
  en vez de unas 100 (hook, página pública y guarda). A cambio, deja dos copias de la lógica de
  concurrencia y contradice el precedente de `use-request-detail.ts` y `use-coordination-inbox.ts`.
- *Eje distinto, alcance del estado*: un catálogo compartido, con caché de módulo o con un
  `ProgramCatalogProvider`, pedido una vez por sesión. Descartado. Los dos consumidores nunca
  conviven en pantalla (uno es público y el otro está detrás de `AppShell`), así que compartir no
  ahorra ninguna petición dentro de una vista. Una caché de módulo sobrevive entre pruebas del mismo
  archivo y vuelve global el «Reintentar». Un Provider tendría que envolver la ruta pública y le
  sumaría una dependencia de layout a una frontera sin sesión.
- *Eje distinto, momento de la carga*: pedir el catálogo al enfocar el selector, desde un handler.
  Descartado. El selector mostraría solo «Sin programa» hasta el foco, y el desplegable nativo se
  abriría vacío mientras llega la respuesta.

**Defensa**: elegí el hook frente a repetir el efecto, sabiendo que el costo es unas 70 líneas más en
B1 y tocar por dentro una pantalla recién mergeada. A cambio, `ignore` y el reintento tienen una sola
implementación, con el patrón que el repo ya usa para cargar al montar.

**Pronóstico**: hook, 38-45 líneas; página pública, 35-40 (unas 33 eliminadas y 5 agregadas);
guarda, 15-20. En total, unas 90-105.

### 2 — Formulario interno: «Sin programa», degradación explicada y «Reintentar»

**Elegido**:

- **Estado.** `const [program, setProgram] = useState('')`, donde `''` significa «Sin programa».
  Reemplaza `useState(PROGRAMS[0])` (`app/requests/new/page.tsx:61`).
- **Opciones.** Primero va `<option value="">Sin programa</option>`, sin `disabled`: es una elección
  legítima, no el marcador del público (`sections.tsx:198`). Después vienen los nombres del catálogo
  en el orden recibido, con `value` igual al nombre y sin `trim()` ni `normalize()`. El `<select>`
  nativo conserva el valor byte a byte, como ya lo prueba `page.test.tsx:216-231` con un doble
  espacio.
- **Tres vistas derivadas en el render**, sin guardar estado derivado. Una función pura del módulo,
  `programCatalogAvailability(catalog)`, devuelve `loading`, `available` (`ready` y con al menos un
  nombre) o `unavailable` (`error`, o `ready` con `[]`: en el interno, la lista vacía es un error,
  proposal §1).
- **Selector.** `disabled` cuando la vista no es `available`, y en ese caso
  `aria-describedby="program-catalog-status"`. El botón «Radicar solicitud» nunca depende del
  catálogo (P2).

| Vista | Texto, con id `program-catalog-status` | Control |
|---|---|---|
| `loading` | «Cargando el catálogo de programas.» (la misma cadena del público, `sections.tsx:206`) | — |
| `unavailable` | «El catálogo de programas no está disponible. Puede radicar la solicitud sin programa.» | `Button` con `type="button"`, `variant="outline"` y `size="sm"`: «Reintentar» |
| `available` | — | — |

- **Un solo texto para el error y la lista vacía.** «No pudimos cargar» sería falso ante una lista
  vacía que sí cargó. «No está disponible» es cierto en los dos casos y además dice la consecuencia
  (regla 7). Es texto estático, `text-xs text-muted-foreground`, igual que la ayuda del correo
  (`page.tsx:287`), sin `role="alert"`: no bloquea nada y aparece al montar, así que una alerta
  interrumpiría durante la carga de la pantalla.
- **«Reintentar».** Usa el `Button` del proyecto; el público usa un `<button>` crudo
  (`sections.tsx:211`), seguimiento que #76 declaró. Lleva `type="button"` explícito porque vive
  dentro de `<form onSubmit={handleSubmit}>` (`page.tsx:179`), igual que «Agregar asignatura» (`:453`).
- **Envío.** `handleSubmit` pasa `program: program || undefined` (`:120`), y `NewRequestInput.program`
  pasa a opcional (`lib/store.tsx:37`). La construcción del cuerpo (`lib/store.tsx:373-384`) no
  cambia (T3).
- **Invariante.** El selector solo está habilitado con el catálogo disponible, y en ese estado no se
  ofrece reintento. Por lo tanto, el valor elegido siempre pertenece a la lista mostrada, y no hace
  falta ninguna lógica para limpiar una selección que haya quedado huérfana.
- **400 por un programa que sale del catálogo** entre la carga y el envío: no cambia nada.
  `problemMessage` (`lib/api.ts:163-174`) devuelve `detail` o, si falta, `title`, y la página lo
  muestra en el aviso general (`page.tsx:127,167-177`), sin `aria-invalid` en ningún campo, que es lo
  que pide el delta (`spec.md:163-168`). El backend arma ese `detail` en español y nombra el campo del
  cable: «El cuerpo de la petición tiene campos con un valor inválido. Campos: program»
  (`Tramita/…/GlobalExceptionHandler.java:71-96`). Confianza media en que este 400 pase por ese
  manejador: el título de la sonda del orquestador, «Petición inválida», coincide con `:74`.

**Alternativas**:

- *Eje de política* (el veto abierto de P2): bloquear el registro hasta que cargue, como el público.
  Se descarta por P2.
- *Eje de control*: una casilla «No declarar programa» junto a un selector sin opción vacía. Serían
  dos controles para un dato, con un estado combinado inválido (casilla marcada y programa elegido).
  La opción vacía es la forma nativa y la que pide el delta (`spec.md:136-141`).
- *Eje de interacción*: dejar el selector habilitado, con solo «Sin programa», mientras no hay
  catálogo. Un desplegable de una sola opción parece roto; deshabilitado y con texto dice por qué.
- *Sin «Reintentar»*, recargando la página: se pierde todo lo diligenciado, porque el estado vive en
  memoria (`page.tsx:55-67`). Con el hook, el reintento no cuesta nada.

**Defensa**: elegí degradar con explicación y reintento frente a bloquear, sabiendo que el costo es
que una solicitud registrada durante una caída del catálogo queda sin programa, y por lo tanto sin
requisito de anexo, aunque el estudiante lo haya declarado en el papel.

**Pronóstico**: página, 45-55 líneas; `lib/ui-constants.ts`, 8 eliminadas; `lib/store.tsx`, 2.

### 3 — Aviso de anexo: un componente presentacional

**Elegido**: `components/annex-requirement-notice.tsx`, con
`AnnexRequirementNotice({ documentName, sourceHint }: AnnexRequirement)`, en kebab-case como
`current-state-block.tsx`. No lleva `'use client'` porque no tiene hooks, igual que
`CurrentStateBlock`. Repite la estructura de ese bloque (`current-state-block.tsx:46-52`):

- un `<section aria-labelledby="annex-requirement-heading">`;
- un `h3` «Anexo requerido»;
- un párrafo `Para reenviar a la facultad, adjunte: {documentName}. {sourceHint}.`, la redacción de P1.

La base visual es la misma (`rounded-xl border p-5 shadow-sm`), con el tono
`border-primary/30 bg-primary/5` para que se lea como un recordatorio distinto del bloque de estado.
El repo ya usa el color del tema con modificador de opacidad (`bg-primary/5` y
`hover:border-primary/40` en `app/requests/new/page.tsx:200-201`); `/30` es el mismo mecanismo de
Tailwind con otro valor.

El aviso no lleva `role` ni `aria-live`. Es un hecho permanente de la solicitud, no un evento: una
región viva lo anunciaría en cada carga y después de cada transición. El `section` con nombre
expone el rol `region`, y eso permite que las pruebas lo encuentren y demuestren su ausencia igual
que `current-state-block.test.tsx:35-36`.

**Contenedor.** La página lo pinta entre el cierre de la cabecera (`app/requests/[id]/page.tsx:294`)
y `CurrentStateBlock` (`:296`):

```tsx
{req.annexRequirement ? (
  <AnnexRequirementNotice
    documentName={req.annexRequirement.documentName}
    sourceHint={req.annexRequirement.sourceHint}
  />
) : null}
```

La ausencia la decide el contenedor, así que sin la clave no se renderiza nada: ni aviso ni
contenedor vacío (`spec.md:194-196`). La fila «Programa» (`:319`) no cambia, y un programa heredado
se sigue mostrando tal cual.

**Estados finales.** El aviso se muestra siempre que llega la clave, también cuando
`currentState.isFinal` es verdadero (FR-009). El delta ya lo dice («incluido un estado final»,
`spec.md:188`). Es una decisión por defecto abierta a veto (Preguntas abiertas). Si se veta, la única
variante admisible es `!req.currentState.isFinal &&` en el contenedor, nunca un código de estado, y
cuesta una rama, invertir una prueba y cambiar el delta.

**Datos.** El `sourceHint` sembrado, «La descarga el estudiante desde CLASS», no termina en punto
(`Tramita/specs/009-program-catalog-annex/data-model.md:251`), así que la plantilla de P1 produce un
solo punto final. Si un texto configurado terminara en punto, se vería «..» (ver Riesgos).

**Alternativas**:

- *Eje de ubicación en el código*: JSX en línea dentro de la página. Son unas 12 líneas frente a unas
  28 y un archivo. Pero la página ya tiene unas 600 líneas y mezcla aviso de creación, acciones y
  firmas; el componente deja en un solo lugar la redacción que FR-012 restringe (el texto nunca afirma
  que el anexo se adjuntó).
- *Eje de composición*: sumar una prop opcional `annexRequirement` a `CurrentStateBlock`. Descartado:
  acoplaría el anexo al estado, que FR-010 separa (`Tramita/…/spec.md:81`), y el bloque existe para
  responder «de quién depende ahora».
- *Eje de semántica*: `role="status"` o `role="alert"`. Descartado por lo dicho arriba.

**Defensa**: elegí un componente presentacional frente al JSX en línea, sabiendo que el costo es un
archivo más de unas 28 líneas. A cambio, la página no crece y la redacción restringida por FR-012
vive en un solo lugar.

### 4 — Tipos y mapeo de `annexRequirement`

- **`lib/types.ts`.** `AnnexRequirement { documentName: string; sourceHint: string }`, antes de
  `AcademicRequest`; los dos campos son `required` en el contrato (`openapi.yaml:255-273`, `:262`).
  `AcademicRequest.annexRequirement?: AnnexRequirement` va justo después de `program` (`:170`).
- **`lib/store.tsx`.** `ApiRequest.annexRequirement?: AnnexRequirement | null`, tolerante en el cable
  como sus vecinos (`:59-64`), y reutilizando el tipo del dominio porque la forma es idéntica.
  `baseRequest` suma `annexRequirement: apiRequest.annexRequirement ?? undefined` junto a `program`
  (`:203`). El dominio nunca lleva `null`.
- **`transition()` no cambia.** `...updated` se aplica primero (`:412`), los overrides (`:414-420`)
  no nombran el campo, y `updated` sale de `loadRequest`, que ya pasa por `baseRequest` (`:410,261`).
  Está confirmado por lectura y lo garantiza la prueba S5 del store (decisión 5).
- **Mapeo gratuito en otros caminos.** La respuesta del `POST` de `createRequest` pasa por
  `baseRequest` (`:390`), y también `refreshRequest` (`:344-353`), así que los dos traen el campo sin
  código nuevo. La búsqueda (`:300`) recibe resúmenes sin la clave (`openapi.yaml:283-286`), que
  quedan en `undefined`.

**Alternativas**:

- *Eje de representación*: `annexRequirement: AnnexRequirement | null` obligatorio en el dominio.
  Cada consumidor tendría dos valores de «no aplica» que comprobar, y la convención del dominio para
  hechos opcionales del backend es `?:` (`availableTransitions?`, `lib/types.ts:177`).
- *Un tipo de cable propio*, `ApiAnnexRequirement`: la forma es idéntica (dos cadenas obligatorias) y
  una interfaz sin diferencias es ruido. Si algún día divergen, se separa entonces.
- *Eje de ubicación del mapeo*: mapear solo en `loadRequest`, el camino del detalle. Dejaría sin el
  campo la respuesta de `createRequest`, aunque el backend ya lo envía al registrar (FR-009,
  «registrarla»), y T4 ya fijó `baseRequest`.

**Defensa**: elegí `?:` en el dominio y `| null` tolerante en el cable, sabiendo que el costo es un
`?? undefined` que hoy nunca actúa, porque el backend no envía `null` (`RequestResponse.java:45`). A
cambio, el modelo tiene una sola forma de decir «no aplica».

### 5 — Pruebas: cada garantía en la capa que puede observarla

**Elegido**: pruebas por capa, según la proposal §3. El store prueba lo que solo se ve en el cable: la
omisión de la clave, la clave ausente y la fusión de `transition()`. Las páginas, con el store
simulado, prueban lo que solo se ve en la UI. Las dos capas se encuentran en contratos tipados
(`NewRequestInput.program` y `AcademicRequest.annexRequirement`). El detalle está en *Testing
Strategy*.

**Alternativa**, en el eje de dónde se observa la garantía: una prueba de integración de
`/requests/new` con el `TramitaProvider` real y `fetch` simulado, como
`app/dashboard/page.integration.test.tsx`. Una sola prueba vería del selector al cuerpo. Se descarta:
necesitaría simular la autenticación, el router y `AppShell`, y llenar todo el formulario. Además,
las dos capas ya se componen por los tipos: una página que envíe `program` crudo cae en N2, y un
store que convierta `undefined` en `''` cae en S1.

**Defensa**: elegí dos capas frente a una prueba de integración, sabiendo que el costo es que ninguna
prueba recorre sola el camino del selector al cuerpo. A cambio, cada prueba es corta y tiene un
mutante que la pone en rojo.

### 6 — Entrega en dos PR: B1 (punto 2 y hook) y B2 (punto 3)

El pronóstico total es de unas 415-500 líneas (*Entrega*), por encima de las 400. El corte va por
punto del issue:

- **B1 va primero.** Quita la preselección silenciosa antes de que el detalle muestre el anexo. Si B2
  entrara antes, una solicitud registrada en el intervalo con la preselección accidental de
  «Ingeniería de Sistemas», que es la única regla de la base de desarrollo, mostraría un anexo que
  nadie declaró (proposal, Intent).
- **B2 va después** y lleva `Closes #74`.

B1 y B2 solo comparten `lib/store.tsx` y `lib/store.test.ts`, en secciones distintas.

**Alternativas**:

- *Eje de corte por capa*: B1 con tipos y store, y B2 con la UI de las dos pantallas. Cada PR
  mezclaría dos features, y B1 entregaría tipos sin consumidores.
- *Una sola PR con `size:exception`*: la estrategia es `auto-chain` y el corte natural existe.

**Defensa**: elegí cortar por punto del issue frente a cortar por capa, sabiendo que `lib/store.tsx`
se toca en las dos PR. A cambio, cada PR entrega un comportamiento completo que se revisa y se revierte
por separado.

## Data Flow

### Envío del formulario interno

```
Coordinación        NewRequestPage             useProgramCatalog       lib/api              backend
    │ abre /requests/new │                            │                    │                    │
    │───────────────────▶│ monta ────────────────────▶│ efecto: loading    │                    │
    │                    │                            │─listPublicPrograms▶│─GET /public/progr.▶│
    │                    │◀─ { status, programs, retry }: ready | error ───│◀───────────────────│
    │ elige un programa o deja «Sin programa», completa y pulsa «Radicar solicitud»             │
    │───────────────────▶│ validate() sin errores                          │                    │
    │                    │─ useTramita().createRequest({ …, program: program || undefined })     │
    │                    │    lib/store.tsx:373-384: JSON.stringify omite la clave si es undefined
    │                    │                            apiFetch POST /requests ────────────────▶│
    │                    │◀─ AcademicRequest (baseRequest) │ Error(detail ?? title) ◀─────────────│
    │◀─ router.push(/requests/{id}?created=1) │ aviso general (errors.form), sin marcar campos   │
```

### Detalle con anexo, al cargar y después de una transición

```
RequestDetailPage monta ─▶ refreshRequest(id) ─▶ loadRequest: GET /requests/{id}, /timeline, /documents
  ─▶ baseRequest: annexRequirement = api.annexRequirement ?? undefined ─▶ setRequests ─▶ getRequest(id)
  ─▶ render: cabecera y acciones ─▶ { annexRequirement ? <AnnexRequirementNotice/> : nada }
  ─▶ CurrentStateBlock

ActionDialog confirma ─▶ transition(id, code)
  ─▶ GET /requests/{id} (comprueba que la transición sigue disponible) ─▶ POST .../transitions
  ─▶ loadRequest: GET otra vez; baseRequest mapea el valor vigente
  ─▶ { ...updated, overrides que no nombran annexRequirement }
  ─▶ re-render: el aviso sigue, con el valor de la última consulta
```

La segunda consulta es el desvío declarado respecto del test 4 del issue y del SC-006 del backend
(proposal §2, issue #52).

## Interfaces / Contracts

```ts
// lib/use-program-catalog.ts — 'use client'; solo importa React y './api'
type ProgramCatalogState =
  | { status: 'loading'; programs: string[] }
  | { status: 'ready'; programs: string[] }
  | { status: 'error'; programs: string[] }
/** La forma que ya espera AcademicFields (components/do-fr-100/sections.tsx:170-176). */
export type ProgramCatalog = ProgramCatalogState & { retry: () => void }
export function useProgramCatalog(): ProgramCatalog
//  - estado inicial { status: 'loading', programs: [] }
//  - efecto con dependencias [request]: setState(loading) → listPublicPrograms()
//    → ready (nombres, mismo orden) | error; `let ignore = false` y cleanup `ignore = true`,
//    copiados de app/solicitud/creditos-adicionales/page.tsx:192-209
//  - retry = useCallback(() => setRequest((n) => n + 1), []), como use-request-detail.ts:31-34

// app/requests/new/page.tsx — función pura del módulo; no se guarda estado derivado
function programCatalogAvailability(catalog: ProgramCatalog): 'loading' | 'available' | 'unavailable'

// lib/types.ts
/** Hecho derivado de la configuración del trámite (009); no afirma que el anexo se adjuntó (FR-012). */
export interface AnnexRequirement {
  documentName: string
  sourceHint: string
}
// en AcademicRequest, junto a `program`:
//   annexRequirement?: AnnexRequirement   // ausente cuando no aplica: la clave no viaja (NON_NULL)

// lib/store.tsx
// NewRequestInput.program?: string                     (hoy `program: string`, :37)
// ApiRequest.annexRequirement?: AnnexRequirement | null
// baseRequest:  annexRequirement: apiRequest.annexRequirement ?? undefined,

// components/annex-requirement-notice.tsx — sin 'use client', como current-state-block.tsx
// Sin anotación de retorno, como CurrentStateBlock.
export function AnnexRequirementNotice({ documentName, sourceHint }: AnnexRequirement)
```

El cuerpo de `POST /requests` no cambia de construcción. La única diferencia observable es que, sin
programa, la clave `program` no aparece.

## File Changes

| Archivo | Acción | PR | Detalle |
|---|---|---|---|
| `lib/use-program-catalog.ts` | Create | B1 | Hook de la decisión 1 |
| `lib/use-program-catalog.test.ts` | Create | B1 | Solo la guarda de frontera del hook (H1) |
| `app/solicitud/creditos-adicionales/page.tsx` | Modify | B1 | Quita la unión `ProgramCatalog` (`:85-88`), los dos estados (`:186-187`), el efecto y `retryProgramCatalog` (`:192-213`) y los imports `useEffect` y `listPublicPrograms` (`:3,31`); suma el hook; `:378` pasa a `programCatalog={programCatalog}`. Sin cambio de comportamiento |
| `app/solicitud/creditos-adicionales/page.test.tsx` | Sin tocar | — | Es la red de la extracción |
| `app/requests/new/page.tsx` | Modify | B1 | Decisión 2 |
| `app/requests/new/page.test.tsx` | Modify | B1 | Simulación de `@/lib/api` y pruebas N1–N6 |
| `lib/ui-constants.ts` | Modify | B1 | Se borra `PROGRAMS` (`:33-39`) |
| `lib/store.tsx` | Modify | B1, B2 | B1: `NewRequestInput.program?`. B2: `ApiRequest.annexRequirement?` y el mapeo en `baseRequest` |
| `lib/store.test.ts` | Modify | B1, B2 | B1: S1 y S2. B2: S3, S4 y S5 |
| `lib/types.ts` | Modify | B2 | `AnnexRequirement` y `AcademicRequest.annexRequirement?` |
| `components/annex-requirement-notice.tsx` | Create | B2 | Decisión 3 |
| `app/requests/[id]/page.tsx` | Modify | B2 | Import y render condicional entre `:294` y `:296` |
| `app/requests/[id]/page.test.tsx` | Modify | B2 | Pruebas D1–D4 |
| `lib/api.ts`, `components/do-fr-100/*` | Sin tocar | — | `listPublicPrograms` (`:243-247`) y `program?: string` (`:288`) ya sirven |

## Testing Strategy

TDD estricto (`openspec/config.yaml:17`) con `pnpm test`. Cada prueba tiene su fuente de RED y un
mutante verificado **aplicado** (convención 6 de la skill). Cuando no hay RED posible porque la
conducta ya existe, se declara como prueba de caracterización y el mutante hace de verificación.

| # | Archivo | Prueba (el nombre es la afirmación) | RED | Mutante que la pone en rojo |
|---|---|---|---|---|
| H1 | `lib/use-program-catalog.test.ts` | El hook no importa `AppShell` ni el store de solicitudes | El archivo no existe (ENOENT) | `import { useTramita } from './store'` en el hook |
| H2 | `app/solicitud/creditos-adicionales/page.test.tsx`, sin cambios | La suite completa sigue en verde antes y después de la extracción | Ninguno: es un refactor y la suite es la red | Quitar `if (!ignore)` pone en rojo `:250`; no incrementar en `retry` pone en rojo `:233` |
| S1 | `lib/store.test.ts`, `createRequest` | Sin programa, el cuerpo no tiene la clave `program` (`'program' in body` es falso) | `pnpm exec tsc --noEmit` (asignar `undefined` a `string`). Vitest no comprueba tipos y la prueba pasaría: `JSON.stringify` ya omite `undefined` | `program: input.program ?? ''` en `:379` |
| S2 | ídem | Con programa, el cuerpo lo lleva idéntico (`toBe`, con el nombre con tilde de `:212`) | Caracterización | `input.program?.normalize('NFD')` |
| S3 | `lib/store.test.ts`, `baseRequest` | Mapea `annexRequirement` cuando llega | Hoy se descarta | Borrar la línea del mapeo |
| S4 | ídem | Con la clave **ausente** del objeto de cable (el `summary` de `:36-43`, no `null`), el resultado tiene `annexRequirement` `undefined` | Caracterización | `?? { documentName: '', sourceHint: '' }` |
| S5 | `lib/store.test.ts`, `describe` nuevo de `transition` | Después de una transición, la solicitud conserva el `annexRequirement` de la consulta posterior | En rojo junto con S3 | (a) borrar el mapeo; (b) sumar `annexRequirement: item.annexRequirement` a los overrides de `:414-420` |
| N1 | `app/requests/new/page.test.tsx` | Arranca con «Sin programa» seleccionado y los nombres del catálogo en el orden recibido | Hoy preselecciona `PROGRAMS[0]` | Ordenar la lista; preseleccionar el primero |
| N2 | ídem | Sin elegir programa, pasa `program` `undefined` al store, nunca `''` | Hoy pasa un nombre | Quitar `\|\| undefined` |
| N3 | ídem | Un nombre con tilde descompuesta (NFD) y doble espacio llega idéntico al store | La opción hoy no existe | `.normalize()` o colapsar espacios en `onChange` |
| N4 | ídem, `it.each`: cargando, en error, lista vacía | Explica el estado y registra sin `program` | Hoy no hay texto | Tratar `[]` como disponible; bloquear el envío |
| N5 | ídem | «Reintentar» vuelve a pedir el catálogo y muestra sus opciones | Hoy no existe | `onClick` sin `retry` |
| N6 | ídem | Un rechazo del registro se muestra en el aviso general y no marca ningún campo | Caracterización | Marcar `aria-invalid` en `program` ante el error |
| D1 | `app/requests/[id]/page.test.tsx` | Con `annexRequirement`, muestra el aviso con los dos textos entre las acciones y «Estado actual», sin región viva y sin afirmar que se adjuntó | Hoy no hay aviso | Quitarlo; moverlo debajo de `CurrentStateBlock`; `role="status"` |
| D2 | ídem | Sin la clave, al terminar la carga no hay región «Anexo requerido» ni texto del aviso | Caracterización | Renderizar el componente siempre, con cadenas vacías |
| D3 | ídem | El aviso se muestra también en un estado final (FR-009) | Hoy no hay aviso | `!req.currentState.isFinal &&` en el contenedor |
| D4 | ídem | Un programa heredado fuera del catálogo («Ing») se muestra tal cual en «Datos del estudiante» | Caracterización | Ocultar el programa si no está en una lista |

**Detalle de las pruebas que no son evidentes**:

- **S5.** Usa simulaciones de `apiFetch` por ruta, que es el patrón de `lib/store.test.ts:20-25`.
  Una función `detailRoutes(detail)` responde:
  - `GET /requests/{id}` con `detail`, que trae `availableTransitions` hacia `EN_FACULTAD`;
  - `/timeline` y `/documents` con `[]`;
  - `POST /requests/{id}/transitions` con 200;
  - cualquier otra ruta con 500.

  La prueba tiene dos fases. Primero siembra el store con `refreshRequest(id)` sobre un detalle
  **sin** la clave. Después cambia la implementación a un detalle **con** la clave y ejecuta
  `transition(id, 'EN_FACULTAD')`, las dos dentro de `act`. El cambio entre fases es realista, porque
  el requisito se deriva de la configuración vigente y no se almacena (`openapi.yaml:259-260`). Además,
  vuelve observable el mutante (b), que con la misma clave en las dos fases sobreviviría.
- **Formulario interno.** Se agrega la misma simulación parcial de la suite pública,
  `vi.mock('@/lib/api', async (importOriginal) => ({ ...(await importOriginal<typeof import('@/lib/api')>()), listPublicPrograms: vi.fn() }))`,
  con un valor por omisión en `beforeEach` y `mockReset()` de ese espía en el `afterEach`, como hace la
  suite pública (`page.test.tsx:17-30`). `mockReset` descarta las respuestas `Once` que no se
  consumieron (convención 2). `createRequest` se simula en `useTramita` (`page.test.tsx:5-10`).
  - Un helper `fillRequiredFields()` completa código, cédula, nombre, correo, semestre, la primera
    asignatura, la justificación (15 o más caracteres) y la casilla de firma, con datos sintéticos.
  - El envío se hace con clic en «Radicar solicitud», como la suite pública (`:143`).
  - Las tres pruebas actuales no cambian.
  - Antes de afirmar sobre las opciones, las pruebas esperan a que termine la carga (convención 4).
  - N3 usa `'Ingeniería  de Sistemas'.normalize('NFD')`: la tilde descompuesta mata un `.normalize()`
    y el doble espacio mata un colapso de espacios.
- **Detalle.** Se usa el fixture `request` y `mockTramita` (`page.test.tsx:23-74`).
  - Toda aserción de ausencia va después de `waitFor(() => getByText('Ana Pérez'))`, cuando «Cargando
    solicitud...» ya se fue (convención 4).
  - El aviso se busca con `getByRole('region', { name: 'Anexo requerido' })`, y su posición se
    comprueba con `compareDocumentPosition` frente al enlace «Ver documento PDF» y frente a la región
    «Estado actual».
  - La prueba de «no afirma» usa `/adjuntad[oa]|se adjuntó|recibid[oa]/i`, que no coincide con el
    imperativo «adjunte».
- **Datos.** Los estudiantes son sintéticos. Los nombres de programa son oferta académica pública o
  ficticios (`'Zoología'` para el orden, como `page.test.tsx:203`).

**Verificación por PR**: `pnpm test`, `pnpm exec tsc --noEmit` (después de `rm -rf .next`, por los
TS2307 falsos, `openspec/config.yaml:60`) y `pnpm build`. `pnpm lint` se vuelve a medir antes de
usarlo como criterio (proposal, Success Criteria). En zsh, las rutas con corchetes van entre
comillas: `pnpm test -- 'app/requests/[id]/page.test.tsx'`.

## Entrega

Estrategia `auto-chain`, cadena `stacked-to-main`, presupuesto de 400 líneas de autoría (adiciones
más eliminaciones). Es una **estimación**, no una medición.

| Archivo | B1 | B2 |
|---|---|---|
| `lib/use-program-catalog.ts` | 38-45 | — |
| `lib/use-program-catalog.test.ts` | 15-20 | — |
| `app/solicitud/creditos-adicionales/page.tsx` | 35-40 | — |
| `app/requests/new/page.tsx` | 45-55 | — |
| `lib/ui-constants.ts` | 8 | — |
| `lib/store.tsx` | 2 | 5-7 |
| `lib/types.ts` | — | 10-14 |
| `components/annex-requirement-notice.tsx` | — | 25-30 |
| `app/requests/[id]/page.tsx` | — | 8-10 |
| `lib/store.test.ts` | 20-28 (S1, S2) | 55-65 (S3–S5) |
| `app/requests/new/page.test.tsx` | 100-125 | — |
| `app/requests/[id]/page.test.tsx` | — | 45-55 |
| **Total** | **~265-320** | **~150-180** |

- **Juntas suman ~415-500.** Incluso el extremo bajo supera el presupuesto, así que el corte no es
  marginal. Con la opción B de §4 (repetir el efecto), B1 bajaría unas 70 líneas y la PR única
  seguiría rozando las 400.
- **Commits sugeridos para `sdd-tasks`.**
  - B1: (1) extracción del hook con su guarda, suite pública intacta; (2) formulario interno, borrado
    de `PROGRAMS` y S1–S2.
  - B2: (3) tipos, mapeo y S3–S5; (4) componente, contenedor y D1–D4.
- **Si el pronóstico fino de B1 supera 400**, el commit (1) puede ir solo como B1a.
- **Vínculo con #74.** B1 lleva «Relacionado: #74». B2 lleva `Closes #74` y declara el desvío del
  test 4 con referencia al issue #52. B2 se abre después de que B1 se mergee.

## Threat Matrix

N/A: no hay enrutamiento, shell, subprocesos, automatización de VCS o PR, clasificación de
ejecutables ni integración de procesos.

## Migration / Rollout

No requiere migración. La reversión es por PR, según la proposal (Rollback Plan):

- Revertir B2 quita el aviso; el backend sigue enviando un campo aditivo que el cliente ignora.
- Revertir B1 restaura `PROGRAMS`, la preselección y el efecto en línea de la página pública, con el
  mismo comportamiento.
- Con `stacked-to-main`, se revierte en orden inverso.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| La simulación de `@/lib/api` deja de alcanzar la importación relativa del hook | Hay precedente en el repo (decisión 1). El commit (1) no se da por bueno hasta ver la suite pública en verde |
| El nombre de la guarda pública («the complete public-request boundary») deja de ser exacto: el hook vive fuera de sus carpetas | H1 cubre el hook. Renombrar o ampliar la guarda pública modificaría esa suite, fuera de alcance: queda como seguimiento junto a los de #76 |
| S1 no puede ponerse en rojo en Vitest | Su RED es `tsc`. `sdd-tasks` debe pedir `pnpm exec tsc --noEmit` como observación del RED, además del mutante |
| Un `sourceHint` o un `documentName` configurado con punto final produce «..» | El dato sembrado no lo tiene (`data-model.md:251`). Si aparece, la corrección es de datos, no de código |
| El escenario del delta «el detalle se actualiza con la respuesta» (`spec.md:263-267`) se puede leer como la respuesta del `POST` | Es el desvío declarado (proposal §2, issue #52). La implementación y la verificación lo leen como «tras la actualización del detalle» |

## Preguntas abiertas

Solo lo que queda abierto a veto del responsable. Ninguna bloquea `sdd-tasks`.

1. **P2** (proposal, Preguntas abiertas §1): el interno registra sin programa si el catálogo no está
   disponible. Si se veta, el selector y el envío se bloquean hasta cargar, y cambian N4 y el delta.
2. **«Reintentar» en el interno** (§2(a)): incluido por defecto.
3. **El aviso de anexo en estados finales** (§2(b)): se muestra por defecto, como ya fija el delta
   (`spec.md:188`). Si se veta, se usa `!req.currentState.isFinal` en el contenedor, D3 se invierte y
   el delta cambia.
4. **Textos nuevos de este diseño**: el encabezado «Anexo requerido»; «El catálogo de programas no
   está disponible. Puede radicar la solicitud sin programa.»; y «Sin programa» (§2(c)).
