import { describe, it, expect } from 'vitest'
import { displayNameFromEmail, initialsFromEmail } from './identity'

describe('displayNameFromEmail', () => {
  it('formatea nombre.apellido en título', () => {
    expect(displayNameFromEmail('ana.restrepo@remington.edu.co')).toBe('Ana Restrepo')
  })

  it('maneja un solo segmento', () => {
    expect(displayNameFromEmail('jgomez@x.co')).toBe('Jgomez')
  })

  it('separa por . _ -', () => {
    expect(displayNameFromEmail('juan_perez-gomez@x.co')).toBe('Juan Perez Gomez')
  })

  it('cae al email si el local está vacío', () => {
    expect(displayNameFromEmail('@x.co')).toBe('@x.co')
  })
})

describe('initialsFromEmail', () => {
  it('toma la inicial de los dos primeros segmentos', () => {
    expect(initialsFromEmail('ana.restrepo@remington.edu.co')).toBe('AR')
  })

  it('un solo segmento da una inicial', () => {
    expect(initialsFromEmail('jgomez@x.co')).toBe('J')
  })

  it('toma como máximo dos iniciales', () => {
    expect(initialsFromEmail('a.b.c@x.co')).toBe('AB')
  })
})
