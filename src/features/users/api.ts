import { api } from "../../lib/api/client"
import type { PaginatedResult } from "../../lib/api/lookup"
import type { UserFormValues, UserListParams, UserRecord } from "./types"

export const USERS_PAGE_SIZE = 12

/** The body the API accepts for a user. Empty optional text is sent as null. */
function toBody(values: UserFormValues) {
  const text = (value: string) => value.trim() || null
  return {
    fullName: values.fullName.trim(),
    initials: values.initials.trim(),
    email: text(values.email),
    role: values.role || null,
    roleTitle: text(values.roleTitle),
    roleTitleAr: text(values.roleTitleAr),
    team: text(values.team),
    teamAr: text(values.teamAr),
    isActive: values.isActive,
  }
}

/** The form values of an existing user, for the edit dialog and the quick activate/deactivate. */
export function userToFormValues(user: UserRecord): UserFormValues {
  return {
    fullName: user.fullName,
    initials: user.initials,
    email: user.email ?? "",
    role: user.role,
    roleTitle: user.roleTitle ?? "",
    roleTitleAr: user.roleTitleAr ?? "",
    team: user.team ?? "",
    teamAr: user.teamAr ?? "",
    isActive: user.isActive,
  }
}

export const usersApi = {
  list(params: UserListParams = {}): Promise<PaginatedResult<UserRecord>> {
    return api.get<PaginatedResult<UserRecord>>("/users", {
      search: params.search?.trim() || undefined,
      role: params.role && params.role !== "all" ? params.role : undefined,
      isActive:
        params.status && params.status !== "all"
          ? params.status === "active"
          : undefined,
      page: params.page ?? 1,
      pageSize: params.pageSize ?? USERS_PAGE_SIZE,
    })
  },

  create(
    values: UserFormValues & { username: string; password: string },
  ): Promise<UserRecord> {
    return api.post<UserRecord>("/users", {
      ...toBody(values),
      username: values.username.trim(),
      password: values.password,
    })
  },

  update(id: string, values: UserFormValues): Promise<UserRecord> {
    return api.put<UserRecord>(`/users/${id}`, toBody(values))
  },

  resetPassword(id: string, newPassword: string): Promise<void> {
    return api.post<void>(`/users/${id}/reset-password`, { newPassword })
  },
}
