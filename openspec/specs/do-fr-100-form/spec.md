# Do Fr 100 Form Specification

## Purpose

Formulario **público** que reproduce el formato oficial **DO-FR-100 — Solicitud de excepción de
matrícula** (v01, plantilla v2024), acotado a matrícula de créditos adicionales, para que el
**estudiante** lo diligencie y firme desde un enlace, sin cuenta ni sesión.

Es una pantalla que reproduce un formato oficial en el sentido del requisito «Catálogo
data-driven de definiciones de trámite» de `workflow-requests`: declara su trámite de forma
explícita y no ofrece selector.

**Criterio de desempate ante dudas de presentación**: conservar la fidelidad al formato **donde
el estudiante la necesita** —orden de los datos, rótulos oficiales, recuadro de firma— y replegar
lo que existía únicamente para que la Coordinación reconociera el papel. Este criterio sustituye
al anterior («la fidelidad al papel prevalece sobre la elegancia de la interfaz»), que se fijó
cuando la lectora de esta pantalla era la Coordinación y no el estudiante.

## Requirements

### Requirement: Acceso sin sesión

El sistema **MUST** renderizar el formulario completo para un visitante sin sesión iniciada, y
**MUST NOT** redirigirlo a la pantalla de autenticación ni ocultarle contenido por no tener
sesión. En consecuencia, la pantalla **MUST NOT** montar `AppShell`, cuyo gate redirige a `/` y
no renderiza sin sesión.

#### Scenario: Un visitante sin sesión ve el formulario

- GIVEN un visitante que nunca inició sesión
- WHEN abre la ruta pública del formulario
- THEN el formulario se renderiza completo
- AND no se produce ninguna redirección a la pantalla de autenticación

#### Scenario: La pantalla no depende del estado de sesión

- GIVEN el formulario renderizado sin sesión
- WHEN se inspecciona su árbol de componentes
- THEN no monta `AppShell` ni consume datos del store de solicitudes

### Requirement: Reproducción del formato con repliegue declarado

El sistema **MUST** presentar los bloques del formato en el orden del papel —lugar y fecha, tipo
de solicitud, datos del solicitante, motivo, compromisos adquiridos y firma— **a lo largo de los
pasos del asistente**, y no de arriba a abajo en una sola página, y **MUST** conservar los
rótulos oficiales de los campos que el estudiante diligencia.

«Lugar y fecha» y «Tipo de solicitud» **MUST** presentarse como una franja fija por encima de la
barra de progreso, visible en todos los pasos; no forman parte de ningún paso individual.
«Motivo de la solicitud» **MUST** titular el paso que agrupa «Compromisos adquiridos»,
conservando el bloque del papel sin agregar un campo propio.

El sistema **MUST** afirmar el tipo de solicitud como dato —«Matrícula créditos adicionales»— y
**MUST NOT** presentar las otras tres casillas de tipo del formato: existían para que la
Coordinación reconociera el papel y no son elegibles por el estudiante.

El sistema **MUST NOT** presentar las trece casillas de motivos del formato. Pertenecen a otros
tipos de solicitud y no a la adición de créditos, y la Coordinación confirmó que ese campo casi
no se diligencia (2026-09-16). El motivo se captura como texto libre.

(Previously: el orden se recorría de arriba a abajo en una sola página, sin franja fija ni un
paso titulado «Motivo de la solicitud».)

#### Scenario: Orden y rótulos de los bloques

- GIVEN el asistente renderizado, con sus cinco pasos
- WHEN se recorren los pasos en orden, de «Sus datos» a «Revisar y enviar»
- THEN los bloques aparecen en el orden del formato oficial
- AND los rótulos de los campos diligenciables coinciden con los de la plantilla v2024

#### Scenario: No hay casillas de tipo de solicitud ni de motivos

