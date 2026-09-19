# Tasks: Semántica del estado del trámite

> TDD estricto (`openspec/config.yaml`: `strict_tdd: true`). Cada tarea abre con su test en
> rojo **observado**, no supuesto. Donde el cambio es refactor sin comportamiento nuevo, se
> indica y se verifica por equivalencia contra el código anterior.

## Delivery Forecast

| Campo | Valor |
|-------|-------|
| Líneas autoradas | 639 (**434 tests / 205 código**) |
| Presupuesto de 400 | Excedido por la cobertura, no por el código |
| PRs encadenados | No — sin CI (#18), encadenar añade ceremonia sin ganancia de revisión |
| Corte natural si se parte | Entre fase 2 y fase 3 |
| Delivery strategy | `ask-on-risk` |

## Fase 0 — La regresión previa

- [x] **0.1** Test en rojo: una solicitud de novedad de notas recién radicada debe reconocerse
      como pendiente. RED observado: `expected 'en_revision' to be 'pendiente'`.
- [x] **0.2** Resolver el estado inicial **por trámite** en vez de con una constante global.
      `V3.2.0` renombró solo adición de créditos. — `65c9fc3`

## Fase 1 — El módulo

- [x] **1.1** Test en rojo del módulo: los estados reales de ambos trámites, la degradación ante
      un código desconocido, y el caso que afirma el hueco de novedad de notas. RED observado:
      fallo de resolución, el módulo no existía.
- [x] **1.2** `lib/request-state.ts`: tabla declarativa y cuatro predicados. `isClosed` fuera de
      la tabla. — `d7d176e`

## Fase 2 — El modelo

- [x] **2.1** Test en rojo: `baseRequest` debe conservar el estado crudo. RED observado:
      `expected undefined to deeply equal { code: 'RECHAZADA', … }`.
- [x] **2.2** Predicados sobre el trámite entero (tipo estructural) en vez de dos argumentos
      sueltos; tabla indexada con `Record<RequestType, …>`.
- [x] **2.3** `AcademicRequest` conserva `currentState`; `statusFromState` y `stageFromState` se
      construyen sobre los predicados.
- [x] **2.4** Actualizar los ocho fixtures literales. El compilador señaló exactamente los ocho
      previstos. — `5a49bcc`

## Fase 3 — Los consumidores

- [x] **3.1** Test en rojo de #35 sobre la pantalla: un rechazo no debe contar entre las
      completadas. RED observado: `expected '1' to be '0'`.
- [x] **3.2** Corregir el contador y su filtro espejo, **sin** alterar qué más cuenta la tarjeta.
      — `b09a5ff`
- [x] **3.3** Tests de `isOverdue`, que no tenía ninguno. RED observado: un trámite cerrado se
      reportaba vencido.
- [x] **3.4** Migrar los ocho sitios de «¿está cerrado?» y la firma de `isOverdue`. Se fusionó
      con la fase de `isOverdue` porque conviven en las mismas expresiones: separarlas obligaba a
      tocar esas líneas dos veces.
- [x] **3.5** Primeros tests de `requests-table` y `app-shell`, verificados **también contra el
      código anterior**: pasan en ambas versiones. — `af02e75`
- [x] **3.6** Migrar los cuatro sitios de «¿está devuelto?». — `26b7e3c`

## Fase 4 — Cierre

- [x] **4.1** Artefactos de la change, escritos **antes del merge** para que la especificación
      gobierne lo que entra a `main`.
- [ ] **4.2** Verificación diagnóstica contra la spec (`verify`).
- [ ] **4.3** Archivar tras el merge, fusionando el delta en la capability.
- [ ] **4.4** Cerrar #15 y #35 una vez mergeado, no antes.

## Fuera de alcance, con su destino

- El stepper y el colapso de siete estados → **#9**
- El criterio de «completada» respecto de `APROBADA_FACULTAD` → **#36**
- El candado de la pantalla del documento → issue pendiente de abrir
- Pedirle al contrato que exponga si el trámite fue devuelto → siguiente change
