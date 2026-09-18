# Design: Formulario público del DO-FR-100 — matrícula de créditos adicionales

> **Reorientado el 2026-09-16.** El design anterior diseñaba una pantalla interna montada sobre
> `AppShell`. Sus cuatro decisiones se reevaluaron una por una: **la 1 se cae, la 2 se repliega,
> la 3 sobrevive con otro código de error, la 4 se endurece**. Se agregan tres decisiones nuevas
> que el canal público obliga a tomar: la firma, el acuse y la salida ante el riesgo biométrico.

## Technical Approach

Una ruta pública que no monta el shell de la aplicación, con un container que orquesta estado,
validación de UX y envío, y componentes presentacionales sin estado propio para cada bloque del
formato. El transporte existente se reusa tal cual; se agrega una función de dominio con su
propio allowlist.

El criterio de desempate ante dudas de presentación es el que fija la proposal: **conservar la
fidelidad donde el estudiante la necesita, replegar lo que existía solo para que la Coordinación
reconociera el papel.**

## Architecture Decisions

### Decisión 1 — Ruta pública `app/solicitud/creditos-adicionales/page.tsx`, sin `AppShell`

| | |
|---|---|
| **Elegido** | `app/solicitud/creditos-adicionales/page.tsx`, sin montar `<AppShell>`. `app-shell.tsx` no se toca. |
| **Alternativa de eje distinto** | `app/solicitud/[definitionCode]/page.tsx`: espejar la ruta del API y servir a cualquier trámite que se habilite como público. |

**Por qué no montar el shell.** Medido el 2026-09-16: `components/app-shell.tsx:46-47` ejecuta
`router.replace('/')` dentro de un `useEffect` cuando no hay sesión, y `:142` devuelve `null`.
Una pantalla pública montada sobre él **sería redirigida al login**. El design anterior rechazó
esta misma opción «porque pierde el gate de sesión»; en el canal público el gate es exactamente
lo que sobra, así que la opción que se descartó es ahora la correcta, por la razón inversa.

> ⚠️ El design anterior citaba `app-shell.tsx:130-132` y `:150` para ese gate. **Esas líneas ya
> no corresponden**: el archivo cambió y hoy son `:46-47` y `:142`. Citar `archivo:línea` desde
> un documento de diseño no es evidencia; hay que volver a medir.

**Por qué esta ruta y no la anterior.** `app/formatos/do-fr-100/` se eligió porque era inmune al
cálculo de resaltado del nav (`app-shell.tsx:38-40`). Sin `AppShell` no hay nav en esta pantalla:
**ese criterio dejó de discriminar** y ninguna ruta lo enciende. El criterio vigente es otro —
esta URL la recibe un estudiante por correo—, y `/solicitud/creditos-adicionales` se lee sin
conocer el sistema, mientras que `DO-FR-100` es un código interno que él no maneja.

> Nota de medición: `BRIEF.md` afirma que el array `NAV` «sigue teniendo sus dos ítems».
> **Hoy tiene cuatro** (`app-shell.tsx:23-28`: dashboard, requests/new, settings, assistant).
> La conclusión no cambia, pero la premisa estaba vencida.

**Por qué se rechaza la alternativa.** `[definitionCode]` es YAGNI: hoy existe **un** trámite
público, el backend ya decide cuáles lo son por configuración (`PUBLIC_CAPTURE_ENABLED`), y este
formulario reproduce **un** formato en papel — no es un formulario genérico y no podría serlo sin
volverse data-driven, que es otro proyecto. Además expondría el código interno en una URL que lee
un estudiante. **Disparo para reconsiderar**: cuando exista un segundo trámite con captura
pública habilitada.

