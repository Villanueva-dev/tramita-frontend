# Proposal: Cliente HTTP — alinear `createRequest` al contrato 003

## Intent

`CreateRequestBody` del front declara **tres** campos y `createRequest` los **destructura
explícitamente** (`lib/api.ts:163-175`), así que cualquier campo extra muere antes del `fetch`.
El backend acepta siete más `subjects` (`Tramita/specs/003-request-form-rules/contracts/openapi.yaml:151-180`).

La consecuencia está medida y es el motivo de esta change: una pantalla que envíe `program`,
`semester` o `reason` recibiría **`201` verde y perdería los tres datos en silencio**. No hay
error, no hay warning, no hay test que lo detecte. La pantalla del DO-FR-100 —la change
siguiente— depende exactamente de esos tres campos, así que el cliente tiene que saber
enviarlos **antes** de que exista una UI que los recoja.

`lib/types.ts:1-3` declara además derivar del contrato **002**, no del 003: la referencia quedó
atrasada cuando el backend avanzó.

## Scope

### In Scope

- **`CreateRequestBody` pasa de 3 a 6 campos**: se agregan `program` (máx. 120), `semester`
  (máx. 50) y `reason` (máx. 2000).
- **`createRequest` los envía**, manteniendo el **allowlist explícito** (ver Approach — es una
  garantía de privacidad, no un detalle de estilo).
- **`lib/types.ts`**: actualizar la referencia de contrato a la 003 en los símbolos que esta
  change toca.
- **Tests de contrato en TDD**: deben fallar contra el código actual antes de implementar.

### Out of Scope

| Sale | Destino | Justificación |
|---|---|---|
| `studentCode` | Change futura | El DO-FR-100 **no tiene** campo de código de estudiante. Sin consumidor. |
| `subjects` + `SubjectRequestBody` | **No entra: el formato no lo pide** | Ver «Fidelidad al formato» abajo — hay dos fuentes independientes. Además arrastra el **issue #17** (una solicitud sin asignaturas esquiva el tope de créditos), que es una discusión propia y no debe importarse acá. |
| La pantalla del DO-FR-100 | Change `formulario-do-fr-100-creditos-adicionales` | Decisión explícita de partir en dos: esta change toca **código compartido con tests vivos**; la pantalla es archivo nuevo aislado. Riesgos de naturaleza distinta no viajan juntos. |
| Cualquier cambio en el backend | — | Verificado: el contrato 003 ya acepta los tres campos. **Cero trabajo del lado servidor.** |

### Fidelidad al formato — por qué `subjects` no entra

Este punto se cuestionó durante la revisión de esta proposal, así que queda con su evidencia
completa: **el formato oficial del DO-FR-100 no tiene ninguna sección de asignaturas.**

Verificado sobre `material-coord/…-formato-solicitud-excepcion-de-matricula-v2024.docx`
extrayendo su XML. El formato tiene **seis tablas**, y estas son todas:

| # | Tabla | Contenido |
|---|---|---|
| 1 | Encabezado | Ciudad · Día · Mes · Año |
| 2 | Tipo de solicitud | 4 casillas; «Matricula créditos adicionales» viene marcada |
| 3 | Datos del solicitante | Nombres · Identificación · Correo · Contacto · Programa académico · Sede · Facultad · Semestre cursado y aprobado · Modalidad |
| 4 | Motivos de la solicitud | 14 casillas + «Otro: ¿Cuál?» |
| 5 | **Compromisos adquiridos** | **una sola fila vacía** — texto libre, sin estructura |
| 6 | Firmas y aprobaciones | Estudiante · Facultad |

**No hay código, nombre ni créditos de asignatura en ninguna parte.** La materia entra **en
prosa**, dentro de «Compromisos adquiridos» → mapea a `reason`. Esto concuerda con lo observado
en el ejemplar diligenciado real, donde el solicitante escribió ahí la asignatura con su código
y su nombre: **dos fuentes independientes, la plantilla en blanco y un formulario real lleno.**

**Consecuencia aceptada explícitamente** (decisión de producto, no omisión): sin asignaturas el
total de créditos solicitados es `0`, así que **el tope de 21 créditos del backend no se dispara
desde esta pantalla**. Se prefiere la fidelidad al instrumento real de la institución antes que
forzar una sección inventada para lucir la validación. Inventarla sería el defecto, no el logro.

## Capabilities

### New Capabilities

- Ninguna. Esta change no agrega capacidad de producto: **alinea el cliente HTTP a un contrato
  que el backend ya expone**.

### Modified Capabilities

- `workflow-requests`: el requisito de registro amplía los campos que el cliente transmite. La
  capacidad ya existe (`openspec/changes/fase-b-integracion-motor-workflow/specs/workflow-requests/spec.md`).

## Approach

El cambio es pequeño y quirúrgico: **un tipo y una función**, más sus tests.

### ⛔ La restricción que no se negocia: el allowlist explícito

`createRequest` hoy hace esto (`lib/api.ts:171,174`):

