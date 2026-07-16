# Constitución — Frontend Tramita

> Los principios no negociables que gobiernan este repo. Heredados de la constitución
> del backend (v1.0.0) y del contrato de equipo (`CLAUDE.md`), destilados a lo esencial.
> Cada decisión de código debe poder defenderse contra estos principios ante el jurado.

## 1. KISS + YAGNI
Lo mínimo que cumple el requisito; nada especulativo "por si acaso". Ante dos soluciones,
la que un compañero entienda más rápido en seis meses, no la de menos líneas hoy.

## 2. Seguridad por defecto
La validación del frontend es **solo UX**; la autoritativa es siempre del backend. La
sesión vive en cookie `HttpOnly` (el JS no la ve); el CSRF es double-submit; la verdad de
"¿hay sesión?" la da `GET /api/auth/me`, nunca el cliente.

## 3. Arquitectura por feature + responsabilidad única
Organizar por dominio, no por capa técnica. La sesión (auth) es un dominio propio,
separado de los trámites. UI con atomic design y patrón container/presentational.

## 4. Decisiones defendibles y trazables
Cada decisión con su trade-off explícito ("elegí X frente a Y, sabiendo que el costo es
Z"). Las afirmaciones técnicas se verifican contra documentación oficial (Context7) y se
cita la fuente.

## 5. Testing del comportamiento sensible
Tests donde el riesgo lo justifica —por valor, no por cobertura nominal—: política de
contraseña (bytes UTF-8), CSRF, mapeo de errores. No se testea lo obvio.

## 6. Fidelidad al contrato del backend
`docs/integracion-auth.md` es la fuente de verdad del cableado. El frontend no inventa
endpoints, códigos de estado ni formatos de error; los espeja.
