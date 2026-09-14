# Proposal: Pantalla del formato DO-FR-100 — matrícula de créditos adicionales

> **Cómo se midió.** Lo que este documento afirma sobre el repo sale de dos mediciones del
> 2026-09-08: lectura de los archivos citados (con número de línea) y
> `rg ADICION_CREDITOS` sobre la raíz. **No verificado en esta fase**: el estado de git
> (rama, `main = d00d2a3`, árbol limpio) y el resultado de `pnpm test` / `pnpm exec tsc
> --noEmit` — esta fase no ejecutó comandos; esos datos se reportan como recibidos, no como
> medidos.

## Intent

La tutora del proyecto de grado **no es técnica** y necesita reconocer el avance en pantalla; la
Coordinación es la fuente de requisitos y **su feedback llega antes si hay algo que mirar**. Esta
pantalla es, además, el instrumento para preguntarle **qué falta**.

Hoy el registro vive en `app/requests/new/page.tsx`, que pide tres datos genéricos —tipo, nombre
y cédula (`:159-219`)—. Quien tramita en papel llena un formato de **seis tablas**; esa pantalla
no se le parece, así que no sirve para validar el proceso con quien lo ejecuta.

El cliente HTTP ya sabe transmitir los seis campos del contrato 003 con **allowlist explícito**
(`lib/api.ts:163-187`), pero **ninguna pantalla los recoge**: la capacidad está construida y sin
consumidor. Esta change lo cierra.

## Scope

### In Scope

- **Pantalla nueva** que reproduce el DO-FR-100 (v01, plantilla v2024) respetando el orden de sus
  seis tablas, acotada al único tipo en alcance: **«Matrícula créditos adicionales»** →
  `definitionCode: ADICION_CREDITOS`.
- **Cinco campos que persisten**: `studentName` (≤120), `studentDocument` (≤20), `program` (≤120),
  `semester` (≤50, ordinal) y `reason` (≤2000, recibe «Compromisos adquiridos»).
- **Los campos no persistidos se pintan y no se envían** — ciudad/fecha, correo, contacto, sede,
  facultad, modalidad, los 13 motivos y «Otro: ¿cuál?». La guarda ya existe en `lib/api.ts:198-207`
  y esta pantalla es la razón por la que se escribió.
- **Los 13 motivos, hardcodeados**, como **deuda deliberada y declarada** (ver Out of Scope).
- **TDD estricto** (`openspec/config.yaml:17`) con los valores sintéticos de `BRIEF.md:42-53`.

### Out of Scope — KISS + YAGNI

| Queda fuera | Por qué |
|---|---|
| Reemplazar `app/requests/new/page.tsx` | Funciona, registra solicitudes reales y tiene tests vivos. **Conviven.** Tocarla mete riesgo sin acercar la demo. |
| Cualquier cambio de backend | Todo lo que persiste ya existe en `CreateRequestBody` (`lib/api.ts:186-195`). Cero trabajo del lado servidor. **Sigue siendo cierto para esta pantalla**: el trabajo de backend que abrió `Villanueva-dev/Tramita#18` pertenece a la captura pública, que es otra change. |
| Sección de asignaturas / disparar el tope de 21 créditos | El formato **no tiene** tabla de asignaturas: la materia entra en prosa dentro de «Compromisos adquiridos». **Confirmado por la Coordinación el 2026-09-13** — era una lectura del formato, ahora es la respuesta a la pregunta 1. Se captura como texto libre, sin catálogo de asignaturas ni créditos. En consecuencia el tope de 21 créditos **no se evalúa por este canal**, y esa es la conducta correcta, no una carencia: `Villanueva-dev/Tramita#17` se cerró como statu quo por el mismo motivo. |
| Motivos como configuración del trámite | Es su destino correcto —la Coordinación confirmó que *«si cambian una casilla, sacan la versión 2»*—, pero cuesta backend y esquema. Se **documenta**, no se implementa. |
| Los otros tres tipos de solicitud del formato | Solo se especifica **que no son seleccionables**; si van deshabilitados o ausentes lo decide el design. |
| Firmas, adjuntos, impresión/PDF | La tabla 6 se pinta como **espacio**, sin funcionalidad. Nada de esto tiene consumidor hoy. |
| Enlace en el menú de navegación | Maqueta de propósito acotado; un ítem de nav la vuelve deuda permanente. |

