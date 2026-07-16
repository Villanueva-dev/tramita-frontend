# CLAUDE.md — Tramita (Frontend)

> Cliente web del MVP **Tramita** — trabajo de grado, Programa de Ingeniería de Sistemas,
> Universidad Remington (modalidad Distancia). Interfaz de la **Coordinación Académica de la
> Sede Cali**. Este archivo es el **contrato de equipo**: las reglas que valen en este repo,
> independientes de la configuración personal de cada integrante. Backend hermano (Spring Boot):
> [Villanueva-dev/Tramita](https://github.com/Villanueva-dev/Tramita).

## Qué se está construyendo

Frontend del sistema Tramita, un *cockpit interno* para que la Coordinación gestione trámites
académicos. **Sprint actual: `auth-login`** (autenticación por sesión de la Coordinación). Los
trámites (adición de créditos, novedad de notas) son una fase posterior. Contexto de dominio e
institucional: [`docs/contexto-institucional.md`](docs/contexto-institucional.md).

## Stack

Next.js 16 (App Router) · React 19 · Tailwind 4 · shadcn/@base-ui · TypeScript strict.

## Principios rectores

> Heredados de la constitución del backend (v1.0.0). Fuente canónica:
> [`.specify/memory/constitution.md`](https://github.com/Villanueva-dev/Tramita/blob/main/.specify/memory/constitution.md).
> Se edita allá; acá viven en resumen para que este repo sea autosuficiente.

1. **KISS + YAGNI** — lo mínimo que cumple el requisito; nada especulativo "por si acaso".
2. **Arquitectura por feature** — organizar por dominio, no por capa técnica; *atomic design* y
   *container-presentational* para la UI.
3. **Seguridad por defecto** — la validación del frontend es **solo UX**; la autoritativa es
   siempre del backend. Sesión por cookie `HttpOnly` (el JS no la ve), CSRF *double-submit*.
4. **Decisiones defendibles y trazables** — cada decisión con su trade-off explícito ("elegí X
   frente a Y, sabiendo que el costo es Z"); esto se defiende ante un jurado. Verificar las
   afirmaciones técnicas contra documentación oficial (ver abajo) y citar la URL.
5. **Testing del comportamiento sensible** — tests donde el riesgo lo justifica, por valor, no
   por cobertura nominal.

## Docs oficiales de librerías — disciplina Context7

Antes de afirmar algo sobre una librería, framework o API (Next.js, React, Tailwind, shadcn…),
consultar documentación **actualizada** con `ctx7` / find-docs. El training puede estar
desactualizado: no fiarse de memoria para sintaxis, opciones de configuración o migraciones de
versión. Preferir esto a la búsqueda web para docs de librerías.

## Idioma y convenciones

- Documentación, commits y comentarios: **español** (neutral/profesional).
- Identificadores de código (componentes, funciones, variables): **inglés**.
- Commits: **conventional commits** (sin atribución de IA).

## Integración con el backend (sprint auth)

Contrato completo:
[`specs/001-auth-login/integracion-frontend.md`](https://github.com/Villanueva-dev/Tramita/blob/main/specs/001-auth-login/integracion-frontend.md)
— conviene copiarlo a `docs/` de este repo al momento de cablear. En corto: sesión por cookie
`HttpOnly`; `GET /api/auth/me` es la **única fuente de verdad** de "hay sesión"; CSRF vía cookie
`XSRF-TOKEN` → header `X-XSRF-TOKEN`; errores en `application/problem+json` (RFC 7807).

## Proceso

**SDD light**: `plan → tasks → tests pragmáticos → code review` antes de cada PR/merge. La
especificación precede al código.
