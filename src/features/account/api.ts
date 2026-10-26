import { api } from "../../lib/api/client"

export type AccountUser = {
  id: string
  username?: string
  name?: string
  fullName?: string
  initials?: string
  role?: string
  roleTitle?: string
  roleTitleAr?: string
  roleAr?: string
  email?: string
  team?: string
  teamAr?: string
}

export type AuthLoginResponse = {
  token: string
  user: AccountUser
}

export const accountApi = {
  login(username: string, password: string): Promise<AuthLoginResponse> {
    return api.post<AuthLoginResponse>("/auth/login", { username, password })
  },
  me(): Promise<AccountUser> {
    return api.get<AccountUser>("/auth/me")
  },
}

