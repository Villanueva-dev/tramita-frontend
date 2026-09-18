# Proposal: Formulario público del DO-FR-100 — matrícula de créditos adicionales

> **Reorientada el 2026-09-16.** Esta change se escribió para una pantalla **interna**, montada
> sobre el gate de sesión y enviando a `POST /requests`. La reunión con la Coordinación del
> 2026-09-15 la volvió **pública**: la llena el estudiante desde un enlace, sin cuenta.
> Lo que sobrevivió del planteamiento original está marcado como tal; lo que se cae, también.
>
> **Cómo se midió.** Las afirmaciones sobre el repo salen de lecturas con número de línea
> ejecutadas el 2026-09-16 sobre `0fee444`. Las afirmaciones sobre el backend salen de
> `../Tramita/specs/004-public-request-capture/` y de las migraciones en
> `../Tramita/src/main/resources/db/migration/`. Lo no medido se declara como tal en el punto
> donde aparece.

## Intent

La Coordinación aceptó que el formato DO-FR-100 lo diligencie **el estudiante**, desde un enlace
público, en vez de diligenciarlo ella a partir de un correo. Esta pantalla es ese enlace.

El cambio no es cosmético. Elimina el paso de transcripción manual —origen de los errores que
devuelven el trámite— y convierte al estudiante en quien escribe sus propios datos. El backend
lo declara así en `../Tramita/specs/004-public-request-capture/spec.md:25-36` (User Story 1, P1).

Sigue sirviendo al propósito original —la tutora del proyecto de grado no es técnica y necesita
reconocer el avance en pantalla— pero ese ya no es el motor: el motor es una decisión de producto
tomada con la usuaria real.

### Quién la usa, y por qué eso cambió el diseño

**Un estudiante, en un celular.** No la Coordinación en un escritorio.

Ese dato no está declarado en ningún artefacto del backend: `spec.md` de la 004 no menciona
móvil, celular, teléfono ni dispositivo **ni una sola vez** (verificado con `grep -i` el
2026-09-16). Lo aportó el responsable del proyecto en la sesión de reorientación, y obliga a
revisar el criterio de desempate que esta change traía escrito.

**El criterio «fidelidad al papel» cambió de dueño.** Se fijó cuando el lector era la
Coordinación, que reconoce el DO-FR-100 porque lo tramita a diario. Para un estudiante que
probablemente nunca vio el formato, reproducir seis tablas administrativas no es familiaridad:
es fricción, y en 390 px de ancho es scroll.

**Criterio vigente, que reemplaza al anterior**: conservar la fidelidad **donde el estudiante la
necesita** —el orden de los datos, los rótulos oficiales, el recuadro de firma— y replegar lo que
existía solo para que la Coordinación reconociera el papel.

## Scope

### In Scope

- **Pantalla pública** en `app/solicitud/creditos-adicionales/page.tsx`, **sin `AppShell`** y por
  tanto sin gate de sesión, que envía a `POST /api/public/requests/ADICION_CREDITOS`.
- **Once campos obligatorios**: `studentName`, `studentDocument`, `studentEmail`, `studentPhone`,
  `program`, `campus`, `faculty`, `modality`, `semester`, `reason` y `signature`.
  **Ningún campo del formulario puede quedar vacío** (decisión del responsable, 2026-09-16).
- **Firma trazada en pantalla**, capturada en un `<canvas>` propio y enviada como URL de datos.
- **Acuse de recibo en la misma página**: el `201` no devuelve identificador, así que no hay a
  dónde navegar.
- **Motivo como texto libre**: las trece casillas del formato **se eliminan**.
- **TDD estricto** (`openspec/config.yaml:17`) con los valores sintéticos de `BRIEF.md:42-53`.

### Out of Scope

| Queda fuera | Por qué |
|---|---|
| Reemplazar `app/requests/new/page.tsx` | Funciona, registra solicitudes reales y tiene tests vivos. **Conviven.** Invariante de esta change, igual que antes. |
| La vista de recientes de la Coordinación | El backend la trae en la misma feature (`GET /requests/inbox`, US2), pero es una pantalla de la bandeja, no del formulario. Change aparte. |
| Sección de asignaturas / tope de créditos | El formato no tiene tabla de asignaturas: la materia entra en prosa dentro de «Compromisos adquiridos». Confirmado por la Coordinación el 2026-09-13. El tope además **salió del alcance del sistema** el 2026-09-15: lo determina CLASS. |
| Firmas de los aprobadores, adjuntos, PDF | Es SP4 y SP3 (`Tramita#11`, `Tramita#10`). El vocabulario `SignatureType`/`AttachmentApproval` de `lib/types.ts:57-77` describe **esas** firmas, no la del estudiante. No mezclarlos. |
| Enlace en el menú de navegación | La pantalla es pública y no monta el shell: no hay menú donde ponerlo. |

