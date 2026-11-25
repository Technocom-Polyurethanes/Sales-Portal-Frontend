import { useCallback, useRef, useState } from "react"

import { downloadCsv } from "../../../lib/import/csv"
import { importApi } from "../api"
import type { ImportPreview, ImportResult, ImportSource } from "../types"
import { uploadProgressView, type UploadProgressView } from "../uploadProgress"

export type ImportStep = 1 | 2 | 3

/** Drives the three steps of an import: source, preview, commit. */
export function useImportFlow() {
  const [source, setSourceState] = useState<ImportSource | null>(null)
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [busy, setBusy] = useState<"template" | "preview" | "commit" | null>(
    null,
  )
  const [error, setError] = useState<Error | null>(null)
  const [fileName, setFileName] = useState("")
  const [progress, setProgress] = useState<UploadProgressView | null>(null)
  const uploadStartedAt = useRef(0)

  const step: ImportStep = result ? 3 : preview ? 2 : 1

  const chooseSource = useCallback((next: ImportSource) => {
    setSourceState(next)
    setError(null)
  }, [])

  const downloadTemplate = useCallback(async () => {
    if (!source) return
    setBusy("template")
    setError(null)
    try {
      const csv = await importApi.template(source)
      downloadCsv(`${source}-template.csv`, csv)
    } catch (cause) {
      setError(cause instanceof Error ? cause : new Error(String(cause)))
    } finally {
      setBusy(null)
    }
  }, [source])

  const upload = useCallback(
    async (file: File) => {
      if (!source) return
      setBusy("preview")
      setError(null)
      setFileName(file.name)
      uploadStartedAt.current = Date.now()
      setProgress(uploadProgressView({ loaded: 0, total: file.size }, 0))
      try {
        setPreview(
          await importApi.preview(source, file, (next) => {
            setProgress(
              uploadProgressView(next, Date.now() - uploadStartedAt.current),
            )
          }),
        )
      } catch (cause) {
        setError(cause instanceof Error ? cause : new Error(String(cause)))
      } finally {
        setProgress(null)
        setBusy(null)
      }
    },
    [source],
  )

  const commit = useCallback(async () => {
    if (!preview) return
    setBusy("commit")
    setError(null)
    try {
      setResult(await importApi.commit(preview.importId))
    } catch (cause) {
      setError(cause instanceof Error ? cause : new Error(String(cause)))
    } finally {
      setBusy(null)
    }
  }, [preview])

  const back = useCallback(() => {
    setError(null)
    if (preview) {
      setPreview(null)
      setFileName("")
    } else {
      setSourceState(null)
    }
  }, [preview])

  const reset = useCallback(() => {
    setSourceState(null)
    setPreview(null)
    setResult(null)
    setFileName("")
    setError(null)
    setProgress(null)
  }, [])

  return {
    source,
    step,
    preview,
    result,
    busy,
    error,
    fileName,
    progress,
    chooseSource,
    downloadTemplate,
    upload,
    commit,
    back,
    reset,
  }
}
