---
name: review-agente-limpio
description: "Lanza un agente SIN CONTEXTO de la sesión para revisar un slice ya cerrado (un rango de commits) antes de continuar con el siguiente de la cadena, y define qué hacer con el informe que devuelve. Invocar cuando el usuario pida \"lanzá el agente limpio\", \"review del slice\", \"revisar la fase antes de seguir\", o al terminar de implementar y commitear una fase completa. NO usar para revisión inline del código que se está escribiendo — para eso está revisar-frontend-next."
compatibility: "Frontend de Trámita. El reglamento vive en el repositorio hermano (../Tramita/); si esa ruta no resuelve, avisar en vez de improvisar el procedimiento."
---

# Review con agente limpio

## Procedimiento

**Leé el reglamento completo antes de lanzar nada**:

```
../Tramita/docs/workflow/code-review-agente-limpio.md
```

Vive en el repositorio hermano y **no se duplica acá a propósito**: dos copias de un procedimiento
se desincronizan, y en este proyecto ya pasó con un documento de integración que hubo que corregir
en dos archivos byte-idénticos.

Si esa ruta no resuelve —porque el repositorio hermano no está clonado al lado—, **decilo y pará**.
No improvises el procedimiento: la mitad del valor está en los detalles que ese archivo fija.

## Qué inyectar cuando el target es este repositorio

El reglamento pide pasarle al agente las fuentes de autoridad. Para un slice del frontend son:

1. `../Tramita/specs/002-workflow-engine/contracts/openapi.yaml` — el contrato.
2. `../Tramita/src/main/java/com/uniremington/api/tramita/` — **el código que lo implementa**. No
   es opcional: el YAML no declara un `400` que el backend sí devuelve.
3. `openspec/changes/<change>/specs/*/spec.md` — las especificaciones del slice.
4. `openspec/changes/<change>/tasks.md` — la lista de tareas y sus criterios.
5. **`.claude/skills/revisar-frontend-next/SKILL.md`** — el checklist de qué mirar en este stack:
   reglas duras, convenciones de test y trampas del entorno.
6. `.gitmessage` — para auditar los mensajes de commit.

## Trampas de este repositorio que hay que pasarle al agente

- **No correr `rm -rf .next`** si hay un `pnpm dev` vivo: lo deja sirviendo 500 hasta reiniciarlo.
- **Las rutas con corchetes** (`app/requests/[id]/...`) se expanden como glob en zsh.
- Los endpoints locales **exigen sesión**: sin login devuelven 401, y no debe intentar autenticarse.

## Lo innegociable

- **Nunca un fork del agente actual**: heredaría el contexto que invalida el review.
- **Pedir mutantes explícitamente**, y que verifique que cada mutación se aplicó.
- **El informe no se aplica: se confirma primero**, hallazgo por hallazgo, con comandos propios.
