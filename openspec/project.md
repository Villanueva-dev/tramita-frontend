# Contexto de proyecto — tramita-frontend

> Complemento narrativo de `openspec/config.yaml` (que se mantiene deliberadamente conciso).
> Versionado desde el 2026-08-27: `openspec/` es el contrato que gobierna cada fase de la cadena
> SDD, y un contrato sin historial en el repositorio no se puede auditar después.

## Qué es este proyecto

Frontend del trabajo de grado **Trámita** (Ingeniería de Sistemas, Universidad Remington) — un
*cockpit interno* para que la Coordinación Académica de la Sede Cali gestione trámites
académicos (adición de créditos, novedad de notas). Backend hermano: Spring Boot 4 / Java 21 en
`../Tramita`, que ya tiene mergeado el motor de workflow
configurable (feature `002-workflow-engine`).

## Stack detectado (verificado, no asumido)

- **Next.js** 16.2.6 (App Router) · **React** 19 · **TypeScript** 5.7.3 (`strict: true`,
  `noEmit: true`, `moduleResolution: bundler`) — `tsconfig.json`.
- **Tailwind** 4 (`@tailwindcss/postcss` + `tailwindcss` ^4.2.0) + `tw-animate-css`.
- UI: `@base-ui/react`, `shadcn` ^4.8.0, `class-variance-authority`, `clsx`, `tailwind-merge`,
  `lucide-react`.
