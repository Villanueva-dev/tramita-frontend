# Issue #38 — Documento disponible durante coordinación

## Objetivo

Permitir que la Coordinación vea y descargue el DO-FR-100 de una solicitud de adición de
créditos mientras el trámite está en curso, sin presentar el documento como cerrado o finalizado.

## Problema y por qué

El backend genera `GET /api/requests/{id}/document` bajo demanda en cualquier estado y ya se
comprobó que responde `200 application/pdf` en `EN_COORDINACION`. El cliente contradice ese
contrato en dos sitios: oculta el enlace desde el detalle y bloquea la ruta del documento cuando
`currentState.isFinal` es falso. Si solo se retiran las guardas, la vista previa conserva textos y
metadatos de cierre que también serían falsos.

## Alcance autorizado

- Mostrar el acceso al documento desde el detalle de una solicitud abierta.
- Permitir abrir y descargar el PDF en la ruta del documento sin exigir cierre.
- Mantener veraz la presentación para solicitudes abiertas.
- Conservar al backend como autoridad de disponibilidad, tipo y autorización.
- Agregar pruebas de regresión para `ADICION_CREDITOS` en `EN_COORDINACION`.

Fuera de alcance: agregar roles, estados, flags, persistencia del PDF o restricciones locales por
tipo de trámite.

## Restricciones y decisiones

- Rama: `fix/documento-disponible-en-curso-38`, basada en el HEAD del PR #37 para evitar rehacer o
  conflictuar la migración intencional a `isClosed(req)`.
- TDD efectivo: estricto, según `openspec/config.yaml`; runner `pnpm test`.
- Ruta: implementación delegada. Evidencia del trigger: la unidad toca dos páginas no triviales,
  sus pruebas y potencialmente la vista previa del PDF.
- Estrategia de entrega: `ask-on-risk`; pronóstico inferior a 400 líneas autorales.
- No se agregará una representación paralela de disponibilidad: se eliminan las guardas del
  cliente y se usa la respuesta del endpoint existente.

## Tareas

- [x] **T1 — Fijar el contrato con pruebas en rojo**
  - El detalle muestra “Ver documento PDF” en `EN_COORDINACION`.
  - La ruta del documento no muestra el rechazo de finalización y permite descargar.
  - La presentación abierta refleja el estado real y no afirma cierre o generación al finalizar.
  - Comprobación: ejecutar primero las pruebas enfocadas y registrar el fallo esperado.

- [x] **T2 — Eliminar la política duplicada y corregir la presentación**
  - Quitar las dos guardas de cierre.
  - Reutilizar el endpoint y flujo de descarga existentes.
  - Neutralizar o condicionar el contenido exclusivo de cierre sin agregar flags de dominio.
  - Comprobación: pruebas enfocadas en verde, suite completa, TypeScript y lint.

- [x] **T3 — Cerrar la unidad de trabajo**
  - Revisar diff, ejecutar comprobación puntual del padre y crear un commit convencional.
  - Registrar commit, conteo de líneas y evidencia final.

## Criterios de aceptación

1. Una solicitud `ADICION_CREDITOS` en `EN_COORDINACION` expone el enlace al documento.
2. La pantalla permite solicitar y descargar el PDF sin exigir `isFinal`.
3. Ningún texto visible afirma que una solicitud abierta ya fue finalizada, resuelta o autorizada.
4. Los errores reales del endpoint siguen mostrándose al usuario.
5. Las comprobaciones obligatorias terminan en verde o quedan registradas honestamente.

## Progreso y evidencia

- Estado inicial: worktree limpio; issue #38 abierto; PR #37 abierto y mergeable.
- Backend comprobado en el issue: `200 application/pdf` para `EN_COORDINACION`.
- Pronóstico inicial: 120–220 líneas autorales. Resultado: 340 líneas cambiadas incluyendo pruebas
  y seguimiento; se mantuvo dentro del presupuesto de entrega de 400 líneas.
- T1 RED observado:
  `pnpm exec vitest run 'app/requests/[id]/page.test.tsx' 'app/requests/[id]/documento/page.test.tsx'`
  terminó con código 1: 3 pruebas fallaron y 2 pasaron. El detalle no encontró el enlace
  “Ver documento PDF”; las dos pruebas de la ruta no encontraron “Descargar PDF” porque la guarda
  de cierre mostraba el rechazo de disponibilidad.
- T2 GREEN observado:
  - Pruebas enfocadas: 2 archivos, 5 pruebas aprobadas.
  - `pnpm test`: 21 archivos, 156 pruebas aprobadas.
  - `pnpm exec tsc --noEmit`: código 0, sin salida.
  - `pnpm lint`: código 0 (`eslint .`), sin hallazgos.
- Comprobación puntual del padre: las pruebas enfocadas se repitieron sobre el diff final y
  aprobaron 5 de 5; `git diff --check` terminó sin hallazgos.
- Evaluación nativa del diff: riesgo `medium` por cambio ejecutable, 6 rutas y 335 líneas
  cambiadas incluyendo pruebas y este documento. RDD está desactivado para este clon, por lo que
  la verificación de registro es la del escritor más la comprobación puntual del padre.
- Archivos de producto y regresión modificados: `app/requests/[id]/page.tsx`,
  `app/requests/[id]/page.test.tsx`, `app/requests/[id]/documento/page.tsx`,
  `app/requests/[id]/documento/page.test.tsx` y `components/pdf-document.tsx`.
- Commit de la unidad: `d7ed387` —
  `fix(documento): permite descargar el formato durante coordinación`.
- Siguiente paso: decidir si se publica la rama y se abre un PR encadenado al #37; esas operaciones
  remotas no forman parte de esta autorización local.

## Rollback

Revertir el commit de esta unidad restaura ambas guardas y sus textos; no modifica el contrato del
backend ni datos persistidos.