### Lo que se cae del planteamiento original

- **La pantalla interna con `AppShell`.** `components/app-shell.tsx:46-47` hace
  `router.replace('/')` dentro de un `useEffect`, y `:142` devuelve `null` sin sesión. Una
  pantalla pública montada sobre él sería **redirigida al login**. El design anterior citaba
  `:130-132` y `:150` — líneas que ya no corresponden a ese archivo.
- **La ruta `app/formatos/do-fr-100/`.** Se eligió para no encender el ítem «Nueva solicitud» del
  nav. Sin `AppShell` no hay nav en esta pantalla, así que ese criterio ya no discrimina y la
  ruta se elige por lo que ahora importa: es una URL que un estudiante recibe por correo.
- **Los 13 motivos y su deuda declarada.** Las casillas pertenecen a **otros tipos de solicitud**
  del formato, no a adición de créditos, y la Coordinación confirmó que ese campo casi no se
  llena y no tiene mayor valor. Sin casillas no hay deuda que migrar a configuración del trámite.
- **«El backend no se toca».** Dejó de ser cierto: ver *Dependencies*.

## Capabilities

### Modified Capabilities

- `do-fr-100-form`: la capability existe pero cambia de raíz — canal público sin sesión, once
  campos obligatorios, firma trazada, acuse sin identificador y motivo como texto libre.
- `workflow-requests`: su delta **sobrevive con un ajuste menor**. Seguía haciendo falta porque
  una pantalla que reproduce un formato oficial declara su trámite en vez de ofrecer un selector.
  Lo único que cambia es **dónde** se usa el literal: antes viajaba en el cuerpo como
  `definitionCode`; ahora arma la ruta `POST /api/public/requests/ADICION_CREDITOS`. Sigue
  apareciendo **exactamente una vez** en el código de la pantalla.

## Approach

Una ruta pública con un solo formulario, siguiendo la estructura idiomática del App Router y el
par container/presentational: la página orquesta estado, validación de UX y envío; la
presentación de cada bloque se compone de primitivas de `components/ui/`.

El transporte **no se toca**: `lib/api.ts:94-97` pone el header `X-XSRF-TOKEN` solo `if (token)`,
así que `apiFetch` funciona sin cookie CSRF y sin sesión. Lo que hace falta es una función de
dominio nueva con su propio allowlist —`submitPublicRequest`—, no un cliente HTTP nuevo.

Los errores se renderizan reusando el camino RFC 9457 que ya existe (`apiErrorMessages`,
`lib/api-errors.ts`), que **ya maneja el `429` con `Retry-After`** (`:31-36`): cero trabajo de UI
para el límite de envíos del canal público.

## Affected Areas

| Área | Impacto | Detalle |
|---|---|---|
| `app/solicitud/creditos-adicionales/` + tests | New | Container público, sin `AppShell` |
| `components/do-fr-100/` | New | Presentational de los bloques del formato |
| `components/firma/` | New | Captura del trazo en `<canvas>` |
| `lib/api.ts` | **Modified** | Agrega `submitPublicRequest` con allowlist propio. `createRequest` **no se toca** |
| `lib/types.ts` | **Modified** | Tipo del cuerpo público y del acuse |
| `openspec/specs/workflow-requests/spec.md` | Modified | Ajuste menor: el literal arma la ruta |
| `app/requests/new/**`, `components/app-shell.tsx` | **Sin tocar** | Invariante |

## Decisiones tomadas — no re-litigar

Las seis se cerraron con el responsable del proyecto el 2026-09-16.

1. **Ruta**: `app/solicitud/creditos-adicionales/`. Lenguaje del estudiante, no jerga interna;
   `DO-FR-100` es un código que él no conoce. Se descartó `app/solicitud/[definitionCode]/` por
   YAGNI: hoy hay un solo trámite público y el backend ya decide cuáles lo son por configuración.
2. **Sin `AppShell`**: la pantalla es pública; montar el shell la redirigiría al login.
3. **Firma**: `<canvas>` propio con suavizado, sin dependencias. Ver el design.
4. **Acuse in-place**: el formulario se reemplaza por la confirmación. Una ruta `/enviado` sería
   alcanzable por URL directa sin haber enviado nada, y un refresh podría re-enviar.
5. **Motivo como texto libre**: se eliminan las trece casillas.
6. **Ningún campo puede quedar vacío**, y los cuatro que hoy no se persisten pasan a persistirse.

## Preguntas a la Coordinación