**Providers**: no hace falta refactor. `app/layout.tsx:42-44` envuelve todo el árbol en
`AuthProvider` + `TramitaProvider`, pero hay precedente probado de una página sin sesión bajo
ellos: `app/page.tsx` (el login) ya usa `useTramita()`. `AuthProvider` llama `getMe()` al montar
(`auth-store.tsx:48`) y el `401` es señal, no error (`api.ts:141`). Costo aceptado: una llamada
`/auth/me` que el estudiante no necesita. **No** se consume el store en esta pantalla.

### Decisión 2 — El tipo de solicitud se afirma, no se ofrece en cuatro casillas

| | |
|---|---|
| **Elegido** | El bloque se reduce a una afirmación: «Tipo de solicitud: **Matrícula créditos adicionales**». Las otras tres casillas del formato **se omiten**. |
| **Alternativa de eje distinto** | Conservar las cuatro casillas deshabilitadas, como decidió el design anterior. |

**Esto invierte la decisión anterior**, que eligió las cuatro casillas «porque el papel tiene
cuatro» y porque «las tres grises *son* la pregunta a la Coordinación». Ambos argumentos
pertenecían al mundo en que la lectora era la Coordinación.

Aplicado el criterio vigente: las tres casillas inertes existían **para que la Coordinación
reconociera el formato**. Un estudiante que abre un enlace de adición de créditos no gana nada
viendo tres opciones grises que no puede elegir — gana la pregunta «¿por qué no puedo pedir
esas?», que nadie va a responderle. En un celular, además, son tres objetivos táctiles de 44 px
que no hacen nada.

Lo que el estudiante **sí** necesita saber es qué está solicitando, y eso se conserva: el tipo
aparece afirmado en el encabezado del formulario.

> ⚠️ **Decisión derivada del principio, no dictada explícitamente.** El responsable fijó el
> criterio general de repliegue; esta aplicación concreta la propone el design. Si se prefiere
> conservar las cuatro casillas, es un cambio de una sección y ~2 tests.

### Decisión 3 — Sin verificación temprana del catálogo (sobrevive, con otro código)

| | |
|---|---|
| **Elegido** | No consultar el catálogo al montar. El fallo de configuración llega en el envío. |
| **Alternativa de eje distinto** | Abaratar el fallo tardío en vez de adelantarlo: mensaje accionable con el estado del formulario intacto. |

Sobrevive del design anterior, y sus razones siguen en pie: el `catch` no resetea el estado ni
navega, así que el fallo cuesta un clic y no volver a llenar el formato.

**Lo que cambia es el código de error.** Ya no es un `422` por definición inexistente: el canal
público responde **`404`** cuando el trámite no existe **o no tiene la captura pública
habilitada**, sin distinguir entre ambos casos —la distinción no le sirve a quien envía
legítimamente y sí a quien sondea—. El mensaje al estudiante debe ser accionable sin exponer esa
diferencia: *«Este enlace no está disponible. Escribile a la Coordinación.»*

⚠️ **Y el preflight gratuito desapareció**: el design anterior contaba con abrir `/requests/new`
antes de una demo para comprobar que `ADICION_CREDITOS` estaba sembrado. Esa pantalla es interna
y no dice nada sobre `PUBLIC_CAPTURE_ENABLED`. La comprobación previa a una demo ahora es abrir
la propia URL pública.

### Decisión 4 — Todos los campos son obligatorios

**Cerrada por el responsable del proyecto el 2026-09-16**: *«mejor dicho, NINGÚN CAMPO PUEDE
QUEDAR VACÍO»*. No es una inferencia de este documento.

El design anterior ya había endurecido tres campos por encima del contrato, y lo declaraba como
tal. Ahora no hay endurecimiento: **el contrato público y la pantalla coinciden**, porque los
once campos son obligatorios en ambos lados.

