import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react'
import { ApiError } from '@/lib/api'
import { authService } from '@/services'
import type { User } from '@/types/api'

interface AuthState {
  user: User | null
  loading: boolean
  login: (u: string, p: string) => Promise<void>
  logout: () => Promise<void>
}
const Ctx = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient()
  const q = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      try {
        return await authService.me()
      } catch (e) {
        if (e instanceof ApiError && [401, 403].includes(e.status)) return null
        throw e
      }
    },
    staleTime: 60_000,
    retry: false,
  })
  const login = useCallback(async (u: string, p: string) => {
    qc.setQueryData(['me'], await authService.login(u, p))
  }, [qc])
  const logout = useCallback(async () => {
    await authService.logout()
    qc.setQueryData(['me'], null)
    qc.removeQueries({ predicate: (qq) => qq.queryKey[0] === 'admin' })
  }, [qc])
  const value = useMemo(() => ({ user: q.data ?? null, loading: q.isLoading, login, logout }), [q.data, q.isLoading, login, logout])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useAuth fuera de AuthProvider')
  return c
}