| # | Pregunta | Estado |
|---|---|---|
| 1 | ¿Capturar la asignatura aparte (código, nombre, créditos)? | ✅ **No** (2026-09-13). Va como texto libre en «Compromisos adquiridos». |
| 2 | ¿Las 13 casillas de motivos siguen vigentes? | ✅ **Resuelta (2026-09-16)**: pertenecen a otros tipos de solicitud, no a adición de créditos, y casi no se llenan. **Se eliminan.** |
| 3 | ¿Correo y contacto se usan operativamente? | ✅ **Sí**: la Coordinación responde por correo. Ambos pasan a persistirse. |
| 4 | ¿Quién diligencia el formato? | ✅ **Resuelta por la reunión del 2026-09-15**: el estudiante, desde un enlace público. Es el origen de esta reorientación. |
| 5 | ¿Basta con dejar constancia de la firma, o hay que adjuntar el PDF firmado? | ⏳ **Pendiente.** No la resuelve `Tramita#11` (SP4, otro alcance). |
| 6 | ¿Una firma manuscrita digitalizada es dato biométrico bajo la Ley 1581 de 2012? | ⏳ **Pendiente**, probablemente para jurídica y no para la Coordinación. Declarada *provisional y no auditada* en `../Tramita/specs/004-public-request-capture/research.md:148-154`. |

## Issues relacionados

Verificado el 2026-09-16 contra los dos repositorios.

| Issue | Relación |
|---|---|
| **`tramita-frontend#2`** | **Es el issue de esta change.** Las PRs lo cierran con `Closes #2`. ⚠️ Su cuerpo quedó vencido: afirma «sin cambios en el backend» (hoy son cuatro columnas), lo declara «en `next: propose`», y repite que `Tramita#17` se cerró — **#17 sigue abierto**. Comentado el 2026-09-16 con la rectificación. |
| **`tramita-frontend#7`** | **Sube de prioridad por esta feature.** Ver *Risks*. |
| **`Tramita#20`** | **Bloquea el desarrollo.** Ver *Dependencies*. |
| `Tramita#18` | El pedido que la feature 004 del backend satisface. La PR del backend lo cierra. |
| `Tramita#10` (SP3) | Las cuatro columnas nuevas existen para que el PDF reproduzca el formato oficial: es el argumento que sostiene §III. |
| `Tramita#13` (SP7) | `V2.3.0` excluyó `student_email` por «no tener consumidor». Ahora lo tiene, y el acuse de esta pantalla le promete al estudiante que la Coordinación responde a ese correo. |
| `Tramita#12` (SP5) | La US2 de la 004 (`GET /requests/inbox`) lo cubre en especificación; la pantalla que lo consume es una change aparte. |
| `tramita-frontend#10`, `#11`, `#12` | Tocan `lib/api.ts` (que esta change modifica), el criterio de «tests intactos y verdes», y la decisión de que esta pantalla **no** consuma el store. |
| `Tramita#22` | **No toca**: el formulario público no muestra el recorrido del trámite. |

## Risks

| Riesgo | Prob. | Mitigación |
|---|---|---|
| **Suplantación**: un visitante sin sesión envía un formato a nombre de otro | Media | **Aceptado y declarado** en el spec del backend. Lo contiene la revisión de la Coordinación, que ya existe como paso del flujo. El front no puede mitigarlo y **no debe simular que sí**. |
| **La superficie de Next queda expuesta sin autenticación** (`tramita-frontend#7`) | **Alta si no se actualiza** | Next 16.2.6 acumula **dos RCE críticas sin autenticar**, parcheadas en `>=16.3.3`. Hoy toda la aplicación vive detrás del login, así que explotarlas exige credenciales. **Esta pantalla cambia eso de clase, no de grado: basta tener el enlace.** Mitigación: subir a `>=16.3.3` **antes** de publicar la pantalla. El issue matiza que la RCE de Windows probablemente no aplica (despliegue Linux) y la de AVIF probablemente está mitigada por `images: { unoptimized: true }` (`next.config.mjs:3-5`, **no verificado a fondo**) — son dos capas de suerte, no una decisión. |
| El trazo de la firma resulta ser dato biométrico | Desconocida | Pregunta 6, abierta. La salida documentada es sustituir el trazo por el nombre tipografiado: el cambio queda confinado al componente de captura. Ver design. |
| Dato personal real del PDF llega al repo público | Baja | Solo valores sintéticos (`BRIEF.md:42-53`). El repo es público. |
| El formulario en móvil resulta demasiado largo igual | Media | El repliegue lo acorta, pero **no está medido con un estudiante real**. Criterio de reconsideración: si alguien abandona a mitad, se parte en pasos. |
| Romper la pantalla existente por refactor «de paso» | Baja | Invariante: sus tests siguen verdes sin modificarlos. |

