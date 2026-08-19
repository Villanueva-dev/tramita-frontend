# CLAUDE.md — Tramita (Frontend)

> Cliente web del MVP **Tramita** — trabajo de grado, Programa de Ingeniería de Sistemas,
> Universidad Remington (modalidad Distancia). Interfaz de la **Coordinación Académica de la
> Sede Cali**. Este archivo es el **contrato de equipo**: las reglas que valen en este repo,
> independientes de la configuración personal de cada integrante. Backend hermano (Spring Boot):
> [Villanueva-dev/Tramita](https://github.com/Villanueva-dev/Tramita).

## Qué se está construyendo

Frontend del sistema Tramita, un *cockpit interno* para que la Coordinación gestione trámites
académicos. El encuadre manda sobre toda la UI: Tramita es una **bitácora de seguimiento**, el
verbo es **registrar** (no aprobar) y el dato central es de quién depende ahora el trámite.
**Fase actual: `fase-b`** — integración con el motor de workflow del backend (la autenticación,
Fase A, está cerrada). Contexto de dominio e institucional:
[`docs/contexto-institucional.md`](docs/contexto-institucional.md).

## Stack

Next.js 16 (App Router) · React 19 · Tailwind 4 · shadcn/@base-ui · TypeScript strict.

## Principios rectores

> Heredados de la constitución del backend (**v2.2.2**, última enmienda 2026-08-16). Fuente
> canónica:
> [`.specify/memory/constitution.md`](https://github.com/Villanueva-dev/Tramita/blob/main/.specify/memory/constitution.md).
> Se edita allá; acá viven en resumen para que este repo sea autosuficiente. La versión
> adaptada a este stack, con sus desvíos justificados, está en
> [`docs/constitucion.md`](docs/constitucion.md).

1. **KISS + YAGNI** — lo mínimo que cumple el requisito; nada especulativo "por si acaso".
2. **Estructura idiomática del App Router** — `app/` rutas, `components/` UI compartida
   (`ui/` para primitivas), `lib/` dominio y acceso a datos; *atomic design* y
   *container-presentational* para la UI. **No se copia el package-by-layer del backend**: su
   rationale es la formación del equipo en Spring Boot y no se transfiere a Next.js
   (justificado en `docs/constitucion.md` §3).
3. **Seguridad por defecto** — la validación del frontend es **solo UX**; la autoritativa es
   siempre del backend. Sesión por cookie `HttpOnly` (el JS no la ve), CSRF *double-submit*.
   **Minimización de datos personales**: solo lo que el trámite necesita; fixtures y capturas
   anonimizados por rol.
4. **Decisiones defendibles y trazables** — cada decisión con su trade-off explícito ("elegí X
   frente a Y, sabiendo que el costo es Z"); esto se defiende ante un jurado. Verificar según
   la clase de fuente: las **técnicas** contra documentación oficial vía Context7 (ver abajo),
   citando la URL; la **normativa institucional** solo contra el documento obtenido de la
   fuente — nunca por Context7 — y marcada como provisional mientras no se obtenga.
   Requisitos según **ISO/IEC/IEEE 29148:2018**; arquitectura con **C4 y 4+1**.
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

## Integración con el backend

La autoridad del cableado es el contrato OpenAPI de cada feature en el repo del backend
(`specs/<feature>/contracts/openapi.yaml`) y el código que lo implementa. En corto: sesión por
cookie `HttpOnly`; `GET /api/auth/me` es la **única fuente de verdad** de "hay sesión"; CSRF vía
cookie `XSRF-TOKEN` → header `X-XSRF-TOKEN`; errores en `application/problem+json` según
**RFC 9457**, que obsoleta a la RFC 7807 (<https://www.rfc-editor.org/rfc/rfc9457.html>).

La guía narrativa está en [`docs/integracion-auth.md`](docs/integracion-auth.md). Es guía, no
autoridad: ante discrepancia manda el contrato. Se mantiene **byte-idéntica** a su copia del
backend (`specs/001-auth-login/integracion-frontend.md`).

## Proceso

**SDD con OpenSpec**: `explore → propose → spec → design → tasks → apply → verify → archive`.
Los artefactos viven en `openspec/`, que está **gitignorado** a propósito para no imponer el
tooling al resto del equipo. La especificación precede al código.
