'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

const PUBLIC_PATHS = ['/login']

interface AuthContextType {
  user: User | null
  isAdmin: boolean
  loading: boolean
  accessToken: string | null
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<{ error: any }>
  resetPassword: (email: string) => Promise<{ error: any }>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  loading: true,
  accessToken: null,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => ({ error: null }),
  resetPassword: async () => ({ error: null }),
})

const COOKIE_MAX_AGE = 60 * 24 * 60 * 60 // 60 días en segundos

function setSessionCookie() {
  document.cookie = `af_session=1; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`
}

function clearSessionCookie() {
  document.cookie = 'af_session=; path=/; max-age=0; SameSite=Lax'
}

async function checkAdminRole(
  userId: string,
  setIsAdmin: (v: boolean) => void,
  setLoading: (v: boolean) => void
) {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Error checking admin role:', error.message)
      setIsAdmin(false)
    } else {
      setIsAdmin(data?.role === 'admin')
    }
  } catch (err) {
    console.error('Unexpected error checking admin role:', err)
    setIsAdmin(false)
  } finally {
    setLoading(false)
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  // Redirigir a login si no está autenticado y no es ruta pública
  useEffect(() => {
    if (!loading && !user && !PUBLIC_PATHS.includes(pathname)) {
      router.replace('/login')
    }
  }, [loading, user, pathname, router])

  useEffect(() => {
    // onAuthStateChange emite INITIAL_SESSION al suscribirse con el estado actual.
    // Esto reemplaza getSession() que puede colgar por el mecanismo de auth lock.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user ?? null

        if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
          setUser(currentUser)
          setAccessToken(session?.access_token ?? null)
          if (currentUser) {
            setSessionCookie()
            await checkAdminRole(currentUser.id, setIsAdmin, setLoading)
          } else {
            clearSessionCookie()
            setLoading(false)
          }
        } else if (event === 'TOKEN_REFRESHED') {
          // Solo actualizar token/user — no resetear isAdmin
          setUser(currentUser)
          setAccessToken(session?.access_token ?? null)
        } else if (event === 'SIGNED_OUT') {
          clearSessionCookie()
          setUser(null)
          setIsAdmin(false)
          setAccessToken(null)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }, [])

  const signUp = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password })
    return { error }
  }, [])

  const signOut = useCallback(async () => {
    // Limpiamos el estado local de inmediato para que el redirect ocurra sin esperar el evento
    clearSessionCookie()
    setUser(null)
    setIsAdmin(false)
    setAccessToken(null)
    const { error } = await supabase.auth.signOut()
    return { error }
  }, [])

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return { error }
  }, [])

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, accessToken, signIn, signUp, signOut, resetPassword }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
