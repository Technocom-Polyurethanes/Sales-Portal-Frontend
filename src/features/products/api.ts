import { api } from "../../lib/api/client"
import type { Product } from "./types"

export const productsApi = {
  list(search = ""): Promise<Product[]> {
    return api.get<Product[]>("/products", { search })
  },
}