- GIVEN el asistente renderizado
- WHEN se buscan casillas de tipo de solicitud distintas a la afirmada, o casillas de motivo
- THEN no existe ninguna
- AND el tipo de solicitud aparece afirmado como «Matrícula créditos adicionales», en la franja
  fija sobre la barra de progreso

#### Scenario: Lugar, fecha y tipo de solicitud son visibles en todos los pasos

- GIVEN el asistente renderizado
- WHEN se navega de un paso a otro con «Continuar» o «Volver»
- THEN la franja con «Lugar y fecha» y «Tipo de solicitud» permanece visible

#### Scenario: El paso 3 se titula Motivo de la solicitud

- GIVEN el asistente renderizado
- WHEN se llega al paso que agrupa «Compromisos adquiridos»
- THEN su título es «Motivo de la solicitud»

### Requirement: Todos los campos son obligatorios

El sistema **MUST** exigir los once campos del contrato público antes de emitir la petición:
`studentName`, `studentDocument`, `studentEmail`, `studentPhone`, `program`, `campus`, `faculty`,
`modality`, `semester`, `reason` y `signature`. **Ningún campo del formulario puede quedar
vacío.** La verificación de vacío **MUST** aplicarse después de `trim()`, de modo que un valor
compuesto solo por espacios no cuente como diligenciado.

El sistema **MUST** exigir esta obligatoriedad **por paso**: «Continuar» **MUST NOT** avanzar al
siguiente paso si algún campo del paso visible está vacío, excede su límite o es inválido. El
sistema **MUST** exigirla también **una segunda vez sobre los once campos**, inmediatamente antes
de emitir la petición desde el paso de revisión, para cubrir un valor que hubiera cambiado tras
validarse por paso.

El sistema **MUST** respetar los límites de longitud del contrato: `studentName` ≤120,
`studentDocument` ≤20, `studentEmail` ≤255, `studentPhone` exactamente 10 dígitos, `program`
≤120, `campus` ≤120, `faculty` ≤120, `modality` ≤50, `semester` ≤50, `reason` ≤2000.
`studentPhone` deja de ser un tope de longitud como los demás: la feature 008 del backend lo
enmienda a exactamente diez dígitos (`^[0-9]{10}$`, FR-009 de la 008), y diez dígitos también
cumplen la regla anterior de la 004 (cualquier texto de hasta 30 caracteres), así que el
formulario puede adoptarla antes que el backend.

`studentDocument` y `studentPhone` **MUST** aceptar solo dígitos y **MUST** descartar
cualquier otro carácter al teclearlo o pegarlo. `studentDocument` conserva su tope de 20 y
viaja como texto. Esta es una regla de UX decidida el 2026-09-25: el backend no la exige para
`studentDocument`.

El sistema **MUST** considerar `studentEmail` inválido, y en consecuencia **MUST NOT** dejar
avanzar «Continuar» del paso que lo contiene, cuando el valor no tiene el carácter `@` o no tiene
un dominio después de él (por ejemplo, `nombre@` o un valor sin `@`).

Esta validación es **de UX**: el backend sigue siendo la autoridad.

(Previously: la obligatoriedad se exigía una sola vez, al enviar, sin distinguir por paso ni
bloquear «Continuar»; no existía una regla explícita para un correo sin `@` o sin dominio.)

#### Scenario: Un campo vacío impide el envío

- GIVEN el formulario diligenciado por completo salvo un campo, que queda vacío
- WHEN se intenta enviar
- THEN ese campo se marca como inválido
- AND no se emite ninguna petición al backend

#### Scenario: Espacios no cuentan como diligenciado

- GIVEN un campo obligatorio cuyo valor es solo espacios
- WHEN se intenta enviar
- THEN el campo se marca como inválido y no se emite la petición

#### Scenario: Un campo que excede su límite impide el envío

- GIVEN `reason` con más de 2000 caracteres
- WHEN se intenta enviar
- THEN el campo se marca como inválido y no se emite la petición

#### Scenario: El backend sigue siendo la autoridad

