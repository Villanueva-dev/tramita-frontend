# Adopción del rediseño del formulario público DO-FR-100

## Objetivo

Llevar al formulario público `/solicitud/creditos-adicionales` el rediseño propuesto con Claude
Design, ajustado al contrato del backend y a la spec `do-fr-100-form`, en cuatro PRs
secuenciales.

## Problema y por qué

Hoy el formulario es una sola página con una tarjeta por bloque del papel. El rediseño propone un
asistente de cinco pasos (Sus datos, Datos académicos, Motivo, Firma, Revisar y enviar), textos y
errores más claros, y un acuse de recibo más completo. Varias de sus piezas contradicen el
contrato o la spec vigente, así que no se adopta tal cual: cada pieza quedó clasificada abajo.

La revisión se hizo el 2026-09-25 sobre el diseño exportado y un prototipo navegable del
resultado ajustado (artefacto privado:
<https://claude.ai/artifact/RNDL2YhLErmnXjbMJwg7tn>). Evidencia que decide el alcance. Las
citas de `openapi.yaml` son del contrato 004 en `main` del backend (`412a5e0`); las de la 008,
de su rama `008-student-closure-notice` (`3e9ffd4`), sin publicar al 2026-09-25:

- `Tramita/specs/004-public-request-capture/contracts/openapi.yaml:292-296`: el acuse público es
  «deliberadamente pobre: sin identificador, sin estado y sin enlace de consulta».
- `…/openapi.yaml:232-234`: el cuerpo público solo tiene los once campos del formato; no admite
  adjuntos.
- 008, FR-009 (`specs/008-student-closure-notice/spec.md:97`) y `PublicRequestBody.java:49`
  (`@Pattern(regexp = "[0-9]{10}")`): la 008 enmienda `studentPhone` a exactamente diez dígitos.
  En `main` el campo sigue en `maxLength: 30` (`openapi.yaml:247-249`).
- 008, `specs/008-student-closure-notice/spec.md:21`: la Coordinación pidió avisar al estudiante
  solo al final, y el aviso lo envía ella a mano.
- `openspec/specs/do-fr-100-form/spec.md:41-67`: los bloques van en el orden del papel, empezando
  por «Lugar y fecha» y «Tipo de solicitud».
- `components/firma/canvas-firma.tsx:47-49`: `CanvasFirma` emite una firma vacía al montarse.

## Decisiones

Clasificación: **adoptado** entra como lo propuso el diseño; **ajustado** entra la idea, cambiada
para cumplir el contrato o la spec; **descartado** no entra; **por decidir** falta un dato que no
depende del código.

### Decisiones de diseño

- **D1 — Asistente de cinco pasos, no una sola página** (decidido por el usuario el 2026-09-25).
  Se gana: cada paso cabe en el teléfono, la firma queda aislada y hay revisión antes de enviar.
  En una página larga, el recuadro de firma tiene `touch-action: none`, así que un dedo que cae
  sobre él al desplazarse dibuja en vez de desplazar
  ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action)). Se pierde: un cambio
  de spec y reescribir 10 de las 14 definiciones de `page.test.tsx` (estimado leyendo el
  archivo). Alternativa descartada: una sola página con el pulido visual, más barata pero con el
  problema del recuadro.
- **D2 — Los cinco pasos siempre montados, ocultos con `hidden`.** La firma y lo escrito
  sobreviven a la navegación sin tocar `CanvasFirma`, que además ya se prepara en el primer toque
  (`canvas-firma.tsx:110-115`). Alternativa descartada: montar un paso a la vez y agregar a
  `CanvasFirma` un modo de redibujo.
- **D3 — Campos numéricos: filtrar al escribir.** Cédula y teléfono descartan todo lo que no sea
  dígito, también al pegar. El teléfono exige exactamente diez. Es una regla de UX: el backend no
  la exige para la cédula (ver «Descartados»).
- **D4 — Un 422 lleva al primer paso con errores**, con el aviso arriba y marcas en la barra de
  progreso. Alternativa descartada: listar los errores en la revisión, lejos del campo.
- **D5 — El acuse no ofrece volver a empezar.** El backend acepta el doble envío y la spec
  prohíbe deduplicar en el cliente (`spec.md:197-218`).

