'use client'

import { useEffect, useState } from 'react'
import { ApiError, getInbox } from './api'
import { apiErrorMessages } from './api-errors'
import { useAuth } from './auth-store'
import type { InboxEntry } from './types'

/**
 * Etiqueta del responsable de la Coordinación, declarada una única vez (design.md, D8).
 * `lib/api.ts` sigue siendo genérico —el servidor a propósito no conoce nombres de
 * áreas (contrato :74-78)— así que la constante vive acá, junto a su único consumidor.
 */
export const COORDINATION_RESPONSIBLE = 'COORDINACION'

/**
 * Cota explícita de la consulta (D8). Vive acá, no en `lib/api.ts`: el contrato exige
 * que quien llama decida cuánto pide, y quien llama es este hook.
 */
export const INBOX_LIMIT = 50

export type InboxState =
  | { status: 'loading' }
  | { status: 'ready'; entries: InboxEntry[]; mayHaveMore: boolean }
  | { status: 'error'; messages: string[] }

/**
 * Carga la bandeja de trabajo de la Coordinación al montar. Mismo patrón `useEffect` +
 * flag `ignore` que `lib/use-request-detail.ts` (design.md, D1): la carga nace de abrir
 * la pantalla, no de una interacción.
 *
 * Un 401 delega en `useAuth().sessionExpired()`, igual que el resto de la aplicación, y
 * no produce mensaje propio: el gate de `AppShell` reemplaza la pantalla.
 */
export function useCoordinationInbox(): InboxState {
  const { sessionExpired } = useAuth()
  const [state, setState] = useState<InboxState>({ status: 'loading' })

  useEffect(() => {
    let ignore = false

    async function load() {
      try {
        const entries = await getInbox(COORDINATION_RESPONSIBLE, INBOX_LIMIT)
        if (ignore) return
        setState({ status: 'ready', entries, mayHaveMore: entries.length >= INBOX_LIMIT })
      } catch (err) {
        if (ignore) return
        if (err instanceof ApiError && err.status === 401) {
          sessionExpired()
          return
        }
        if (err instanceof ApiError && err.status === 400) {
          // `responsible` y `limit` son constantes del cliente (D8): el usuario no
          // ingresó nada, así que el genérico de "datos ingresados" no aplica.
          setState({
            status: 'error',
            messages: apiErrorMessages(err, {
              badRequest: 'No se pudo consultar la bandeja de la Coordinación.',
            }),
          })
          return
        }
        setState({ status: 'error', messages: apiErrorMessages(err) })
      }
    }

    void load()
    return () => {
      ignore = true
    }
  }, [sessionExpired])

  return state
}
