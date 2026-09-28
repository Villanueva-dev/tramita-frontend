import { describe, expect, it } from 'vitest'
import { ACADEMIC_FIELD_OPTIONS, SINGLE_CAMPUS, type AcademicListField } from './public-request-options'
import { PUBLIC_REQUEST_FIELD_LIMITS } from './public-request-limits'

const FIELDS = Object.keys(ACADEMIC_FIELD_OPTIONS) as AcademicListField[]

describe('ACADEMIC_FIELD_OPTIONS', () => {
  it('pins the exact lists, in order', () => {
    expect(ACADEMIC_FIELD_OPTIONS).toEqual({
      campus: ['Cali'],
      faculty: [
        'Ciencias Contables',
        'Ciencias de la Salud',
        'Ciencias Empresariales',
        'Ciencias Jurídicas y Políticas',
        'Diseño',
        'Ingenierías',
        'Medicina Veterinaria',
      ],
      semester: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
      modality: ['Presencial', 'Distancia', 'Virtual'],
    })
  })

  it.each(FIELDS)('%s: every option fits its contract limit', (field) => {
    for (const option of ACADEMIC_FIELD_OPTIONS[field]) {
      expect(option.length).toBeGreaterThan(0)
      expect(option.length).toBeLessThanOrEqual(PUBLIC_REQUEST_FIELD_LIMITS[field])
    }
  })

  it.each(FIELDS)('%s: has no duplicates', (field) => {
    const options = ACADEMIC_FIELD_OPTIONS[field]
    expect(new Set(options).size).toBe(options.length)
  })

  it.each(FIELDS)('%s: no option needs normalization (edge or repeated inner spaces)', (field) => {
    for (const option of ACADEMIC_FIELD_OPTIONS[field]) {
      expect(option).toBe(option.trim().replace(/\s+/g, ' '))
    }
  })

  it('exposes the single campus while its list has one option', () => {
    expect(SINGLE_CAMPUS).toBe('Cali')
  })
})
