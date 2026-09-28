# Issue #12 — Llamadas a endpoints inexistentes y el falso fallo al radicar

## Objetivo

Que el cliente deje de llamar endpoints que el backend no expone y que radicar una solicitud no
pueda reportar un fallo cuando la solicitud sí se creó.

## Problema y por qué

Radicar con un adjunto crea la solicitud (`201`), después falla la subida contra
`POST /requests/{id}/documents`, que no existe, y el formulario muestra el `detail` técnico del
404. Quien lo lee reintenta y crea un duplicado. Se comprobó en vivo el 2026-09-23 (comentario de
evidencia en el issue). Las demás llamadas muertas (`GET /documents`, descarga por id,
aprobaciones, `POST /assistant`) y el documento simulado completan los criterios de cierre.

Evidencia que decide el alcance (backend `origin/main` `412a5e0`):

- `model/Request.java:39-40`: el sistema no recibe archivos adjuntos (006, FR-010).
- `specs/006-verifiable-document-seal/spec.md:108` (FR-011): no se capturan firmas de aprobadores.
- `RequestController.java:50-55` y `:113-115`: el `POST` y el `GET /requests/{id}` devuelven el
  mismo `RequestResponse`.
- `DocumentServiceImpl.java:140`: cada `GET /requests/{id}/document` registra un sello.

## Alcance autorizado

Tres PRs secuenciales contra `main`, uno por criterio de cierre (decidido el 2026-09-23):

- **PR-1** (criterio 2): radicar ya no crea duplicados. Rama `fix/radicar-sin-duplicados-12`.
- **PR-2** (criterio 1): fuera las llamadas a endpoints inexistentes.
- **PR-3** (criterios 3 y 4): documento real en vez del simulado.

