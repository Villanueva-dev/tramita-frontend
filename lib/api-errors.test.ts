import { describe, it, expect } from 'vitest'
import { ApiError } from './api'
import { apiErrorMessages } from './api-errors'

describe('apiErrorMessages', () => {
  it('separa las reglas del 422 por "; "', () => {
    const err = new ApiError(
      422,
      'Regla de negocio incumplida',
      'La contraseña actual es incorrecta; La contraseña debe tener al menos 15 caracteres',
    )
    expect(apiErrorMessages(err)).toEqual([
      'La contraseña actual es incorrecta',
      'La contraseña debe tener al menos 15 caracteres',
    ])
  })

  it('usa el override de 401 según el contexto', () => {
    const err = new ApiError(401, 'No autenticado')
    expect(apiErrorMessages(err, { unauthorized: 'Credenciales inválidas.' })).toEqual([
      'Credenciales inválidas.',
    ])
  })

  it('incluye los segundos del Retry-After en 429', () => {
    const err = new ApiError(429, 'Demasiados intentos', undefined, 120)
    expect(apiErrorMessages(err)[0]).toContain('120')
  })

  it('cae a "sin conexión" cuando no es ApiError (error de red)', () => {
    expect(apiErrorMessages(new TypeError('fetch failed'))).toEqual([
      'Sin conexión con el servidor. Intente más tarde.',
    ])
  })

  it('usa el fallback en status no contemplados', () => {
    const err = new ApiError(500, 'Error del servidor')
    expect(apiErrorMessages(err, { fallback: 'No se pudo iniciar sesión.' })).toEqual([
      'No se pudo iniciar sesión.',
    ])
  })
})
