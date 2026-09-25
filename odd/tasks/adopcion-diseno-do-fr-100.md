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
<https://claude.ai/artifact/RNDL2YhLErmnXjbMJwg7tn>). Evidencia que decide el alcance:

- `Tramita/specs/004-public-request-capture/contracts/openapi.yaml:305-309`: el acuse público es
  «deliberadamente pobre: sin identificador, sin estado y sin enlace de consulta».
- `…/openapi.yaml:239-240`: el cuerpo público solo tiene los once campos del formato; no admite
  adjuntos.
- `…/openapi.yaml:253-262`: la 008 del backend enmienda `studentPhone` a exactamente diez dígitos
  (`^[0-9]{10}$`). La 008 está en su rama `008-student-closure-notice`, no en `main` (`412a5e0`).
- `Tramita/specs/008-student-closure-notice/spec.md:21`: la Coordinación pidió avisar al
  estudiante solo al final, y el aviso lo envía ella a mano.
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
  (`openapi.yaml:248-251`).
- Ejemplos en cada campo y mensajes que dicen qué falta («Falta este dato. Por ejemplo: Cali»).
- «Volver» conserva lo escrito (D2).
- Contador «N de 2000 caracteres» en «Compromisos adquiridos».
- La asignatura se escribe en prosa dentro de los compromisos, como pide `spec.md:132-143`.
- Recuadro de firma de 200 px con línea guía y el texto «Firme aquí con el dedo o con el mouse».
- «Borrar y firmar de nuevo» reemplaza a «Limpiar firma». Costo: cinco consultas de tests buscan
  el nombre actual.
- Paso de revisión con un resumen por bloque y el botón «Cambiar».
- «La fecha de radicación se registra al enviar la solicitud», en la revisión.
- Acuse con confirmación visual y el correo destacado; cumple el «responderá al correo
  diligenciado» de la spec.

### Ajustados

- **Lugar y fecha y Tipo de solicitud se conservan** como una franja arriba del progreso. El
  diseño los quitó; la spec exige los bloques en el orden del papel.
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
  propósito (`openapi.yaml:305-309`, `spec.md:197-218`).
- **Línea de tiempo con las etapas del trámite en el acuse**: expone estado y ruta, que el acuse
  no debe mostrar, y las etapas no se verificaron contra la configuración.
- **«Le avisaremos cada vez que avance»**: la Coordinación pidió avisar solo al final
  (`008…/spec.md:21`).
- **Adjuntar documentos de soporte**: el contrato público no los admite; en el diseño era un
  simulacro. Necesitaría una feature del backend.
- **Botón «Volver al inicio del formulario»** en el acuse (D5).
- **«Su firma reemplaza la firma escaneada del formato en Word»**: sugiere equivalencia legal, y
  la spec prohíbe afirmar valor probatorio (`spec.md:145-196`).
- **«Le tomará unos 5 minutos»**: nadie lo midió.
- **Exigir dígitos en la cédula también en el backend**, decidido por el usuario el 2026-09-25.
  Las dos pantallas que crean solicitudes entregan solo dígitos: el formulario interno ya lo exige
  (`app/requests/new/page.tsx:79-80`) y el público lo hará con PR-1. Riesgo aceptado: el
  endpoint público no tiene autenticación (`openapi.yaml:49`, `security: []`), así que una
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
- Que el front salga antes que la 008 es compatible: el backend en `main` (004) acepta cualquier
  texto de hasta 30 caracteres en `studentPhone`, y diez dígitos cumplen esa regla.
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

- [ ] **T3 — Cerrar la unidad de trabajo**
  - Mostrar el diff con la evidencia RED/GREEN; commit convencional después del «aprobado».
  - Probar en vivo con permiso previo, y abrir el PR con el borrador mostrado antes.

### PR-2 — Cambio OpenSpec «formulario público por pasos» (se detalla al empezar)

- [ ] **T4** — Propuesta, delta de spec (dos requisitos modificados, dos escenarios nuevos y un
  requisito nuevo: «Diligenciamiento por pasos»), diseño con D1 a D5 y tareas.

### PR-3 — Asistente (se detalla al empezar)

- [ ] **T5** — Estado de pasos, validación por paso, revisión con «Cambiar», salto del 422 y foco
  en el encabezado del paso. Reescribir las pruebas afectadas.

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

**Siguiente paso:** T3, revisión del diff por el usuario antes del commit.