- GIVEN un valor que pasa la validación del cliente
- WHEN el backend lo rechaza igualmente
- THEN el sistema muestra el error devuelto, sin asumir que el envío fue válido

#### Scenario: Pegar un número con separadores deja solo los dígitos

- GIVEN el formulario renderizado
- WHEN el estudiante teclea o pega un valor con puntos, guiones o espacios en `studentDocument`
  o en `studentPhone`
- THEN el campo conserva solo los dígitos de ese valor

#### Scenario: Un teléfono sin diez dígitos impide el envío

- GIVEN `studentPhone` con menos o más de diez dígitos
- WHEN se intenta enviar
- THEN el campo se marca como inválido y no se emite la petición

#### Scenario: Continuar no avanza con un campo inválido en el paso visible

- GIVEN un campo obligatorio vacío, fuera de límite o inválido en el paso visible
- WHEN el estudiante pulsa «Continuar»
- THEN el paso visible no cambia
- AND el campo se marca como inválido
- AND el foco pasa al primer campo inválido del paso visible

#### Scenario: Un correo sin arroba o sin dominio impide continuar

- GIVEN `studentEmail` con un valor sin `@` o sin dominio después de `@`
- WHEN el estudiante pulsa «Continuar» en el paso que lo contiene
- THEN el paso visible no cambia
- AND el campo se marca como inválido

### Requirement: El trámite viaja en la ruta, no en el cuerpo

El sistema **MUST** enviar la solicitud a `POST /api/public/requests/ADICION_CREDITOS`,
declarando el literal del trámite **exactamente una vez** en el código de la pantalla, y
**MUST NOT** incluir `definitionCode` en el cuerpo. Un cuerpo manipulado no puede cambiar a qué
trámite corresponde la solicitud.

El sistema **MUST** construir el cuerpo mediante un allowlist explícito, sin propagar el estado
del formulario.

#### Scenario: La ruta lleva el trámite y el cuerpo no

- GIVEN el formulario diligenciado por completo y firmado
- WHEN se envía la solicitud
- THEN la petición se dirige a `/public/requests/ADICION_CREDITOS`
- AND el cuerpo contiene exactamente los once campos del contrato
- AND el cuerpo no contiene `definitionCode`

#### Scenario: El semestre viaja como ordinal

- GIVEN un semestre diligenciado como `"8"`
- WHEN se envía la solicitud
- THEN el cuerpo transporta `"8"` sin transformarlo a un identificador de periodo académico

### Requirement: La asignatura no se captura como campo propio

El sistema **MUST NOT** capturar ni presentar la asignatura, su código o sus créditos como campos
propios. La asignatura viaja como prosa dentro de «Compromisos adquiridos» → `reason`, tal como
la registra el formato en papel (confirmado por la Coordinación, 2026-09-13). El tope de créditos
no se evalúa por este canal: quedó fuera del alcance del sistema el 2026-09-15.

#### Scenario: No existen campos de asignatura ni de créditos

- GIVEN el formulario renderizado
- WHEN se buscan campos de asignatura, código de asignatura o créditos
- THEN no existe ninguno

### Requirement: Firma trazada en pantalla con alternativa accesible

El sistema **MUST** permitir al estudiante trazar su firma en pantalla con el dedo o el puntero,
**MUST** enviarla como URL de datos en `signature`, y **MUST** ofrecer una acción para limpiar el
trazo y volver a firmar.

El sistema **MUST** ofrecer además un `<input type="file">` nativo, etiquetado y operable por
teclado, para cargar una imagen PNG o JPEG de la firma como alternativa accesible al canvas. La
imagen cargada **MUST** alimentar el mismo contrato `{ dataUrl, hayFirma }`; no crea una segunda
clase de firma ni una vía de envío distinta. Limpiar la firma **MUST** reiniciar el trazo, la
selección del archivo y su estado visible.