## Capabilities

### New Capabilities

- `do-fr-100-form`: la pantalla que reproduce el formato oficial de excepción de matrícula acotado
  a créditos adicionales — mapeo campo→destino, qué se envía y qué **no**, y las validaciones de
  UX derivadas de los límites del contrato.

### Modified Capabilities

- `workflow-requests`: su escenario **«Ausencia de códigos hardcodeados»**
  (`openspec/specs/workflow-requests/spec.md:33-37`) exige **0 ocurrencias** de un `code` literal
  de trámite en `app/`, `components/` y `lib/` fuera de fixtures. **Medido hoy: el invariante se
  cumple** — `rg ADICION_CREDITOS` devuelve 11 archivos, todos tests, artefactos OpenSpec o
  documentación; ninguno de producción. Atar esta pantalla al literal **lo rompe**, así que el
  requisito debe acotarse a la pantalla data-driven, dejando explícito que un formulario que
  reproduce **un** formato en papel está atado a **un** trámite por construcción. El delta
  desaparece si el design resuelve el código desde el catálogo (ver Decisión pendiente 3).

## Approach

Una ruta nueva con un solo formulario, siguiendo la estructura idiomática del App Router
(`app/` rutas, `components/` UI, `lib/` dominio) y el par container/presentational: la página
orquesta estado y envío; la presentación de cada tabla del formato se compone de primitivas ya
existentes en `components/ui/`. Los errores se renderizan reusando el camino RFC 9457 que ya usa
la pantalla actual (`apiErrorMessages`, `lib/api-errors.ts`). La validación del cliente es **solo
UX**: la autoritativa sigue siendo del backend.

Fidelidad al papel por encima de la elegancia de UI: quien usa el formato debe reconocer el orden
y los rótulos. Ese es el criterio de desempate ante cualquier duda de presentación.

## Affected Areas

| Área | Impacto | Detalle |
|---|---|---|
| Ruta nueva de la pantalla + su test | New | Ubicación **por decidir en el design** |
| `openspec/specs/workflow-requests/spec.md` | Modified | Acotar el invariante de códigos hardcodeados |
| `app/requests/new/page.tsx` y su test | **Sin tocar** | Invariante de esta change |
| `lib/api.ts`, `lib/types.ts` | **Sin tocar** | El contrato 003 ya está alineado |
| `components/app-shell.tsx` | **Sin tocar** (esperado) | Salvo que el design elija la opción 4 de `BRIEF.md:117` |

## Decisiones pendientes — se resuelven en el DESIGN, no aquí

1. **La ruta de la pantalla.** Cinco opciones en `BRIEF.md:91-120`. **No se hereda la sugerencia
   original** (`app/requests/new/creditos/`): `app-shell.tsx:38-40` calcula el resaltado como
   `pathname === href || (href !== '/dashboard' && pathname.startsWith(href))`, así que esa ruta
   **enciende el ítem «Nueva solicitud»** apuntando a otra pantalla. El efecto es condicional —
   solo si la página monta `<AppShell>`—, y no montarlo **pierde el gate de sesión**
   (`app-shell.tsx:130-132` y `:150`). Impacto: coherencia del nav frente a protección de sesión.
2. **Las otras tres casillas de tipo de solicitud**: deshabilitadas o ausentes, con justificación.
3. **De dónde sale `ADICION_CREDITOS`**: literal en la pantalla o resuelto desde el catálogo. De
   esto depende que haya delta en `workflow-requests`.

## Preguntas abiertas para la Coordinación

Objetivo declarado de la pantalla: preguntar en lugar de suponer.

1. ✅ **RESPONDIDA el 2026-09-13.** ¿Capturar la asignatura aparte (código, nombre, créditos)?
   **No.** Se captura como texto libre dentro de «Compromisos adquiridos», tal cual el papel:
   pedirla estructurada inventaría un dato que quien diligencia no puede completar. El tope de 21
   créditos no se evalúa por este canal — `Tramita#17` se cerró como statu quo por lo mismo.