### Adoptados

- Asistente de cinco pasos con barra de progreso (D1).
- Encabezado con el logo, el código «Formato DO-FR-100» y un botón de Ayuda. El logo es el mismo
  archivo que `public/tramita-logo.jpeg` (md5 idéntico).
- Letra de 17 px y controles de 52 a 56 px: superan los 44 px de objetivo táctil del cambio
  archivado (`openspec/changes/archive/2026-09-18-formulario-do-fr-100-creditos-adicionales/design.md:75`).
- Los mismos tokens del proyecto: Source Sans 3, Source Serif 4 y el primario
  `oklch(0.42 0.16 264)` (`app/globals.css:59,66`, `app/layout.tsx:3`). No hay tema nuevo.
- Aviso amable si el correo está incompleto; el contrato declara `format: email`
  (`openapi.yaml:242-245`).
- Ejemplos en cada campo y mensajes que dicen qué falta («Falta este dato. Por ejemplo: Cali»).
- «Volver» conserva lo escrito (D2).
- Contador «N de 2000 caracteres» en «Compromisos adquiridos».
- La asignatura se escribe en prosa dentro de los compromisos, como pide `spec.md:132-143`.
- Recuadro de firma de 200 px con línea guía y el texto «Firme aquí con el dedo o con el mouse».
- «Borrar y firmar de nuevo» reemplaza a «Limpiar firma». Costo: cinco consultas de tests buscan
  el nombre actual.
- Paso de revisión con un resumen por bloque y el botón «Cambiar».
- Acuse con confirmación visual y el correo destacado; cumple el «responderá al correo
  diligenciado» de la spec.

### Ajustados

- **Lugar y fecha y Tipo de solicitud se conservan** como una franja arriba del progreso. El
  diseño los quitó; la spec exige los bloques en el orden del papel.
- **La nota «La fecha de radicación se registra al enviar la solicitud» va solo en la franja**,
  no también en la revisión como la ponía el diseño (ajustado el 2026-09-26, en PR-3c). La franja
  ya la muestra desde la fase 1 (`sections.tsx`) y es visible en todos los pasos, así que en la
  revisión se leería dos veces. La propuesta se enmendó en la misma PR.
- **Campos en el orden del papel**: nombre, identificación, correo y teléfono; después programa,
  sede, facultad, semestre y modalidad. El diseño cambiaba de lugar el teléfono con el correo y la
  facultad con la sede (`page.test.tsx:89-120`).
- **Teléfono de exactamente diez dígitos, sin espacios.** El ejemplo del diseño, «312 456 7890»,
  recibiría un 422 cuando entre la 008.
- **Número de identificación solo con dígitos**, decidido por el usuario el 2026-09-25: la
  Coordinación busca por número y no recibe documentos extranjeros. Tope de 20 caracteres, el del
  contrato. Viaja como texto, porque no se opera con él.
- **«Motivo de la solicitud» es el título del paso 3.** Conserva el bloque del papel sin agregar
  un campo; el motivo se sigue escribiendo en «Compromisos adquiridos».
- **Se conserva la lógica de `CanvasFirma`**: trazo mínimo de 4 px, suavizado y validación
  PNG/JPEG. En el diseño, cualquier toque contaba como firma.
- **La carga de la imagen de firma sigue siendo un `<input type="file">` nativo** y etiquetado,
  como exige `spec.md:151-155`. El diseño lo creaba invisible desde un botón.
- **El paso de firma nunca se desmonta** (D2).
- **Un 422 lleva al primer paso con errores** (D4).
- **404, 413 y 429 se muestran en la revisión** y conservan los datos, con los textos de hoy. El
  413 suma un atajo «Ir a la firma».
- **Ayuda con el WhatsApp de la Coordinación Cali, +57 315 2966601**, una línea institucional
  confirmada por el usuario el 2026-09-25. Se muestra como texto y como enlace
  (`https://wa.me/573152966601`). Reemplaza el correo y el teléfono inventados del diseño.

### Descartados

- **Número de radicado en el acuse** («TRA-2026-0142»): el contrato omite el identificador a
  propósito (`openapi.yaml:292-296`, `spec.md:197-218`).
