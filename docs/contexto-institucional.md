# Contexto institucional y de dominio — Tramita

> Documento liviano de orientación. La fuente canónica del planteamiento (problema, causas,
> efectos, alcance y métricas) es el árbol de problemas del backend:
> [`docs/nuevo-proyecto/01-planteamiento/arbol-de-problemas.md`](https://github.com/Villanueva-dev/Tramita/blob/main/docs/nuevo-proyecto/01-planteamiento/arbol-de-problemas.md).
> Acá va solo el *para quién y por qué*, para no perder de vista que esto es un sistema
> **institucional**, no una app genérica.

## Para quién

- **Institución**: Universidad Remington — Sede Cali. Programa de Ingeniería de Sistemas,
  modalidad Distancia (SNIES 53112, Resolución 015939 del 1 de septiembre de 2023).
- **Usuario interno del sistema**: la **Coordinación Académica de la Sede Cali**. Es el único rol que
  inicia sesión en el cockpit interno. Los aprobadores aguas abajo
  (Facultad/Decano en Medellín, Dirección de CD, Área Financiera, Registro y Control) operan por
  correo y OneDrive: **no son usuarios** del sistema.
- **El estudiante no usa el portal interno ni tiene auto-consulta** (decisión explícita de la
  Coordinación), pero puede radicar públicamente el formato DO-FR-100 de créditos adicionales
  sin cuenta. Tras el envío, la pantalla confirma la recepción e indica que la Coordinación
  responderá al correo diligenciado; no se documenta un aviso automático por correo.

## Qué resuelve

La gestión de solicitudes académicas multi-aprobación (**adición de créditos**, **novedad de
notas**) depende hoy de correos, formatos en Word y memoria humana, sin un workflow que estructure
el ciclo de vida, valide los datos de entrada y registre la trazabilidad de cada decisión. Tramita
es el **cockpit interno** de la Coordinación: captura validada, generación del PDF formal, registro
y avance del estado. **No** orquesta de punta a punta la cadena de firmas externas.

## Fronteras del sistema

- **Class** (sistema académico) y **QF** (gestor documental) son **cajas negras**: el sistema no
  las reemplaza ni se integra con ellas. Se sitúa *aguas arriba*; un humano asienta el resultado
  formal en esos sistemas.
- Alcance del MVP: **Sede Cali**, los dos trámites citados. La corrección de notas mal calculadas
  queda fuera.

## Dónde estamos ahora

La autenticación protege el cockpit interno de la Coordinación. El motor de workflow del backend
ya está integrado en el frontend, y el DO-FR-100 público de créditos adicionales se radica desde
una ruta pública sin autenticación como asistente de cinco pasos con su pulido visual (PRs #70 y
#72, en `main` el 2026-09-26; eso no acredita un despliegue en producción). El cambio OpenSpec
[`formulario-publico-por-pasos`](../openspec/changes/archive/2026-09-26-formulario-publico-por-pasos/tasks.md) quedó
archivado; queda por confirmar la firma con el dedo en un celular.
