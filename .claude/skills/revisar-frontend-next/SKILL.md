---
name: revisar-frontend-next
description: "Checklist de revisión del frontend de Trámita (Next.js 16 / React 19 / TypeScript / Vitest). Reglas duras del proyecto, convenciones de test y trampas del entorno. Invocar al revisar código del frontend, antes de un commit, al terminar una fase, o como fuente de autoridad cuando se lanza un review con agente limpio sobre este repositorio."
compatibility: "Frontend de Trámita. Asume el modelo derivado del contrato del motor (openapi.yaml de la feature 002) y la suite en Vitest + Testing Library."
---

# Revisión de código — frontend de Trámita

Checklist de **qué mirar**. El procedimiento para lanzar un review con agente limpio y qué hacer
con su informe está en `../Tramita/docs/workflow/code-review-agente-limpio.md`.

## Contexto del proyecto (no inventar sobre esto)

SPA en Next.js 16 (App Router) / React 19 / TypeScript, cliente de un **motor de workflow
configurable**. El backend define los trámites, los estados y las transiciones **como datos**, no
como código. La autoridad del cableado es
`../Tramita/specs/002-workflow-engine/contracts/openapi.yaml` **y el código Java que lo
implementa** — cuando difieren, manda el código.

Sesión por cookie HttpOnly, CSRF double-submit, errores en `application/problem+json` (RFC 9457).
Todo eso lo encapsula `lib/api.ts`: ningún componente hace `fetch` directo.

## Reglas duras

### 1. Nada del motor fijado en el cliente

Ni códigos de trámite, ni de estado, ni de transición, ni etiquetas redactadas a mano, ni mapas de
iconos o colores por estado. Un trámite que se configure mañana no tendría entrada en ese mapa.

```tsx
// 🔴 Un Record por estado: el motor puede crear estados nuevos sin tocar el front
const iconForStatus: Record<RequestStatus, LucideIcon> = { pendiente: FilePlus2, … }

// ✅ Genérico, alimentado por el dato que llega
<Badge variant="info">{currentState.name}</Badge>
```

Verificación: `rg -n 'ADICION_CREDITOS|NOVEDAD_NOTAS|REGISTRADA|EN_FACULTAD' app components lib`
→ 0 fuera de fixtures.

### 2. Toda fecha del servidor pasa por `parseServerDateTime`

El backend serializa `LocalDateTime` **sin offset** y el valor es UTC. `new Date(iso)` lo interpreta
como hora local: en `America/Bogota` son **5 horas** de corrimiento, no un error abstracto.

### 3. `null` y `[]` no son lo mismo

En estados de colección, `null` es *"todavía no se consultó"* y `[]` es *"se consultó y no hubo
resultados"*. Si la UI debe distinguirlos —casi siempre debe—, un array vacío solo no alcanza.

### 4. Toda validación de cliente necesita fuente en el contrato

Un mínimo, un máximo o un formato que no salga del `openapi.yaml` o del bean validation del backend
es una regla inventada. Ya pasó: un diálogo exigía comentarios de "al menos 5 caracteres", número
que no existía en ningún lado.

**Y al revés**: los topes del backend deben espejarse en el cliente. Un `@Size(max = 2000)` sin
`maxLength` en el campo deja salir un POST que vuelve rechazado y hace perder lo escrito.

### 5. Cada código de error, donde corresponde

- **422** — regla de negocio: va **al campo** que la incumplió, nunca a un banner suelto.
- **409** — conflicto: informar y ofrecer releer. **Sin optimismo**: no pintar la operación como
  aplicada.
- **401** — no es un mensaje: la sesión terminó. Hay que llamar a `sessionExpired()` para que el
  gate de `AppShell` redirija.
- **404** — pantalla propia, no un banner sobre una pantalla vacía.

⚠️ **No uses `err.detail` sin verificar que el backend lo llena.** Para el 400 de bean validation,
Spring devuelve el literal `"Invalid request content."` — usarlo como mensaje reemplaza un texto
en español por una cadena en inglés que no nombra ningún campo.

