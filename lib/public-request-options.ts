import type { PublicRequestTextField } from './public-request-limits'

/** Los cuatro campos académicos que se eligen de una lista cerrada en lugar de escribirse. */
export type AcademicListField = Extract<PublicRequestTextField, 'campus' | 'faculty' | 'semester' | 'modality'>

/**
 * Listas cerradas de sede, facultad, semestre y modalidad del formulario público.
 *
 * Procedencia: decisión del propietario del 2026-09-28. Fuentes: la web oficial de la
 * universidad (https://www.uniremington.edu.co/cali/ y https://www.uniremington.edu.co/programas/)
 * para facultades y modalidades —la oferta nacional también lista Combinada e Híbrida, que el
 * propietario descartó— y https://www.uniremington.edu.co/programas/medicina/ para el tope de
 * 12 semestres (el programa más largo). El alcance del MVP es la Sede Cali.
 *
 * PROVISIONALES: no cuentan con confirmación escrita de la Coordinación Académica.
 *
 * Los valores son nombres cortos («Ingenierías», no «Facultad de Ingenierías») porque el rótulo
 * del campo ya dice «Facultad»; el semestre viaja como dígito ordinal. Ninguno tiene espacios
 * sobrantes, y por eso estos campos quedan fuera de la normalización de la página: viajan tal
 * como están aquí. El tipo del registro hace que un campo mal escrito no compile, y el test
 * unitario comprueba que cada opción cabe en su límite de `PUBLIC_REQUEST_FIELD_LIMITS`.
 */
export const ACADEMIC_FIELD_OPTIONS: Record<AcademicListField, readonly string[]> = {
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
}

/**
 * La sede cuando su lista tiene una sola opción: la página la preselecciona y el selector explica
 * con una pista por qué no hay otra. En cuanto haya varias es `null`, y las dos cosas desaparecen
 * juntas en vez de quedar afirmando algo falso.
 */
export const SINGLE_CAMPUS: string | null =
  ACADEMIC_FIELD_OPTIONS.campus.length === 1 ? ACADEMIC_FIELD_OPTIONS.campus[0] : null
