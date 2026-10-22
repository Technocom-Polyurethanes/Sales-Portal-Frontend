import { getTransport } from "./transport"
import type { ApiClient, ApiRequestOptions, Query } from "./types"

export const api: ApiClient = {
  request<T,>(path: string, options?: ApiRequestOptions): Promise<T> {
    return getTransport()(path, options) as Promise<T>
  },
  get<T,>(path: string, query?: Query): Promise<T> {
    return api.request<T>(path, { method: "GET", query })
  },
  post<T,>(path: string, body?: unknown): Promise<T> {
    return api.request<T>(path, { method: "POST", body })
  },
  patch<T,>(path: string, body?: unknown): Promise<T> {
    return api.request<T>(path, { method: "PATCH", body })
  },
  delete<T,>(path: string): Promise<T> {
    return api.request<T>(path, { method: "DELETE" })
  },
}

export * from "./types"