### 6. Fetch: handler o Effect, según quién lo dispara

Una petición que nace de **una interacción** va en el event handler
([You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)). Una que
nace de **abrir la pantalla** va en un `useEffect` — y entonces necesita el flag `ignore` en el
cleanup, o una respuesta lenta pisa a una más nueva.

### 7. Un estado que bloquea debe explicar por qué

Botón deshabilitado, lista vacía o pantalla en blanco sin un texto que diga qué pasa es
indistinguible de un fallo. Bloquear en silencio no es informar.

## Convenciones de test

Todas salieron de defectos reales de esta suite.

1. **`cleanup()` manual en el `afterEach`.** `vitest.config.mts` no activa `globals`, así que el
   auto-cleanup de Testing Library no se registra. Sin él, los renders se acumulan y todo falla con
   *"Found multiple elements"*.
2. **`mockClear()` de todo spy declarado a nivel de módulo.** Si no, acumula llamadas de otros
   tests y un `toHaveBeenCalled()` pasa sin que este test lo haya provocado.
3. **Acotá las aserciones con `within`.** `screen.getAllByText` global es frágil por construcción:
   en cuanto la página crece, empieza a contar elementos nuevos.
4. **Cuidado con el verde por *timing*.** Un `waitFor` puede capturar la ventana en que el
   componente muestra el spinner y el elemento buscado no está en el DOM. Esperá a que la carga
   **termine** antes de assertar una ausencia.
5. **El nombre del test es una afirmación.** Si dice *"y refresca el detalle"*, tiene que haber una
   aserción sobre el refresco. Un nombre correcto con aserción incompleta es **peor** que no tener
   el test: consume atención sin dar cobertura.
6. **Verificá con mutantes.** Rompé la línea que el test dice cubrir y comprobá que se pone en
   rojo. Y **verificá que la mutación se aplicó** — un reemplazo que no coincide reporta
   "sobrevive" sobre código intacto.
7. Para tests de página, mockeá `@/components/app-shell` con un stub que renderice `children`, y
   `next/navigation`. El patrón está en `app/dashboard/page.test.tsx`.

## Checklist general

**React**: dependencias de los efectos completas y estables · sin estado derivado que se pueda
calcular en el render · `key` estable en listas · nada de `setState` en cascada dentro de un mismo
efecto.

**TypeScript**: sin `any` ni aserciones `as` que oculten una forma real · uniones discriminadas en
vez de `string | null` cuando hay tres casos o más · los tipos del contrato se derivan del
`openapi.yaml`, no se adivinan.

**Accesibilidad**: `label` asociado a cada control · `aria-invalid` **con** `aria-describedby` que
apunte al mensaje · `role="alert"` solo cuando hay texto adentro · foco visible y navegable por
teclado — los `onClick` sobre `<tr>` o `<div>` no lo son.

**Verificación**: `pnpm test` y `pnpm exec tsc --noEmit`. Los dos: hoy hubo dos veces en que la
suite estaba verde y `tsc` en rojo. **`pnpm lint` está roto** (declara `eslint .` sin ESLint
instalado) y no es criterio de nada.

## Trampas del entorno

| Trampa | Síntoma |
|---|---|
| `rm -rf .next` con `pnpm dev` vivo | Todo responde **500** con `ENOENT ... manifest.json`; el proceso no muere. Parar el dev server antes de limpiar |
| Borrar una ruta del App Router | `tsc` da un `TS2307` **falso** por tipos stale. Un `TS2307` cuya ruta arranca con `.next/` nunca es del código |
| Rutas con corchetes en zsh | `app/requests/[id]/...` se expande como glob; el filtro no matchea y la corrida mide otra cosa |

## Formato de salida

Por severidad (Críticos / Altos / Medios / Bajos), y para cada hallazgo: qué · dónde
(`archivo:línea`) · camino concreto al fallo · evidencia · sugerencia.

Si una categoría no tiene hallazgos, decilo. Un informe de tres reales vale más que uno de quince
especulativos.
