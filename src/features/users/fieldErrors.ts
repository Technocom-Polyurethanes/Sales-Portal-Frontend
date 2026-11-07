import { ApiError } from "../../lib/api/types"

/**
 * The per field messages of a rejected request, keyed by the form field name. The API names a
 * field in camel case (`fullName`); a model binding error may name it `$.fullName` or `FullName`.
 */
export function fieldErrorsOf(error: unknown): Record<string, string> {
  if (!(error instanceof ApiError) || !error.errors) return {}

  const result: Record<string, string> = {}
  for (const [key, messages] of Object.entries(error.errors)) {
    const name = key.replace(/^\$\./, "")
    const field = name.charAt(0).toLowerCase() + name.slice(1)
    if (messages?.[0]) result[field] = messages[0]
  }
  return result
}

/** Initials suggested from a full name: "Jane Doe" becomes "JD". */
export function suggestInitials(fullName: string): string {
  return fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0))
    .join("")
    .replace(/[^A-Za-z0-9]/g, "")
    .toUpperCase()
    .slice(0, 3)
}
