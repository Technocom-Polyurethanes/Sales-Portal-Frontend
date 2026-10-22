import { api } from "../../lib/api/client"

export type AccountUser = {
  id: string
  name: string
  initials: string
  role: string
  roleAr: string
  email: string
  team: string
  teamAr: string
}

export const accountApi = {
  me(): Promise<AccountUser> {
    return api.get<AccountUser>("/users/me")
  },
}
