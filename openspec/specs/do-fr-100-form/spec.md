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

El sistema **MUST** presentar los bloques del formato en el orden del papel: lugar y fecha, tipo
de solicitud, datos del solicitante, motivo, compromisos adquiridos y firma; y **MUST** conservar
los rótulos oficiales de los campos que el estudiante diligencia.

El sistema **MUST** afirmar el tipo de solicitud como dato —«Matrícula créditos adicionales»— y
**MUST NOT** presentar las otras tres casillas de tipo del formato: existían para que la
Coordinación reconociera el papel y no son elegibles por el estudiante.

El sistema **MUST NOT** presentar las trece casillas de motivos del formato. Pertenecen a otros
tipos de solicitud y no a la adición de créditos, y la Coordinación confirmó que ese campo casi
no se diligencia (2026-09-16). El motivo se captura como texto libre.

#### Scenario: Orden y rótulos de los bloques

- GIVEN el formulario renderizado
- WHEN se recorre su contenido de arriba a abajo
- THEN los bloques aparecen en el orden del formato oficial
- AND los rótulos de los campos diligenciables coinciden con los de la plantilla v2024

#### Scenario: No hay casillas de tipo de solicitud ni de motivos

- GIVEN el formulario renderizado
- WHEN se buscan casillas de tipo de solicitud distintas a la afirmada, o casillas de motivo
- THEN no existe ninguna
- AND el tipo de solicitud aparece afirmado como «Matrícula créditos adicionales»

### Requirement: Todos los campos son obligatorios

El sistema **MUST** exigir los once campos del contrato público antes de emitir la petición:
`studentName`, `studentDocument`, `studentEmail`, `studentPhone`, `program`, `campus`, `faculty`,
`modality`, `semester`, `reason` y `signature`. **Ningún campo del formulario puede quedar
vacío.** La verificación de vacío **MUST** aplicarse después de `trim()`, de modo que un valor
compuesto solo por espacios no cuente como diligenciado.

El sistema **MUST** respetar los límites de longitud del contrato: `studentName` ≤120,
`studentDocument` ≤20, `studentEmail` ≤255, `studentPhone` exactamente 10 dígitos, `program`
≤120, `campus` ≤120, `faculty` ≤120, `modality` ≤50, `semester` ≤50, `reason` ≤2000.
`studentPhone` deja de ser un tope de longitud como los demás: la feature 008 del backend lo
enmienda a exactamente diez dígitos (`^[0-9]{10}$`,
`Tramita/specs/004-public-request-capture/contracts/openapi.yaml:253-262`), y diez dígitos
también cumplen la regla anterior de la 004 (cualquier texto de hasta 30 caracteres), así que el
formulario puede adoptarla antes que el backend.

`studentDocument` y `studentPhone` **MUST** aceptar solo dígitos y **MUST** descartar
cualquier otro carácter al teclearlo o pegarlo. `studentDocument` conserva su tope de 20 y
viaja como texto. Esta es una regla de UX decidida el 2026-09-25: el backend no la exige para
`studentDocument`.

Esta validación es **de UX**: el backend sigue siendo la autoridad.

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
| `413` | Mensaje que orienta a limpiar la firma y volver a trazarla |
| `422` | Error atado a cada campo que nombre el `problem+json`, distinguiendo faltantes de inválidos |
| `429` | Mensaje con el tiempo de espera, reusando el manejo de `Retry-After` existente |
| otros | Aviso general del formulario |

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

#### Scenario: El enlace no está habilitado

- GIVEN el backend responde `404`
- WHEN se procesa la respuesta
- THEN se muestra un mensaje accionable que no revela si el trámite existe
- AND los datos diligenciados se conservan

#### Scenario: El cuerpo excede el tope

- GIVEN el backend responde `413`
- WHEN se procesa la respuesta
- THEN el mensaje orienta a limpiar la firma y trazarla de nuevo

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
- THEN el mensaje indica cuántos segundos esperar
- AND los datos diligenciados se conservan