| Campo | Límite | Nota |
|---|---|---|
| `studentName` | ≤120 | |
| `studentDocument` | ≤20 | |
| `studentEmail` | ≤255 | Canal por el que responde la Coordinación |
| `studentPhone` | ≤30 | Columna nueva en el backend |
| `program` | ≤120 | |
| `campus` | ≤120 | Columna nueva |
| `faculty` | ≤120 | Columna nueva |
| `modality` | ≤50 | Columna nueva |
| `semester` | ≤50 | Ordinal (`'8'`), no un periodo académico |
| `reason` | ≤2000 | «Compromisos adquiridos». Acá va la asignatura, en prosa |
| `signature` | — | URL de datos; el tope real lo fija el filtro de 256 KB sobre el cuerpo |

**Consecuencia declarada**: esto **reabre la feature 004 del backend**. `V3.3.0` pasa de dos
columnas a seis, y `data-model.md:28` —que rechazó `student_phone` por §III— debe rectificarse
con el consumidor que esa decisión no miró: el PDF formal del SP3 (`Tramita#10`). Ver la
proposal, sección *Dependencies*, incluida la precisión sobre el alcance de esa cita.

**Validación vacía**: se valida tras `trim()`. Un campo con espacios no cuenta como diligenciado.

### Decisión 5 — La firma es un `<canvas>` propio con suavizado, sin dependencias

| | |
|---|---|
| **Elegido** | `<canvas>` con Pointer Events y suavizado por curva cuadrática; `toDataURL('image/png')`, más carga nativa de imagen PNG/JPEG como alternativa accesible. |
| **Alternativa de eje distinto** | Atestación con nombre tipografiado. |

**Por qué no una librería.** `signature_pad` existe para que el trazo salga suave. El spec del
backend declara que **el sistema acepta una firma ilegible o un solo trazo** y que juzgar si una
firma sirve es de la Coordinación (`../Tramita/specs/004-public-request-capture/spec.md:129`).
El requisito de calidad es cero: comprar una dependencia para satisfacerlo es comprar algo que
nadie pidió. El suavizado que de verdad mejora el trazo con el dedo cabe en cuatro líneas —punto
medio entre muestras y `quadraticCurveTo`— y queda en el repo, auditable.

**Alternativa accesible aceptada.** Se conserva el canvas aprobado y se añade un `<input
type="file">` nativo, etiquetado y alcanzable por teclado, que acepta PNG/JPEG. Tras cargarlo,
la imagen produce el mismo contrato `{ dataUrl, hayFirma }` que el canvas; no hay una ruta de
envío ni una afirmación legal nueva. Se descartó la atestación con nombre tipografiado porque el
responsable pidió una imagen de firma, no un sustituto textual ni una equivalencia jurídica.

**Detalles que no son opcionales**, y que solo se ven con un teléfono en la mano:

- **`touch-action: none` en el canvas.** Sin esa línea de CSS, arrastrar el dedo hace scroll y el
  recuadro no recibe el trazo. Es la trampa número uno y no es JavaScript.
- **Escalar por `devicePixelRatio`** al dimensionar el canvas, o el trazo sale borroso.
- **`setPointerCapture`**, para que el trazo no se corte si el dedo sale del recuadro.
- **Botón «Limpiar»**, porque firmar mal con el dedo es normal.
- El canvas se considera firmado solo cuando la distancia desde el inicio del gesto
  alcanza **4 píxeles CSS**. Un toque o un movimiento menor no emite PNG ni cambia el estado.
- El callback se guarda en una referencia actual para que un cambio de identidad no reinicialice
  una captura existente; los eventos posteriores notifican la función vigente.
- Limpiar reinicia el canvas, la selección de archivo y el estado de ambas alternativas.

**Peso**: un trazo del tamaño del recuadro pesa 20–30 KB en base64
(`research.md` D6), contra un tope de 256 KB para el cuerpo entero (D7). Holgado, pero el
formulario debe mostrar el error `413` de forma accionable si alguna vez se supera.

### Decisión 6 — El acuse reemplaza al formulario en la misma página