- Gestor de paquetes: **pnpm** (`pnpm-lock.yaml`, `pnpm-workspace.yaml`). ⚠️ El campo
  `"pnpm".overrides` de `package.json` declara `hono` a `4.12.25` pero **pnpm ya no lo lee** y lo
  avisa en cada corrida (<https://pnpm.io/settings>): el override **no se está aplicando**.
- Test runner: **Vitest** ^4.1.10 con `vitest.config.mts` propio en la raíz
  (`environment: 'jsdom'`, `resolve.tsconfigPaths: true`), agregado el 2026-08-15.

## Arquitectura y convenciones (de `CLAUDE.md` y `docs/constitucion.md`)

1. **KISS + YAGNI** — lo mínimo que cumple el requisito.
2. **Estructura idiomática del App Router** — `app/` rutas, `components/` UI compartida (`ui/`
   primitivas), `lib/` dominio y acceso a datos; atomic design + container/presentational para la
   UI. *(Corregido el 2026-08-16: antes decía «arquitectura por feature», que contradecía al
   propio repo — no existe ningún `features/`.)* **No se copia el package-by-layer del backend
   (§II, v2.0.0)**: su rationale es la formación del equipo en Spring Boot y no se transfiere a
   Next.js. El desvío está justificado en `docs/constitucion.md` §3.
3. **Seguridad por defecto** — validación del frontend es solo UX; la autoritativa es siempre el
   backend. Sesión por cookie `HttpOnly` (JS no la ve), CSRF double-submit vía cookie
   `XSRF-TOKEN` → header `X-XSRF-TOKEN`. `GET /api/auth/me` es la única fuente de verdad de "hay
   sesión".
4. **Decisiones defendibles y trazables** — cada decisión con su trade-off explícito; se defiende
   ante jurado. La verificación depende de **la clase de fuente**: las **técnicas** con Context7
   (`find-docs`), citando la URL; la **normativa institucional** solo contra el documento obtenido
   de la fuente —nunca por Context7— y marcada como provisional mientras no se obtenga.
   Requisitos según **ISO/IEC/IEEE 29148:2018** (cl. 9.6); arquitectura con **C4 y 4+1**.
5. **Testing del comportamiento sensible** — por riesgo/valor, no por cobertura nominal.
6. **Minimización de datos personales** — solo lo que el trámite necesita para existir; nada de
   documentos de identidad, recibos ni anexos de terceros. Fixtures, mocks y capturas
   **anonimizados por rol**.
7. **Fidelidad al contrato del backend** — el frontend no inventa endpoints, códigos ni formatos
   de error. La autoridad es el contrato OpenAPI de la feature
   (`Tramita/specs/<feature>/contracts/openapi.yaml`) y el código que lo implementa.

⚠️ `docs/integracion-auth.md` es **guía narrativa, no autoridad**: ante discrepancia manda el
contrato OpenAPI. Se mantiene **byte-idéntica** a su copia del backend
(`specs/001-auth-login/integracion-frontend.md`) — al corregir una, corregir la otra.

## Testing — snapshot verificado

| Capacidad | Estado | Detalle |
|---|---|---|
| Unit runner | ✅ | Vitest, `pnpm test` → `vitest run`. 4 archivos en `lib/*.test.ts`: `api.test.ts`, `api-errors.test.ts`, `identity.test.ts`, `password-policy.test.ts`. **27 tests, verdes.** |
| Integration (componentes) | ✅ | **Instalado el 2026-08-15**: `@testing-library/react ^16.3.2` (la línea que soporta React 19), `@testing-library/dom ^10.4.1`, `jsdom ^30.0.1`, `@vitejs/plugin-react ^6.0.5`, más `vitest.config.mts` en la raíz (`environment: 'jsdom'`, `resolve.tsconfigPaths: true`). Verificado montando un componente real. |
| E2E | ❌ | No hay Playwright ni Cypress. |
| Coverage | ❌ | No hay `@vitest/coverage-v8` ni equivalente. |
| Linter | ❌ (roto) | Script `lint: eslint .` existe en `package.json`, pero **`eslint` no está instalado** (`node_modules/.bin/eslint` ausente, no aparece en `dependencies`/`devDependencies`) y no existe ningún archivo de config (`eslint.config.*`, `.eslintrc*`). El script fallaría si se ejecuta hoy. |
| Type checker | ✅ | `typescript` 5.7.3 instalado, `tsconfig.json` con `strict: true`. Sin script npm dedicado — invocar `pnpm exec tsc --noEmit`. |
| Formatter | ❌ | No hay Prettier ni Biome. |

**Implicación para Strict TDD**: el modo está en `enabled` (marcador global del usuario +
runner detectado) y **desde el 2026-08-15 cubre también componentes React** — el prerequisito de
tooling está resuelto, así que **ninguna tarea de la Fase B necesita declarar excepción al TDD**.

Gotcha de la instalación: la guía oficial de Next.js manda instalar además `vite-tsconfig-paths`
para resolver el alias `@/*`, pero la versión de Vite que trae Vitest 4 lo resuelve de forma
nativa y avisa por consola que el plugin sobra. Se usó `resolve: { tsconfigPaths: true }` y se
desinstaló el plugin — una dependencia menos en un repositorio compartido.

Lo que **sigue faltando**: cobertura (`@vitest/coverage-v8`), E2E, formatter, y sobre todo el
**linter, que está roto** (el script existe, ESLint no está instalado ni configurado).

## Encuadre del producto (decidido 2026-08-15) — leer antes de diseñar cualquier pantalla

**Trámita es una bitácora de seguimiento, no un sistema de aprobaciones.**

El único usuario es la Coordinación Académica de la Sede Cali: una o dos personas, **sin roles
diferenciados** (verificado: `model/User.java` del backend no tiene campo de rol ni entidad
`Role`). El proceso real ocurre **afuera** del sistema — por correo, en papel, con firmas
escaneadas. La coordinación registra el trámite, escribe a la facultad o a registro, espera la
respuesta, y **asienta** lo que el tercero decidió.

Consecuencia para toda la UI: **el verbo del sistema es REGISTRAR, no aprobar.** Cuando la
coordinación mueve un trámite a `APROBADA_FACULTAD` no está aprobando como facultad: está
dejando constancia de que la facultad aprobó. El backend ya modela esa dupla en cada entrada del
timeline — `actorEmail` (quién lo asentó) y `responsible` (en nombre de quién ocurrió, FR-006) —
y el front todavía no tiene el concepto.

**El dato operativo central es «ahora de quién depende»**: el trabajo real de la coordinación es
perseguir el trámite, así que el responsable del paso actual vale más que el «cuánto falta».

## El trabajo que viene — Fase B (contexto, no ejecutar desde acá)

Hoy el front corre 100% sobre mocks: `lib/mock-data.ts` + `lib/store.tsx`. La Fase B es conectar
contra el motor de workflow real del backend.

**Brecha 1 — el modelo del cliente es incompatible con el motor.** `lib/types.ts` congela
`RequestStatus`/`RequestType` en union types literales (`'pendiente' | 'en_revision' | …`),
mientras el motor trata trámites y cadenas de estados como **datos configurables en base de
datos**. El backend prueba su genericidad con `rg` → 0 ocurrencias hardcodeadas; el front la
vuelve a congelar en TypeScript. No es "conectar el fetch": hay que rediseñar el modelo cliente.

**Brecha 2 — el stepper: RESUELTA, se descarta.** `components/workflow-stepper.tsx` exige la
cadena completa de etapas, que no es derivable del contrato actual **ni lo sería agregando un
endpoint**: el grafo de estados es cíclico (las devoluciones son aristas hacia atrás) y
`workflow_state` no tiene columna de orden, ni ninguna otra por la que reconstruirlo — su PK es
un UUID aleatorio y no hay timestamp. Decisión: **el componente sale de la Fase B**, también
porque con devoluciones un "paso 3 de 6" promete un avance que el proceso no garantiza.

**Lo que va en su lugar** (todo con fuente real en el contrato de la `002`):

1. Estado actual con su responsable — de `currentState` y del `responsible` de la transición.
2. «Lleva N días esperando» — derivado del `occurredAt` de la última entrada del timeline.
   **Es presentación, no dominio**: se formatea una fecha que el servidor ya entregó.
3. Acciones redactadas como registro — compuestas desde `availableTransitions`
   (`targetState.name` + `responsible`), nunca hardcodeadas.
4. Timeline con el par actor / en-nombre-de (`actorEmail` + `responsible`).

**Diferido a la `003`, como un paquete coherente**: columna de orden (`display_order`) + endpoint
de definición completa + recordatorios, prioridades y vencimientos por tiempo en un estado. Son
la misma clase de cosa — configuración por trámite del lado del servidor — y por eso entran
juntos. Los campos `priority` y `dueDate` que el mock V0 ya tiene **no se borran por absurdos: se
difieren**, porque anticipan justamente esa necesidad.

**Frontera a sostener en la defensa**: mostrar «lleva 12 días» es presentación; decidir que 12
días es «tarde» es regla de negocio y va en configuración, no en el navegador.

Este archivo documenta el contexto; **no autoriza a `sdd-init` a planificar ni ejecutar** ese
trabajo — eso es tarea de `sdd-explore` / `sdd-propose` sobre un `change` nuevo.

## Fuentes leídas para este bootstrap

- `CLAUDE.md`
- `docs/constitucion.md`
- `package.json`
- `tsconfig.json`
- `.gitignore`
