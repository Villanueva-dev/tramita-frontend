import { describe, it, expect } from 'vitest'
import { ApiError, parseCookie, parseProblem } from './api'

describe('parseCookie', () => {
  it('extrae el valor de una cookie presente', () => {
    expect(parseCookie('XSRF-TOKEN=abc123', 'XSRF-TOKEN')).toBe('abc123')
  })

  it('encuentra la cookie entre varias', () => {
    expect(parseCookie('a=1; XSRF-TOKEN=tok; b=2', 'XSRF-TOKEN')).toBe('tok')
  })

  it('decodifica valores percent-encoded (el token puede llevar =, +)', () => {
    expect(parseCookie('XSRF-TOKEN=a%2Bb%3D', 'XSRF-TOKEN')).toBe('a+b=')
  })

  it('no confunde un nombre que es sufijo/prefijo de otro', () => {
    expect(parseCookie('X-TOKEN=1; XSRF-TOKEN=2', 'XSRF-TOKEN')).toBe('2')
  })

  it('devuelve null si la cookie no está', () => {
    expect(parseCookie('a=1; b=2', 'XSRF-TOKEN')).toBeNull()
  })

  it('devuelve null con string vacío', () => {
    expect(parseCookie('', 'XSRF-TOKEN')).toBeNull()
  })
})

describe('parseProblem', () => {
  function problem(
    status: number,
    body: unknown,
    headers: Record<string, string> = {},
  ): Response {
    return new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/problem+json', ...headers },
    })
  }

  it('mapea title y detail del cuerpo problem+json', async () => {
    const err = await parseProblem(
      problem(422, {
        title: 'Regla de negocio incumplida',
        detail: 'La contraseña actual es incorrecta',
        status: 422,
      }),
    )
    expect(err).toBeInstanceOf(ApiError)
    expect(err.status).toBe(422)
    expect(err.title).toBe('Regla de negocio incumplida')
    expect(err.detail).toBe('La contraseña actual es incorrecta')
  })

  it('captura Retry-After (segundos) en 429', async () => {
    const err = await parseProblem(
      problem(429, { title: 'Demasiados intentos', status: 429 }, { 'Retry-After': '120' }),
    )
    expect(err.status).toBe(429)
    expect(err.retryAfter).toBe(120)
  })

  it('cae al statusText cuando no hay cuerpo JSON', async () => {
    const err = await parseProblem(new Response(null, { status: 403, statusText: 'Forbidden' }))
    expect(err.status).toBe(403)
    expect(err.title).toBe('Forbidden')
    expect(err.detail).toBeUndefined()
    expect(err.retryAfter).toBeUndefined()
  })
})