El sistema **MUST** considerar el canvas diligenciado solo después de un trazo significativo: la
distancia desde el inicio del gesto alcanza al menos 4 píxeles CSS. Un toque o un
movimiento menor no cuenta. Un lienzo en blanco produce una imagen válida, de modo que la
existencia de una URL de datos **MUST NOT** usarse como prueba de que el estudiante firmó.

El sistema **MUST NOT** afirmar que la firma tiene valor probatorio o validez legal.

(Previously: no existía un escenario que cubriera la navegación entre pasos del asistente.)

#### Scenario: La firma trazada viaja como URL de datos

- GIVEN el estudiante traza su firma en el recuadro
- WHEN envía la solicitud
- THEN `signature` contiene una URL de datos con el trazo

#### Scenario: Un lienzo en blanco no cuenta como firma

- GIVEN el formulario diligenciado por completo pero sin ningún trazo en el recuadro
- WHEN se intenta enviar
- THEN el sistema marca la firma como faltante y no emite la petición

#### Scenario: La alternativa accesible usa el mismo contrato

- GIVEN el formulario renderizado
- WHEN el estudiante carga una imagen PNG o JPEG mediante el control nativo etiquetado
- THEN `signature` recibe la URL de datos cargada
- AND `hayFirma` es `true`
- AND limpiar reinicia la selección del archivo y el estado de ambas alternativas

#### Scenario: Un toque no cuenta como firma trazada

- GIVEN el formulario renderizado
- WHEN el estudiante hace un toque o desplaza menos de 4 píxeles CSS en el canvas
- THEN `hayFirma` sigue en `false`
- AND no se emite una imagen de firma

#### Scenario: La pantalla no afirma validez legal

- GIVEN el formulario renderizado, incluido el recuadro de firma y el acuse
- WHEN se revisa su texto
- THEN ninguna frase afirma que la firma tiene valor probatorio o validez legal

#### Scenario: La firma sobrevive a la navegación entre pasos

- GIVEN el estudiante traza su firma en el paso «Firma»
- WHEN navega a otro paso con «Continuar» o «Volver», y regresa al paso «Firma»
- THEN el trazo sigue visible en el recuadro
- AND al enviar la solicitud, `signature` contiene la misma URL de datos trazada

### Requirement: Acuse de recibo sin identificador

Al recibir la confirmación del backend, el sistema **MUST** reemplazar el formulario por un acuse
en la misma ruta, y **MUST NOT** mostrar identificador de la solicitud, su estado ni ningún medio
de consulta posterior. El acuse **MUST** indicar que la Coordinación responderá al correo
diligenciado.

El sistema **MUST NOT** deduplicar envíos: el backend acepta explícitamente que un doble envío
registre dos solicitudes y que la Coordinación descarte una.

#### Scenario: El acuse reemplaza al formulario

- GIVEN una solicitud enviada con éxito
- WHEN el backend confirma la recepción
- THEN el formulario deja de mostrarse y en su lugar aparece la confirmación
- AND no se produce ninguna navegación a otra ruta

#### Scenario: El acuse no expone identificador ni estado

- GIVEN el acuse renderizado
- WHEN se revisa su contenido
- THEN no contiene identificador de la solicitud, ni su estado, ni enlace de consulta

### Requirement: Manejo de errores del backend

El sistema **MUST** interpretar los errores como `application/problem+json` (RFC 9457), reusando
`apiErrorMessages` de `lib/api-errors.ts`, y **MUST** distinguir estos casos:

| Código | Tratamiento |
|---|---|
| `404` | Mensaje accionable que **MUST NOT** distinguir entre «el trámite no existe» y «no admite captura pública» |
| `413` | «La firma es demasiado pesada. Bórrela y fírmela de nuevo.», con un atajo «Ir a la firma» |
| `422` | Error atado a cada campo que nombre el `problem+json`, distinguiendo faltantes de inválidos |
| `429` | Mensaje con el tiempo de espera, reusando el manejo de `Retry-After` existente |
| otros | Aviso general del formulario |

