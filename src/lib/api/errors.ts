import { ApiError } from "./types"

export type ProblemDetails = {
  type?: string
  title?: string
  status?: number
  detail?: string
  instance?: string
  errors?: Record<string, string[]>
  [key: string]: unknown
}

export function parseApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error
  }
  if (error instanceof Error) {
    return new ApiError(error.message)
  }
  return new ApiError("Request failed")
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}
