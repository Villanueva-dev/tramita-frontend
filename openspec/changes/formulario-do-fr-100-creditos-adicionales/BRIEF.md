# Brief — Pantalla del formato DO-FR-100 (créditos adicionales)

> **Qué es este documento.** El insumo que originó esta change, redactado el 2026-09-07 a partir
> de una sesión de análisis sobre el backend, los formatos oficiales de la Coordinación y el
> estado real de este repo. **No es la proposal**: es lo que hay que saber *antes* de escribirla.
>
> **Ciclo de vida.** Vive dentro de esta change y se archiva con ella. Cuando `proposal.md`,
> `design.md` y `tasks.md` existan, ellos son la autoridad; este documento queda como registro
> de por qué la change se planteó así.

## Contexto

Trámita es un trabajo de grado: un motor de workflow configurable para trámites académicos de la
Universidad Remington, Sede Cali. El backend (Spring Boot 4) vive en `../Tramita` y ya tiene
mergeadas tres features: autenticación, motor de workflow, y reglas de negocio configurables.
Este repo es el frontend.

**Objetivo de este trabajo**: la tutora del proyecto de grado **no es técnica**. Necesita ver en
pantalla algo que reconozca como avance. Hoy la Coordinación tramita las solicitudes con un
formato Word que circula por correo; queremos mostrar ese mismo formato, en línea, con
validaciones. Esta pantalla es además **el instrumento para preguntarle a la Coordinación qué
falta**: no damos por hecho nada que el formato no diga.

## La fuente

El formato oficial es `DO-FR-100 — Solicitud de excepción de matrícula`, versión 01, y vive en el
repositorio del backend:

- Plantilla: `../Tramita/material-coord/2026-06-03-coord-DO-FR-100-formato-solicitud-excepcion-de-matricula-v2024.docx`
- Ejemplar diligenciado: `../Tramita/material-coord/2026-06-03-coord-DO-FR-100-Solicitud-excepcion-matricula-cali.pdf`

### ⛔ Prohibición absoluta — PII real

**El PDF es un formato real diligenciado**: contiene nombre completo, número de cédula, correo
electrónico, teléfono y **dos firmas escaneadas de personas reales**.

- **Nunca** copiar esos valores a código, tests, fixtures, mocks, specs, comentarios, mensajes de
  commit ni documentación. Ni parcialmente, ni "anonimizados a medias".
- `material-coord/` está en el `.gitignore` del backend. **Este repo es público.**
- Leer los archivos para conocer la **estructura**; nunca para extraer **datos**.

**Valores de prueba a usar, ya definidos:**

| Campo | Valor |
|---|---|
| Nombre | `Estudiante De Prueba` |
| Documento | `DOC-PRUEBA-001` |
| Correo | `estudiante.prueba@example.com` |
| Contacto | `3000000000` |
| Programa | `Ingeniería de Sistemas` |
| Sede / Facultad | `Cali` / `Ingenierías` |
| Semestre / Modalidad | `8` / `Distancia` |
| Asignatura | `AAA0000 ASIGNATURA DE PRUEBA` |

## Qué construir

Una pantalla que reproduce el DO-FR-100 **tal cual**, restringida al único tipo de solicitud en
alcance: **"Matrícula créditos adicionales"**.

| Campo del formato | Destino |
|---|---|
| Ciudad · Día/Mes/Año | se pinta, **no se envía** |
| Tipo de solicitud (4 casillas) | **solo "Matrícula créditos adicionales"** → `definitionCode: "ADICION_CREDITOS"`. Las otras tres, deshabilitadas o ausentes: decidir y justificar en el design |
| Nombres completos del solicitante | → `studentName` (máx. 120) |
| Número de identificación | → `studentDocument` (máx. 20) |
| Correo electrónico | se pinta, **no se envía** |
| Número de contacto | se pinta, **no se envía** |
| Programa académico | → `program` (máx. 120) |
| Sede · Facultad · Modalidad | se pintan, **no se envían** |
| Semestre cursado y aprobado | → `semester` (máx. 50) |
| Motivos de la solicitud (14 casillas) | **checkboxes multi-select, todas opcionales**, **no se envían** |
| "Otro: ¿Cuál?" | texto **opcional**, **no se envía** |
| **Compromisos adquiridos** | → **`reason`** (máx. 2000) |
| Campo de firmas y aprobaciones | solo el **espacio** pintado, sin funcionalidad |

