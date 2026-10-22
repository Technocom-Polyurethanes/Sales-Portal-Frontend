import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import type { ReactNode } from "react"

import { accountApi, type AccountUser } from "./api"

const SESSION_STORAGE_KEY = "technocom.session"

export type SessionValue = {
  user: AccountUser | undefined
  authenticated: boolean
  loading: boolean
  signIn: (username: string, password: string) => Promise<boolean>
  signOut: () => void
}

const SessionContext = createContext<SessionValue | null>(null)

function readSession(): boolean {
  if (typeof localStorage === "undefined") return false
  return localStorage.getItem(SESSION_STORAGE_KEY) === "active"
}

/** Mock session: the backend replaces this with a real authentication call. */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState(readSession)
  const [user, setUser] = useState<AccountUser | undefined>(undefined)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!authenticated) return
    let active = true
    setLoading(true)

    accountApi
      .me()
      .then((profile) => {
        if (active) setUser(profile)
      })
      .catch(() => {
        if (active) setUser(undefined)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [authenticated])

  const signIn = useCallback(async (username: string, password: string) => {
    if (username.trim().length === 0 || password.length === 0) return false
    localStorage.setItem(SESSION_STORAGE_KEY, "active")
    setAuthenticated(true)
    return true
  }, [])

  const signOut = useCallback(() => {
    localStorage.removeItem(SESSION_STORAGE_KEY)
    setAuthenticated(false)
  }, [])

  const value = useMemo(
    () => ({ user, authenticated, loading, signIn, signOut }),
    [user, authenticated, loading, signIn, signOut],
  )

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  )
}

export function useSession(): SessionValue {
  const context = useContext(SessionContext)
  if (!context)
    throw new Error("useSession must be used inside <SessionProvider>")
  return context
}
