import type { Transport } from "./types"
import { ApiError } from "./types"

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000/api"
const TOKEN_KEY = "sales_portal_jwt"
const SESSION_KEY = "technocom.session"

let transport: Transport | null = null

export function registerTransport(next: Transport): void {
  transport = next
}

function getToken(): string | null {
  if (typeof localStorage === "undefined") return null
  return localStorage.getItem(TOKEN_KEY)
}

function clearAuth(): void {
  if (typeof localStorage === "undefined") return
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(SESSION_KEY)
}

async function httpTransport(
  path: string,
  options: Parameters<Transport>[1] = {},
): Promise<unknown> {
  const rawBase = API_BASE_URL
  const base = rawBase.replace(/\/$/, "")
  const normalizedPath = path.replace(/^\//, "")
  const isApiBase = /\/api$/i.test(base)
  const finalBase = isApiBase ? base.replace(/\/api$/i, "") : base
  const url = path.startsWith("http")
    ? path
    : `${finalBase}/api/${normalizedPath}`

  const headers = new Headers((options as any).headers as HeadersInit | undefined)
  if ((options as any).body !== undefined && !((options as any).body instanceof FormData)) {
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json")
    }
  }
  const token = getToken()
  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  const fetchOptions: RequestInit = {
    method: (options as any).method ?? "GET",
    headers,
  }

  if ((options as any).body !== undefined) {
    if ((options as any).body instanceof FormData) {
      fetchOptions.body = (options as any).body
    } else if (typeof (options as any).body === "string") {
      fetchOptions.body = (options as any).body
    } else {
      fetchOptions.body = JSON.stringify((options as any).body)
    }
  }

  const query = (options as any).query
  if (query && typeof query === "object") {
    const q = new URLSearchParams()
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null) continue
      if (Array.isArray(value)) {
        for (const v of value) {
          if (v === undefined || v === null) continue
          q.append(key, String(v))
        }
      } else {
        q.append(key, String(value))
      }
    }
    const qs = q.toString()
    if (qs) {
      const separator = url.includes("?") ? "&" : "?"
      const finalUrl = `${url}${separator}${qs}`
      const response = await fetch(finalUrl, fetchOptions)
      return handleResponse(response)
    }
  }

  const response = await fetch(url, fetchOptions)
  return handleResponse(response)

}

async function handleResponse(response: Response): Promise<unknown> {
  if (response.status === 401) {
    clearAuth()
    if (typeof window !== "undefined") {
      window.location.href = "/login"
    }
    throw new ApiError("Unauthorized", 401)
  }

  const contentType = response.headers.get("content-type") ?? ""
  let data: unknown
  if (contentType.includes("application/json")) {
    try {
      data = await response.json()
    } catch {
      data = undefined
    }
  } else {
    const text = await response.text()
    data = text || undefined
  }

  if (!response.ok) {
    if (typeof data === "object" && data) {
      const problem = data as any
      const message =
        problem.detail ||
        problem.title ||
        problem.message ||
        `Request failed with status ${response.status}`
      const fieldErrors =
        problem.errors && typeof problem.errors === "object"
          ? problem.errors
          : undefined
      throw new ApiError(message, response.status, {
        title: problem.title,
        detail: problem.detail,
        errors: fieldErrors,
      })
    }
    if (typeof data === "string" && data) {
      throw new ApiError(data, response.status)
    }
    throw new ApiError(`Request failed with status ${response.status}`, response.status)
  }

  return data
}

export function createHttpTransport(): Transport {
  return httpTransport as Transport
}

export function getTransport(): Transport {
  if (!transport) {
    transport = createHttpTransport()
  }
  return transport
}
