# Datos académicos seleccionables en el formulario público DO-FR-100

## Objetivo y problema

En el paso «Datos académicos» del formulario público (`app/solicitud/creditos-adicionales`),
el programa ya se elige del catálogo `GET /api/public/programs` (#76, `00ec201`), pero sede,
facultad, semestre y modalidad siguen como texto libre (`components/do-fr-100/sections.tsx:216-219`).
El estudiante los escribe como puede —abreviaturas, variantes, errores— y la Coordinadora termina
devolviendo solicitudes para corrección. Objetivo: que los cuatro campos se elijan de listas
cerradas, sin cambiar el contrato del backend.

El pedido llegó con el mockup de Claude Design «Formulario publico DO-FR-100.dc.html» (proyecto
`de6ad1d8-…`), cuya instrucción es «Los campos de datos académicos deben ser seleccionables para
evitar depender del usuario y reducir las probabilidades del mal diligenciamiento». El mockup
todavía dibuja los cuatro campos como texto; solo se adopta la instrucción.

## Decisiones del propietario (2026-09-28)

- **Modalidad**: únicamente Presencial, Distancia y Virtual. La oferta nacional también publica
  Combinada e Híbrida ([programas](https://www.uniremington.edu.co/programas/)); se descartan.
- **Sede**: solo Cali, por ahora.
- **Facultad**: las siete de la página oficial —Medicina Veterinaria, Ciencias Jurídicas y
  Políticas, Ciencias Empresariales, Ciencias de la Salud, Ciencias Contables, Ingenierías y
  Diseño—, como selector independiente del programa. Derivarla del programa quedó descartado: la
  009 del backend declara que no existe el mapa programa→facultad de la sede
  (`Tramita/specs/009-program-catalog-annex/spec.md:115`).
- **Semestre**: del 1 al 12, como ordinal. 12 es la duración de Medicina según su
  [página](https://www.uniremington.edu.co/programas/medicina/) (leída con WebFetch, confianza
  media). Aprobado con el plan.
- Plan aprobado: `~/.claude/plans/arma-el-plan-leyendo-shimmering-cocke.md`.

## Evidencia del contrato

- El backend acepta cualquier texto en los cuatro campos: `PublicRequestBody.java:52-55`
  (`@NotBlank @Size(max = 120|50)`). No hay enmienda de contrato.
- Ninguna lógica del backend depende de su valor: se persisten (`RequestServiceImpl.java:143-145`)
  y se imprimen en el PDF (`DoFr100Renderer.java:309-312`).
- El clon local del backend está en `0b6a02f` y el remoto en `fa3573a`; el delta (`gh api
  repos/Villanueva-dev/Tramita/compare/0b6a02f...fa3573a`) no toca estos campos.

## Alcance autorizado

- Nuevo `lib/public-request-options.ts` con las cuatro listas y su procedencia, marcadas como
  provisionales (sin confirmación escrita de la Coordinación).
- `SelectField` en `components/do-fr-100/sections.tsx`; `AcademicFields` reemplaza las cuatro
  `TextField` por selectores. El selector del programa no cambia.
- `app/solicitud/creditos-adicionales/page.tsx`: sede preseleccionada mientras sea la única
  opción; los cuatro campos salen de la normalización de una línea.
- Tests de la página y test unitario de las listas.
- Enmienda de `openspec/specs/do-fr-100-form/spec.md`.

Fuera de alcance: el semestre del formulario interno (`app/requests/new/page.tsx:331-341`, también
texto libre); el resto del mockup (ayuda, adjuntos —el backend no recibe archivos—, número de
radicado —`PublicReceipt` no lo expone—); editar el mockup de Claude Design.

## Decisiones de diseño

- **D1 — Las listas viven en `lib/`, junto a los límites.** `lib/public-request-options.ts`
  sigue el patrón de `lib/public-request-limits.ts`: un registro por campo, tipado contra el
  contrato. Un test unitario comprueba que cada opción cabe en su límite de
  `PUBLIC_REQUEST_FIELD_LIMITS`: la garantía de longitud pasa de la UI a la construcción.
- **D2 — La sede se preselecciona solo mientras sea la única opción.** Un valor fijo se volvería
  un defecto silencioso el día que se agregue otra sede. Facultad, semestre y modalidad empiezan
  vacíos, como el programa («sin preselección»).
- **D3 — Los valores viajan tal como están en la lista.** Los cuatro campos salen de
  `SINGLE_LINE_FIELDS`, igual que el programa. No cambia el comportamiento (las opciones no
  tienen espacios sobrantes); mantiene la spec coherente con su propio criterio.
- **D4 — Facultad con nombre corto** («Ingenierías», no «Facultad de Ingenierías»): el rótulo ya
  dice «Facultad» y el PDF imprime «Facultad | Ingenierías». **Semestre como dígito** (`"8"`),
  el ordinal que exige la spec.
- **D5 — La desviación del papel se declara.** La plantilla DO-FR-100 v2024 pide estos campos
  escritos. La 009 del backend advirtió lo mismo sobre el programa («se aparta de ese
  instrumento; es defendible por la calidad del dato»). La enmienda de la spec lo justifica por
  escrito.

## Restricciones y ruta

- Worktree `../tramita-frontend-worktrees/datos-academicos`, rama
  `feat/datos-academicos-seleccionables` desde `main` `bcab51f` (igual a `origin/main`).
  Dependencias propias (`pnpm install --frozen-lockfile --offline`). Sin índice CodeGraph propio:
  el mapa se hizo sobre el checkout principal en el mismo commit.
- Sesión paralela activa en `../tramita-frontend-worktrees/filtros-bandeja` (#96, tablero); sin
  archivos en común. Commits por rutas explícitas; antes de cualquier push, `git ls-remote` y
  `gh pr list --head` en el mismo comando.
- TDD estricto (`~/.claude/CLAUDE.md`): RED → GREEN → REFACTOR. Runner `pnpm test` (`vitest run`);
  enfocado `pnpm exec vitest run <archivo>`. Línea base en `bcab51f`: 27 archivos / 398 tests.
- Verificación por tarea, en el orden del CI: `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm test`,
  `pnpm build`, `git diff --check`.
- Ruta: **delegada** para T1 (disparador de escritor: cuatro archivos no triviales —opciones,
  secciones, página y sus tests— más la spec). T2 inline (un archivo mecánico). RDD `off` por
  `clone_local`.
- Diff mostrado al propietario antes de cada commit; prueba en vivo en `:3001` antes de la PR (el backend admite el origen con que se levantó: ver la prueba en vivo);
  push y PR con autorización separada.
- Estrategia de entrega: `single-pr`. Pronóstico: ~250–350 líneas autorales.

## Tareas

- [x] **T1 — Listas cerradas y selectores.** Commit `d7983d8` (era `c20566f` antes del rebase). Ruta: delegada (escritor); RDD `off` por `clone_local`, sin evaluación de riesgo. `lib/public-request-options.ts` (+ test),
  `components/do-fr-100/sections.tsx`, `app/solicitud/creditos-adicionales/page.tsx` (+ test),
  `openspec/specs/do-fr-100-form/spec.md`. Ajustes de tests previstos:
  - fixtures `campus`/`faculty` a `'Cali'`/`'Ingenierías'` (un select no acepta un valor ajeno);
  - la prueba «program as the only catalog selector» pasa de 1 a 5 comboboxes;
  - la prueba de «vacío tras trim» se acota a los campos de texto; los selects ganan «sin elegir
    bloquea Continuar»;
  - la tabla de límites pierde `campus`, `faculty`, `modality` y `semester` (inalcanzables con un
    select), cubiertos por el test unitario de D1.
- [x] **T1b — Pista de la sede (hallazgo de la prueba en vivo).** Commit `a1d0ed3` (era `d60c4b1` antes del rebase). Aprobado por el propietario
  el 2026-09-28. Ruta: inline (tres ediciones pequeñas y ya entendidas). `SINGLE_CAMPUS` en
  `lib/public-request-options.ts` es la única fuente de «hay una sola sede»: la preselección y la
  pista «Por ahora, este formulario atiende solo la Sede Cali.» desaparecen juntas cuando haya
  varias. `SelectField` acepta una pista opcional enlazada por `aria-describedby`, como
  `TextField`. Se agregan un escenario y un párrafo a la spec.
- [x] **T2 — Registro.** Ruta: inline (un archivo mecánico). Hashes, evidencia RED/GREEN y
  checks en este documento y su copia en engram (`odd/datos-academicos-seleccionables/tasks`).

## Progreso y evidencia

- 2026-09-28: plan aprobado; worktree creado; línea base 398/398 en verde.
- 2026-09-28, T1 implementada por un escritor delegado, sin commit:
  - **RED**: `pnpm exec vitest run lib/public-request-options.test.ts app/solicitud/creditos-adicionales/page.test.tsx`
    falló primero en la importación (el módulo no existía). Con solo el módulo de datos, 6
    fallaron y 85 pasaron. Los 6: «keeps program as the only selector fed by the catalog», los 4
    «renders <field> as a required select…» y «preselects the campus only…». Otros cinco tests
    nuevos ya pasaban con inputs de texto: los 3 «left unselected», «sends the chosen values
    exactly as listed» y el de altura y letra. Son guardas de regresión, no evidencia de RED.
  - **GREEN**: la suite completa pasa, 28 archivos y 409 tests.
  - **Desviación del escritor**: quitó las filas de sede, facultad, semestre y modalidad del
    `it.each` «links a synthetic example hint to %s». Esos campos ya no tienen hint (alcance
    autorizado), así que es consecuencia directa del cambio.
  - **Ajuste del orquestador**: `SelectField` toma las opciones de `ACADEMIC_FIELD_OPTIONS[field]`
    en vez de recibirlas como prop, así que no se puede combinar un campo con la lista de otro.
  - **Checks del orquestador**, tras el ajuste y en el orden del CI:
    - `pnpm lint`: exit 0.
    - `pnpm exec tsc --noEmit`: exit 0.
    - `pnpm test`: 28 archivos, 409 tests.
    - `git diff --check`: exit 0.
    - `pnpm build` con `.next` limpio: exit 0.
  - **Tamaño**: +218/−25 en los archivos existentes y 78 líneas nuevas en `lib/`.

- 2026-09-28, commit de T1 `c20566f` (hoy `d7983d8`), aprobado por el propietario.
- 2026-09-28, **prueba en vivo** (Chrome, `next dev -p 3001` desde este worktree):
  - **Backend**: `:8080`, levantado desde la terminal del propietario. Él lo reinició con
    `APP_CORS_ALLOWED_ORIGINS=http://localhost:3001`. Antes solo admitía `:3000`, que usaba la
    sesión paralela. El proxy (`proxy.ts:5-6`) reenvía el `Origin` tal cual, así que un POST
    desde `:3001` habría recibido 403.
  - **Escritorio, 1920 px**:
    - «Continuar» sin elegir marca `aria-invalid` en programa, facultad, semestre y
      modalidad. El foco va al programa y el aviso del paso nombra los cuatro campos.
    - Tras elegir, la página avanza. La revisión muestra Sede «Cali», Facultad «Ingenierías»,
      Semestre «7» y Modalidad «Distancia».
    - Se envió una solicitud sintética (cédula `0000000928`) y apareció «Solicitud recibida».
  - **Hallazgo introducido por T1**: en la primera fila, el selector de Sede queda 30 px más
    arriba que el de Programa (`top` 524 frente a 554). El programa tiene una pista y la sede ya
    no; antes tenía «Por ejemplo: Cali». La segunda fila sí queda alineada (666 y 666). jsdom no
    podía verlo.
  - **390 px** (`iframe` de ese ancho, mismo método que en #86):
    - Una sola columna, sin desborde horizontal (`scrollWidth` 373 = `clientWidth` 373).
    - Los cinco selectores miden 290 px de ancho.
    - «Ciencias Jurídicas y Políticas» cabe: 227 de 234 px.
  - **Preexistente, fuera de alcance**:
    - A 390 px se corta el programa más largo (selector de #76).
    - El aviso del paso nombra «Modalidad» antes que «Semestre»: sigue el orden de claves de
      `INITIAL_VALUES`, no el de la pantalla.
    - `aria-invalid` persiste hasta el siguiente «Continuar», igual que en los campos de texto.
  - **Pendiente**: comprobar en el detalle interno lo que quedó guardado. El reinicio del
    backend cerró la sesión del navegador (`/api/auth/me` → 401).

- 2026-09-28, **T1b**:
  - **RED**: `pnpm exec vitest run lib/public-request-options.test.ts app/solicitud/creditos-adicionales/page.test.tsx`
    da 2 fallidos y 87 aprobados («exposes the single campus…» y «explains the single campus
    with a hint…»).
  - **GREEN**: 89/89 enfocados. Suite completa 28/411; `pnpm lint`, `pnpm exec tsc --noEmit` y
    `git diff --check` sin errores.
  - **En vivo, 1920 px**: los selectores de programa y sede quedan en `top` 724 y 724, y sus
    rótulos en 659 y 659. La pista se ve y `aria-describedby="campus-hint"`.
  - **En vivo, 390 px**: sin desborde (375 = 375); la pista ocupa dos líneas.
  - `pnpm build` queda para antes del push: compartiría `.next` con el `next dev` de `:3001`,
    que sigue arriba para la verificación con sesión.

- 2026-09-28, **verificación con sesión, hecha por el propietario**:
  - La solicitud `0000000928` quedó guardada y aparece en el detalle interno.
  - El detalle no muestra sede, facultad ni modalidad: `RequestResponse.java` expone
    `program` y `semester`, pero no `campus`, `faculty` ni `modality`. Esos tres valores solo
    se pueden comprobar en el PDF (`DoFr100Renderer.java:309-312`).
  - Mejoras detectadas, fuera de alcance, para issues aparte:
    - exponer sede, facultad y modalidad en el detalle (backend y front);
    - ocultar la tabla vacía «Lo que se solicita» (Código, Asignatura, Créditos, Grupo) en
      las solicitudes públicas, que nunca traen asignaturas (misma clase que #90). Publicado
      como **#98** (`bug`) el 2026-09-28, con el borrador aprobado y el cuerpo leído de vuelta
      desde la API.
    - El issue del backend (sede, facultad y modalidad en `RequestResponse`) se publica
      **después de la PR**, para que cite su número (decisión del propietario).

- 2026-09-28, **rebase y cierre**:
  - Rebase sobre `main` `c628f7b` (merge de #97, que solo toca el tablero), sin conflictos. Los
    hashes pasan de `c20566f`/`d60c4b1` a `d7983d8`/`a1d0ed3`.
  - Checks sobre la rama rebasada, en el orden del CI:
    - `pnpm lint`: exit 0.
    - `pnpm exec tsc --noEmit`: exit 0.
    - `pnpm test`: 28 archivos, 416 tests (los 5 de más vienen de #97).
    - `pnpm build` con `.next` limpio: exit 0.
    - `git diff --check main..HEAD`: exit 0.
  - **Tamaño**: +339/−25 en 6 archivos (`git diff --stat main..HEAD`), más este documento.
  - Se apagó el `next dev` de `:3001`. El backend del propietario sigue admitiendo solo
    `http://localhost:3001`.

## Siguiente paso

Issue de la feature y PR (borradores al propietario antes de publicar); después, el issue del
backend citando el número de la PR.