- **Línea de tiempo con las etapas del trámite en el acuse**: expone estado y ruta, que el acuse
  no debe mostrar, y las etapas no se verificaron contra la configuración.
- **«Le avisaremos cada vez que avance»**: la Coordinación pidió avisar solo al final
  (008, `spec.md:21`).
- **Adjuntar documentos de soporte**: el contrato público no los admite; en el diseño era un
  simulacro. Necesitaría una feature del backend.
- **Botón «Volver al inicio del formulario»** en el acuse (D5).
- **«Su firma reemplaza la firma escaneada del formato en Word»**: sugiere equivalencia legal, y
  la spec prohíbe afirmar valor probatorio (`spec.md:145-196`).
- **«Le tomará unos 5 minutos»**: nadie lo midió.
- **Exigir dígitos en la cédula también en el backend**, decidido por el usuario el 2026-09-25.
  Las dos pantallas que crean solicitudes entregan solo dígitos: el formulario interno ya lo exige
  (`app/requests/new/page.tsx:79-80`) y el público lo hará con PR-1. Riesgo aceptado: el
  endpoint público no tiene autenticación (`openapi.yaml:43`, `security: []`), así que una
  llamada directa todavía puede traer otro formato; lo peor es que esa solicitud no aparezca al
  buscar por cédula.
- **Copiar al formulario público el rango de 6 a 12 dígitos del formulario interno.** Ese rango
  viene de la maqueta V0 (`9d9c53c`, 2026-07-15) sin fuente que lo respalde. La búsqueda necesita
  solo dígitos, no un largo, y un rango sin verificar podría bloquear una cédula válida.

### Por decidir

- **Nota de privacidad del pie** («Sus datos se usan solo para este trámite»): es una afirmación
  institucional. Hay que confirmarla con la Coordinación; hasta entonces no se publica.
- **Rango de 6 a 12 dígitos del formulario interno** (fuera de esta feature): verificar con la
  Coordinación o con la Registraduría si es correcto, porque podría rechazar una cédula antigua.

## Alcance autorizado

Cuatro PRs secuenciales contra `main` (plan presentado y aprobado el 2026-09-25):

- **PR-1 — Campos numéricos del formulario público.** Rama `feat/campos-numericos-do-fr-100`.
  No depende de D1 y conviene que salga antes o junto con la 008 del backend.
- **PR-2 — Cambio OpenSpec «formulario público por pasos»**: propuesta, delta de spec, diseño con
  D1 a D5 y tareas.
- **PR-3 — Asistente**: estado de pasos, validación por paso, revisión y salto del 422.
- **PR-4 — Pulido visual**: encabezado y Ayuda, aviso de errores, recuadro de firma y acuse.

Fuera de alcance: todo lo descartado, la nota de privacidad hasta que se confirme y el rango de
la cédula del formulario interno.

## Restricciones

- TDD efectivo: estricto (`openspec/config.yaml:17`, `strict_tdd: true`); runner `pnpm test`.
- Revisión por recibos (RDD): apagada en este clon (`gentle-ai review mode status`, fuente
  `clone_local`).
- Puertas que abre el usuario: el diff se revisa antes del commit; el arreglo se prueba en vivo
  antes del PR; todo texto que va a GitHub se redacta y se muestra completo antes de publicarlo.
