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
const TOKEN_STORAGE_KEY = "sales_portal_jwt"

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
  return (
    localStorage.getItem(SESSION_STORAGE_KEY) === "active" ||
    Boolean(localStorage.getItem(TOKEN_STORAGE_KEY))
  )
}

function getStoredToken(): string | null {
  if (typeof localStorage === "undefined") return null
  return localStorage.getItem(TOKEN_STORAGE_KEY)
}

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
        if (active) {
          setUser({
            ...profile,
            name: profile.name ?? profile.fullName ?? profile.username,
            initials:
              profile.initials ??
              (profile.fullName || profile.username || "")
                .split(/\s+/)
                .filter(Boolean)
                .map((part) => part[0])
                .join("")
                .toUpperCase()
                .slice(0, 2),
          })
        }
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
    try {
      const response = await accountApi.login(username.trim(), password)
      if (typeof localStorage !== "undefined") {
        if (response.token) {
          localStorage.setItem(TOKEN_STORAGE_KEY, response.token)
        }
        localStorage.setItem(SESSION_STORAGE_KEY, "active")
      }
      const profile = response.user
      setUser({
        ...profile,
        name: profile.name ?? profile.fullName ?? profile.username,
        initials:
          profile.initials ??
          (profile.fullName || profile.username || "")
            .split(/\s+/)
            .filter(Boolean)
            .map((part) => part[0])
            .join("")
            .toUpperCase()
            .slice(0, 2),
      })
      setAuthenticated(true)
      return true
    } catch {
      return false
    }
  }, [])

  const signOut = useCallback(() => {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(SESSION_STORAGE_KEY)
      localStorage.removeItem(TOKEN_STORAGE_KEY)
    }
    setAuthenticated(false)
    setUser(undefined)
  }, [])

  useEffect(() => {
    if (authenticated && !getStoredToken()) {
      signOut()
    }
  }, [authenticated, signOut])

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