### Por qué "Compromisos adquiridos" es el campo central

En el ejemplar real, el solicitante escribió ahí —en prosa— la asignatura que quería adicionar,
con su código y su nombre, y que sobrepasaba un crédito. **El formato no tiene tabla de
asignaturas: la materia entra por ese texto libre.** Por eso se lo queda `reason`, y no
"Otro: ¿Cuál?", que en el ejemplar real ni se llenó.

## Decisiones tomadas — no re-litigar

1. **Convive con la pantalla actual**, no la reemplaza. `app/requests/new/page.tsx` funciona,
   registra solicitudes reales y tiene 8 tests en verde. **No tocarla.**
2. **Ruta nueva** (sugerido: `app/requests/new/creditos/page.tsx`) y **sin enlace en el nav**
   (`components/app-shell.tsx`). Se llega por URL directa. Es una maqueta de propósito acotado;
   un botón en el menú la convertiría en deuda permanente.

   > ⚠️ **PUNTO ABIERTO — la ruta NO está decidida.** Anotado el 2026-09-08. Todo lo de abajo
   > se validó ejecutando sobre el código, no de memoria.
   >
   > ✅ **La afirmación de arriba es literalmente correcta**: no se agrega ningún `<Link>`, y el
   > array `NAV` (`components/app-shell.tsx:23-26`) sigue teniendo sus dos ítems.
   >
   > ⚠️ **Pero la ruta sugerida enciende el ítem que YA existe.** `app-shell.tsx:38-40` calcula
   > el resaltado con `pathname === href || (href !== '/dashboard' && pathname.startsWith(href))`;
   > su único guard protege a `/dashboard`. Evaluada la expresión real, `/requests/new/creditos`
   > resalta «Nueva solicitud». No es un enlace nuevo: es el existente iluminado apuntando a
   > otra pantalla.
   >
   > ✅ **El efecto es CONDICIONAL, no automático.** `AppShell` no se hereda por layout — el
   > único layout del árbol es `app/layout.tsx`, y cada página lo instancia a mano. Solo ocurre
   > si esta pantalla monta `<AppShell>`.
   >
   > ✅ **Hay precedente en el repo**: `/account/password` y `/requests/<id>` ya se muestran hoy
   > sin ningún ítem resaltado. No hay invariante roto.
   >
   > ✅ **Sin cobertura**: no existe `components/app-shell.test.tsx`, y los tests de páginas
   > mockean `AppShell`. Ningún test ejercita ese cálculo.
   >
   > **Opciones — decidir en el design de esta change; NO heredar la sugerencia:**
   > 1. `app/requests/creditos/` — ruta hermana. ✅ Verificado: no enciende el nav.
   > 2. `app/formatos/do-fr-100/` — fuera del árbol. ✅ Verificado: no enciende el nav.
   > 3. Aceptar el resalte y declararlo como trade-off consciente.
   > 4. Refinar el cálculo de `active` en `app-shell.tsx`. La más invasiva: componente
   >    compartido por las cinco pantallas y sin un solo test que lo cubra.
   > 5. No montar `<AppShell>`. ⚠️ Se pierde el gate de sesión: `app-shell.tsx:130-132` redirige
   >    a `/` cuando `status === 'unauthenticated'`, y `:149` no renderiza nada sin sesión.
3. **Los campos no persistidos ni siquiera se envían** al backend. No mandarlos y confiar en que
   el backend los ignore: si se envían, pueden quedar en logs de request.
4. **Las 14 opciones de motivos van hardcodeadas**, como **deuda deliberada y declarada**. Su
   destino correcto es configuración asociada a la definición del trámite, porque la Coordinación
   confirmó que *"si cambian una casilla, sacan la versión 2"* del formato. Dejarlo escrito en el
   design; no implementarlo ahora.
