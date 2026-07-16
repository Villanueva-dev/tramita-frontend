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
    setUser(me)
    setStatus(me ? 'authenticated' : 'unauthenticated')
  }, [])

  const logout = useCallback(async () => {
    try {
      await apiLogout()
    } finally {
      setUser(null)
      setStatus('unauthenticated')
      // logout borra ambas cookies; re-sembramos el CSRF para el próximo login.
      void getMe()
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, login, logout }),
    [status, user, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
