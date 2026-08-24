import { describe, it, expect, afterEach } from 'vitest'
import { parseServerDateTime, daysSince } from './format'

describe('parseServerDateTime', () => {
  it('interpreta un valor sin offset como UTC (bug: el backend serializa LocalDateTime UTC sin offset)', () => {
    expect(parseServerDateTime('2026-08-14T15:00:00').toISOString()).toBe(
      '2026-08-14T15:00:00.000Z',
    )
  })

  it('respeta un valor que ya trae Z tal cual', () => {
    expect(parseServerDateTime('2026-08-14T15:00:00Z').toISOString()).toBe(
      '2026-08-14T15:00:00.000Z',
    )
  })

  it('respeta un valor que ya trae offset positivo tal cual (no lo reinterpreta como UTC)', () => {
    // 15:00 en +05:00 son las 10:00 UTC
    expect(parseServerDateTime('2026-08-14T15:00:00+05:00').toISOString()).toBe(
      '2026-08-14T10:00:00.000Z',
    )
  })

  it('respeta un valor que ya trae offset negativo tal cual', () => {
    // 15:00 en -05:00 (Bogotá) son las 20:00 UTC
    expect(parseServerDateTime('2026-08-14T15:00:00-05:00').toISOString()).toBe(
      '2026-08-14T20:00:00.000Z',
    )
  })
})

describe('daysSince', () => {
  it('calcula los días transcurridos con now inyectado (determinista, sin depender de la TZ del runner)', () => {
    expect(daysSince('2026-08-10T00:00:00Z', new Date('2026-08-14T00:00:00Z'))).toBe(4)
  })

  it('devuelve 0 el mismo día, aunque hayan pasado horas', () => {
    expect(daysSince('2026-08-14T08:00:00Z', new Date('2026-08-14T23:00:00Z'))).toBe(0)
  })

  it('interpreta un value sin offset como UTC igual que parseServerDateTime', () => {
    expect(daysSince('2026-08-10T00:00:00', new Date('2026-08-14T00:00:00Z'))).toBe(4)
  })
})

describe('corrimiento de TZ con America/Bogota fija (documentación del bug, no regresión)', () => {
  const originalTz = process.env.TZ

  afterEach(() => {
    process.env.TZ = originalTz
  })

  it('un Date nativo sin offset corre 5 horas en America/Bogota; parseServerDateTime no', () => {
    process.env.TZ = 'America/Bogota'

    // El bug real: new Date() interpreta un date-time sin offset como hora LOCAL.
    // 15:00 hora local de Bogotá (UTC-5) son las 20:00 UTC — 5 horas de corrimiento.
    const naive = new Date('2026-08-14T15:00:00')
    expect(naive.getUTCHours()).toBe(20)

    // parseServerDateTime evita el bug: interpreta el mismo string como UTC.
    const fixed = parseServerDateTime('2026-08-14T15:00:00')
    expect(fixed.getUTCHours()).toBe(15)
  })
})
