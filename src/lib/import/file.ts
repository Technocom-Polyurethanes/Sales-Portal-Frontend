export const MAX_IMPORT_BYTES = 5 * 1024 * 1024

export type FileProblem = "extension" | "size" | "empty"

/** Checks an uploaded file against the import limits before it is sent. */
export function checkImportFile(file: {
  name: string
  size: number
}): FileProblem | null {
  if (!/\.(xlsx|csv)$/i.test(file.name)) return "extension"
  if (file.size > MAX_IMPORT_BYTES) return "size"
  if (file.size === 0) return "empty"
  return null
}
