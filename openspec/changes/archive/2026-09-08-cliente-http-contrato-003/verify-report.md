```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:76ac9bb352805b72b5687a60263f31305f59caad7d3d6f72b29f42cfb4febfb3
verdict: pass
blockers: 0
critical_findings: 0
requirements: 1/1
scenarios: 8/8
test_command: pnpm test --run
test_exit_code: 0
test_output_hash: sha256:e70e61596f818c9896933270cebfc4760621f6da479b3fe8bbb4db1374ef9676
build_command: pnpm build
build_exit_code: 0
build_output_hash: sha256:10d0f6fdc84c01ed77a8b0f5f1f95606796fa31388e3e5adb17c3c4cdadd2f24
```

## Verification Report

**Change**: cliente-http-contrato-003
**Version**: delta sobre `openspec/specs/workflow-requests/spec.md`
**Mode**: Strict TDD (`openspec/config.yaml:14`)

**Receta del `evidence_revision`** (reproducible, no reutilizada de ningún informe previo):

```
{ git rev-parse HEAD
  git rev-parse HEAD:lib/api.ts
  git rev-parse HEAD:lib/types.ts
  git rev-parse HEAD:lib/api.test.ts } | sha256sum
```

Con `HEAD = 0ab92876fc09c674cf1e21f616249718b40c3951` (commit
`feat(cliente-http): amplía createRequest a los seis campos del contrato 003`). Los tres blobs
quedan nombrados en la sección de evidencia, de modo que cualquiera puede recomputar el valor sin
confiar en este informe.

### Completeness

| Metric | Value |
|---|---|
| Tasks total | 12 |
| Tasks complete | 12 |
| Tasks incomplete | 0 |
| Requirements verified | 1/1 |
| Scenarios covered | 8/8 |

### Trazabilidad escenario → prueba

El requisito modificado es **«Registro de una solicitud (US1)»**. Sus ocho escenarios:

| # | Escenario | Prueba que lo cubre | Estado |
|---|---|---|---|
| 1 | El cuerpo enviado transporta los seis campos | `lib/api.test.ts` — «transporta los seis campos del contrato 003 en el cuerpo emitido» | ✅ nueva |
| 2 | Un campo no declarado no alcanza la petición | `lib/api.test.ts` — «no deja pasar al cuerpo una propiedad no declarada en el contrato» | ✅ nueva |
| 3 | Un envío incompleto deja de pasar inadvertido | Cubierto por la prueba del escenario 1: afirma sobre el cuerpo emitido con `toEqual`, nunca sobre el código de estado | ✅ |
| 4 | El semestre viaja como ordinal | `lib/api.test.ts` — «transporta semester como ordinal, sin convertirlo en identificador de periodo» | ✅ nueva |
| 5 | Los tres campos incorporados son opcionales | `lib/api.test.ts:130` — «envía POST /api/requests solo con definitionCode+studentName+studentDocument…», **sin modificar** | ✅ preexistente |
| 6 | Trámite inexistente en la configuración | `lib/api.test.ts:160` — «lanza ApiError 422…» | ✅ preexistente |
| 7 | Campo de solo espacios rechazado sin llamar al backend | `app/requests/new/page.test.tsx:130,175` | ✅ preexistente |
| 8 | Los valores viajan recortados | `app/requests/new/page.test.tsx:156` | ✅ preexistente |

### Evidencia del ciclo TDD

El orden rojo→verde se **observó y registró**, no se asumió. Ejecución de
`pnpm test --run lib/api.test.ts` con las tres pruebas escritas y `lib/api.ts` sin modificar:

```
Tests  2 failed | 23 passed (25)
```

| Prueba | Rojo inicial | Causa observada |
|---|---|---|
| Escenario 1 | ❌ falla | El diff reportó ausentes `program`, `reason` y `semester` |
| Escenario 4 | ❌ falla | `expected undefined to be '8'` |
| Escenario 2 | ⚠️ **pasa ya** | La garantía del allowlist ya existía |

**Hallazgo, y es el que sostiene la Decisión 1 del design**: el escenario 2 no llegó a estar en
rojo porque la destructuración vigente más la comparación exacta de `toEqual` ya lo satisfacían.
Esto es evidencia directa de que la abstracción evaluada y descartada —función de mapeo, arreglo
de claves, esquema en tiempo de ejecución— habría sido estructura sin problema que la justifique.
La prueba se conserva como red de regresión: fallará el día que alguien introduzca una
propagación del objeto.

### Verificación de no regresión

| Chequeo | Comando | Resultado |
|---|---|---|
| Suite completa | `pnpm test --run` | **117 passed / 10 files**, exit 0 (línea base previa: 114) |
| Tipos | `rm -rf .next && pnpm exec tsc --noEmit` | exit 0 |
| Compilación | `rm -rf .next && pnpm build` | exit 0 |
| Consumidor intacto | `git status --short app/requests/new/page.tsx` | sin cambios |

El borrado de `.next` antes de comprobar tipos y compilar es obligatorio en este repositorio: sin
él aparecen errores `TS2307` falsos, provocados por artefactos de compilación obsoletos.

### Evidencia de los artefactos verificados

| Archivo | Blob en `HEAD` |
|---|---|
| `lib/api.ts` | `949fcc2fdc74122c57cf6db820d8178570f862ae` |
| `lib/types.ts` | `3d05a90df5481b8896fad09b7736091ba8a23d1b` |
| `lib/api.test.ts` | `1c0a5924496eb07857c2057ab656f2d4057690a5` |

### Conformidad con el design

| Decisión del design | Estado |
|---|---|
| 1 — Allowlist como destructuración, sin abstracción nueva | ✅ Cumplida. Seis campos enumerados uno por uno; ningún *spread*. Comentario de guarda presente. |
| 2 — Guarda estructural diferida a la change de la pantalla | ✅ Cumplida. No se introdujo tipo de formulario alguno en esta change. |
| 3 — `lib/types.ts` solo actualiza el comentario de cabecera | ✅ Cumplida. Referencia 002→003; **ningún tipo modificado** (verificable en el diff: +9/−2, todas líneas de comentario). |

### Warnings (no bloqueantes)

1. **`pnpm.overrides` inerte**: cada invocación de `pnpm exec` emite
   `The "pnpm" field in package.json is no longer read by pnpm`. Preexistente, ajeno a esta
   change, sin efecto sobre el resultado.
2. **Deuda planificada para la change siguiente**: `app/requests/new/page.test.tsx` afirma
   `queryAllByRole('textbox')` con longitud exactamente `2`. Cuando la pantalla del DO-FR-100
   incorpore `program`, `semester` y `reason`, esa prueba fallará **por diseño**. Debe
   actualizarse de forma deliberada, nunca eliminarse para recuperar el verde.

### Verdict

**PASS.** Un requisito modificado, ocho escenarios cubiertos, cero hallazgos críticos, cero
bloqueantes. Ciclo TDD observado con su rojo registrado. Suite completa, tipos y compilación en
verde. El consumidor existente permanece sin modificar, lo que demuestra la retrocompatibilidad
que la propuesta declaraba.
