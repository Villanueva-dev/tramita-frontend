import type { PublicRequestBody } from './types'

/** Los diez campos de texto del formato: el cuerpo público menos la firma. */
export type PublicRequestTextField = Exclude<keyof PublicRequestBody, 'signature'>

/**
 * Límites de longitud que impone el endpoint público (contracts/openapi.yaml).
 *
 * Viven acá, y no junto al formulario, porque pertenecen al contrato del backend y no a
 * la presentación: la página valida contra ellos antes de enviar y los controles topan el
 * tecleo con el mismo número. Tenerlos una sola vez es lo que impide que las dos lecturas
 * se separen en silencio. Cédula y teléfono son la excepción: sus controles no topan el
 * tecleo, porque el navegador recortaría el texto pegado, separadores incluidos, antes del
 * filtro de dígitos; su límite lo aplica solo la validación.
 *
 * Tipar el registro contra `PublicRequestBody` hace que el compilador rechace un campo
 * faltante o mal escrito, así que la tabla no puede desalinearse del contrato.
 *
 * `studentPhone` pasó de 30 a 10: la feature 008 del backend (FR-009) enmienda el campo a
 * exactamente diez dígitos (`^[0-9]{10}$`). Diez dígitos también cumplen la regla anterior de
 * la 004 (cualquier texto de hasta 30 caracteres), así que el frontend puede adoptarla antes
 * que el backend sin romper la integración.
 */
export const PUBLIC_REQUEST_FIELD_LIMITS: Record<PublicRequestTextField, number> = {
  studentName: 120,
  studentDocument: 20,
  studentEmail: 255,
  studentPhone: 10,
  program: 120,
  campus: 120,
  faculty: 120,
  modality: 50,
  semester: 50,
  reason: 2000,
}