Un `422` **MUST** llevar al estudiante al primer paso, en orden, que tenga un campo con error,
con el foco en el primer campo con error de ese paso, y **MUST** marcar en la barra de progreso
todos los pasos que tengan al menos un campo con error, sin perder el mensaje de ninguno de los
campos señalados. `404`, `413` y `429` **MUST** mostrarse en el paso de revisión, sin mover al
estudiante a otro paso.

En todos los casos el sistema **MUST** conservar los datos ya diligenciados.

Para el `422`, el `problem+json` trae dos arreglos de nombres de campo —`missingFields` e
`invalidFields`— y el sistema:

- **MUST** traducir `missingFields` a un mensaje de campo obligatorio y `invalidFields` a un
  mensaje de revisión, para que quien completa el formulario sepa si le falta el dato o lo
  escribió mal.
- **MUST** dar precedencia al mensaje de campo obligatorio si un mismo campo apareciera en ambos
  arreglos. El backend los emite disjuntos, así que es una defensa del cliente y no un caso que
  el contrato produzca.
- **MUST** descartar los nombres que no correspondan a un control del formulario, para no
  arrastrar errores sin control visible al que atarlos.
- **MUST** mostrar un aviso general del formulario cuando ningún nombre recibido corresponda a un
  control, en lugar de dejar el envío sin explicación.

(Previously: el mensaje del `413` orientaba a limpiar la firma sin ofrecer un atajo; ningún caso
indicaba a qué paso, o a cuál pantalla del asistente, debía llevar al estudiante.)

#### Scenario: El enlace no está habilitado

- GIVEN el backend responde `404`
- WHEN se procesa la respuesta
- THEN se muestra un mensaje accionable que no revela si el trámite existe, en el paso de
  revisión
- AND los datos diligenciados se conservan

#### Scenario: El cuerpo excede el tope

- GIVEN el backend responde `413`
- WHEN se procesa la respuesta
- THEN el mensaje dice «La firma es demasiado pesada. Bórrela y fírmela de nuevo.», en el paso de
  revisión
- AND se ofrece un atajo «Ir a la firma»

#### Scenario: El backend rechaza campos faltantes e inválidos

- GIVEN el backend responde `422` con un campo en `missingFields` y otro en `invalidFields`
- WHEN se procesa la respuesta
- THEN el campo faltante indica que es obligatorio
- AND el campo inválido indica que debe revisarse
- AND los datos diligenciados se conservan

#### Scenario: Un mismo campo llega como faltante y como inválido

- GIVEN el backend responde `422` nombrando el mismo campo en ambos arreglos
- WHEN se procesa la respuesta
- THEN ese campo indica que es obligatorio, no que deba revisarse

#### Scenario: El rechazo solo nombra campos que el formulario no tiene

- GIVEN el backend responde `422` y ningún nombre corresponde a un control del formulario
- WHEN se procesa la respuesta
- THEN se muestra un aviso general del formulario
- AND ningún control queda marcado con error

#### Scenario: Demasiados envíos desde el mismo origen

- GIVEN el backend responde `429` con `Retry-After`
- WHEN se procesa la respuesta
- THEN el mensaje indica cuántos segundos esperar, en el paso de revisión
- AND los datos diligenciados se conservan

#### Scenario: Un 422 lleva al primer paso con errores y marca la barra de progreso

- GIVEN el backend responde `422` con campos con error repartidos en dos pasos distintos
- WHEN se procesa la respuesta
- THEN el asistente muestra el primer paso, en orden, que tiene un campo con error
- AND el foco se mueve al primer campo con error de ese paso
- AND la barra de progreso marca todos los pasos con al menos un campo con error
- AND cada campo señalado conserva su propio mensaje

### Requirement: Diligenciamiento por pasos

