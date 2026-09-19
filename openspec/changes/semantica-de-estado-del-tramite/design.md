# Design: Semántica del estado del trámite

## Technical Approach

Un módulo plano en `lib/` —convención del repo: un archivo por responsabilidad, con su test al
lado— declara la semántica de los estados del motor como una tabla, y expone cuatro predicados
que la consultan. `baseRequest` deja de descartar el estado crudo, así que el modelo del cliente
puede responder preguntas en vez de solo mostrar un nombre. Los sitios que decidían leyendo
`status` pasan a preguntar por el predicado que corresponde.

## Architecture Decisions

### Decisión 1 — La semántica es dato, no código

**Elegido:** una tabla `código de estado → { initial, returned, rejection }` por trámite, y
predicados que la consultan.

**Alternativas exploradas, en ejes distintos** (la regla del repo pide al menos una en un eje
diferente; variaciones del mismo eje no cuentan):

- *Eje «código imperativo aislado»*: las mismas cadenas de `if` con `includes()`, pero en un
  módulo con nombre y tests. Diff menor y riesgo mínimo. **Descartada** porque conserva el
  defecto de fondo: el hueco de novedad de notas seguiría siendo una ausencia de coincidencia
  —invisible, sin error, imposible de afirmar en un test—.
- *Eje «dónde ocurre la traducción»*: enriquecer la respuesta en `lib/api.ts`, la capa que
  custodia el contrato, dejando al store solo el modelo de UI. **Descartada** por ahora: ese
  módulo es deliberadamente delgado (fetch, CSRF, problem+json) y meterle reglas de dominio le
  cambia el carácter. Sigue siendo el destino natural cuando el contrato exponga la semántica.
- *Eje «que el compilador lo impida»*: modelar el trámite como unión discriminada para que
  preguntar mal no compile. **Descartada por el dominio, no por gusto**: un trámite rechazado
  está cerrado **y** es corregible a la vez —el backend lo permite—, así que las categorías no
  son excluyentes y una unión modelaría mal la realidad.

**Trade-off asumido:** la tabla fija códigos del motor en el cliente, en tensión con FR-009. La
heurística que reemplaza cometía la misma violación, disimulada. Se elige hacerla **auditable y
removible** antes que seguir escondiéndola.

### Decisión 2 — `isClosed` no sale de la tabla

`isFinal` es el único dato de semántica que el contrato garantiza (`State`, :212-218). El
predicado que lo lee es una línea y no consulta la tabla.

**Por qué importa:** meterlo en la tabla por simetría lo habría vuelto tan frágil como los
otros tres, sin ninguna ganancia. Queda como el único predicado con **deuda cero**, y eso debe
seguir siendo cierto: si alguien lo mueve a la tabla, pierde su garantía.

### Decisión 3 — Los predicados reciben el trámite entero

**Elegido:** un tipo estructural mínimo, `{ currentState, type }`, que `AcademicRequest`
satisface sin que el módulo lo importe.

**Alternativa principal descartada:** guardar en el modelo tres booleanos ya calculados y que los
consumidores lean una propiedad. Era más ergonómico —cero imports en la UI— y fue la
recomendación inicial. **Se cambió al escribir la justificación**, por un argumento que no se
había visto: los booleanos son datos derivados almacenados, así que un caso de prueba puede
declarar `isClosed: true` sobre un estado que el motor no marca como final y pasar en verde. El
paso siguiente consistía precisamente en escribir casos nuevos para cuatro componentes sin
cobertura, y el repo ya tiene documentado un falso verde (#11).

**Precisión honesta:** esto **reduce** el riesgo, no lo elimina. `AcademicRequest` sigue
almacenando `status`, que un caso puede declarar incoherente. Lo que sí queda garantizado es que
los predicados se derivan siempre de `currentState`, así que los consumidores leen la verdad
aunque el `status` del caso mienta.

**Dos argumentos sueltos, descartado:** con `(estado, trámite)` por separado se puede construir
una combinación que el motor nunca produce —un estado de adición etiquetado como novedad—. El
trámite entero lo hace imposible por construcción.

### Decisión 4 — La tabla se indexa por `RequestType` con un `Record`

`Record<RequestType, …>` hace que el compilador exija la fila si el cliente reconoce un tercer
trámite, en vez de dejarlo sin semántica en silencio.

**Consecuencia deliberada:** vuelve **inalcanzable** el caso «trámite desconocido». Su test se
retiró en lugar de fingir cobertura — el mismo criterio con el que este repo señala los fallbacks
inertes (#34).

Cada fila lleva en comentario el código del motor (`ADICION_CREDITOS`, `NOVEDAD_NOTAS`) para que
la tabla siga leyéndose al lado del seed SQL sin traducir mentalmente.

### Decisión 5 — Degradación segura ante lo que la tabla no conoce

Un estado ausente de la tabla no recibe semántica: no habilita acciones, y `isClosed` sigue
respondiendo porque no la consulta.

**Por qué:** sin CI (#18) ni E2E, los casos corren sobre estados que escribimos nosotros. Un
estado que el motor tenga y la tabla no anticipe **pasa los tests y falla en la pantalla**. La
degradación acota el daño a «no habilita acciones» en vez de una excepción. No lo evita.

### Decisión 6 — `status` sobrevive, relegado a presentación

No se elimina `RequestStatus`. Sigue poblando badges, etiquetas y el filtro del selector, que por
definición filtra por el valor textual que eligió quien usa la pantalla. Queda declarado en
comentario como vocabulario de presentación.

**Por qué no eliminarlo:** KISS. Sustituirlo obligaría a rehacer colores, etiquetas y filtros sin
resolver ningún defecto abierto.

## Testing Strategy

- **El módulo** se prueba contra los estados reales del motor de ambos trámites, más la
  degradación ante un estado desconocido.
- **El hueco de novedad de notas** se fija con un caso que recorre sus seis estados y exige que
  ninguno se reconozca como devolución. Si algún día deja de ser cierto, el test avisa que la
  limitación cambió.
- **Los casos construyen los trámites con `baseRequest`**, no como literales, para que el estado
  y lo que se deriva de él no puedan contradecirse dentro del propio test.
- **Los componentes sin cobertura previa** (`summary-cards`, `requests-table`, `app-shell`)
  reciben la suya. Los dos últimos se migran sin tener tests antes, así que los suyos se
  verifican **también contra el código anterior**: si pasan en ambas versiones, el refactor
  preserva el comportamiento observable. Un test escrito mirando el código nuevo puede pasar por
  estar moldeado a él; correrlo contra el viejo es lo que lo descarta.

## Open Questions

1. **¿Qué pedirle al backend?** No «expón la semántica de `State`»: con eso no alcanzaría. Para
   novedad de notas, «estar devuelto» **no es una propiedad del estado actual** —el trámite vuelve
   a `EN_PREPARACION`, indistinguible de estar ahí por primera vez—, sino un hecho histórico. Lo
   que hay que pedir es **«expón si este trámite fue devuelto»**, como propiedad del `Request`. El
   backend ya tiene la regla escrita: `RequestMetricsServiceImpl.isReturn` la deriva de la
   estructura del workflow, sin substrings y sirviendo a los dos trámites.
2. **¿La pantalla del documento debe seguir gateando por estado?** Hoy lo hace, y contradice al
   backend. Queda migrada preservando el comportamiento, con la contradicción escrita en el
   código.
