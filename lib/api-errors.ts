import { ApiError } from './api'

export interface ApiErrorMessageOverrides {
  /** Mensaje para 401. Su significado depende del contexto: credenciales vs sesión. */
  unauthorized?: string
  /** Mensaje para 400. */
  badRequest?: string
  /** Mensaje para cualquier otro status no contemplado. */
  fallback?: string
}

// Traduce un error de la API (o de red) a mensajes de UI en español.
// Devuelve una lista porque el 422 (regla de negocio) puede traer varias reglas
// en el `detail`, separadas por "; ". El 401 y el fallback se parametrizan porque
// cambian de significado según la pantalla (login vs cambio de contraseña).
export function apiErrorMessages(
  err: unknown,
  overrides: ApiErrorMessageOverrides = {},
): string[] {
  if (err instanceof ApiError) {
    if (err.status === 422 && err.detail) {
      return err.detail.split('; ')
    }
    switch (err.status) {
      case 401:
        return [overrides.unauthorized ?? 'Tu sesión expiró. Iniciá sesión de nuevo.']
      case 400:
        return [
          overrides.badRequest ?? 'Solicitud inválida. Revise los datos ingresados.',
        ]
      case 429:
        return [
          err.retryAfter
            ? `Demasiados intentos. Reintente en ${err.retryAfter} segundos.`
            : 'Demasiados intentos. Espere unos minutos e intente de nuevo.',
        ]
      default:
        return [
          overrides.fallback ?? err.title ?? 'Ocurrió un error. Intente nuevamente.',
        ]
    }
  }
  return ['Sin conexión con el servidor. Intente más tarde.']
}