| | |
|---|---|
| **Elegido** | Al recibir el `201`, la página cambia de estado y muestra la confirmación en lugar del formulario. |
| **Alternativa de eje distinto** | Una ruta `/solicitud/creditos-adicionales/enviado`. |

El `201` del canal público **no devuelve identificador, ni estado, ni cabecera `Location`**
(`openapi.yaml`, FR-008, D5): devolverlos abriría de hecho la ventana de consulta que la
Coordinación decidió no dar. Por lo tanto `router.push('/requests/{id}?created=1')` —el patrón
vigente en `app/requests/new/page.tsx:146`— **es imposible aquí**: no hay `id`.

Contra la ruta aparte: sería alcanzable por URL directa sin haber enviado nada, mostrando una
confirmación falsa, y un refresh sobre el formulario podría re-enviar. El cambio de estado in
situ no tiene ninguno de los dos problemas.

El acuse **MUST NOT** mostrar identificador, estado ni enlace de consulta. Dice que llegó, y
dice que la Coordinación responderá al correo que el estudiante escribió.

> El spec del backend acepta explícitamente que un doble envío registre dos solicitudes y que la
> Coordinación descarte una (`spec.md:119`). El front **no debe** inventar deduplicación.

### Decisión 7 — La salida ante el riesgo biométrico queda escrita, no implementada

No está determinado si una firma manuscrita digitalizada constituye dato biométrico bajo la
Ley 1581 de 2012, ni se obtuvo pronunciamiento sobre su valor probatorio. Ambas cosas están
declaradas **provisionales y no auditadas** en `research.md:148-154`.

**Decisión**: se implementa la Decisión 5 y se deja documentada la sustitución.

**Disparo explícito**: si la consulta responde que el trazo es dato biométrico, se sustituye la
captura por el nombre tipografiado. Para que ese cambio sea local y no un rediseño, la captura
vive **detrás de una interfaz de un solo método** —«devolveme una URL de datos y si hubo firma»—
en `components/firma/`, y el container no sabe cómo se produjo el trazo.

Eso es lo único que el desacoplamiento compra, y se paga con un archivo más. No se construye
nada más «por si acaso».

