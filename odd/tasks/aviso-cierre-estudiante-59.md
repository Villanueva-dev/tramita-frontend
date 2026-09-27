# Issue #59 — Aviso manual de cierre al estudiante

## Objetivo y problema

Ofrecer desde el detalle de una solicitud pública finalizada enlaces de correo y, cuando aplique,
WhatsApp con un texto mínimo y veraz. Hoy el backend entrega origen y datos de contacto, pero el
frontend no los mapea ni ofrece los enlaces; además, el documento afirma sin evidencia que el
estudiante fue notificado.

## Alcance autorizado

- Mapear `origin` y `studentPhone` del detalle; ausencia de origen significa `null`.
- Ofrecer correo y, solo para un móvil colombiano `^3\d{9}$`, WhatsApp cuando
  `origin === 'PUBLIC_LINK' && currentState.isFinal` (incluido rechazo).
- Usar en ambos enlaces el mismo mensaje compuesto únicamente por nombre del estudiante,
  nombre del trámite y nombre del estado. Codificar UTF-8 y CRLF (`%0D%0A`) en `mailto:`.
- Actualizar el aviso inmediatamente tras una transición final sin recargar y retirar del
  documento la afirmación no comprobada de notificación.
- Fijar con pruebas que solicitudes de Coordinación, de origen desconocido y en estados
  intermedios no ofrecen enlaces; novedad de notas es un caso de Coordinación.

Fuera de alcance: enviar mensajes automáticamente, registrar un estado «avisado», cambiar el
backend, añadir información privada al texto o modificar el flujo de transición existente.

## Restricciones y ruta

- Rama: `feat/aviso-cierre-estudiante-59`, desde `main` `1be4fa5`.
- TDD estricto activado por las instrucciones del proyecto: RED → GREEN → REFACTOR; runner
  `pnpm test` (`vitest run` en `package.json`).
- Ruta: implementación directa delegada. Evidencia: mapear y presentar los datos exige varios
  archivos de lógica y pruebas; la exploración de 4+ archivos se delegó antes del primer cambio.
- RDD efectivo: `off` por `clone_local` (`gentle-ai review mode status`); no activarlo.
- Estrategia de entrega: `ask-on-risk`. Pronóstico inicial: 300–400 líneas autorales para código,
  pruebas y este seguimiento; revisar el conteo real antes de cada commit. El umbral de 400 es
  orientativo por tarea y de planificación de entrega, no una razón para recortar pruebas.
- No hacer push, abrir PR ni cerrar la issue sin una autorización separada para la operación remota.

## Tareas

- [x] **T1 — Transportar los datos de contacto del contrato.** Primero probar en RED el mapeo de
  `origin` y `studentPhone` (incluidas claves ausentes), luego añadir los tipos y el mapeo sin
  duplicar la enum `InboxOrigin`. Actualizar solo los fixtures afectados. Comprobar pruebas
  enfocadas, suite, TypeScript y lint. Cerrar con un commit convencional de la unidad.
- [x] **T2 — Ofrecer el aviso veraz y corregir el documento.** Primero probar en RED estados
  finales/intermedios, origen público/interno/desconocido, rechazo, teléfono fijo/móvil, privacidad
  de enlaces, CRLF y aparición tras transición modificando `getRequest`; probar también el texto
  falso del documento. Luego implementar la UI y retirar la afirmación. Comprobar pruebas
  enfocadas, suite, TypeScript, lint y build. Cerrar con un commit convencional de la unidad.
- [x] **T3 — Retirar promesas falsas del formulario interno.** El comentario nuevo del propietario
  en #59 detectó dos frases que prometen un envío inexistente. Primero fijar en RED que no se
  muestran; luego dejar «El estudiante no accede al sistema.» y quitar la promesa junto al correo,
  conservando el campo y su envío al backend. Comprobar pruebas enfocadas, suite, TypeScript,
  lint y build; cerrar con un commit convencional.

## Criterios de aceptación

