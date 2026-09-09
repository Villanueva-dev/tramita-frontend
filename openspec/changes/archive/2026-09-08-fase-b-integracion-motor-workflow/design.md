# Design: Fase B — integración con el motor de workflow

## Enfoque técnico

Cada pantalla pide al servidor lo que necesita vía `lib/api.ts` (Fase A, se reutiliza tal cual) y
compone la UI desde el payload: desaparece la copia en memoria del estado del servidor. El orden
de entrega sigue siendo el Parallel Change de la proposal (4 slices).

## Decisiones de arquitectura

### D-A: muere el Context global; los datos se piden por pantalla

| Opción | Trade-off | |
|---|---|---|
| Hook local por pantalla en `lib/` | Cada pantalla refetchea lo suyo | **Elegido** |
| Mantener `TramitaProvider` como caché | Duplica estado del servidor que cambia por transiciones: cada 409 nace de esa copia vieja | Descartado |
| Server Components | `lib/api.ts` es de navegador por construcción: path relativo (`api.ts:10`) vía proxy (`proxy.ts:24`) y `document.cookie` para el CSRF (`api.ts:46-47`) | Descartado |
| TanStack Query / SWR | Rompe «ninguna dependencia npm nueva» (proposal `:87`) | Descartado |

Nada compartido justifica el provider: `getRequest` (`store.tsx:90-93`) busca en una lista
precargada que ya no existe — `search` es `required: true` (`openapi:60-62`). **Cierra D4**:
`app/layout.tsx:43` deja de importar `lib/store`; `AuthProvider` (`:42`) se queda, porque la
sesión sí es estado del cliente.

### D-B: el parseo UTC vive en `lib/format.ts`

El backend escribe `LocalDateTime.now(ZoneOffset.UTC)` (`Request.java:80`,
`RequestTransitionLog.java:69`) y serializa sin offset; JS lee un date-time sin offset como hora
**local** → 5 h de corrimiento en `America/Bogota`.

**Elegido**: función pura `parseServerDateTime(iso): Date` exportada por `lib/format.ts`, único
lugar autorizado a construir un `Date` desde un valor del servidor; si el valor ya trae offset o
`Z`, se respeta (chequeo determinista, no heurística). **Descartado**: normalizar en `lib/api.ts`
(obligaría a un mapper por shape y los tipos dejarían de espejar el contrato) y crear
`lib/datetime.ts` (un archivo para 3 líneas con un solo consumidor — KISS, `project.md:30`).

### D-C: el detalle hace dos GET en paralelo

`Request` (`openapi:221-235`) no tiene `updatedAt`: la antigüedad solo sale del `occurredAt` de la
última entrada del timeline. **No es una llamada extra** — la misma pantalla ya renderiza el
timeline (`app/requests/[id]/page.tsx:440`). Descartado pedir `updatedAt` al backend (fuera de
alcance) y derivarla de `createdAt` (responde la antigüedad del trámite, no la del estado).

### D-D: el 409 se maneja con un único camino de recarga

`useRequestDetail(id)` expone `reload()` (los dos GET) y es la **única** escritura del estado de
la pantalla: al montar, tras el 200 de una transición, y desde el botón «Actualizar estado
vigente» que ofrece el diálogo ante un 409. Sin actualización optimista. El texto sale del
`detail` del problem+json, que el backend ya redacta en español
(`GlobalExceptionHandler:51-52,63-68`). Descartado usar el body del 200 para ahorrar un GET: crea
un segundo camino de escritura que el test del 409 ya no ejercita, y con uno o dos usuarios ese
GET no cuesta nada (`project.md:86`).

### D-E: el 422 se ata al campo con un mapa estático por operación

