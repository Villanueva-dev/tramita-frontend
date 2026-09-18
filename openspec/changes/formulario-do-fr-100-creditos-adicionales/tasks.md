# Tasks: Formulario público del DO-FR-100 — matrícula de créditos adicionales

> **Reorientadas el 2026-09-16.** Las 29 tareas anteriores describían una pantalla interna.
> Sobrevive la Fase 1 estructural (bloques del formato, guarda del literal); se caen las tareas
> de las 17 casillas y toda la fase de envío; entran dos bloques nuevos: **la firma** y **el
> acuse**.

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~900–1100 (7 archivos nuevos, 2 modificados) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 esqueleto público → PR 2 firma → PR 3 envío y acuse |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main |

Cada PR sale de `main` ya actualizado, sin rebases ni PRs apuntando a ramas de feature. PR 1 es
demostrable por sí solo —la pantalla se ve y se abre sin sesión, aunque todavía no envíe—, que es
lo que habilita pedir feedback temprano.

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Ruta pública accesible sin sesión + bloques del formato | PR 1 | `pnpm test -- solicitud` | Abrir la ruta en ventana privada, sin backend | Revierte archivos nuevos; sin huella en `requests/new`, `lib/`, `app-shell.tsx` |
| 2 | Captura de la firma | PR 2 | `pnpm test -- firma` | **Firmar con el dedo en un teléfono real** | Revierte el componente de firma; el esqueleto queda |
| 3 | Envío, validación total, errores y acuse | PR 3 | `pnpm test -- solicitud` | Enviar contra el backend con el endpoint público vivo | Revierte el envío; la pantalla queda visible y de solo lectura |

⚠️ **PR 3 está bloqueada end-to-end**: el endpoint público no existe (0/45 tareas en el backend).
Se desarrolla contra el contrato y se verifica con mocks; la prueba real espera al backend.

**Issues**: la última PR de la cadena cierra `Closes #2` — el issue de esta change. Las dos
anteriores lo referencian sin cerrarlo (`Refs #2`), porque el criterio de cierre de `#2` exige la
pantalla completa.

### Fase 0 — Antes de escribir código

- [ ] 0.1 🔴 **Decisión del responsable sobre `tramita-frontend#7`**: subir `next` a `>=16.3.3` antes de publicar la pantalla, o dejar por escrito que se acepta publicar un canal sin sesión sobre dos RCE críticas sin autenticar. **No es una tarea técnica: es una decisión que hay que poder defender.** Si se actualiza: `pnpm test`, `rm -rf .next && pnpm exec tsc --noEmit` y `pnpm build` deben seguir verdes, y se mide de nuevo con `pnpm audit`.
- [ ] 0.2 Verificar que `APP_CORS_ALLOWED_ORIGINS` del backend incluye el origen del front (`Tramita#20`: `.env.example:4` trae el `5173` de Vite, no el `3000` de Next). Sin esto, PR 3 no se puede probar contra el backend local.
- [ ] 0.3 Anotar en el checklist de despliegue que **el origen público debe entrar en la allowlist de CORS** cuando el front y el backend queden en dominios distintos. No lo rompe ningún test: se pierde si no se escribe.

## Fase 1 (PR 1) — La ruta pública y el formato

- [x] 1.1 RED `page.test.tsx`: **la página renderiza sin sesión y no redirige**. Falla: la ruta no existe. Es el test que habría detectado el error del design anterior.
- [x] 1.2 GREEN: crear `app/solicitud/creditos-adicionales/page.tsx` **sin montar `AppShell`** + `components/do-fr-100/sections.tsx` con los bloques estáticos.
- [x] 1.3 GUARD `page.test.tsx`: el árbol no contiene `AppShell` ni consume el store de solicitudes.
- [x] 1.4 RED `page.test.tsx`: orden de los bloques y rótulos oficiales de los campos diligenciables. Corregidos el rótulo oficial de programa y el orden semestre/modalidad con RED/GREEN observado.
- [x] 1.5 GUARD `page.test.tsx`: **no existe ninguna casilla** — ni de tipo de solicitud ni de motivo (`queryAllByRole('checkbox')` = 0), y el tipo aparece afirmado como texto.
- [x] 1.6 GUARD `page.test.tsx`: guarda de `workflow-requests` (a) — `queryAllByRole('combobox')` = 0.
- [x] 1.7 GUARD `page.test.tsx`: no existe campo de asignatura, código de asignatura ni créditos; el único texto libre extenso es «Compromisos adquiridos».
- [x] 1.8 GREEN: completar `sections.tsx` con los once campos y el bloque de firma vacío. El marcador ahora usa una figura nombrada, compatible con el canvas planeado.
- [x] 1.9 RED: crear `definition-code.test.ts` — guarda de `workflow-requests` (b): lee `page.tsx` con `node:fs`, cuenta `ADICION_CREDITOS`, espera **1**.
- [x] 1.10 GREEN: ajustar `page.tsx` a un único literal.
- [x] 1.11 Verificar `pnpm test` completo; `app/requests/new/page.test.tsx` **sin editar** y con todos sus `it(...)` verdes — contar con `rg -c '^\s*it\(' app/requests/new/page.test.tsx` al ejecutar, no citar el número.
- [x] 1.12 Verificar `rm -rf .next && pnpm exec tsc --noEmit` y `pnpm lint` sin errores.

