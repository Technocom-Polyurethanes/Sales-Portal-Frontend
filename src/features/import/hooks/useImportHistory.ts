import { useAsyncData } from "../../../lib/hooks/useAsyncData"
import { importApi } from "../api"

/** The committed import log, newest first. */
export function useImportHistory(page: number) {
  return useAsyncData(() => importApi.history(page), [page])
}