2. ¿Las **13 casillas de motivos** siguen vigentes en la versión que se usa hoy, o ya cambiaron?
   (Trece es el conteo medido sobre el XML de la plantilla v2024, más dos celdas «Otro: ¿Cuál?».)
3. ✅ **RESPONDIDA.** **Correo y número de contacto** sí se usan operativamente: la Coordinación
   responde hoy por correo, así que el canal existe antes que el sistema. Persistirlos es una
   enmienda de `FR-020` del backend, pedida en `Villanueva-dev/Tramita#18` y **fuera del alcance de
   esta pantalla**: acá se siguen pintando sin enviarse.
4. **¿Quién diligencia el formato?** ¿El estudiante lo envía lleno y la Coordinación transcribe, o
   la Coordinación lo llena mientras atiende?
5. **Firmas**: ¿basta con dejar constancia de que existieron, o hay que adjuntar el PDF firmado?

## Risks

| Riesgo | Prob. | Mitigación |
|---|---|---|
| Un campo no persistido llega al backend y a sus logs | Baja | El allowlist de `lib/api.ts:198-207` lo impide por construcción; la spec exige un escenario que lo ejercite. |
| Dato personal real del PDF llega al repo público | Baja | Solo valores sintéticos (`BRIEF.md:42-53`); el PDF se consulta por estructura, nunca por datos. Verificable con una búsqueda antes del commit. |
| La demo hace creer que el tope de 21 créditos está validado | **Media** | La pregunta 1 ya tiene respuesta: el tope no se evalúa por este canal y es deliberado. El design decide si la pantalla lo dice explícitamente. |
| Romper la pantalla existente por refactor «de paso» | Baja | Es invariante de la change; sus tests deben seguir verdes sin modificarlos. |
| La maqueta se vuelve permanente sin decidir su futuro | Media | Alcance y deuda (motivos hardcodeados) declarados aquí; sin enlace en el nav. |

## Rollback Plan

La change es **aditiva y aislada**: archivos nuevos, sin migraciones, sin estado persistido en el
cliente y sin cambios en `lib/` ni en el backend. Un `git revert` de la PR retira la pantalla y
deja el resto del front exactamente como está hoy. Si el design elige tocar `app-shell.tsx`
(opción 4), ese archivo lo comparten las cinco pantallas y **no tiene tests**: en ese caso el
rollback deja de ser trivial, y esa asimetría es parte del trade-off que el design debe pesar.

## Dependencies

- Cliente HTTP alineado al contrato 003 — **cumplido**: `CreateRequestBody` declara los seis
  campos (`lib/api.ts:186-195`).
- Backend levantado y con `ADICION_CREDITOS` sembrado, solo para la prueba end-to-end manual.
- Ninguna dependencia npm nueva. `pnpm lint` **ya funciona**: ESLint entró en `ede7bc3` y el
  issue #4 se cerró el 2026-09-13. La verificación del repo es `pnpm test` + `pnpm exec tsc
  --noEmit` + `pnpm lint` + `pnpm build`.

## Success Criteria

- [ ] La pantalla es reconocible para quien usa el formato en papel (juicio de la Coordinación).
- [ ] Registra una solicitud real contra el backend con los cinco campos que persisten.
- [ ] Un test verifica que **ningún campo no persistido** llega al cuerpo emitido.
- [ ] `pnpm test` verde, incluidos los tests nuevos, y `pnpm exec tsc --noEmit` sin errores
      (precedido de `rm -rf .next`).
- [ ] `app/requests/new/page.test.tsx` **intacto y verde**. Hoy declara **9** bloques `it(...)`
      (medido: `rg '^\s*it\(' app/requests/new/page.test.tsx`), no 8 como dice `BRIEF.md:86`;
      usar el conteo medido al cerrar la change.
- [ ] Cero datos personales reales en cualquier archivo del repo.
- [ ] Las cinco preguntas a la Coordinación quedan formuladas y con respuesta registrada o
      explícitamente pendiente.
