'use client'

import { useState } from 'react'
import { searchRequests } from './api'
import { apiErrorMessages } from './api-errors'
import type { RequestSummary } from './types'

// El mínimo lo fija el backend, no la UI: `minLength: 2` en el contrato y
// `@Size(min = 2)` en RequestController. Vive en el hook y no en el JSX porque
// es una regla del contrato — cualquier pantalla que reuse el hook la hereda.
const MIN_SEARCH_LENGTH = 2

/**
 * Localización de solicitudes por nombre o cédula (US3, FR-011).
 *
 * La búsqueda la dispara `search()` desde el handler del formulario, no un
 * Effect: es una acción del usuario, no una sincronización con un sistema
 * externo. Esa elección evita de raíz la condición de carrera de respuestas
 * fuera de orden, porque hay una petición por intención y no una por tecla.
 */
export function useRequestSearch() {
  const [term, setTerm] = useState('')
  // null = todavía no se consultó; [] = se consultó y no hubo coincidencias.
  // La spec pide mensajes distintos para esos dos estados.
  const [results, setResults] = useState<RequestSummary[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  const trimmed = term.trim()
  const canSearch = trimmed.length >= MIN_SEARCH_LENGTH

  async function search() {
    // Bloquear en silencio no es informar: sin este mensaje, pulsar "Buscar"
    // con un carácter no produce ningún efecto visible y parece un fallo.
    //
    // Se descartan los resultados previos por la misma razón que en el catch:
    // pertenecen al término anterior y dejarlos en pantalla junto al aviso
    // sugiere que siguen vigentes para lo que hay escrito ahora.
    if (!canSearch) {
      setErrors([`Escriba al menos ${MIN_SEARCH_LENGTH} caracteres para buscar.`])
      setResults(null)
      return
    }

    setLoading(true)
    setErrors([])
    try {
      setResults(await searchRequests(trimmed))
    } catch (err) {
      setErrors(apiErrorMessages(err))
      // Se descartan los resultados previos: mostrarlos junto a un error
      // sugiere que siguen vigentes para el término actual, y no lo están.
      setResults(null)
    } finally {
      setLoading(false)
    }
  }

  return { term, setTerm, results, loading, errors, canSearch, search }
}