## Fase 2 (PR 2) — La firma

- [x] 2.1 RED `canvas-firma.test.tsx`: el componente expone `{ dataUrl, hayFirma }` y arranca con `hayFirma: false`.
- [x] 2.2 GREEN: crear `components/firma/canvas-firma.tsx` con Pointer Events, `setPointerCapture` y escalado por `devicePixelRatio`.
- [x] 2.3 RED: **un lienzo en blanco no cuenta como firma**, aunque `toDataURL()` devuelva un PNG válido. `hayFirma` sigue en `false`.
- [x] 2.4 GREEN: llevar `hayFirma` en estado propio, activado por el primer `pointerdown`, nunca inferido del data URL.
- [x] 2.5 RED: tras trazar, `dataUrl` empieza por `data:image/png;base64,`; tras «Limpiar», `hayFirma` vuelve a `false`.
- [x] 2.6 GREEN: suavizado por punto medio + `quadraticCurveTo`, y acción «Limpiar».
- [x] 2.7 **Guarda de CSS**: el canvas declara `touch-action: none`. jsdom no ejercita el gesto, así que esta tarea verifica que **la declaración existe**, y deja explícito que no prueba el gesto.
- [x] 2.8 **Verificación manual completada**: el maintainer confirmó que el canvas corregido permite dibujar la firma con el dedo en un dispositivo móvil real. No se registraron detalles de dispositivo o navegador.
- [x] 2.9 Verificar `pnpm test`, `rm -rf .next && pnpm exec tsc --noEmit`, `pnpm lint`.

### Corrección crítica de firma — pre-Fase 3

> **Motivo.** Las tareas 2.4, 2.5 y 2.8 siguen registrando correctamente el trabajo realizado,
> pero su afirmación de que el primer `pointerdown` basta para firmar quedó invalidada: un toque
> sin desplazamiento no constituye un trazo significativo. Estas tareas corrigen el contrato sin
> reabrir evidencia válida de la Fase 2 ni adelantar el envío de la Fase 3.

- [x] 2.10 RED/GREEN: un toque o desplazamiento menor al umbral de trazo significativo no firma;
  un desplazamiento que alcanza el umbral sí firma y conserva la salida PNG.
- [x] 2.11 RED/GREEN: cambiar la identidad de `onChange` no reinicia una captura existente y los
  eventos posteriores notifican al callback vigente.
- [x] 2.12 RED/GREEN: ofrecer una carga de imagen PNG/JPEG operable por teclado como alternativa
  accesible al canvas; su resultado alimenta el mismo contrato `SignatureCapture` y limpiar
  reinicia ambas vías.
- [x] 2.13 RED/GREEN: nombrar la figura y el bloque como `Firma del solicitante`, sin conservar
  el nombre accesible obsoleto `Espacio para firma`.
- [x] 2.14 RED/GREEN: agregar guardas que fallen si se eliminan los comandos de dibujo o se cambia
  la codificación PNG; aislar la sustitución de `devicePixelRatio` para que sus descriptores no
  se filtren entre pruebas.
