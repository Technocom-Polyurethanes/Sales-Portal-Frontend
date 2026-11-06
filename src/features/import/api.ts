import { api } from "../../lib/api/client"
import { invalidate } from "../../lib/cache/queryCache"
import type {
  ImportHistoryPage,
  ImportPreview,
  ImportResult,
  ImportSource,
} from "./types"

export const importApi = {
  /** The template arrives as CSV text; the browser turns it into a download. */
  template(source: ImportSource): Promise<string> {
    return api.get<string>(`/import/templates/${source}`)
  },
  preview(source: ImportSource, file: File): Promise<ImportPreview> {
    const form = new FormData()
    form.append("file", file, file.name)
    return api.post<ImportPreview>(`/import/${source}/preview`, form)
  },
  async commit(importId: string): Promise<ImportResult> {
    const result = await api.post<ImportResult>(`/import/${importId}/commit`)
    // A commit can add or change customers, materials, prices and bank accounts.
    invalidate("customers", "materials", "banks", "catalog")
    return result
  },
  history(page = 1, pageSize = 10): Promise<ImportHistoryPage> {
    return api.get<ImportHistoryPage>("/import/history", { page, pageSize })
  },
}
