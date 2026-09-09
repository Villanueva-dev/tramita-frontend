# Design: Cliente HTTP — alinear `createRequest` al contrato 003

## Alcance del diseño

Un tipo y una función: `CreateRequestBody` y `createRequest` (`lib/api.ts:163-178`), más sus
tests. El diseño se mantiene deliberadamente pequeño; las decisiones de abajo documentan sobre
todo **lo que se decidió no construir**.

## Decisión 1 — El allowlist se mantiene como destructuración, sin abstracción nueva

`createRequest` seguirá enumerando campo por campo, ampliado de tres a seis. **No** se extrae
una función de mapeo, **no** se introduce un arreglo de claves permitidas, **no** se agrega
validación en tiempo de ejecución.

**Por qué, y esta es la razón que decide**: la garantía que la spec exige —que un campo no
declarado no alcance la petición— **ya está implementada por la convención de tests del repo**.
`lib/api.test.ts:152` afirma sobre el cuerpo emitido con `toEqual`, que es una comparación
**exacta**, no parcial (la parcial sería `toMatchObject`). Una clave de más hace fallar el test.
El mismo patrón se repite en `:289` y `:299`.

Construir una abstracción para obtener una garantía que la convención vigente ya entrega sería
agregar estructura sin problema que la justifique.

**Alternativas evaluadas y descartadas**:

| Alternativa | Motivo del descarte |
|---|---|
| `pickCreateRequestFields()` como función propia | Nombra la garantía, pero agrega una indirección para ocho líneas; el test ya la ejercita sin ella. |
| Arreglo `ALLOWED_FIELDS` + iteración | Pierde la verificación del compilador: un error de tipeo en una clave no lo detecta `tsc`. Cambia una lista legible por construcción dinámica, justo lo que la spec quiere evitar. |
| Validación con esquema en tiempo de ejecución | No hay validador en el proyecto y la propuesta declara «ninguna dependencia npm nueva». Reabriría esa decisión por un riesgo que hoy no se materializa. |
| Guarda centralizada en `apiFetch` | `apiFetch` (`:77-106`) es genérico y no conoce endpoints; darle un allowlist por ruta lo acoplaría a cada contrato. |
| Prueba de arquitectura que inspeccione el código fuente | Ataca el riesgo documentado, pero una prueba que lee código fuente es frágil y ajena a las convenciones del repo. |

**Costo aceptado**: la garantía vive en el cuerpo de la función y no tiene nombre propio. Se
compensa con un comentario que declara su carácter de guarda de privacidad y remite a esta
decisión, más las dos pruebas de la sección siguiente.

## Decisión 2 — La guarda estructural pertenece a la pantalla, no al cliente

Hoy ningún consumidor construye el cuerpo por propagación: `app/requests/new/page.tsx:89-93` lo
arma como literal, campo por campo. El riesgo del *spread* en el cliente es **hipotético**.

Donde será real es en la pantalla del DO-FR-100: su estado reunirá alrededor de veinte campos,
ocho de los cuales no se persisten —correo, contacto, ciudad, sede, facultad, modalidad, los
catorce motivos y «Otro»—. La forma natural de equivocarse allí es `createRequest(estadoDelFormulario)`.

La defensa estructural correspondiente —**declarar el estado del formulario con un tipo propio,
distinto de `CreateRequestBody`, de modo que pasarlo entero no compile**— se difiere a la change
`formulario-do-fr-100-creditos-adicionales`, junto al código que la vuelve necesaria.

**Costo aceptado**: entre esta change y aquélla existe una ventana en la que alguien podría
introducir la propagación. Queda mitigada porque la prueba de forma exacta la detecta igual.

## Decisión 3 — La referencia de contrato en `lib/types.ts`

`lib/types.ts:1-3` declara derivar de la 002. Esta change **no** toca ningún símbolo de ese
archivo: `CreateRequestBody` y `createRequest` viven en `lib/api.ts`. Se actualiza únicamente el
comentario de cabecera para que la referencia deje de ser incorrecta, sin modificar tipos.

**Por qué no más**: ampliar `Request` con los campos que la 003 devuelve fue descartado en la
propuesta (decisión abierta 1, opción A). Ninguna pantalla los lee todavía.

## Plan de implementación (TDD estricto)

`strict_tdd: true` (`openspec/config.yaml:14`), runner `vitest`, archivo `lib/api.test.ts`.

1. **Rojo** — escribir las pruebas de los escenarios que hoy no están cubiertos:
   - el cuerpo emitido transporta los seis campos, afirmado con `toEqual`;
   - un cuerpo que además trae una propiedad no declarada emite exactamente los seis campos;
   - `semester` viaja como ordinal, sin transformarse.
   Deben fallar contra el código actual, que descarta los tres campos nuevos.
2. **Verde** — ampliar `CreateRequestBody` a seis campos y la destructuración de `createRequest`.
3. **Refactor** — agregar el comentario de la guarda. Sin cambios estructurales.

La verificación se hace siempre **sobre el cuerpo emitido**, nunca sobre el código de estado: el
defecto que motiva esta change es precisamente que un envío incompleto también obtiene `201`.

## Compatibilidad

Los tres campos son opcionales, en coherencia con el contrato
(`required: [definitionCode, studentName, studentDocument]`). `app/requests/new/page.tsx` sigue
compilando y funcionando **sin modificarse**, y sus pruebas deben permanecer en verde como
evidencia de ello.

## Riesgos residuales

| Riesgo | Mitigación |
|---|---|
| Alguien reemplaza la destructuración por propagación | La prueba de forma exacta falla. El comentario explica por qué no debe hacerse. |
| La convención de `semester` como ordinal se pierde | Fijada en la spec y ejercitada por una prueba propia. El `example: '2026-2'` del contrato induce a lo contrario. |
| Se asume que el tipo protege contra campos de más | No lo hace: TypeScript verifica exceso solo sobre literales escritos en el sitio de la llamada, y no existe en tiempo de ejecución. La destructuración es la garantía real. |
