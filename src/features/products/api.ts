import { api } from "../../lib/api/client"
import { cached } from "../../lib/cache/queryCache"
import type { Product } from "./types"

export const productsApi = {
  /** Cached: the builder reads every material each time an offer is started. */
  list(search = ""): Promise<Product[]> {
    return cached(`materials:list:${search.trim().toLowerCase()}`, ["materials"], () =>
      api.get<Product[]>("/materials", { search }).catch(() =>
        api.get<Product[]>("/products", { search }),
      ),
    )
  },
}
