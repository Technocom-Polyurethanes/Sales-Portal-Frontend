export interface LookupQueryParams {
  search?: string
  page: number
  pageSize: number
}

export interface PaginatedResult<T> {
  items: T[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

function normalize(value: unknown): string {
  return String(value ?? "")
    .toLowerCase()
    .trim()
}

function matchesSearch<T>(item: T, search: string, fields: (keyof T)[]): boolean {
  if (!search) return true
  const term = normalize(search)
  if (!term) return true
  return fields.some((field) => normalize((item as Record<string, unknown>)[field as string]).includes(term))
}

export function paginate<T>(items: T[], params: LookupQueryParams): PaginatedResult<T> {
  const pageSize = Math.max(1, Math.floor(params.pageSize) || 8)
  const totalCount = items.length
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const page = Math.min(Math.max(1, Math.floor(params.page) || 1), totalPages)
  const start = (page - 1) * pageSize
  const end = start + pageSize
  return {
    items: items.slice(start, end),
    totalCount,
    page,
    pageSize,
    totalPages,
  }
}

export function queryCustomers<T extends { id: string; code?: string; customerCode?: string; erpNextId?: string; name: string; nameAr?: string }>(
  customers: T[],
  params: LookupQueryParams,
): PaginatedResult<T> {
  const filtered = customers.filter((customer) =>
    matchesSearch(customer, params.search ?? "", ["code", "customerCode", "erpNextId", "name", "nameAr", "id"]),
  )
  return paginate(filtered, params)
}

export function queryMaterials<T extends { id: string; code?: string; itemCode?: string; erpNextItemCode?: string; name: string; category?: string }>(
  materials: T[],
  params: LookupQueryParams,
): PaginatedResult<T> {
  const filtered = materials.filter((material) =>
    matchesSearch(material, params.search ?? "", ["code", "itemCode", "erpNextItemCode", "name", "category", "id"]),
  )
  return paginate(filtered, params)
}