- [x] 2.15 Documentar el umbral, la alternativa accesible y el límite de jsdom; verificar el
  lote de corrección sin implementar comportamiento de envío/API de la Fase 3. La historia del
  sandbox se preserva: allí `pnpm build` falló porque Turbopack no pudo enlazar un puerto y el
  diagnóstico no canónico webpack falló al analizar `tsc --showConfig`. La verificación canónica
  fue resuelta por el maintainer: `pnpm build` terminó con código 0 en 8.4142 s y una segunda
  corrida también compiló; ambas completaron TypeScript, generaron 9/9 páginas estáticas y
  emitieron `/solicitud/creditos-adicionales` como ruta estática. La verificación manual final
  confirmó dibujo con mouse en Chrome de escritorio usando la URL correcta, dibujo con dedo en
  móvil, y carga/limpieza por teclado de imagen; no se registraron versiones ni detalles de
  dispositivo. El error HMR WebSocket pertenecía a la URL de desarrollo incorrecta, no al canvas.

## Fase 3 (PR 3) — Envío, validación, errores y acuse

- [ ] 3.1 RED `lib/api.test.ts`: `submitPublicRequest('ADICION_CREDITOS', body)` llama a `/public/requests/ADICION_CREDITOS`.
- [ ] 3.2 RED: el cuerpo emitido contiene **exactamente los once campos** y **no** contiene `definitionCode`.
- [ ] 3.3 GREEN: agregar `submitPublicRequest` en `lib/api.ts` con allowlist propio por desestructuración, y los tipos en `lib/types.ts`. **`createRequest` no se toca.**
- [ ] 3.4 RED `page.test.tsx`: por **cada uno de los once campos**, vaciarlo impide el envío y lo marca inválido.
- [ ] 3.5 RED: un campo con solo espacios tampoco pasa (validación tras `trim()`).
- [ ] 3.6 RED: cada campo sobre su límite (120/20/255/30/120/120/120/50/50/2000) impide el envío.
- [ ] 3.7 GREEN: `validate()` con obligatoriedad y límites de los once.
- [ ] 3.8 RED: `semester` viaja `"8"` sin transformar.
- [ ] 3.9 RED: `404` → mensaje accionable que **no** revela si el trámite existe; los datos diligenciados se conservan.
- [ ] 3.10 RED: `413` → mensaje que orienta a limpiar la firma y volver a trazarla.
- [ ] 3.11 RED: `422` → error atado al campo que nombra el `problem+json`.
- [ ] 3.12 RED: `429` → mensaje con los segundos de espera, reusando `apiErrorMessages` (`lib/api-errors.ts:31-36`, ya existente).
- [ ] 3.13 GREEN: `handleSubmit` con el `catch` de `ApiError` y el ruteo de errores.
- [ ] 3.14 RED: tras el `201`, el formulario **deja de mostrarse**, aparece el acuse, y **no hay navegación**.
- [ ] 3.15 RED: el acuse **no contiene** identificador, estado ni enlace de consulta, y menciona que la Coordinación responde al correo diligenciado.
- [ ] 3.16 GREEN: estado de envío y acuse in situ.
- [ ] 3.17 RED: ninguna frase de la pantalla ni del acuse afirma validez legal de la firma.
- [ ] 3.18 Verificar `pnpm test` completo, `rm -rf .next && pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm build`.
- [ ] 3.19 ⚠️ **Bloqueada por el backend**: enviar una solicitud real contra el endpoint público. No se puede cerrar hasta que existan las 45 tareas de `../Tramita/specs/004-public-request-capture/`.

## Cierre — Success Criteria (medidos)

- [ ] Un visitante sin sesión abre la ruta, diligencia, firma y recibe acuse, sin redirección.
- [ ] El cuerpo emitido tiene exactamente los once campos y ningún `definitionCode`.
- [ ] Ningún campo vacío (ni con espacios) permite enviar.
- [ ] Un lienzo en blanco no cuenta como firma.
- [x] La firma se probó **con el dedo en un dispositivo táctil real** (tarea 2.8): el maintainer confirmó que el canvas corregido permite dibujar con el dedo.
- [ ] El acuse no expone identificador, estado ni enlace de consulta.
- [ ] `pnpm test` verde; `rm -rf .next && pnpm exec tsc --noEmit`, `pnpm lint` y `pnpm build` sin errores.
- [ ] `app/requests/new/page.test.tsx` intacto y con todos sus `it(...)` verdes. El conteo se mide al cerrar con `rg -c '^\s*it\(' app/requests/new/page.test.tsx`: el «9» original venció al integrar `ede7bc3`.
- [ ] Cero datos personales reales en cualquier archivo del repo.
- [ ] Preguntas a la Coordinación: **1, 2, 3 y 4 respondidas**; **5 y 6 explícitamente pendientes** (validez legal de la firma, y si el trazo es dato biométrico bajo la Ley 1581).