## Rollback Plan

La change es **aditiva en el front**: archivos nuevos más dos funciones agregadas en `lib/`. Un
`git revert` de la PR retira la pantalla y deja el resto exactamente como está.

⚠️ **El backend no comparte esa propiedad**: la migración que agrega las cuatro columnas es
`ALTER TABLE` y Flyway no la revierte sola. El rollback del front es trivial; el del backend
sigue las reglas del backend.

## Dependencies

🔴 **Bloqueo real: el endpoint público no existe todavía.** Las 45 tareas de
`../Tramita/specs/004-public-request-capture/tasks.md` están en **0/45**. Hasta que exista, esta
pantalla solo puede verificarse contra mocks; la prueba end-to-end queda pendiente.

🔴 **La allowlist de CORS apunta al puerto equivocado** (`Tramita#20`, abierto).
`APP_CORS_ALLOWED_ORIGINS=http://localhost:5173` —el puerto por defecto de **Vite**— está en
`.env.example:4`, en el quickstart y en cinco IT; solo `README.md:190` tiene el `3000` de Next.
`.env.example` es el vector: de ahí copia cada integrante su `.env`, y la variable no tiene
default. **Hasta que se corrija, el formulario no puede probarse contra el backend local.**

⚠️ **Y algo que ningún documento contemplaba hasta hoy**: en desarrollo el front llama por ruta
relativa a través de su proxy, así que CORS no se ejercita. **En producción el formulario lo abre
un estudiante desde cualquier lugar**, y si el front y el backend quedan en orígenes distintos,
**el origen público debe estar en la allowlist**. No está escrito en el plan del backend ni estaba
en este design. Es una tarea de despliegue, no de código, y por eso se pierde fácil.

🔴 **La decisión 6 reabre la feature 004 del backend**, que tenía el plan cerrado. Medido sobre
las migraciones el 2026-09-16:

- `request` tiene hoy `student_name` y `student_document` como `NOT NULL` (`V2.0.0:54-55`), más
  `student_code`, `program`, `semester` y `reason` opcionales (`V2.3.0:8-15`).
- La `V3.3.0` planeada agrega `student_email` y `student_signature`.
- **No existe columna para contacto, sede, facultad ni modalidad.**

La `V3.3.0` pasa de **dos columnas a seis**, y `data-model.md:28` —que rechazó `student_phone`
por «ninguna fuente documenta que la Coordinación lo use», §III— debe rectificarse.

**El consumidor que esa decisión no miró es el PDF formal del SP3.** El issue `Tramita#10`
declara que *«un PDF que no reproduce el formato oficial no sirve para lo que el trámite
necesita»*, y al enumerar el formato incluye la modalidad. Minimización de datos personales no
es «guardar lo mínimo posible» sino «guardar lo que tiene finalidad declarada», y la finalidad
está en el árbol de problemas (`arbol-de-problemas.md:130`). Con eso, §III se cumple.

> ⚠️ **Precisión de la cita**: `Tramita#10` analiza el formato de **novedad de notas**, no el
> DO-FR-100. El principio es el mismo y el DO-FR-100 pide esos cuatro campos en su tabla 3, pero
> la frase citada no se escribió sobre este formato. Verificarlo contra la plantilla v2024 antes
> de usarlo como argumento único ante el jurado.

- Ninguna dependencia npm nueva. Verificación del repo: `pnpm test` + `rm -rf .next && pnpm exec
  tsc --noEmit` + `pnpm lint` + `pnpm build`.

## Success Criteria

- [ ] Un visitante **sin sesión** abre la ruta, diligencia, firma y recibe acuse — sin ser
      redirigido al login.
- [ ] Un test verifica que el cuerpo emitido contiene **exactamente** los once campos del
      contrato público, y que **no** contiene `definitionCode` (viaja en la ruta).
- [ ] Un test verifica que el formulario **no envía** con algún campo vacío tras `trim()`.
- [ ] La firma se captura con el dedo en un dispositivo táctil real, no solo con mouse en jsdom.
- [ ] El acuse no muestra identificador, estado ni enlace de consulta.
- [ ] `pnpm test` verde, `rm -rf .next && pnpm exec tsc --noEmit` sin errores, `pnpm lint` limpio.
- [ ] `app/requests/new/page.test.tsx` intacto y con todos sus `it(...)` verdes. El conteo se
      **mide** al cerrar con `rg -c '^\s*it\(' app/requests/new/page.test.tsx` — el «9» original
      venció al integrar `ede7bc3`.
- [ ] Cero datos personales reales en cualquier archivo del repo.