5. **El backend no se toca.** No necesita ningún cambio: todo lo que se persiste ya existe en
   `CreateRequestBody`.

## Lo que esta pantalla no va a demostrar (y está bien)

El tope de 21 créditos **no se va a disparar**, porque el formulario no envía asignaturas y el
total queda en 0. Es una consecuencia conocida y aceptada de reproducir el formato tal cual.
**No inventar una sección de asignaturas para forzarlo.** Si parece que falta, va como pregunta
para la Coordinación en la proposal — no como código.

> Relacionado: el backend tiene abierto el issue **Villanueva-dev/Tramita#17**, que documenta que
> una solicitud sin asignaturas se registra con `201` sin que el tope llegue a evaluarse. Su
> resolución y esta pantalla **se deciden juntas**: exigir al menos una asignatura rompería este
> formulario.

## Cómo trabajar

Flujo **OpenSpec**, elegido para dejar trazabilidad de cara a la tesis. Referencia de formato:
`openspec/changes/fase-b-integracion-motor-workflow/`. Reglas vigentes: `openspec/config.yaml`.

Escribir `proposal.md` → `design.md` → `tasks.md` **antes de cualquier código**, y **parar tras la
proposal a esperar aprobación**.

### Restricciones del repo, verificadas el 2026-09-07

- **Gestor: `pnpm`** (hay `pnpm-lock.yaml`). No usar npm.
- **`strict_tdd: true`** en `openspec/config.yaml`. Test primero.
- Tests: `pnpm test` (Vitest 4 + Testing Library + jsdom, ya configurados).
- Typecheck: `pnpm exec tsc --noEmit` — no hay script npm dedicado.
- ⚠️ **ESLint no está instalado**: `pnpm lint` falla aunque el script exista en `package.json`.
  No correrlo ni intentar arreglarlo.
- No hay Prettier, Biome, coverage ni E2E.
- Arquitectura: **estructura idiomática del App Router** (`app/` rutas, `components/` UI, `lib/`
  dominio), atomic design y container/presentational. **No copiar el package-by-layer del
  backend** — su rationale no se transfiere a Next.
- Specs con **Given/When/Then** y keywords RFC 2119.
- Errores del backend: **RFC 9457** (`application/problem+json`). La autoridad es el contrato
  OpenAPI del backend.
- Commits: **Conventional Commits en español, sin atribución de IA.**
- ⚠️ **`openspec/` está VERSIONADO en este repo** (medido el 2026-09-07: `git check-ignore -v
  openspec/` → no ignorado; `git ls-files openspec/` → 8 archivos trackeados). Es decir: los
  artefactos de esta change —proposal, design, tasks y este brief— **se commitean en un repo
  público**. Tenerlo presente al redactarlos, sobre todo por la prohibición de PII de arriba.

## Criterio de terminado

- [ ] Change de OpenSpec completa (proposal → design → tasks), aprobada en cada paso
- [ ] La pantalla es reconocible para quien usa el formato en papel
- [ ] Registra una solicitud real contra el backend con los cinco campos que sí persisten
- [ ] `pnpm test` en verde, incluidos los tests nuevos
- [ ] `pnpm exec tsc --noEmit` sin errores
- [ ] Los 8 tests de `app/requests/new/page.test.tsx` **intactos y en verde**
- [ ] Cero datos reales del PDF en cualquier archivo del repo

## Levantar el entorno

Backend (en `../Tramita`):

```
docker start tramita-postgres
set -a; source .env; set +a; SPRING_PROFILES_ACTIVE=dev ./mvnw spring-boot:run
```

Front: `pnpm dev` → http://localhost:3000 (proxy a `:8080` vía `proxy.ts`).

⚠️ Si el login devuelve `401`, leer el título del `problem+json`: *"Autenticación requerida"*
significa que faltó el paso de CSRF (el `403` se enmascara como `401` por un forward interno a
`/error`); *"Credenciales inválidas"* significa que el filtro sí corrió.
