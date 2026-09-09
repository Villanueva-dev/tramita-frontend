Voy a recopilar los pendientes reales separando lo que ya funciona, lo que está parcialmente conectado y lo que todavía falta implementar. Revisaré el estado del código y la documentación de alcance para que la lista sirva como orden de integración, no como una lista genérica.

Ran terminal command: git status --short

No matches found. Your search pattern might be excluded completely by either the search.exclude settings or .*ignore files.
If you believe that it should have results, you can check into the .*ignore files and the exclude setting (here are some excluded patterns for reference:[**/node_modules,**/bower_components,**/*.code-search]).
Then if you want to include those files you can call the tool again by setting "includeIgnoredFiles" to true.

Read 

Read , lines 176 to 176

Read , lines 110 to 180

Sí. Esta es la lista consolidada de lo que falta, organizada por prioridad.

**Ya está logrado**

- Backend Spring Boot funcionando.
- PostgreSQL funcionando en Docker.
- Autenticación real con sesión, BCrypt, CSRF y control de intentos.
- Motor de workflow configurable.
- Registro y avance de solicitudes.
- Timeline inmutable.
- Versionamiento de workflows.
- Pruebas de integración principales.
- Frontend visual responsive.
- Frontend conectado parcialmente con backend.
- Logo oficial integrado.
- Persistencia real de nombre, cédula, estado y timeline.

**Prioridad 1: terminar la integración actual**

- Corregir la carga del detalle cuando se entra directamente por URL o después de `F5`.
- Cargar correctamente el timeline persistido en el frontend.
- Mostrar las transiciones reales del backend, sin etiquetas fijas como “Aprobar” o “Finalizar”.
- Manejar errores de API en pantalla, especialmente:
  - `401`: sesión vencida.
  - `403`: CSRF.
  - `409`: transición no permitida.
  - `422`: observación obligatoria.
  - `429`: demasiados intentos.
- Implementar logout visual con espera y manejo de errores.
- Verificar que el frontend use las credenciales reales y no datos simulados.
- Eliminar gradualmente `mock-data.ts` cuando ya no sea necesario.

**Prioridad 2: guardar todos los datos del formulario**

Actualmente PostgreSQL solo recibe:

- Tipo de trámite.
- Nombre del estudiante.
- Cédula.
- Estado.
- Timeline.

Todavía no se guardan:

- Código del estudiante.
- Correo del estudiante.
- Programa académico.
- Semestre.
- Asignaturas.
- Créditos.
- Grupo.
- Nota actual.
- Nota propuesta.
- Justificación.
- Prioridad.
- Archivos adjuntos.

Para esto hace falta:

- Diseñar nuevas tablas o ampliar `request`.
- Crear una nueva migración Flyway.
- Actualizar entidades Java.
- Actualizar DTOs.
- Actualizar endpoints.
- Enviar todos los campos desde el frontend.
- Crear almacenamiento real de archivos.

**Prioridad 3: reglas de negocio**

Implementar el módulo de validaciones del trámite:

- Tope máximo de créditos.
- Ventana temporal para solicitar adición de créditos.
- Materias elegibles.
- Validación de notas.
- Reglas específicas de novedad de notas.
- Parámetros configurables en base de datos.
- Mensajes claros de validación para el usuario.

Esta parte corresponde principalmente a SP2 y todavía está pendiente de validar con la normativa institucional.

**Prioridad 4: PDF formal**

El PDF actual es una demostración visual. Falta:

- Generarlo realmente desde el backend.
- Usar los datos guardados en PostgreSQL.
- Crear plantillas distintas para cada trámite.
- Incluir estudiante, materias, justificación y decisiones.
- Descargar el archivo real.
- Guardarlo o versionarlo.
- Asociarlo con la solicitud.
- Permitir adjuntar el PDF a QF manualmente.

**Prioridad 5: documentos y firmas**

- Subir archivos reales.
- Validar tipo y tamaño.
- Guardar metadatos.
- Definir almacenamiento local o externo.
- Registrar firma escaneada o digital.
- Generar hash del documento.
- Registrar sello de tiempo.
- Mantener trazabilidad de aprobaciones.
- No integrar directamente Class ni QF, porque están definidos como sistemas externos.

**Prioridad 6: notificaciones**

- Agregar envío de correo institucional al finalizar.
- Crear plantilla de notificación.
- Registrar si el correo fue enviado o falló.
- Configurar SMTP.
- Usar una notificación alternativa si SMTP no está disponible.
- Enviar notificación únicamente cuando el trámite llegue a `FINALIZADA`.

**Prioridad 7: bandeja operativa**

La interfaz ya tiene una bandeja visual, pero falta conectarla completamente con necesidades reales:

- Solicitudes pendientes por acción.
- Responsable actual.
- Fechas de vencimiento reales.
- SLA.
- Solicitudes vencidas.
- Filtros basados en datos reales.
- Métricas de tiempo de ciclo.
- Cantidad de devoluciones.
- Estados reales configurados en BD.

**Prioridad 8: OpenRouter e inteligencia artificial**

La IA debería agregarse después de estabilizar los puntos anteriores. Faltaría:

- Definir el alcance del asistente académico.
- Crear endpoint backend `/api/assistant`.
- Proteger la API Key de OpenRouter en variables de entorno.
- Crear base de conocimiento institucional.
- Cargar reglamentos, requisitos y preguntas frecuentes.
- Implementar búsqueda documental.
- Implementar RAG.
- Enviar al modelo únicamente el contexto recuperado.
- Evitar respuestas inventadas.
- Mostrar fuentes o documentos utilizados.
- Limitar tokens y costos.
- Registrar consultas sin almacenar datos personales innecesarios.
- Añadir un botón o panel de asistente en el frontend.

**Prioridad 9: documentación académica**

Todavía falta completar:

- SRS bajo ISO/IEC/IEEE 29148:2018.
- Diagramas C4.
- Vistas 4+1.
- Casos de uso.
- Requisitos funcionales y no funcionales.
- Metodología.
- Resultados.
- Conclusiones.
- Validación formal con la Coordinación.
- Actualizar el plan documental antiguo que todavía marca varias fases como “No iniciado”.

**Orden recomendado**

1. Terminar integración frontend-backend.
2. Guardar todos los campos del formulario.
3. Implementar reglas de negocio.
4. Generar PDF real.
5. Implementar archivos y firmas.
6. Implementar notificaciones.
7. Completar bandeja y métricas.
8. Integrar OpenRouter + RAG.
9. Completar documentación y validación académica.

La integración con OpenRouter sí es posible, pero conviene hacerla después de completar la persistencia y los documentos institucionales, porque el asistente necesita información oficial real para responder correctamente.