- Datos de prueba sintéticos y no realistas (#14). Los valores de cédula y teléfono pasan a
  dígitos obviamente falsos.
- PR-1 actualiza la spec viva en el mismo commit que el código, porque ajusta un requisito que ya
  existe («Todos los campos son obligatorios»). El asistente sí va como cambio OpenSpec (PR-2),
  porque agrega un requisito y cambia la forma de la pantalla.
- Que el front salga antes que la 008 es compatible: hasta su merge (`0cf3fa3`), `main` (004)
  aceptaba hasta 30 caracteres en `studentPhone`, y diez dígitos cumplen las dos reglas.
- Ruta de PR-1: implementación delegada. Trigger: toca más de un archivo no trivial
  (`app/solicitud/creditos-adicionales/page.tsx`, `components/do-fr-100/sections.tsx`, sus
  pruebas y la spec).

## Tareas

### PR-1 — Campos numéricos (pronóstico: 150–250 líneas con pruebas y spec, sin este documento)

- [x] **T1 — Fijar el comportamiento con pruebas en rojo**
  - Escribir «1.144.123.456» en la cédula deja «1144123456»; pegar «300 123 4567» en el teléfono
    deja «3001234567».
  - Un teléfono que no tiene exactamente diez dígitos impide el envío, con un mensaje que lo dice.
  - Cédula y teléfono usan `inputMode="numeric"` y tienen una pista asociada con
    `aria-describedby`.
  - El cuerpo enviado lleva la cédula y el teléfono solo con dígitos.
  - Los datos de prueba y los casos de límite de ambos campos pasan a dígitos sintéticos.
  - Comprobación: pruebas enfocadas ejecutadas primero, con el fallo esperado registrado.

- [x] **T2 — Implementar y actualizar la spec**
  - Filtro de dígitos, validación de los diez dígitos, pistas y tope de 10 para el teléfono en
    `lib/public-request-limits.ts`.
  - Delta en `openspec/specs/do-fr-100-form/spec.md`, requisito «Todos los campos son
    obligatorios»: reglas numéricas y escenarios nuevos.
  - Comprobación: pruebas enfocadas en verde, `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm lint`.

- [x] **T3 — Cerrar la unidad de trabajo**
  - Mostrar el diff con la evidencia RED/GREEN; commit convencional después del «aprobado».
  - Probar en vivo con permiso previo, y abrir el PR con el borrador mostrado antes.

### PR-2 — Cambio OpenSpec «formulario público por pasos» (se detalla al empezar)

- [x] **T4** — Propuesta, delta de spec (dos requisitos modificados, dos escenarios nuevos y un
  requisito nuevo: «Diligenciamiento por pasos»), diseño con D1 a D5 y tareas.

### PR-3 — Asistente (se detalla al empezar)

- [ ] **T5** — Estado de pasos, validación por paso, revisión con «Cambiar», salto del 422 y foco
  en el encabezado del paso o, tras un error, en el primer campo inválido (cierra #58). Reescribir
  las pruebas afectadas.

### PR-4 — Pulido visual (se detalla al empezar)

- [ ] **T6** — Encabezado con logo y Ayuda, aviso de errores, recuadro de firma de 200 px y
  acuse. Revisar si cierra #27 (el botón «Limpiar firma» por debajo del objetivo táctil).

## Criterios de aceptación de PR-1

1. La cédula y el teléfono del formulario público solo aceptan dígitos, también al pegar.
2. El teléfono exige exactamente diez dígitos antes de enviar.
3. La spec viva refleja las dos reglas.
4. Sin regresiones: suite completa, tipos y lint en verde.

## Progreso y evidencia

- Estado inicial (2026-09-25): `main` en `7b9e2bf`, worktree limpio; rama
  `feat/campos-numericos-do-fr-100` creada desde ahí. Suite base: 24 archivos, 241 pruebas en
  verde (`pnpm test`).
- T1 RED observado (escritor delegado, repetido por el padre con los cambios de producción
  apartados): `pnpm exec vitest run app/solicitud/creditos-adicionales/page.test.tsx` →
  6 fallidas, 32 aprobadas. Fallan el tope de 11 dígitos del teléfono (el límite seguía en 30),
  el filtro al pegar, los teléfonos de 9 y 11 dígitos, el `inputMode` con su pista y el cuerpo
  con solo dígitos.
- T2 GREEN observado sobre el diff final, después de los ajustes del padre: se quitaron del
  comentario de `lib/public-request-limits.ts` y de la spec las frases sobre la rama de la 008,
  que caducan con su merge; dos valores de prueba con forma de celular y cédula plausibles
  pasaron a valores obviamente falsos (#14); dos títulos de prueba quedaron enteros en inglés.
  - Pruebas enfocadas: 38 aprobadas.
  - `pnpm test`: 24 archivos, 246 pruebas aprobadas (241 + 5 nuevas).
  - `pnpm exec tsc --noEmit`: código 0.
  - `pnpm lint`: código 0.
- Ruta de T1 y T2: delegada, con el trigger declarado en «Restricciones». El escritor dejó el
  filtro en el contenedor (`handleChange` de `page.tsx`) y `sections.tsx` sigue siendo
  presentacional. Sin desvíos de TDD reportados.
- `gentle-ai review assess` (RDD apagado, con este documento declarado): riesgo `medium`
  (`executable_change`), 376 líneas, `review_due: false` (`under_budget`). Verificación
  aplicada: autoverificación del escritor más la comprobación puntual del padre.
- Defecto hallado por el padre al revisar el diff y corregido con TDD: el teléfono conservaba
  `maxLength={10}`, que cuenta caracteres crudos. En Chrome, sobre el servidor de desarrollo de
  esta rama, insertar «300 123 4567» de una vez (`document.execCommand('insertText')`, el
  camino de edición de un pegado) dejaba `30012345`: el navegador recortó a 10 antes del
  filtro. Tecleando sí quedaba `3001234567`. El portapapeles real no se pudo usar desde la
  automatización (`Document is not focused`).
  - Corrección: cédula y teléfono no llevan `maxLength` en el control; el tope lo aplica la
    validación. Se descartó recortar los dígitos en el filtro, porque borraría en silencio un
    dígito de más.
  - RED: la prueba nueva de ausencia de `maxLength` falló (`expected true to be false`).
  - GREEN: pruebas enfocadas 39 aprobadas; `pnpm test` 24 archivos, 247 pruebas aprobadas;
    `tsc --noEmit` y `pnpm lint` con código 0.
  - Recomprobado en Chrome: insertar «300 123 4567» deja `3001234567`, e insertar
    «1.144.123.456» deja `1144123456`.
- T3: diff revisado y aprobado por el usuario el 2026-09-25; commit `a373065`
  (`feat(solicitud): cédula y teléfono del formulario público solo aceptan dígitos`),
  6 archivos, +414 −16. Pendiente: prueba en vivo del envío completo y abrir el PR.
- Prueba en vivo (2026-09-25, con permiso del usuario, datos ficticios): Chrome sobre el servidor
  de desarrollo de esta rama, contra el backend local arrancado a las 09:43 desde
  `Tramita/target/classes`. Esas clases se compilaron el 2026-09-24 sobre la rama
  `008-student-closure-notice` (`3e9ffd4`), cuyo `PublicRequestBody.java:49` exige
  `@Pattern(regexp = "[0-9]{10}")` en `studentPhone`.
  - Insertar «00.000.010-0» en la cédula dejó `000000100`; insertar «000 000 010» en el teléfono
    dejó `000000010`.
  - Con el teléfono en 9 dígitos y la firma trazada con el mouse, «Enviar solicitud» no emitió
    ninguna petición y marcó solo el teléfono, con «El número debe tener 10 dígitos, sin
    espacios. Por ejemplo: 3001234567».
  - Una extensión de Chrome tomó la pestaña y la automatización dejó de responder
    (`Cannot access a chrome-extension:// URL of different extension`). El usuario escribió
    los diez dígitos y envió a mano.
  - La instrumentación de `fetch` en la página registró una sola petición en toda la prueba:
    `POST /api/public/requests/ADICION_CREDITOS` → `201`, con los once campos del contrato y sin
    `definitionCode`, cédula `000000100` y teléfono de diez dígitos. El acuse reemplazó al
    formulario en la misma ruta.

- Corrección de citas después de `a373065`: las líneas del contrato 004 se habían leído del
  checkout del backend, que estaba en la rama 008 (sin publicar), y no coincidían con `main`.
  En `main` (`412a5e0`) el contrato no tiene la enmienda de la 008, y `openapi.yaml:253-262` son
  otros campos. El comentario de `lib/public-request-limits.ts` y la spec citan ahora la 008 por
  su requisito (FR-009). Las citas de este documento se rehicieron contra `main`, y las de la
  008 quedan marcadas como de su rama.

- Commit de corrección `d922c33`, aprobado por el usuario. PR-1 publicado como #57
  (`main` ← `feat/campos-numericos-do-fr-100`, commits `a373065` y `d922c33`) con el borrador
  aprobado. El cuerpo leído desde la API coincide con el borrador, salvo el salto de línea final.
- CI de #57: job `build` (`pnpm lint`, `tsc --noEmit`, `pnpm test` y `pnpm build`) en verde,
  50 s (run `36169212482`).
- #57 mergeado el 2026-09-25 (`9c40acc`, 17:52 UTC). PR-1 cerrado.
- La 008 se mergeó al `main` del backend el mismo día (`0cf3fa3`, 18:10 UTC), después de #57, como
  pedía su research D9: el filtro del cliente salió antes. Desde ahí, `main` del backend exige los
  diez dígitos. Las citas de este documento fijadas a `412a5e0` siguen valiendo para ese commit.
- PR-2 (T4), rama `docs/spec-formulario-publico-por-pasos` desde `9c40acc`. Preflight SDD del
  usuario: ritmo `auto`, artefactos `openspec`, entrega `auto-chain`; cadena `stacked-to-main`,
  como la 007 (#45 a #48, todos a `main`).
  - Propuesta: 177 líneas. Resolvió cuatro preguntas con el diseño adoptado: el correo incompleto
    impide continuar, la barra solo indica, «Cambiar» recorre los pasos siguientes y el 413 dice
    «Bórrela y fírmela de nuevo».
  - Delta de spec: 365 líneas; cuatro requisitos modificados y «Diligenciamiento por pasos»
    nuevo.
  - Diseño: 234 líneas. El validador de contexto limpio dio `FAIL` por un hallazgo crítico: el
    PR-3 decía cumplir el delta completo, pero dejaba el texto del 413 para el PR-4. Se corrigió,
    y el cambio se archiva después del PR-4. `flushSync` quedó verificado con Context7 en
    react.dev.
  - Tamaño medido de los tres artefactos: 776 líneas; el PR-2 se parte en tres PRs de menos de
    400.
  - Fuera de alcance, sin decidir: que el botón Atrás del navegador retroceda un paso.
  - Tareas: el primer borrador (239 líneas) no pasó el control. Metía los helpers de prueba en el
    corte del asistente, al revés del diseño, y declaraba que no había partición honesta. El
    reintento (129 líneas) parte PR-3 en 3a (modelo puro), 3b (helpers sobre la página actual,
    sin cambio de comportamiento), 3c (presentacionales sin cablear) y 3d (cableado). Pronóstico:
    3a 180–220, 3b 200–280, 3c 380–450, 3d 450–550 y PR-4 300–400 líneas. El 3d necesitará
    `size:exception`, que se pide al usuario al llegar a ese corte.
  - Artefactos: 905 líneas en total. El PR-2 se entrega en tres PRs encadenados a `main`: 2a,
    propuesta y este documento; 2b, delta de spec; 2c, diseño y tareas.
- PR-2 cerrado el 2026-09-25: #60 (`38bfb65`), #61 (`c86fd85`) y #62 (`76b792c`) mergeados a
  `main`, cada uno con el CI en verde. La enmienda del foco tras un error (#58) entró en #64
  (`68cda99`, merge `5a5f848`): spec, diseño (decisión 6), propuesta, tareas 4.1 y 4.3 y T5.
- PR-3a (T5, primer corte), rama `feat/formulario-publico-3a-steps` desde `5a5f848`. Ruta: SDD
  apply delegado por corte (`sdd-apply`, sonnet), con validador de contrato de fase de contexto
  limpio. Preflight SDD del usuario: `auto`, `openspec`, `auto-chain`; cadena `stacked-to-main`.
  - `components/do-fr-100/steps.ts` (87 líneas) y 18 pruebas (131 líneas): RED observado antes
    de crear el módulo; 18/18 en verde. Tamaño medido: 219 líneas contra 180–220 de pronóstico.
  - Hallazgo: el guardián de frontera de `page.test.tsx:75-87` enumera los archivos de producción
    del directorio, así que se rompió al crear `steps.ts`; `tasks.md` difería su actualización a
    4.5. Se adelantó al corte que crea cada archivo (1.2 y 3.4) con una línea en el test; el CI
    corre `pnpm test`, así que dejarlo en rojo no era opción.
  - Validador de contexto limpio: 4/5 puertas en PASS; una cifra vieja del reporte, corregida.
  - Commit `c6e3bf2` tras el «Aprobado» del diff; PR #65 con el borrador mostrado antes, CI en
    verde (1m02s), mergeado el 2026-09-26 (`6693811`, 02:04 UTC). Sin prueba en vivo: el módulo
    no tiene consumidor todavía.
- PR-3b (T5, segundo corte), rama `feat/formulario-publico-3b-test-helpers` desde `6693811`:
  helpers `fillPublicRequestForm` y `submitForm` sobre la página actual, sin cambio de
  comportamiento. Medido: 56 líneas contra 200–280 de pronóstico; 9 de las 12 definiciones
  «reescritas» del diseño tenían llenado y envío y se migraron (una solo a `submitForm()`, porque
  depende de no firmar); las 3 de solo render quedan para la reescritura de navegación de 4.5.
  Suite idéntica antes y después: 39/39 en el archivo, 265/265 en total; `tsc`, `lint` en verde.
  Commits `4165b63` y `09c6b58`; PR #66, CI en verde, mergeado el 2026-09-26 (`bd1b69d`, 02:30
  UTC).
- PR-3c (T5, tercer corte), rama `feat/formulario-publico-3c-presentacionales` desde `bd1b69d`:
  `wizard.tsx` (`StepPanel`, `StepProgress`, `StepNavigation`), `review-summary.tsx` y la
  extracción de `sections.tsx` en grupos de campos, todo sin cablear. RED→GREEN en los dos
  módulos nuevos (18 y 9 pruebas); `sections.tsx` con salida idéntica comprobada por `innerHTML`.
  - Revisión del orquestador: cuatro correcciones al trabajo del agente (rótulos con una sola
    fuente, grupos que solo renderizan campos, marca visible de error en la barra, type guard en
    vez de `as`); validador de contexto limpio en PASS.
  - Decisión del usuario: la nota de la fecha de radicación va solo en la franja (ver
    «Ajustados»); propuesta enmendada. `design.md` enmendado: PR-3 en cuatro cortes.
  - Medido: 646 líneas, sobre el presupuesto; se parte como preveía `tasks.md` en 3c-i
    (`wizard.tsx`, 282) y 3c-ii (`review-summary.tsx` + `sections.tsx`, 364), apiladas a `main`.
  - Suite: 27 archivos, 292/292; `tsc`, `lint` en verde. Sin prueba en vivo: nada lo renderiza
    en producción todavía.
- PR-3d (T5, cuarto corte), rama `feat/formulario-publico-3d-cableado` desde `ff4b6ab`: el
  cableado del asistente en `page.tsx` (estado `step`, `handleContinue`/`handleBack`/`goToStep`
  con `flushSync` y foco al encabezado o al primer campo inválido, `<form onSubmit>` con despacho
  único, 422 → paso del primer campo con error) y la baja de `PublicRequestSections` en
  `sections.tsx`. Un solo RED→GREEN para 4.1–4.5 (43/50 en rojo contra la página vieja, 50/50 en
  verde); tres mutantes en rojo y revertidos; validador de contexto limpio en PASS 5/5.
  - Medido: 607 líneas contra 450–550 de pronóstico; el usuario concedió el `size:exception` el
    2026-09-26 junto con el «aprobado» del diff (sin corte honesto adicional bajo
    `stacked-to-main`).
  - Puerta en vivo con el mouse en Chrome: el foco no se mueve al cargar, va al encabezado en
    cada transición y al primer campo inválido cuando Continuar falla; la firma sobrevive a
    Volver, Continuar y «Cambiar» y llega a la revisión como imagen; sin enviar. Firmar con el
    dedo queda para la puerta 5.7 en un celular. Hallazgo: el «1 issue» del overlay de `next dev`
    es un `img src=""` de `review-summary.tsx` (Slice 3) al montarse la revisión oculta; el
    usuario decidió diferirlo a la tarea 5.5.
  - Suite: 27 archivos, 303/303; `tsc`, `lint`, `build` en verde. Commit `1fb9de9` (código y
    artefactos del corte) más el commit de docs que registra este cierre; cierra #58 al mergear.

**Siguiente paso:** PR-4, el pulido visual (Slice 5 de `tasks.md`), que ahora incluye la tarea
5.5 (la `<img>` de la firma no se renderiza sin firma) y la única puerta que puede confirmar la
firma con el dedo (5.7).
