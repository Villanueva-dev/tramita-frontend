import { describe, it, expect } from 'vitest'
import { passwordByteLength, validateNewPassword } from './password-policy'

describe('passwordByteLength', () => {
  it('cuenta bytes UTF-8, no caracteres', () => {
    expect(passwordByteLength('abc')).toBe(3)
    expect(passwordByteLength('ñ')).toBe(2) // 1 carácter, 2 bytes
    expect(passwordByteLength('🔒')).toBe(4) // 1 code point, 4 bytes
  })
})

describe('validateNewPassword', () => {
  const ok = 'claveSegura1234' // 15 caracteres

  it('acepta una contraseña que cumple todo', () => {
    const r = validateNewPassword({ current: 'otraClave123456', next: ok, confirm: ok })
    expect(r.valid).toBe(true)
    expect(r.errors).toEqual([])
  })

  it('rechaza menos de 15 caracteres', () => {
    const short = 'corta12345' // 10
    const r = validateNewPassword({ current: 'x', next: short, confirm: short })
    expect(r.valid).toBe(false)
    expect(r.errors.some((e) => e.includes('15 caracteres'))).toBe(true)
  })

  it('rechaza por bytes UTF-8 aunque la longitud parezca válida', () => {
    const many = 'ñ'.repeat(37) // 37 caracteres, 74 bytes
    const r = validateNewPassword({ current: 'x', next: many, confirm: many })
    expect(r.valid).toBe(false)
    expect(r.errors.some((e) => e.includes('72 bytes'))).toBe(true)
  })

  it('rechaza si la nueva es igual a la actual', () => {
    const r = validateNewPassword({ current: ok, next: ok, confirm: ok })
    expect(r.errors.some((e) => e.includes('distinta'))).toBe(true)
  })

  it('rechaza si la confirmación no coincide', () => {
    const r = validateNewPassword({ current: 'x', next: ok, confirm: `${ok}z` })
    expect(r.errors.some((e) => e.includes('coincide'))).toBe(true)
  })
})
