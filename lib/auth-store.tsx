'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  ApiError,
  changePassword as apiChangePassword,
  getMe,
  login as apiLogin,
  logout as apiLogout,
  type SessionUser,
} from './api'

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

interface AuthContextValue {
  status: AuthStatus
  user: SessionUser | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  changePassword: (current: string, next: string) => Promise<void>
  /**
   * Marca la sesión como terminada ante un 401 llegado desde cualquier
   * pantalla. El gate de AppShell observa `status`, así que esto es lo que
   * dispara la vuelta al login: sin avisarle al provider, un 401 en una
   * pantalla interna deja al usuario mirando un error sin salida.
   */
  sessionExpired: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [user, setUser] = useState<SessionUser | null>(null)

  // Rehidratación al montar: GET /me es la única fuente de verdad de "¿hay sesión?"
  // (la cookie es HttpOnly). Esto es lo que sobrevive al F5. Además siembra el CSRF.
  useEffect(() => {
    let alive = true
    getMe()
      .then((me) => {
        if (!alive) return
        setUser(me)
        setStatus(me ? 'authenticated' : 'unauthenticated')
      })
      .catch(() => {
        if (!alive) return
        setUser(null)
        setStatus('unauthenticated')
      })
    return () => {
      alive = false
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    await apiLogin(email, password)
    const me = await getMe()
    if (!me) {
      // Login 204 pero la sesión no se confirmó (caso raro): no dejamos el estado a medias.
      setUser(null)
      setStatus('unauthenticated')
      throw new ApiError(0, 'No se pudo iniciar sesión')
    }
    setUser(me)
    setStatus('authenticated')
  }, [])

  const logout = useCallback(async () => {
    try {
      await apiLogout()
    } finally {
      setUser(null)
      setStatus('unauthenticated')
      // logout borra ambas cookies; re-sembramos el CSRF para el próximo login.
      void getMe().catch(() => {})
    }
  }, [])

  const sessionExpired = useCallback(() => {
    setUser(null)
    setStatus('unauthenticated')
  }, [])

  const changePassword = useCallback(
    async (current: string, next: string) => {
      try {
        await apiChangePassword(current, next)
      } catch (err) {
        // Si la sesión expiró en el intento, reflejarlo para que el gate redirija.
        if (err instanceof ApiError && err.status === 401) sessionExpired()
        throw err
      }
    },
    [sessionExpired],
  )

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, login, logout, changePassword, sessionExpired }),
    [status, user, login, logout, changePassword, sessionExpired],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