El sistema **MUST** presentar el formulario como un asistente de cinco pasos: «Sus datos»,
«Datos académicos», «Motivo de la solicitud», «Firma» y «Revisar y enviar». Los cinco pasos
**MUST** estar montados desde el primer render; en cada momento, **MUST** haber exactamente uno
visible.

«Continuar» **MUST** validar únicamente los campos del paso visible. Si alguno falla, **MUST NOT**
avanzar y **MUST** mover el foco al primer campo inválido del paso, en el orden en que aparecen;
si todos son válidos, **MUST** avanzar al paso siguiente. «Volver» **MUST** conservar lo escrito
en todos los pasos, incluidos los que ya se dejaron atrás.

La barra de progreso **MUST** indicar el paso activo y **MUST NOT** ofrecer saltar a otro paso:
sus elementos **MUST NOT** responder a una interacción del estudiante.

El paso «Revisar y enviar» **MUST** mostrar un resumen por bloque de lo diligenciado en los pasos
anteriores, con un botón «Cambiar» por bloque. Al pulsar «Cambiar», el sistema **MUST** llevar al
estudiante al paso de ese bloque; desde ahí, **MUST** recorrer los pasos siguientes de uno en uno
con «Continuar», validando cada uno, hasta volver al paso de revisión.

El sistema **MUST** mover el foco al encabezado del paso visible en cada cambio de paso, incluida
la llegada al paso de revisión, salvo en el salto de un `422`, que lo lleva al primer campo con
error. Si el paso no tiene ningún campo inválido que pueda recibir el foco —el caso de la firma,
cuyo lienzo no es enfocable—, el foco **MUST** ir al encabezado del paso. El elemento que recibe el
foco **MUST** quedar a la vista.

El sistema **MUST NOT** emitir ninguna petición al backend antes de que el estudiante pulse
«Enviar solicitud» en el paso de revisión.

#### Scenario: Un paso a la vez, con los cinco montados

- GIVEN el asistente renderizado
- WHEN se inspecciona su árbol de componentes
- THEN los cinco pasos existen en el árbol
- AND exactamente uno de ellos es visible

#### Scenario: Continuar avanza al siguiente paso cuando el paso es válido

- GIVEN todos los campos obligatorios del paso visible diligenciados y válidos
- WHEN el estudiante pulsa «Continuar»
- THEN el asistente muestra el siguiente paso

#### Scenario: Volver conserva lo escrito

- GIVEN un valor diligenciado en el paso actual
- WHEN el estudiante pulsa «Volver» y luego regresa al mismo paso
- THEN el valor sigue diligenciado

#### Scenario: La barra de progreso no permite saltar de paso

- GIVEN el asistente renderizado en un paso distinto del primero
- WHEN se interactúa con un elemento de la barra de progreso
- THEN el paso visible no cambia

#### Scenario: Cambiar un bloque recorre los pasos siguientes

- GIVEN el estudiante en el paso de revisión, tras diligenciar los cinco pasos
- WHEN pulsa «Cambiar» en el bloque de un paso anterior al último, y luego «Continuar» en cada
  paso hasta volver a la revisión
- THEN el asistente pasa por cada paso siguiente en orden, validándolo
- AND termina de nuevo en el paso de revisión

#### Scenario: El foco se mueve al encabezado en cada cambio de paso

- GIVEN el asistente renderizado
- WHEN el estudiante cambia de paso con «Continuar», «Volver» o «Cambiar»
- THEN el foco queda en el encabezado del paso que se muestra

#### Scenario: Una firma faltante lleva el foco al encabezado del paso «Firma»

- GIVEN el paso «Firma» visible y sin firma
- WHEN el estudiante pulsa «Continuar»
- THEN el paso visible no cambia
- AND el foco queda en el encabezado del paso «Firma»

#### Scenario: No se emite ninguna petición antes de enviar en la revisión

- GIVEN el estudiante diligenció los cinco pasos y llegó a la revisión
- WHEN navega por los pasos anteriores sin pulsar «Enviar solicitud»
- THEN no se emite ninguna petición al backend
