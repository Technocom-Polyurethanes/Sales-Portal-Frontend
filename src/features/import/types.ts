export type ImportSource = "customers" | "materials" | "prices"

export type ImportRowStatus = "new" | "update" | "unchanged" | "error"

export type ImportChange = {
  field: string
  oldValue?: string | null
  newValue?: string | null
}

export type ImportRow = {
  rowNumber: number
  status: ImportRowStatus
  errors: string[]
  values: Record<string, string | null>
  existing?: Record<string, string | null> | null
  changes: ImportChange[]
}

export type ImportSummary = {
  total: number
  new: number
  update: number
  unchanged: number
  error: number
}

export type ImportPreview = {
  importId: string
  summary: ImportSummary
  rows: ImportRow[]
}

export type ImportResult = {
  importId: string
  created: number
  updated: number
  skipped: number
  failed: number
}

export type ImportHistoryItem = {
  id: string
  type: ImportSource
  fileName: string
  createdByName?: string | null
  createdAt: string
  committedAt?: string | null
  created: number
  updated: number
  skipped: number
  failed: number
}

export type ImportHistoryPage = {
  items: ImportHistoryItem[]
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}
