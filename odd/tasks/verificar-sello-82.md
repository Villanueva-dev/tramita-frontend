# Issue #82 — Página pública `/verificar` para el código del sello (006)

## Objetivo y problema

La 006 del backend (Villanueva-dev/Tramita#41) imprime en el pie de cada PDF un código de
verificación y expone `GET /api/public/seals/{code}` sin sesión, pero el frontend no lo consume:
quien tiene el papel (la Coordinación, o la decanatura, que no tiene cuenta) no tiene dónde
contrastarlo. Autoridad del cableado: `Tramita/specs/006-verifiable-document-seal/contracts/openapi.yaml:28-95`
y `:243-274`.

## Alcance autorizado

- `PublicSeal` en `lib/types.ts` y `getPublicSeal(code)` en `lib/api.ts`: 404 → `null`, otro
  error → `parseProblem`, código con `encodeURIComponent`.
- `app/verificar/page.tsx` fuera de `AppShell`: quitar espacios, pasar a mayúsculas y validar
  `^[0-9A-Z]{1,13}$` antes de consultar; sin `maxLength`; sin autocorregir `0`/`O` ni `1`/`I`.
  Textos de 200, 404 y otro error según #82. Fecha en `dd/MM/yyyy` con `timeZone: 'America/Bogota'`.
- Entradas desde el menú (`NAV`) y desde el login.

Fuera de alcance: `POST /seals/verify`, `GET /requests/{id}/seals`, prellenar con `?code=`,
reglas por `definition.code`, mover el formateador a `lib/`, la T6 de #12.

## Restricciones y ruta

- Rama: `feat/verificar-sello-82`, desde `main` `be8a614`.
- TDD estricto (instrucciones del proyecto): RED → GREEN → REFACTOR; runner `pnpm test`
  (`vitest run`).
- Ruta: implementación directa delegada a un escritor (disparador: 2+ archivos no triviales,
  página y sus pruebas). Los commits los hace el padre, por rutas explícitas, tras revisar.
- RDD efectivo: `off` por `clone_local` (`gentle-ai review mode status`); no activarlo. Revisión
  final con agente limpio, pedida por el propietario.
- Entrega: una sola PR (pronóstico ~250 líneas autorales). Autorización del propietario
  («Procede… Luz verde», 2026-09-27) para issue, commits, prueba en vivo y PR.
- Sesión paralela detectada (`tramita-9c`, backend): commitear solo por rutas explícitas y
  re-verificar el remoto antes de publicar.

## Tareas

- [ ] **T1 — Cliente del sello público.** RED en `lib/api.test.ts` (404 → `null`; 200 → cuerpo
  y ruta codificada); luego `PublicSeal` y `getPublicSeal`. Commit convencional.
- [ ] **T2 — Página `/verificar`.** RED en `app/verificar/page.test.tsx`: normaliza espacios y
  minúsculas; código inválido no llama al backend; 200 con `TZ=UTC` muestra `17/09/2026`,
  estado y revisión sin «íntegro/auténtico/válido/alterado»; 404 sin «falso/alterado/inválido».
  Mutante único y temporal: formateador sin `timeZone` debe hacer fallar el test de fecha.
  Commit convencional.
- [ ] **T3 — Entradas desde el menú y el login.** Entrada «Verificar documento» en `NAV` y
  enlace bajo el formulario del login. Commit convencional.
- [ ] **T4 — Prueba en vivo** contra el backend local (registra un sello): `/verificar` sin
  sesión no redirige; el código de un PDF descargado coincide en fecha, estado y revisión;
  `ZZZZZZZZZZZZZ` no da resultado.
- [ ] **T5 — Revisión con agente limpio y PR** con `Closes #82`.

## Criterios de aceptación (de #82)

1. `/verificar` abre sin sesión y no redirige al login.
2. Espacios y minúsculas se normalizan; fuera de `[0-9A-Z]` o más de 13 no llaman al backend.
3. Con 200 muestra fecha, estado y revisión; la fecha es `17/09/2026` para
   `2026-09-17T23:30:00-05:00` aun corriendo en UTC.
4. Con 200 declara que no detecta modificaciones del contenido, sin «íntegro», «auténtico»,
   «válido» ni «alterado».
5. Con 404 dice que no hay documento emitido con ese código, sin «falso», «alterado» ni «inválido».
6. La página no pide ni muestra datos personales.
7. Hay enlace desde el login y desde el menú.
8. `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm test` y `pnpm build` en verde.

## Progreso y evidencia

- Estado inicial: `main` limpio en `be8a614`; suite base 28 archivos, 355 pruebas en verde.
- #82 publicado el 2026-09-27 desde el brief del backend, con cuatro citas corregidas
  (`DoFr100Renderer.java:442-448`, `app-shell.tsx:44-48,141`, `app-shell.tsx:23-27`, enlace
  cruzado al PR del backend); leído de vuelta, idéntico al borrador.
- Medido antes de implementar: `vi.stubEnv('TZ', 'UTC')` cambia la zona dentro de Vitest 4.1.11
  (node y jsdom): sin `timeZone` el instante da `18/09/2026`; con `America/Bogota`, `17/09/2026`.

## Próximo paso

T1.