1. Los enlaces solo aparecen para origen público y estado final; el rechazo cuenta.
2. El correo requiere `studentEmail`; WhatsApp requiere `studentPhone` móvil válido.
3. Los enlaces contienen únicamente nombre, trámite y estado, y `mailto:` usa `%0D%0A`.
4. Tras transicionar a un estado final, aparecen sin recargar la página.
5. Ninguna pantalla afirma que el estudiante ya fue notificado.
6. Las comprobaciones aplicables quedan registradas con resultados observados.

## Progreso y evidencia

- Estado inicial: `main` limpio en `1be4fa5`; #59 abierta. Rama de trabajo creada.
- Clasificación de raíz: bug real del flujo de comunicación de cierre (aviso manual ausente y
  afirmación de envío no demostrable). No crear bandera local de «avisado».
- T1 RED: `pnpm test -- lib/store.test.ts` falló porque `origin` recibido era `undefined`.
  GREEN: el mismo comando y `pnpm test` aprobaron 28 archivos y 348 pruebas; TypeScript y
  `pnpm lint` terminaron con código 0; `git diff --check` no encontró errores. Lint falló primero
  por la base de datos de `pnpm` en el sandbox y aprobó al repetirse fuera de él.
- T1: `d4756c4` — `feat(solicitudes): mapea origen y teléfono del estudiante` (105 líneas
  autorales, incluido este seguimiento). Riesgo nativo `medium`; RDD permanece desactivado.
  Prueba de ejecución en vivo: N/A, esta unidad solo transporta los campos y se ejerció en el
  límite de `baseRequest`. Reversión: retirar `d4756c4` elimina el mapeo y sus fixtures, sin
  afectar el selector de programas ni el aviso de anexo.
- T2 RED: cinco aserciones nuevas fallaron antes de implementar los enlaces y corregir la
  afirmación del documento. GREEN tras reutilizar `isFinalized`: `pnpm test` aprobó 28 archivos
  y 354 pruebas; `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm build` y `git diff --check`
  terminaron con código 0. Lint y una ejecución de tests necesitaron repetición fuera del
  sandbox por un error local de base de datos de `pnpm`.
- T2: `678ece2` — `feat(solicitudes): ofrece aviso manual al cerrar trámites públicos` (215
  líneas autorales, incluido el avance anterior de este documento). Riesgo nativo `medium`;
  RDD permanece desactivado. La prueba de ejecución en vivo es N/A: no se abrió el cliente de
  correo ni WhatsApp desde un navegador autenticado; las pruebas de componente fijan el `href`
  exacto y el cambio de estado sin recarga. Reversión: retirar `678ece2` elimina enlaces y la
  corrección del texto, sin quitar el mapeo de T1.
- Total inicial de la rama frente a `main`: 320 líneas autorales antes de este cierre documental;
  sigue por debajo del umbral de planificación de una PR. Entrega remota pendiente de autorización.
- Seguimiento nuevo: comentario del propietario en #59 del 2026-09-27 03:35 UTC añade dos
  promesas falsas en `app/requests/new/page.tsx`. Se conserva el correo; T3 debe corregir solo
  el texto. Se abre T3 antes de proponer la entrega de la rama.
- T3 RED: el test nuevo falló porque no existía la frase exacta «El estudiante no accede al
  sistema.». GREEN: `pnpm test` aprobó 28 archivos y 355 pruebas; TypeScript, lint, build y
  `git diff --check` aprobaron. El test comprueba que el correo sigue en el formulario y en el
  objeto enviado al store. Prueba en vivo: N/A, esta unidad solo retira copy; el DOM se verificó
  con la prueba de componente. Riesgo nativo `medium`; RDD sigue desactivado.
- T3: `79816a5` — `fix(solicitudes): elimina promesas falsas de notificación` (30 líneas
  autorales, incluido el plan T3). Reversión: retirar este commit restaura únicamente esos
  textos y su test; no afecta los enlaces manuales ni el transporte de correo.
- Total de la rama antes de este cierre documental: 359 líneas autorales frente a `main`.
  Siguiente paso: solicitar autorización para publicar la rama y abrir la PR de #59.