**Cambio de orden (2026-09-27).** La PR-3 fue antes que la PR-2, con `Relacionado: #12`,
porque la T4 reescribe el mismo archivo que el rediseño del detalle (#86). La T5 queda anulada
por el comentario del propietario del 2026-09-27 en #12: el asistente vuelve con la feature 010
del backend. Por eso la PR-2 **tampoco** cierra #12: `POST /assistant`
(`app/assistant/page.tsx:54`) sigue siendo una llamada muerta hasta que el backend mergee la 010
(rama `router-ia`, sin PR; el `main` del backend no expone `/assistant`). La PR-2 lleva
`Relacionado: #12`, y #12 se cierra con la 010.

Fuera de alcance: el defecto de `apiFetch` que serializa `FormData` como JSON (#10 §2.2), la
idempotencia del registro en el backend (Tramita#30) y los datos de prueba locales.

## Restricciones y decisiones

- TDD efectivo: estricto (`openspec/config.yaml:17`, `strict_tdd: true`); runner `pnpm test`.
- Revisión por recibos (RDD): apagada en este clon (`gentle-ai review mode status`, fuente
  `clone_local`). Verificación según el nivel de `gentle-ai review assess`.
- Estrategia de entrega: tres PRs decididos por el usuario; pronóstico por PR abajo.
- El campo de adjuntos se **retira**, no se deshabilita: un aviso de «no disponible todavía»
  prometería algo que el backend descartó (FR-010, FR-011).
- `createRequest` arma la solicitud con la respuesta del `POST` y no recarga: después del `201`
  no queda ninguna llamada que pueda convertir el resultado en error. El detalle ya recarga al
  montarse (`app/requests/[id]/page.tsx:85-88`).
- Los tests de PR-1 ejercen el `createRequest` real del `TramitaProvider` con `renderHook`,
  como `lib/use-coordination-inbox.test.ts`, en vez de extraer una función solo para probarla.
- Ruta de PR-1: implementación delegada. Evidencia del trigger: toca dos archivos de código no
  triviales (`lib/store.tsx`, `app/requests/new/page.tsx`) y sus pruebas.

## Tareas

### PR-1 — Radicar ya no crea duplicados (pronóstico: 120–200 líneas con pruebas)

- [x] **T1 — Fijar el contrato con pruebas en rojo**
  - Con `POST /requests` en `201`, `createRequest` resuelve con la solicitud del cuerpo aunque
    cualquier otra llamada falle, y hace una sola llamada.
  - Con `POST /requests` rechazado, `createRequest` sigue reportando el error del backend.
  - El formulario de radicación no ofrece adjuntar archivos.
  - Comprobación: pruebas enfocadas ejecutadas primero, con el fallo esperado registrado.

- [x] **T2 — Retirar la subida y la recarga**
  - Quitar `uploadDocument` (interfaz, provider y valor del contexto), `attachments` de
    `NewRequestInput` y `file` de `Attachment`.
  - `createRequest` usa `baseRequest` sobre la respuesta del `POST`.
  - Quitar del formulario el estado, el manejador y el campo de adjuntos; la tarjeta pasa a
    llamarse «Justificación».
  - Comprobación: pruebas enfocadas en verde, `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm lint`.

- [x] **T3 — Cerrar la unidad de trabajo** (PR #55, mergeada el 2026-09-23)
  - Revisar el diff, repetir una comprobación como padre y crear un commit convencional.
  - Abrir el PR con «Relacionado: #12» y la nota sobre #10 §2.2.

### PR-2 — Fuera las llamadas a endpoints inexistentes (rama `fix/llamadas-muertas-12`, desde `366ed13`)

- [x] **T4** — Retirar `GET /documents`, la descarga por id, las aprobaciones y la tarjeta
  «Documentos adjuntos» del detalle, con los tipos que queden sin uso. Plan aprobado por el
  propietario (2026-09-27), líneas verificadas sobre `366ed13`:
  - `lib/store.tsx`: `GET /documents` (`:268`, dentro de `loadRequest`), `GET …/approvals`
    (`:250`, `loadAttachment`) y `POST …/approvals` (`:366`, `registerDocumentApproval`).
    `loadRequest` queda con `/requests/{id}` y `/timeline`.
  - `app/requests/[id]/page.tsx`: la descarga `GET …/documents/{id}` (`:147`) y la tarjeta
    «Documentos adjuntos» con «Registrar firma» (`:468-624`).
  - `lib/types.ts`: `Attachment`, `AttachmentApproval`, `DocumentApprovalInput`, `SignatureType`
    y el campo `attachments` de `AcademicRequest`, que el backend nunca envía (FR-010).
  - El mensaje de resultado del detalle pasa a `string | null`: su único error era la descarga,
    y los errores de transición los muestra `ActionDialog` (T4a del rediseño).
  - Ruta: un escritor delegado (disparador: 5+ archivos de código y pruebas). TDD estricto,
    runner `pnpm test`. Garantías: refrescar una solicitud pide solo `/requests/{id}` y
    `/timeline`; el detalle no muestra «Documentos adjuntos» ni «Registrar firma».
  - No se tocan los parecidos: `canvas-firma` (firma del estudiante), el aviso de anexo de la
    009 y el `Content-Disposition: attachment` del PDF.
- ~~**T5** — Retirar `app/assistant/page.tsx` y su entrada en `components/app-shell.tsx`.~~
  Anulada el 2026-09-27 (comentario del propietario en #12).

### PR-3 — Documento real en vez del simulado (rama `fix/documento-real-12`, desde `0f99c23`)

- [x] **T6** — Retirar `PdfDocument` y el botón «Imprimir»; corregir los textos falsos de
  `app/requests/[id]/documento/page.tsx`. Líneas re-verificadas el 2026-09-27 sobre `0f99c23`:
  - `components/pdf-document.tsx` (169 líneas): «DOCUMENTO OFICIAL» (`:31`) y «Se autoriza»
    (`:91`, `:99`) con cualquier estado final, rechazo incluido; «Verificable con folio RC-…»
    (`:8`, `:162-163`), un folio que `/verificar` rechaza por formato; fabrica un documento de
    novedad de notas que el backend no emite.
  - «Imprimir» (`:133-140`) imprime la pantalla con la simulación, no el PDF real.
  - Aviso de descarga (`:166-170`): muestra `constancia_{radicado}.pdf`, pero el archivo se guarda
    con el nombre del `Content-Disposition` (`DO-FR-100-<id>.pdf`). Era la `:169` original.
  - Evidencia nueva: con estado final dice «Documento oficial de cierre» (`:114`) y «constituye la
    constancia formal del trámite» (`:119`). El PDF real es el DO-FR-100 «Solicitud de excepción
    de matrícula», y el backend descartó esa constancia a propósito (`DoFr100Renderer.java:44-47`).
  - La `:121` original («y fue notificado al estudiante») ya la retiró `678ece2` (#59).
  - Decisión del criterio 3: sin vista previa; la página queda con la descarga y los metadatos,
    y se imprime el PDF real. Descartado embeber el PDF: cada `GET /requests/{id}/document`
    registra un sello (`DocumentServiceImpl.java:140`), así que cada visita inflaría el historial
    de emisiones. Descartado mover la descarga al detalle: más alcance sin ganancia.
  - Ruta: un escritor delegado (disparador: página y pruebas, dos archivos no triviales). TDD
    estricto, runner `pnpm test`. Garantías: un rechazo no se presenta como documento oficial ni
    ofrece «Imprimir»; el aviso nombra el archivo guardado; la página enlaza a `/verificar`. Se
    borra la prueba `#9b` (`page.test.tsx:98`), porque lo que protegía vivía en `PdfDocument`.
- [x] **T7** — Comprobar en vivo la descarga real, con permiso previo (registra un sello).

## Criterios de aceptación (de #12)

1. Ninguna llamada a un endpoint inexistente.
2. Radicar una solicitud no puede reportar un fallo cuando la solicitud sí se creó.
3. Decisión tomada y registrada sobre el documento imprimible.
4. `GET /requests/{id}/document` se consume como descarga, no como JSON.

## Progreso y evidencia

- Estado inicial: `main` en `32a8370`, worktree limpio, sin PRs abiertos. Suite base:
  24 archivos, 238 pruebas en verde.
- T1 RED observado (escritor delegado, repetido por el padre con los cambios de producción
  apartados): `pnpm exec vitest run lib/store.test.ts app/requests/new/page.test.tsx` →
  2 fallidas, 14 aprobadas. `createRequest` rechazó con «No debería llamarse»: la recarga
  posterior al `201` alcanzó la ruta que falla, que es el bug. El formulario todavía mostraba
  «Adjuntar documento de soporte». La prueba del `POST` rechazado ya pasaba (guarda de
  regresión).
- Desvío de TDD reportado por el escritor: editó `lib/types.ts` antes de escribir las pruebas,
  lo revirtió antes de ejecutar nada y recién entonces escribió T1. El RED de arriba se
  observó sobre el código original.
- T2 GREEN observado (sobre el diff final, tras los ajustes del padre a comentarios y datos de
  prueba):
  - Pruebas enfocadas: 16 aprobadas.
  - `pnpm test`: 24 archivos, 241 pruebas aprobadas (238 + 3 nuevas).
  - `pnpm exec tsc --noEmit`: código 0.
  - `pnpm lint`: código 0.
- `gentle-ai review assess` (RDD apagado): riesgo `medium` (`executable_change`), 339 líneas
  con este documento, `review_due: false` (`under_budget`). Verificación aplicada:
  autoverificación del escritor más la comprobación puntual del padre.
- T3: diff revisado y aprobado por el usuario; commit `5f1cf71`
  (`fix(radicacion): radicar ya no reporta un fallo después de crear la solicitud`),
  6 archivos, +252 −106. Pendiente: abrir el PR.
- Prueba en vivo (2026-09-23, rama sobre el backend local `412a5e0`, datos ficticios): el
  formulario no tiene `input[type=file]` y la tarjeta se llama «Justificación». Radicar hizo un
  solo `POST /requests` (`201`) y ninguna subida; la página navegó al detalle con el aviso de
  éxito y sin errores, y la bandeja pasó de 40 a 41 solicitudes (una sola del estudiante de
  prueba). El detalle cargó dos veces porque Strict Mode ejecuta los efectos dos veces en
  desarrollo (activo por defecto con el App Router, `reactStrictMode.md` de Next); cada carga
  todavía pide `GET /documents` (404), que retira PR-2.
- 2026-09-27, antes de la PR-3: `main` en `0f99c23` (con #83, `/verificar`), worktree limpio,
  suite 29 archivos y 365 pruebas en verde. RDD `off` por `clone_local`. La otra sesión
  (`feat/detalle-ui`) no toca `documento/page.tsx`, `pdf-document.tsx` ni este documento.
- T6 (escritor delegado; diff revisado por el padre y aprobado por el propietario):
  - RED: `pnpm exec vitest run 'app/requests/[id]/documento/page.test.tsx'` → 3 fallidas. T-A
    encontró «Se autoriza» (vista previa) en un rechazo; T-B no encontró el enlace «Verificar
    documento»; el test de descarga no encontró `DO-FR-100-request-1.pdf` en el aviso, que decía
    `constancia_RAD-2026-001.pdf`.
  - GREEN: 3 de 3. `pnpm test`: 29 archivos, 364 pruebas (365 menos la `#9b` borrada), repetido
    por el padre; `tsc`, `pnpm lint`, `pnpm build` y `git diff --check` limpios.
  - Mutantes (escritor; el del aviso repetido por el padre): «Imprimir» de vuelta, título «Documento
    oficial de cierre», nombre fijo `constancia_…` y enlace a `/verificar` quitado. Los cuatro
    mueren; restauración con `cp` y `cmp` idéntico.
  - Referencias a lo borrado: solo en registros históricos (`odd/tasks/documento-disponible-en-curso-38.md`
    y cambios archivados de openspec). Ninguna spec viva de `openspec/specs/` exige la vista previa.
  - Commit `4280671` (`fix(documento): la página del documento deja de afirmar lo que el PDF no es`),
    3 archivos, +41 −261.
- T7 en vivo (Chrome, 2026-09-27, backend local, con permiso del propietario; registró un sello):
  - Solicitud en curso `0b934002…`: sin vista previa ni «Imprimir», ninguno de los textos «Se
    autoriza», «DOCUMENTO OFICIAL», «Verificable con folio», «constancia formal» u «oficial de
    cierre»; enlace a `/verificar` presente.
  - Descarga: el aviso dijo `DO-FR-100-0b934002-e36f-4f3c-b0d3-fd7b330a6e23.pdf` y en `~/Descargas`
    se guardó un archivo con ese nombre exacto. Su pie: `Verificación: <código> · Emitido:
    27/09/2026 · Estado: En coordinación (revisión) · Revisión: 0`. Desde el enlace de la página,
    `/verificar` devolvió la misma fecha, estado y revisión.
  - Solicitudes cerradas (solo lectura, sin descargar): una `RECHAZADA` y una `FINALIZADA` muestran
    «Documento de la solicitud» con su estado real y ninguno de los textos falsos.
  - Criterio 4 confirmado: la descarga llega como archivo (`blob`), no como JSON.
- PR-3 mergeada como #84 (`d6ad98e`, 2026-09-27 21:39 -0500), CI verde; #12 sigue abierta, como se
  esperaba. El rediseño del detalle (#86) se mergeó a continuación sin revertir nada de la PR-3.
- 2026-09-27, antes de la PR-2: `main` en `366ed13`, worktree limpio, sin PRs abiertas. Suite
  base: 29 archivos, 381 pruebas en verde; `tsc` y `pnpm lint` limpios.
- T4 (escritor delegado; diff revisado por el padre y aprobado por el propietario):
  - RED: `pnpm exec vitest run lib/store.test.ts 'app/requests/[id]/page.test.tsx'` → 2 fallidas,
    50 aprobadas. `refreshRequest` pidió un tercer path (`/documents`); el detalle mostró dos veces
    «documentos adjuntos» (título y texto de vacío).
  - GREEN: los mismos dos archivos, 51 aprobadas. `pnpm test`: 29 archivos, 382 pruebas (381 + 2
    nuevas − 1 borrada, la del error de descarga), repetido por el padre; `tsc`, `pnpm lint`,
    `pnpm build` y `git diff --check` limpios.
  - Búsqueda de nombres retirados (`attachments`, `Attachment*`, `DocumentApprovalInput`,
    `SignatureType`, `registerDocumentApproval`, `mapApproval`, `loadAttachment`, `ApiDocument`):
    sin resultados en `app`, `components` ni `lib`. Hace falta porque ni `tsc` ni ESLint marcan
    imports sin uso en este repo.
  - Mutantes: `/documents` de vuelta en `loadRequest` (repetido por el padre) y la tarjeta de
    vuelta. Los dos mueren; restauración con `cp` y `cmp` idéntico.
  - Corrección del padre al escritor: los comentarios nuevos citaban «spec.md:108» sin la
    feature; ahora dicen «spec 006, FR-011».
  - Commit `ae09837` (`fix(solicitudes): deja de pedir documentos que el backend no expone`),
    8 archivos, +54 −449.
