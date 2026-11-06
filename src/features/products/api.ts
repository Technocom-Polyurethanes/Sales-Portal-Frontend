import { api } from "../../lib/api/client"
import type { PaginatedResult } from "../../lib/api/lookup"
import { cached, invalidate } from "../../lib/cache/queryCache"
import type { Product } from "./types"

type RawProduct = Partial<Product> & {
  itemCode?: string
  referencePricePerKg?: number | null
  defaultPackageTypeName?: string
}

/** The material API names follow the database; the UI keeps one shape. */
function mapProduct(raw: RawProduct): Product {
  return {
    id: raw.id ?? "",
    code: raw.code ?? raw.itemCode ?? "",
    itemCode: raw.itemCode ?? raw.code,
    erpNextItemCode: raw.erpNextItemCode,
    name: raw.name ?? "",
    category: raw.category ?? "",
    defaultPackageTypeId: raw.defaultPackageTypeId ?? "",
    defaultPackageTypeName: raw.defaultPackageTypeName,
    defaultWeightKg: raw.defaultWeightKg ?? 0,
    referencePrice: raw.referencePrice ?? raw.referencePricePerKg ?? 0,
    uom: raw.uom,
    isActive: raw.isActive ?? true,
    specifications: raw.specifications,
  }
}

function toBody(product: Partial<Product>) {
  return {
    itemCode: product.itemCode ?? product.code ?? "",
    erpNextItemCode: product.erpNextItemCode,
    name: product.name ?? "",
    category: product.category ?? "",
    referencePricePerKg: product.referencePrice ?? 0,
    uom: product.uom ?? "kg",
    defaultPackageTypeId: product.defaultPackageTypeId || null,
    defaultWeightKg: product.defaultWeightKg ?? 0,
    isActive: product.isActive ?? true,
  }
}

export const productsApi = {
  /** Cached: the builder reads every material each time an offer is started. */
  list(search = ""): Promise<Product[]> {
    return cached(
      `materials:list:${search.trim().toLowerCase()}`,
      ["materials"],
      () =>
        api
          .get<RawProduct[]>("/materials", { search })
          .catch(() => api.get<RawProduct[]>("/products", { search }))
          .then((rows) => rows.map(mapProduct)),
    )
  },
  listPage(
    search: string,
    category: string,
    page: number,
    pageSize = 20,
  ): Promise<PaginatedResult<Product>> {
    return cached(
      `materials:page:${search.trim().toLowerCase()}:${category}:${page}:${pageSize}`,
      ["materials"],
      () =>
        api
          .get<PaginatedResult<RawProduct>>("/materials", {
            search: search.trim() || undefined,
            category: category || undefined,
            page,
            pageSize,
          })
          .then((result) => ({
            ...result,
            items: result.items.map(mapProduct),
          })),
    )
  },
  async create(product: Partial<Product>): Promise<Product> {
    const created = await api.post<RawProduct>("/materials", toBody(product))
    invalidate("materials", "catalog")
    return mapProduct(created)
  },
  async update(id: string, product: Partial<Product>): Promise<Product> {
    const updated = await api.put<RawProduct>(
      `/materials/${id}`,
      toBody(product),
    )
    invalidate("materials", "catalog")
    return mapProduct(updated)
  },
}
