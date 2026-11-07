import type { Role } from "../account/permissions"

/** A user as the Users screen shows it. The password is never part of it. */
export type UserRecord = {
  id: string
  username: string
  fullName: string
  initials: string
  email?: string | null
  role: Role
  roleTitle?: string | null
  roleTitleAr?: string | null
  team?: string | null
  teamAr?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

/** The fields of the create and edit form (the username and password only apply to a new user). */
export type UserFormValues = {
  fullName: string
  initials: string
  email: string
  role: Role | ""
  roleTitle: string
  roleTitleAr: string
  team: string
  teamAr: string
  isActive: boolean
}

export type UserStatusFilter = "all" | "active" | "inactive"

export type UserListParams = {
  search?: string
  role?: Role | "all"
  status?: UserStatusFilter
  page?: number
  pageSize?: number
}
