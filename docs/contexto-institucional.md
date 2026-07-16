# Contexto institucional y de dominio — Tramita

> Documento liviano de orientación. La fuente canónica del planteamiento (problema, causas,
> efectos, alcance y métricas) es el árbol de problemas del backend:
> [`docs/nuevo-proyecto/01-planteamiento/arbol-de-problemas.md`](https://github.com/Villanueva-dev/Tramita/blob/main/docs/nuevo-proyecto/01-planteamiento/arbol-de-problemas.md).
> Acá va solo el *para quién y por qué*, para no perder de vista que esto es un sistema
> **institucional**, no una app genérica.

## Para quién

- **Institución**: Universidad Remington — Sede Cali. Programa de Ingeniería de Sistemas,
  modalidad Distancia (SNIES 53112, Resolución 015939 del 1 de septiembre de 2023).
- **Usuario del sistema**: la **Coordinación Académica de la Sede Cali**. Es el único rol que
  inicia sesión — de ahí que el primer sprint sea `auth-login`. Los aprobadores aguas abajo
  (Facultad/Decano en Medellín, Dirección de CD, Área Financiera, Registro y Control) operan por
  correo y OneDrive: **no son usuarios** del sistema.
- **El estudiante NO es usuario**: no hay portal de auto-consulta (decisión explícita de la
  Coordinación). Solo recibe un aviso por correo institucional al finalizar su trámite.

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

**Sprint `auth-login`**: autenticación de la Coordinación. El motor de workflow configurable
(los trámites) es la fase siguiente y **aún no tiene backend**. La UI de trámites de la maqueta
es un borrador visual: no cablear todavía.
