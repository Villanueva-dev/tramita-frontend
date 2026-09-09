# Tasks: Cliente HTTP — alinear `createRequest` al contrato 003

Orden obligatorio por `strict_tdd: true` (`openspec/config.yaml:14`): cada prueba se escribe y se
observa **fallar** antes de escribir el código que la satisface.

## 1. Rojo — pruebas que fallan contra el código actual

- [x] 1.1 Prueba: el cuerpo emitido transporta los **seis** campos, afirmado con `toEqual`
      (comparación exacta). Escenario de spec «El cuerpo enviado transporta los seis campos».
- [x] 1.2 Prueba: un cuerpo que además trae una propiedad **no declarada** emite exactamente los
      seis campos y no esa propiedad. Escenario «Un campo no declarado no alcanza la petición».
- [x] 1.3 Prueba: `semester` con valor `"8"` viaja **sin transformarse** a identificador de
      periodo. Escenario «El semestre viaja como ordinal».
- [x] 1.4 Ejecutar `pnpm test` y **registrar que 1.1–1.3 fallan** por la causa esperada: la
      destructuración vigente descarta `program`, `semester` y `reason`.

## 2. Verde — implementación mínima

- [x] 2.1 Ampliar `CreateRequestBody` (`lib/api.ts:163-167`) con `program?`, `semester?` y
      `reason?`, los tres **opcionales**, en coherencia con
      `required: [definitionCode, studentName, studentDocument]` del contrato.
- [x] 2.2 Ampliar la destructuración y el cuerpo de `createRequest` (`:171-175`) a los seis
      campos, **enumerados uno por uno**. Prohibido el *spread*.
- [x] 2.3 Ejecutar `pnpm test` y verificar que 1.1–1.3 pasan.

## 3. Refactor — dejar la guarda documentada

- [x] 3.1 Comentario sobre la destructuración que declara su condición de **guarda de
      privacidad** y remite a `design.md` (Decisión 1). Sin cambios estructurales.
- [x] 3.2 Actualizar el comentario de cabecera de `lib/types.ts:1-3`: la referencia de contrato
      pasa de la 002 a la 003. **No se modifica ningún tipo.**

## 4. Verificación de no regresión

- [x] 4.1 `pnpm test` completo en verde. Línea base previa a esta change: **114 tests**.
- [x] 4.2 `rm -rf .next && pnpm exec tsc --noEmit` sin errores. El borrado previo es obligatorio:
      sin él aparecen `TS2307` falsos por artefactos de compilación obsoletos.
- [x] 4.3 Confirmar que `app/requests/new/page.tsx` **no fue modificado** y sus pruebas siguen en
      verde: es la evidencia de que los tres campos nuevos son retrocompatibles.
