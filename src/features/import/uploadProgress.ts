import type { UploadProgress } from "../../lib/api/types"

export type UploadProgressView = UploadProgress & {
  percent: number
  etaSeconds: number | null
}

export function uploadProgressView(
  { loaded, total }: UploadProgress,
  elapsedMs: number,
): UploadProgressView {
  const percent =
    total > 0 ? Math.min(100, Math.round((loaded / total) * 100)) : 0
  const bytesPerMs = elapsedMs > 0 ? loaded / elapsedMs : 0
  const etaSeconds =
    bytesPerMs > 0 && loaded < total
      ? Math.ceil((total - loaded) / bytesPerMs / 1000)
      : null
  return { loaded, total, percent, etaSeconds }
}