`Problem` (`openapi:165-176`) no tiene puntero de campo, pero cada operación tiene **una** causa
de 422: crear → definición inexistente (`RequestServiceImpl:52`); transicionar → nota faltante
(`:123-126`). Bean Validation sale 400. Se declara `{ 422: 'definitionCode' }` y
`{ 422: 'note' }` junto a cada función de dominio; **nunca** se inspecciona el texto del `detail`.
Resto: 409 → banner + recargar; 400 → error de formulario con `detail`; 404 → «no encontrado»;
401/403/429 ya los resuelve `lib/api.ts` (`:19-20,63-65,96-101`).

## Flujo de datos

    pantalla ──→ hook (lib/use-*.ts) ──→ lib/api.ts ──→ /api/* ──→ proxy.ts ──→ backend
       ↑                  │
       └── estado local ──┘   reload() = GET /requests/{id} ∥ GET /requests/{id}/timeline

## Cambios de archivos

| Archivo | Acción | Slice |
|---|---|---|
| `lib/types.ts` | Modificar | 1 agrega el modelo del contrato · 4 borra el viejo |
| `lib/api.ts` | Modificar | 1 — funciones de dominio + mapa de campo por operación |
| `lib/format.ts` | Modificar | 1 — `parseServerDateTime`, `daysSince`; 4 borra `daysUntil`/`isOverdue`/`statusVariant` |
| `lib/use-request-search.ts` | Crear | 3 — búsqueda por nombre/cédula (el dashboard de seguimiento se difirió) |
| `lib/use-request-detail.ts` | Crear | 4 — detalle + timeline + `reload()` |
| `app/layout.tsx` | Modificar | 4 — sale `TramitaProvider` |
| `lib/store.tsx`, `lib/mock-data.ts` | Borrar | 4 |
| `components/workflow-timeline.tsx`, `app/requests/[id]/page.tsx` | Modificar | 4 |
| `app/requests/new/page.tsx`, `app/dashboard/*` | Modificar | 3 |
| `components/workflow-stepper.tsx`, `app/settings/` | Borrar | 2 |

## Interfaces

```ts
export function parseServerDateTime(value: string): Date
export function daysSince(value: string, now?: Date): number
export function useRequestDetail(id: string): {
  request: Request | null; timeline: TimelineEntry[]
  loading: boolean; error: ApiError | null
  reload: () => Promise<void>
  advance: (targetStateCode: string, note?: string) => Promise<void>
}
```

## Estrategia de testing

| Capa | Qué | Cómo |
|---|---|---|
| Unit | `parseServerDateTime` (con y sin offset), `daysSince`, funciones de dominio | Vitest con `TZ` fija y `fetch` mockeado — patrón de `lib/api.test.ts` |
| Integración | Estado final sin acciones, responsables divergentes, 422 en el campo, 409 → recargar | `@testing-library/react` + jsdom |
| E2E | — | No hay runner (`project.md:64`) |

## Threat Matrix

N/A — no se toca `proxy.ts` ni ningún límite de shell, subproceso, automatización VCS/PR o
clasificación de ejecutables.

## Migración / Rollout

Sin migración: el front no persiste. Slices 1–4 de la proposal, cada uno con `pnpm test` y
`pnpm exec tsc --noEmit` verdes.

## Preguntas abiertas

- [x] **D5 — dashboard**: **RESUELTO por diferimiento** (2026-08-23). El slice 3 entrega el
      dashboard como **buscador puro**: `lib/use-request-search.ts` sirve a la búsqueda por
      nombre o cédula y nada más. **Ya no bloquea el slice 3.** El dashboard de seguimiento
      (no finales ordenados por tiempo sin movimiento, sin umbral ni semáforo) vuelve en un
      ciclo posterior, después de un change en el backend que haga `search` opcional y agregue
      el último movimiento a `RequestSummary`. Criterio completo y su respaldo en las
      entrevistas: `proposal.md`, sección «D5 — el dashboard».
- [ ] Una segunda causa de 422 en una misma operación rompería el mapa estático de D-E. Es un
      cambio de contrato, no deuda del front.