```ts
const { definitionCode, studentName, studentDocument } = body
const res = await apiFetch('/requests', {
  method: 'POST',
  body: { definitionCode, studentName, studentDocument },
})
```

Esa destructuración **no es un descuido: es un allowlist**, y es lo que hoy implementa la
garantía de que los campos no persistidos **ni siquiera se envían**. Al ampliarla, **MUST**
seguir enumerando campo por campo. **MUST NOT** usar un spread del cuerpo ni del estado del
formulario.

**Por qué importa**: la pantalla del DO-FR-100 pinta ocho campos que no se persisten —correo,
teléfono, ciudad, sede, facultad, modalidad, los catorce motivos y «Otro: ¿cuál?»—. Con un
spread, todos ellos llegarían al request y a sus logs. El contrato del backend es explícito al
respecto: el schema de respuesta declara *«NO incluye ningún dato de contacto del estudiante
(FR-020, constitución §III)»* (`openapi.yaml:218`). El front debe honrar lo mismo del lado del
envío.

### TDD

`strict_tdd: true` (`openspec/config.yaml:14`) y hay runner configurado (`vitest`), con
`lib/api.test.ts` ya existente como lugar natural. El orden es: test que ejercite los tres
campos nuevos → verlo fallar → implementar.

El test debe atacar **el modo de fallo real**: no basta con afirmar que la llamada devuelve
`201`. Debe verificar **el cuerpo efectivamente enviado**, porque el defecto actual es
precisamente que un envío incompleto sale verde.

## Risks

| Riesgo | Prob. | Mitigación |
|---|---|---|
| Se «simplifica» el allowlist a un spread en una refactorización futura | **Media** | Comentario en el código explicando que es una guarda de privacidad + un test que falle si aparece un campo no declarado en el cuerpo enviado. |
| El test verifica el `201` y no el cuerpo, replicando el falso verde | Media | Requisito explícito arriba: se asierta sobre el cuerpo enviado, no sobre el status. |
| Romper el consumidor existente (`app/requests/new/page.tsx`) | **Baja** | Los tres campos nuevos son **opcionales en el contrato** (`required: [definitionCode, studentName, studentDocument]`). El consumidor actual sigue compilando y funcionando sin tocarlo. |
| La convención de `semester` se pierde | Media | Se documenta en la spec: **ordinal** (`"8"`), no periodo. El `example: '2026-2'` del contrato induce a lo contrario. |

## Rollback Plan

Cambio puramente aditivo sobre un tipo y una función, sin estado persistido del lado del
cliente. Un `git revert` de la PR devuelve `lib/api.ts` a su forma actual. **El consumidor
existente no se toca**, así que un rollback no puede romper el registro de solicitudes que hoy
funciona.

## Dependencies

- Backend 003 mergeado (`ade03f7`) y su contrato disponible — **cumplido y verificado**.
- Ninguna dependencia npm nueva.
- **No depende** de la change de la pantalla; es al revés: la pantalla depende de esta.

## Success Criteria

- [ ] `CreateRequestBody` declara los seis campos.
- [ ] Un test verifica **el cuerpo enviado** e incluye `program`, `semester` y `reason`.
- [ ] Un test verifica que un campo **no declarado** en el tipo **no llega** al cuerpo enviado
      (la guarda de privacidad, ejercitada).
- [ ] `pnpm test` verde (hoy: **112/112 en 10 archivos**) y `pnpm exec tsc --noEmit` sin errores.
- [ ] `app/requests/new/page.tsx` sigue funcionando **sin modificarlo** (sus 8 tests en verde).
- [ ] La convención de `semester` como ordinal queda escrita en la spec.

## Decisiones abiertas (del usuario, no del agente)

### 1. ~~¿El tipo de **respuesta** también se amplía?~~ — RESUELTA (2026-09-08)

**Decisión: opción A — solo el request.** El `Request` del front (`lib/types.ts:30-38`) no se
amplía en esta change, aunque el contrato 003 devuelva `studentCode`, `program`, `semester`,
`reason` y `subjects` (`openapi.yaml:208-226`).

Razón: esta change se partió justamente para mantenerse pequeña, y ampliar el tipo de respuesta
agregaría campos que **ninguna pantalla lee todavía**. Los datos siguen llegando en el JSON —
solo que TypeScript no los declara. El response entra cuando alguna pantalla necesite
**mostrarlos**, probablemente el detalle, con su consumidor a la vista.

**Consecuencia aceptada**: el criterio «se registró de verdad» no se puede verificar desde el
tipo de respuesta. Se verifica donde está el defecto real —**el cuerpo enviado**— según los
escenarios de la spec.

### 2. 🟡 Errata heredada del BRIEF: «cinco campos» vs. seis

`BRIEF.md:144` fija como criterio *«registra […] con los cinco campos que sí persisten»*, pero
su propia tabla de mapeo (`:60-73`) lista **seis** destinos: `definitionCode`, `studentName`,
`studentDocument`, `program`, `semester`, `reason`. Probablemente cuenta cinco excluyendo
`definitionCode`, que no es dato del estudiante. **Precisar el número al escribir la spec** para
que el criterio de aceptación no quede ambiguo.
