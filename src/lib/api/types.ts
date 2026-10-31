export type QueryValue = string | number | boolean | undefined | null

export type Query = Record<string, QueryValue>

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

export type ApiRequestOptions = {
  method?: HttpMethod
  query?: Query
  body?: unknown
  signal?: AbortSignal
}

/** Transport contract: one function that resolves a JSON payload. */
export type Transport = (
  path: string,
  options?: ApiRequestOptions,
) => Promise<unknown>

export interface ApiClient {
  request<T>(path: string, options?: ApiRequestOptions): Promise<T>
  get<T>(path: string, query?: Query): Promise<T>
  post<T>(path: string, body?: unknown): Promise<T>
  put<T>(path: string, body?: unknown): Promise<T>
  patch<T>(path: string, body?: unknown): Promise<T>
  delete<T>(path: string): Promise<T>
}

/** Error thrown when the API layer rejects a request. */
export class ApiError extends Error {
  status: number
  title?: string
  detail?: string
  errors?: Record<string, string[]>

  constructor(message: string, status = 404, extra?: Partial<ApiError>) {
    super(message)
    this.name = "ApiError"
    this.status = status
    if (extra) {
      this.title = extra.title
      this.detail = extra.detail
      this.errors = extra.errors
    }
  }
}

