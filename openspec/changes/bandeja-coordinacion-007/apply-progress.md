# Apply Progress: Bandeja de trabajo de la Coordinación (bandeja-coordinacion-007)

> PR boundary de esta ejecución: **A-1 = C1 únicamente** (`feat/bandeja-007-a1-vencimiento`).
> Fases 2–8 (C2–C7) quedan pendientes para futuras ejecuciones de `sdd-apply`, cada una en su
> propia rama apilada según `stacked-to-main`.

## Estado global

| Fase | Unidad | Estado |
|---|---|---|
| 1 | C1 — Baja del vencimiento inventado | **Completa** (15/15 tareas) |
| 2 | C2 — `State.isInitial` | Pendiente |
| 3 | C3 — Tipo honesto (#9b) | Pendiente |
| 4 | C4a/C4b — Bloque del estado actual | Pendiente |
| 5 | C5 — Baja de Configuración | Pendiente |
| 6 | C6 — Cliente + hook de la bandeja | Pendiente |
| 7 | C7a/C7b — Tablero carga la bandeja | Pendiente |
| 8 | Entrega (cuerpo de la PR) | Pendiente (aplica a la PR final de cada corte) |

## Fase 1 — C1: Baja del vencimiento inventado — COMPLETA

Modo: **Strict TDD** (`openspec/config.yaml: strict_tdd: true`, runner `pnpm test` / vitest 4).

### TDD Cycle Evidence

| Tarea | RED (observado) | GREEN | REFACTOR |
|---|---|---|---|
| 1.1 — Tarjeta «Urgentes» cuenta solo prioridad | `expected '1' to be '0'` en `summary-cards.test.tsx` (contaba también el vencimiento) | `summary-cards.tsx`: `urgent` filtra solo `priority === 'urgente' && !isClosed`; label → «Urgentes» | — |
| 1.2 — Detalle no muestra vencimiento en trámite abierto antiguo | `Found multiple elements with the text matching: /Vencida/i` en `app/requests/[id]/page.test.tsx` | `page.tsx`: removidos `overdue`/`days`, la insignia «Vencida hace Nd» y la fila «Vencimiento» | — |
| 1.3 — Tabla de búsqueda no afirma vencimiento | `Found multiple elements with the text: /Vencida/` (desktop + card móvil) en `requests-table.test.tsx` (test renombrado) | `requests-table.tsx`: borrado `DueCell`, columna «Vencimiento» y sus celdas | — |
| 1.4 — Tablero sin indicadores «Vencidas»/«Por vencer» | `Unable to find an element with the text: Vencidas` (el elemento SÍ existía → fallo por presencia, no ausencia) — la aserción sobre el texto ausente falló porque el nodo estaba presente | `app/dashboard/page.tsx`: borradas ambas tarjetas de indicadores y `overdueRequests`/`dueSoonRequests` | — |

Los cuatro RED se observaron con `pnpm exec vitest run <archivo>` antes de tocar producción; cada
mensaje de fallo citado arriba es el texto real devuelto por vitest, no una suposición.

### Work Unit Evidence

| Evidencia | Valor |
|---|---|
| Comando de test focalizado y resultado exacto | `pnpm exec vitest run lib/format.test.ts lib/store.test.ts components/dashboard/summary-cards.test.tsx components/dashboard/requests-table.test.tsx app/dashboard/page.test.tsx "app/requests/[id]/page.test.tsx"` → **6 archivos, 40 tests, todos verdes** |
| Arnés de runtime | N/A — sin E2E instalado (`openspec/config.yaml`); `pnpm build` (Next.js 16, Turbopack) es la única prueba de runtime de esta unidad → **compiló y generó las 9 rutas estáticas/dinámicas sin error** |
| Rollback | Revertir el commit de C1 (`fix(vencimiento): ...`); independiente del resto de unidades — ningún archivo de C1 es tocado por C2–C7 antes de que esas unidades empiecen |

### Mutante 3 (obligatorio) — Observado

Se restauró temporalmente:
- una insignia `<Badge variant="destructive">Vencida hace 1d</Badge>` incondicional en
  `app/requests/[id]/page.tsx` (header), y
- una celda `<td>Vencida (1d)</td>` incondicional en
  `components/dashboard/requests-table.tsx` (fila desktop),

y se corrió `pnpm exec vitest run "app/requests/[id]/page.test.tsx" components/dashboard/requests-table.test.tsx`.
**Resultado observado**: 4 tests en rojo — el nuevo test de 1.2 (`expected ... to be null`, recibió
el badge), el renombrado de 1.3, y como efecto colateral esperado los dos tests preexistentes de
`requests-table.test.tsx` («cerrado», «rechazo») también cayeron, porque la celda mutada aparece en
cualquier fila. Se revirtieron ambas mutaciones con `Edit` (no se commiteó ninguna) y se confirmó
verde de nuevo antes de continuar.

### Verificación de la unidad (1.14)

| Comando | Resultado observado |
|---|---|
| `pnpm lint` | exit 0, sin salida (`eslint .`) |
| `rm -rf .next && pnpm exec tsc --noEmit` | exit 0, sin errores. **Nota**: había un proceso `next dev` vivo (pid 438742) al momento de correr `rm -rf .next`; `tsc` no se vio afectado, pero ese servidor de desarrollo puede requerir reinicio (`revisar-frontend-next`, «Trampas del entorno») |
| `pnpm test` | **21 archivos, 165 tests, todos verdes** — igual a la línea base medida el 2026-09-22 (neto 0: +3 tests nuevos de ausencia, −3 del `describe('isOverdue')` borrado) |
| `pnpm build` | Compiló con Turbopack, TypeScript sin errores, 9 rutas generadas (`/`, `/dashboard`, `/requests/[id]`, `/requests/[id]/documento`, `/requests/new`, `/settings`, etc.) |

### Criterio de aceptación de 1.12 — Desviación observada y documentada

El comando literal de la tarea 1.12
(`rg -n -i 'venc(e|er|ida|idas|imiento)|d[ií]as restantes|dueDate|isOverdue|businessDaysUntil|addBusinessDays' app components lib -g '!*.test.*'`)
da **1 resultado**, no 0:

```
app/settings/page.tsx:257:  Días hábiles antes de marcar una solicitud como vencida.
```

Es texto estático de la pantalla de Configuración, que **C5 retira por completo** (`design.md`,
`tasks.md` Fase 5) — fuera del alcance de este slice A-1 (C1 únicamente), y el prompt de esta
ejecución prohíbe explícitamente empezar C2–C7. El requisito «Ausencia de vencimiento en toda la
aplicación» del spec no queda 100% satisfecho hasta que C5 se aplique; este residuo es conocido y
esperado, no un defecto introducido por C1.

La verificación **más estricta del propio `design.md`** (D6, «Helpers muertos») sí da 0:

```
rg -n 'addBusinessDays|businessDaysUntil|isOverdue' app components lib
```
→ sin resultados. Los tres helpers y sus consumidores de producción están completamente
eliminados; lo único que sobrevive es el texto libre de Configuración, ajeno al código que esta
unidad tocaba.

`git diff main -- lib/format.ts` no toca `HAS_OFFSET` ni `parseServerDateTime` (confirmado: el
diff de `lib/format.ts` solo borra las tres funciones y su tipo `StatusVariant` queda intacto
justo debajo).

### Desviaciones de diseño

`tasks.md` Fase 1 no menciona ajustar los dos tests preexistentes de `requests-table.test.tsx`
(«no muestra vencimiento de un trámite cerrado» y «tampoco lo muestra para un rechazo definitivo»),
pero al borrar `DueCell` por completo (1.8) desaparece también su placeholder `—` para trámites
cerrados, que el primero de esos tests afirmaba con
`expect(screen.getAllByText('—').length).toBeGreaterThan(0)`. Se quitó esa aserción (ya no hay
ningún `—` en la tabla) y se conservó la aserción de ausencia de «Vencida» y el comentario
explicativo, actualizado. Sin este ajuste `pnpm test` no queda verde. El resto de la unidad sigue
el diseño sin desvíos.

### Archivos tocados en C1

| Archivo | Acción |
|---|---|
| `lib/format.ts` | Borra `addBusinessDays`, `businessDaysUntil`, `isOverdue` |
| `lib/format.test.ts` | Borra `describe('isOverdue')` y el import correspondiente |
| `lib/store.tsx` | Borra import de `addBusinessDays`, `deriveDueDate`, los dos usos de `dueDate` |
| `lib/types.ts` | Borra `AcademicRequest.dueDate` |
| `lib/fixtures/mock-requests.ts` | Borra `dueDate` de los 6 objetos |
| `components/dashboard/requests-table.tsx` | Borra `DueCell`, columna «Vencimiento», celdas desktop/móvil |
| `components/dashboard/requests-table.test.tsx` | Renombra el test del mutante 3; ajusta los dos tests de estado cerrado (ver desviación) |
| `components/dashboard/summary-cards.tsx` | «Urgentes / vencidas» → «Urgentes»; cuenta solo `priority` |
| `components/dashboard/summary-cards.test.tsx` | Nuevo test de ausencia (1.1) |
| `app/dashboard/page.tsx` | Borra tarjetas «Vencidas»/«Por vencer», `overdueRequests`/`dueSoonRequests`, mitad de vencimiento del filtro «urgente» |
| `app/dashboard/page.test.tsx` | Nuevo test de ausencia (1.4); fixture sin `dueDate` |
| `app/requests/[id]/page.tsx` | Borra insignia «Vencida», fila «Vencimiento», `overdue`/`days` |
| `app/requests/[id]/page.test.tsx` | Nuevo test de ausencia (1.2); fixture sin `dueDate` |
| `app/requests/[id]/documento/page.test.tsx` | Fixture sin `dueDate` (necesario para `tsc`; C3 la sigue tocando después) |

### Commit

`fix(vencimiento): retira el vencimiento inventado y sus helpers de días hábiles` — incluye código
de producción, tests, `tasks.md` (checkboxes 1.1–1.15) y este archivo.

Tamaño medido: `git diff --stat` sobre los 14 archivos de código/test de C1 → **60 inserciones, 143
borrados (203 líneas), dentro del rango estimado por `design.md` (190–230)**. No se necesita
`size:exception` para A-1.

**Enmienda del mensaje (2026-09-22, orquestador)**: el mensaje original llevaba un pie
`Closes #9 (parcial: …)`. Se retiró antes de pushear porque GitHub cierra el issue al mergear
cualquier commit con esa palabra clave en la rama por defecto, y C1 no cierra el #9 (tasks.md,
Fase 8, 8.1: la palabra clave va solo en el cuerpo de la PR A-3). El árbol del commit no cambió.

## Próximo paso

`sdd-apply` para la Fase 2 (C2 — `State.isInitial`), rama `feat/bandeja-007-a2-...` apilada sobre
`feat/bandeja-007-a1-vencimiento` según `stacked-to-main`, gated por decisión humana (push/PR de
A-1 no están hechos por este agente).
