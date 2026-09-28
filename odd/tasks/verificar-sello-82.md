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

- [x] **T1 — Cliente del sello público.** RED en `lib/api.test.ts` (404 → `null`; 200 → cuerpo
  y ruta codificada); luego `PublicSeal` y `getPublicSeal`. Commit convencional.
- [x] **T2 — Página `/verificar`.** RED en `app/verificar/page.test.tsx`: normaliza espacios y
  minúsculas; código inválido no llama al backend; 200 con `TZ=UTC` muestra `17/09/2026`,
  estado y revisión sin «íntegro/auténtico/válido/alterado»; 404 sin «falso/alterado/inválido».
  Mutante único y temporal: formateador sin `timeZone` debe hacer fallar el test de fecha.
  Commit convencional.
- [x] **T3 — Entradas desde el menú y el login.** Entrada «Verificar documento» en `NAV` y
  enlace bajo el formulario del login. Commit convencional.
- [x] **T4 — Prueba en vivo** contra el backend local (registra un sello): `/verificar` sin
  sesión no redirige; el código de un PDF descargado coincide en fecha, estado y revisión;
  `ZZZZZZZZZZZZZ` no da resultado.
- [x] **T5 — Revisión con agente limpio y PR** con `Closes #82`: PR #83, CI `build` en verde.
- [x] **T6 — Hallazgos confirmados de la revisión limpia** (alcance aprobado por el propietario
  el 2026-09-27): campo de solo lectura durante la consulta (M1), tests de «otro error» en la
  API y en la página (M2), región `role="status"` montada desde el inicio (M3), envío vacío y
  `aria-describedby` (B1 parcial), y este documento al día (B2).

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
- T1 (ruta delegada: un escritor para T1–T3): RED `getPublicSeal is not a function`; GREEN 357
  en verde. Commit `20fce44`.
- T2: RED «no resuelve ./page»; GREEN 361 en verde. Mutantes: `formatDate` y formateador sin
  `timeZone` hacen fallar el test de fecha (el segundo, repetido por el padre: `18/09/2026`).
  Commit `352c25a`.
- T3: `tsc`, lint y build limpios; `/verificar` como ruta estática. Commit `d6b1d16`. Los tres
  commits se rehicieron antes de publicar para agregar `Refs:` y `Verificado:` (`.gitmessage`);
  `git diff` contra el respaldo, vacío.
- T4 parcial (sin sesión, vía curl): `GET /verificar` → 200 sin redirección, con el formulario;
  `GET /api/public/seals/ZZZZZZZZZZZZZ` por el proxy de `:3000` → 404 `application/problem+json`.
  Pendiente con navegador: PDF real, fecha/estado/revisión en pantalla y los dos enlaces.
- Revisión limpia (opus, sin contexto): sin CRÍTICO ni ALTO; tres MEDIO confirmados por el padre
  con comandos propios. No aplicados, con razón: día < 10 (el issue fija el dato de prueba),
  tests de los dos enlaces (los cubre la prueba en vivo; corrección posterior: solo el del login
  exige un archivo nuevo, el del menú cabe en `components/app-shell.test.tsx`, que ya existe),
  reescribir otra vez los `Verificado:` (lo que afirman se re-verificó cierto). Anotado aparte:
  el checklist `revisar-frontend-next` dice que `pnpm lint` está roto y ya no lo está.
- T6: RED 2 fallidos (sin `role="status"`; `readOnly` falso); GREEN 47 en verde. Nueve mutantes
  mueren, siete de ellos sobrevivían en la revisión (M05, M08, M09, M19, M20, M21, M22). Suite 364 en verde; `tsc`, lint, build y
  `git diff --check` limpios. Commits `0aa2a8d` y `be636e0`.
- Revisión nativa (RDD): `off` por `clone_local`; no aplica.
- T4 en vivo (Chrome, 2026-09-27, backend local): se descargó el PDF de una solicitud de adición
  de créditos, lo que registró un sello; `pdftotext` leyó en el pie `Emitido: 27/09/2026 · Estado:
  En coordinación (revisión) · Revisión: 0`. Escribir el código en minúsculas y con espacios
  consultó `/api/public/seals/<CÓDIGO>` en mayúsculas y sin espacios (200), y la pantalla mostró la
  misma fecha, estado y revisión. `ZZZZZZZZZZZZZ` → 404 y el texto de «no hay ningún documento
  emitido». `RC-000123` → error de campo y ninguna petición en la red. La entrada del menú lleva a
  `/verificar` fuera del shell; con sesión, la página no redirige; el enlace del login está en el
  HTML servido sin sesión, y `curl` sin cookies devuelve 200 sin redirección.
- Observado en vivo, sin aplicar: el contenedor `role="status"` vacío ocupa un hueco del `gap-6`, y
  deja ~24 px de más bajo el botón cuando no hay resultado (cosmético). Fuera del alcance de #82: el
  aviso de descarga del documento dice `constancia_<id>.pdf`, pero el archivo se guarda como
  `DO-FR-100-<id>.pdf`.

## Próximo paso

Merge de #83 (decisión del propietario). Después, la T6 de #12: retirar la vista previa que dice
«Verificable con folio RC-…».