## Data Flow

    app/solicitud/creditos-adicionales/page.tsx  (container, público)
      ├─ estado: 11 campos + hayFirma:boolean + estadoEnvio
      ├─ validate() → todos no vacíos tras trim() + límites → marca aria-invalid, NO emite
      └─ handleSubmit() → submitPublicRequest('ADICION_CREDITOS', { …11 campos })
              │  allowlist propio en lib/api.ts — el estado del formulario no se propaga
              │  apiFetch sin cambios: sin cookie CSRF no manda el header (api.ts:94-97)
              ▼
         POST /api/public/requests/ADICION_CREDITOS
              ├─ 201 → estado 'enviado' → el acuse reemplaza al formulario
              ├─ 404 → «Este enlace no está disponible» (Decisión 3)
              ├─ 413 → «La firma es demasiado pesada. Limpiá y firmá de nuevo.»
              ├─ 422 → error atado al campo que el problem+json nombre
              ├─ 429 → apiErrorMessages ya lo maneja con Retry-After (api-errors.ts:31-36)
              └─ otro → banner de formulario

    components/do-fr-100/*  ← props (valores + onChange + errors); sin estado propio
    components/firma/*      ← canvas o PNG/JPEG cargado → { dataUrl, hayFirma } hacia arriba

## File Changes

| Archivo | Acción | Detalle |
|---|---|---|
| `app/solicitud/creditos-adicionales/page.tsx` | Create | Container público. **Único lugar con el literal `ADICION_CREDITOS`**, ahora para armar la ruta. |
| `app/solicitud/creditos-adicionales/page.test.tsx` | Create | Tests de componente (jsdom). |
| `app/solicitud/creditos-adicionales/definition-code.test.ts` | Create | Guarda de texto fuente: el literal aparece exactamente una vez. |
| `components/do-fr-100/sections.tsx` | Create | Presentational de los bloques del formato. |
| `components/firma/canvas-firma.tsx` | Create | Captura del trazo. Superficie mínima hacia afuera (Decisión 7). |
| `components/ui/checkbox.tsx` | **Ya no hace falta** | Existía para las 17 casillas (4 + 13). Sin casillas, no hay consumidor: no se crea (§I). |
| `lib/api.ts` | Modify | Agrega `submitPublicRequest` con allowlist propio. **`createRequest` no se toca.** |
| `lib/types.ts` | Modify | `PublicRequestBody` y `PublicReceipt`. |
| `app/requests/new/**`, `components/app-shell.tsx` | **Sin tocar** | Invariante. |

## Testing Strategy

TDD estricto (`openspec/config.yaml:17`). Los tests que importan, más allá de los de render:

1. **Sin sesión no hay redirección.** El test monta la página sin sesión y verifica que sigue
   renderizando. Es el que habría detectado el error del design anterior.
2. **El cuerpo emitido tiene exactamente once campos** y **no** contiene `definitionCode`.
3. **El trámite viaja en la URL**: la ruta llamada es `/public/requests/ADICION_CREDITOS`.
4. **Ningún campo vacío pasa**: por cada campo, vaciarlo (y llenarlo de espacios) impide el envío.
5. **Canvas en blanco no cuenta como firma**, aunque `toDataURL()` devuelva un PNG válido.
6. **El acuse no contiene identificador ni estado.**
7. **Los errores 404 / 413 / 422 / 429** se renderizan donde corresponde.

⚠️ **Lo que jsdom no puede probar**: el gesto táctil real. `touch-action` es CSS y no se ejercita
en jsdom, así que **la firma con el dedo se verifica a mano en un dispositivo real** y se anota
como criterio de cierre. Un test verde no prueba que se pueda firmar en un celular.

## Threat Matrix

| Amenaza | Tratamiento |
|---|---|
| Suplantación de identidad | **Aceptada y declarada** por el backend. El front no la mitiga y no debe aparentar que sí. |
| **Superficie de Next expuesta sin autenticación** | 🔴 `tramita-frontend#7`: dos **RCE críticas sin autenticar** en 16.2.6, parcheadas en `>=16.3.3`. Hasta hoy toda la app estaba detrás del login; esta pantalla **cambia la amenaza de clase**: ya no hace falta una credencial, hace falta el enlace. **Decisión pendiente del responsable**: actualizar antes de publicar, o publicar y aceptarlo por escrito. |
| **Origen público ausente de la allowlist de CORS** | `Tramita#20`. En desarrollo no se nota —el front llama por ruta relativa a través de su proxy—; **en producción sí**. Tarea de despliegue, fácil de perder porque no la rompe ningún test. |
| Campo no persistido filtrado a logs | Ya no aplica igual: los once campos se persisten. El allowlist se conserva porque el estado del formulario puede crecer con datos de UI. |
| Envíos masivos | Del backend (límite por origen + tope de 256 KB). El front solo muestra el `429` bien. |
| PII real en el repo público | Valores sintéticos de `BRIEF.md:42-53`. Verificable antes del commit. |

## Migration / Rollout

Aditiva en el front. **Bloqueada end-to-end** hasta que exista el endpoint público (0/45 tareas
en el backend). Hasta entonces la pantalla se desarrolla contra el contrato y se verifica con
mocks.

## Open Questions

- **Validez legal de la firma trazada** y **si es dato biométrico** (preguntas 5 y 6 de la
  proposal). No bloquean: la Decisión 7 deja la salida escrita.
- **¿El formulario sigue siendo demasiado largo en móvil tras el repliegue?** No está medido con
  un estudiante real. Si alguien abandona a mitad, la salida es partirlo en pasos — y eso sí
  sería un rediseño, no un ajuste.
