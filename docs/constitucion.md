# Constitución — Frontend Tramita

> Los principios no negociables que gobiernan este repo. Heredados de la constitución del
> backend (**v2.2.2**, ratificada el 2026-07-02, última enmienda el 2026-08-16) y del
> contrato de equipo (`CLAUDE.md`), destilados a lo esencial. Donde el *rationale* del
> backend no se transfiere a este stack, el principio se adapta y el desvío se justifica
> aquí mismo. Cada decisión de código debe poder defenderse contra estos principios ante
> el jurado.
>
> Fuente canónica del original:
> [`.specify/memory/constitution.md`](https://github.com/Villanueva-dev/Tramita/blob/main/.specify/memory/constitution.md).

## 1. KISS + YAGNI
Lo mínimo que cumple el requisito; nada especulativo "por si acaso". Ante dos soluciones,
la que un compañero entienda más rápido en seis meses, no la de menos líneas hoy.

## 2. Seguridad por defecto
La validación del frontend es **solo UX**; la autoritativa es siempre del backend. La
sesión vive en cookie `HttpOnly` (el JS no la ve); el CSRF es double-submit; la verdad de
"¿hay sesión?" la da `GET /api/auth/me`, nunca el cliente.

**Minimización de datos personales.** El front pide y muestra únicamente los datos que el
trámite necesita para existir: identificación del solicitante, datos de la solicitud y
trazabilidad de quién registró cada paso. No se solicitan documentos de identidad, recibos
de pago ni anexos con datos de terceros — el documento formal se entrega y la institución
lo custodia en sus propios sistemas. Todo dato personal en fixtures, mocks o capturas de
pantalla DEBE estar anonimizado por rol.

## 3. Estructura idiomática del App Router
El código se organiza según la convención de Next.js: `app/` (rutas y páginas),
`components/` (UI compartida, con `ui/` para primitivas), `lib/` (tipos de dominio, acceso
a datos y helpers). UI con *atomic design* y patrón *container/presentational*.

**Trade-off frente al backend.** El §II de la constitución del backend fija
*package-by-layer*, con el rationale explícito de alinear el proyecto al material de
formación en Spring Boot del equipo. Ese argumento no se transfiere a este repo: no hay
material equivalente para Next.js, y el App Router impone su propia estructura por
convención. Se adopta la convención del framework en lugar de importar una conclusión sin
su argumento — precisamente lo que el §4 exige. El costo aceptado es que el árbol de
carpetas no "grita" el dominio; esa correspondencia se documenta en los diagramas de
arquitectura, igual que en el backend.

## 4. Decisiones defendibles y trazables
Cada decisión con su trade-off explícito ("elegí X frente a Y, sabiendo que el costo es
Z"). Las afirmaciones se verifican con el medio que corresponde a **cada clase de fuente**:

- **Fuentes técnicas** (Next.js, React, Tailwind, shadcn, estándares publicados): se
  verifican vía Context7 / `find-docs` o contra el catálogo del organismo emisor, y se
  citan con su URL.
- **Normativa institucional** (reglamento estudiantil, PEI, resoluciones y comunicados de
  la universidad): NO está en Context7 y puede no estar publicada. Se verifica únicamente
  contra el documento obtenido de la fuente. **Mientras no se obtenga, toda afirmación que
  dependa de él se marca explícitamente como provisional y no auditada** en el artefacto
  donde aparezca.

La especificación precede al código. Los requisitos se estructuran según **ISO/IEC/IEEE
29148:2018** (cláusula 9.6) y la arquitectura se documenta con **C4 y 4+1**.

## 5. Testing del comportamiento sensible
Tests donde el riesgo lo justifica —por valor, no por cobertura nominal—: política de
contraseña (bytes UTF-8), CSRF, mapeo de errores, composición de la UI a partir de datos
del servidor. No se testea lo obvio.

## 6. Fidelidad al contrato del backend
El frontend no inventa endpoints, códigos de estado ni formatos de error: los espeja. La
autoridad es, en este orden, el contrato OpenAPI de la feature
(`specs/<feature>/contracts/openapi.yaml` en el repo del backend) y el código que lo
implementa. Los errores llegan en `application/problem+json` según **RFC 9457**, que
obsoleta a la RFC 7807 (<https://www.rfc-editor.org/rfc/rfc9457.html>).

> `docs/integracion-auth.md` es **guía narrativa, no autoridad**: ante cualquier
> discrepancia mandan el contrato OpenAPI y el código. Se mantiene **byte-idéntica** a su
> copia del backend (`specs/001-auth-login/integracion-frontend.md`) — al corregir una,
> corregir la otra.
