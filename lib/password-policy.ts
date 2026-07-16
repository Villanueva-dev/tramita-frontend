// Política de contraseña — espejo de la validación del backend (docs/integracion-auth.md).
// En el frontend es SOLO UX: la autoridad es el backend, que responde 422 si algo no cumple.

const MIN_LENGTH = 15
const MAX_BYTES = 72

/** Longitud en bytes UTF-8. La regla de los 72 se mide en bytes, no en caracteres. */
export function passwordByteLength(pw: string): number {
  return new TextEncoder().encode(pw).length
}

export interface PasswordInput {
  current: string
  next: string
  confirm: string
}

export interface PasswordCheck {
  valid: boolean
  errors: string[]
}

export function validateNewPassword({
  current,
  next,
  confirm,
}: PasswordInput): PasswordCheck {
  const errors: string[] = []

  if (next.length < MIN_LENGTH) {
    errors.push(`La contraseña debe tener al menos ${MIN_LENGTH} caracteres.`)
  }
  if (passwordByteLength(next) > MAX_BYTES) {
    errors.push(`La contraseña no debe superar ${MAX_BYTES} bytes en UTF-8.`)
  }
  if (next === current) {
    errors.push('La nueva contraseña debe ser distinta de la actual.')
  }
  if (next !== confirm) {
    errors.push('La confirmación no coincide.')
  }

  return { valid: errors.length === 0, errors }
}
