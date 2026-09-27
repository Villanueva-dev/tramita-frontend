'use client'

import { useCallback, useEffect, useState } from 'react'
import { listPublicPrograms } from './api'

type ProgramCatalogState =
  | { status: 'loading'; programs: string[] }
  | { status: 'ready'; programs: string[] }
  | { status: 'error'; programs: string[] }

/**
 * La forma que espera `AcademicFields`. Qué hacer con cada estado lo decide la pantalla: la
 * página pública bloquea el envío sin catálogo; el formulario interno deja radicar sin programa.
 */
export type ProgramCatalog = ProgramCatalogState & { retry: () => void }

/**
 * Carga `GET /api/public/programs` al montar, con reintento manual. `ignore` en el cleanup
 * evita que una respuesta lenta pise a una más nueva (desmontaje o «Reintentar» en vuelo).
 */
export function useProgramCatalog(): ProgramCatalog {
  const [state, setState] = useState<ProgramCatalogState>({ status: 'loading', programs: [] })
  const [request, setRequest] = useState(0)

  useEffect(() => {
    let ignore = false

    async function loadPrograms() {
      setState({ status: 'loading', programs: [] })
      try {
        const programs = await listPublicPrograms()
        if (!ignore) setState({ status: 'ready', programs: programs.map((program) => program.name) })
      } catch {
        if (!ignore) setState({ status: 'error', programs: [] })
      }
    }

    void loadPrograms()
    return () => {
      ignore = true
    }
  }, [request])

  const retry = useCallback(() => setRequest((current) => current + 1), [])

  return { ...state, retry }
}
