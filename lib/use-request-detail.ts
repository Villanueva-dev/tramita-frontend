'use client'

import { useCallback, useEffect, useState } from 'react'
import { ApiError, getRequest, getRequestTimeline } from './api'
import { apiErrorMessages } from './api-errors'
import type { Request, TimelineEntry } from './types'

/**
 * Detalle de una solicitud junto con su bitácora de auditoría.
 *
 * A diferencia de `use-request-search`, esta carga no nace de una interacción
 * sino de abrir la pantalla, así que va en un Effect. Eso obliga al flag
 * `ignore` del cleanup que documenta React: si el id cambia o la pantalla se
 * desmonta mientras una petición está en vuelo, su respuesta ya no corresponde
 * al estado vigente y no debe escribirse.
 *
 * Los dos GET van en paralelo porque son independientes; encadenarlos
 * duplicaría la latencia sin ganar consistencia — el backend no ofrece una
 * lectura atómica de ambos.
 */
export function useRequestDetail(id: string) {
  const [request, setRequest] = useState<Request | null>(null)
  const [timeline, setTimeline] = useState<TimelineEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [errors, setErrors] = useState<string[]>([])
  // Un 404 es una pantalla propia, no un banner sobre un detalle vacío.
  const [notFound, setNotFound] = useState(false)
  const [reloadToken, setReloadToken] = useState(0)

  /** Vuelve a leer del servidor. La Fase 4b lo usa para resolver el 409. */
  const reload = useCallback(() => setReloadToken((token) => token + 1), [])

  useEffect(() => {
    let ignore = false

    async function load() {
      setLoading(true)
      setErrors([])
      setNotFound(false)
      try {
        const [detail, entries] = await Promise.all([
          getRequest(id),
          getRequestTimeline(id),
        ])
        if (ignore) return
        setRequest(detail)
        setTimeline(entries)
      } catch (err) {
        if (ignore) return
        setRequest(null)
        setTimeline([])
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true)
        } else {
          setErrors(apiErrorMessages(err))
        }
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    void load()
    return () => {
      ignore = true
    }
  }, [id, reloadToken])

  return { request, timeline, loading, errors, notFound, reload }
}
