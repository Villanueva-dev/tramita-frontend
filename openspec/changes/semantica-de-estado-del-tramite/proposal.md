# Proposal: Semántica del estado del trámite

> Insumo: `BRIEF.md`. Autoridad del contrato:
> `Tramita/specs/002-workflow-engine/contracts/openapi.yaml`.

## Intent

Que el cliente deje de deducir la situación de un trámite de una etiqueta de presentación, y
pase a responder cada pregunta por separado desde un único lugar auditable.

Hoy `RequestStatus` —cinco valores— responde a la vez «¿está cerrado?», «¿terminó con éxito?»,
«¿está devuelto?» y «¿es el inicio?». Como las cuatro respuestas salen de un solo valor, mover
una mueve las otras. Eso ya produjo defectos observables: **#35** (los rechazos se cuentan como
completados), **#15** (el renombre del estado inicial rompió el reconocimiento), y un hueco sin
issue: la detección de devolución es ciega a novedad de notas.

## Scope

### In Scope

- Un módulo que declare la semántica de los estados **como dato**, con predicados que la
  consulten, y con la deuda escrita en el propio módulo.
- Que el modelo del cliente conserve el estado crudo que el backend envía, en vez de descartarlo.
- Migrar los sitios que **deciden** leyendo `status` a preguntar por el predicado que
  corresponde.
- Corregir #35 y #15.
- Cobertura de los componentes que se tocan y hoy no tienen ninguna.

### Out of Scope

- **El stepper** (#9). Colapsar siete estados en una etapa es un problema de presentación, con
  su propio alcance.
- **Qué cuenta como «completada»** más allá de excluir el rechazo. El valor `'aprobado'` nace de
  `APROBADA_FACULTAD`, que no es final; revisarlo es **#36**.
- **El candado de la pantalla del documento.** Contradice al backend, pero quitarlo es decisión
  de producto.
- **Eliminar `RequestStatus`.** Sobrevive relegado a presentación: badges, etiquetas y el filtro
  del selector.
- **Cambiar el contrato.** Esta change no pide nada al backend; deja escrito qué pedirle después.

## Capabilities

### Added Requirements

`workflow-requests` — un requisito nuevo sobre cómo el cliente interpreta la semántica del
estado. No modifica los existentes: «Detalle de una solicitud» y «Responsable del estado actual»
ya fijan cómo se muestra el estado y de dónde sale el responsable, y siguen valiendo tal cual.

## Approach

La semántica se declara como **tabla por trámite**, espejo de las migraciones del motor, y los
predicados son consultas a esa tabla. Se eligió sobre una versión imperativa con condicionales
porque convierte una ceguera implícita en una ausencia declarada: novedad de notas simplemente
**no tiene fila de devolución**, y eso se puede afirmar en un test en vez de quedar como un
`includes()` que nunca coincide.

`isClosed` queda fuera de la tabla a propósito: lo responde `isFinal`, el único dato que el
contrato garantiza.

## Decisiones tomadas — no re-litigar

1. **La semántica es dato, no código.** Se evaluó la alternativa imperativa y se descartó por lo
   dicho arriba.
2. **Los predicados reciben el trámite entero**, no el estado y el tipo por separado. Con dos
   argumentos sueltos, un caso de prueba puede declarar una combinación que el motor nunca
   produce y pasar en verde describiendo algo imposible.
3. **La tabla se indexa por `RequestType` con un `Record`**, para que el compilador exija la fila
   si aparece un tercer trámite.
4. **Degradación segura**: un estado que la tabla no conoce no recibe semántica. No rompe la
   pantalla; solo no habilita acciones.

## Issues relacionados

- **Cierra #35** — los rechazos contados como completados. Reproducido con test antes de
  reportarlo.
- **Cierra #15** — el estado inicial renombrado, ahora resuelto por trámite y no con una
  constante global.
- **Deja constancia para #36** — el criterio de «completada» respecto de `APROBADA_FACULTAD`.
- **No toca #9, #10, #11, #12, #13** — mismo clúster de deuda, distinto alcance.

## Risks

- **La tabla fija códigos del motor en el cliente**, en tensión con FR-009. Se asume a
  conciencia: la heurística que reemplaza cometía la misma violación, disimulada entre
  condicionales y sin forma de auditarla. Aquí está en un solo lugar, con tests, y es removible.
- **Un renombre en el motor vuelve a romper el cliente.** Se reduce el daño —rompe en un lugar
  con tests, no en varios en silencio— pero no se elimina hasta que el contrato exponga la
  semántica.
- **Sin CI (#18) ni E2E**, los casos corren sobre estados que escribimos nosotros. Un estado que
  el motor tenga y la tabla no anticipe pasa los tests y falla en la pantalla. La degradación
  segura acota el daño; no lo evita.

## Rollback Plan

El módulo es aditivo y los consumidores cambian llamadas, no estructura. Revertir los commits de
migración devuelve el comportamiento anterior sin tocar datos ni contrato. El único cambio con
efecto fuera del cliente es el campo nuevo en el modelo, que es de lectura.

## Dependencies

Ninguna del backend. Esta change funciona contra el contrato vigente.

## Success Criteria

1. Ningún sitio decide si un trámite está cerrado o devuelto leyendo `status`.
2. Un trámite rechazado no aparece entre las completadas, sí como cerrado, y conserva el acceso
   a su documento.
3. Una solicitud recién radicada se reconoce como pendiente **en los dos trámites**.
4. El hueco de novedad de notas está fijado por un test que lo afirma explícitamente.
5. Los componentes tocados que no tenían cobertura, la tienen.
