import { ApiError, type Query } from "../lib/api/types"
import type { Role } from "../features/account/permissions"
import type { UserRecord } from "../features/users/types"
import { db, sessionAccount } from "./db"
import type { Route } from "./transport"

const ROLE_VALUES: Role[] = ["Admin", "Sales", "Accountant"]

type UserBody = Partial<UserRecord> & { password?: string; newPassword?: string }

const text = (value: unknown) => {
  const trimmed = typeof value === "string" ? value.trim() : ""
  return trimmed || null
}

/** The same field rules the API applies, so the form shows the same messages in mock mode. */
function validate(body: UserBody, creating: boolean): Record<string, string[]> {
  const errors: Record<string, string[]> = {}
  if (!text(body.fullName)) errors.fullName = ["Full name is required."]
  if (!/^[A-Za-z0-9]{1,6}$/.test(text(body.initials) ?? ""))
    errors.initials = ["Initials are required: 1-6 letters or digits."]
  if (!body.role || !ROLE_VALUES.includes(body.role))
    errors.role = ["Choose a role."]
  if (creating) {
    const username = text(body.username) ?? ""
    if (!/^[A-Za-z0-9._-]{3,50}$/.test(username))
      errors.username = ["Username must be 3-50 characters."]
    else if (
      db.accounts.some(
        (a) => a.username.toLowerCase() === username.toLowerCase(),
      )
    )
      errors.username = ["This username is already taken."]
    if ((body.password ?? "").length < 8)
      errors.password = ["Password must be at least 8 characters."]
  }
  return errors
}

function reject(errors: Record<string, string[]>): never {
  throw new ApiError(Object.values(errors).flat().join(" "), 400, { errors })
}

function listUsers(query: Query) {
  const search = String(query.search ?? "")
    .trim()
    .toLowerCase()
  const role = query.role ? String(query.role) : undefined
  const isActive =
    query.isActive === undefined ? undefined : String(query.isActive) === "true"
  const pageSize = Math.max(1, Number(query.pageSize ?? 12))

  const matches = db.accounts
    .filter(
      (user) =>
        (!search ||
          [user.username, user.fullName, user.email ?? ""].some((value) =>
            value.toLowerCase().includes(search),
          )) &&
        (!role || user.role === role) &&
        (isActive === undefined || user.isActive === isActive),
    )
    .sort((a, b) => a.fullName.localeCompare(b.fullName))

  const totalPages = Math.max(1, Math.ceil(matches.length / pageSize))
  const page = Math.min(Math.max(1, Number(query.page ?? 1)), totalPages)
  return {
    items: matches.slice((page - 1) * pageSize, page * pageSize),
    page,
    pageSize,
    totalCount: matches.length,
    totalPages,
  }
}

export const userRoutes: Route[] = [
  {
    method: "GET",
    segments: ["users"],
    handle: ({ query }) => listUsers(query),
  },
  {
    method: "POST",
    segments: ["users"],
    handle: ({ body }) => {
      const input = body as UserBody
      const errors = validate(input, true)
      if (Object.keys(errors).length > 0) reject(errors)

      const now = new Date().toISOString()
      const user: UserRecord = {
        id: `acct-${Date.now()}`,
        username: text(input.username)!,
        fullName: text(input.fullName)!,
        initials: text(input.initials)!.toUpperCase(),
        email: text(input.email),
        role: input.role!,
        roleTitle: text(input.roleTitle),
        roleTitleAr: text(input.roleTitleAr),
        team: text(input.team),
        teamAr: text(input.teamAr),
        isActive: input.isActive ?? true,
        createdAt: now,
        updatedAt: now,
      }
      db.accounts.push(user)
      return user
    },
  },
  {
    method: "PUT",
    segments: ["users", ":id"],
    handle: ({ params, body }) => {
      const user = db.accounts.find((account) => account.id === params[0])
      if (!user) throw new ApiError("User was not found.", 404)

      const input = body as UserBody
      const errors = validate(input, false)
      if (Object.keys(errors).length > 0) reject(errors)

      const isActive = input.isActive ?? user.isActive
      const losesAdmin =
        user.role === "Admin" &&
        user.isActive &&
        (input.role !== "Admin" || !isActive)
      if (losesAdmin) {
        if (user.id === sessionAccount().id)
          throw new ApiError(
            "You cannot change your own role or deactivate your own account.",
            409,
          )
        const otherAdmins = db.accounts.filter(
          (a) => a.id !== user.id && a.role === "Admin" && a.isActive,
        )
        if (otherAdmins.length === 0)
          throw new ApiError(
            "At least one active administrator is required.",
            409,
          )
      }

      Object.assign(user, {
        fullName: text(input.fullName)!,
        initials: text(input.initials)!.toUpperCase(),
        email: text(input.email),
        role: input.role!,
        roleTitle: text(input.roleTitle),
        roleTitleAr: text(input.roleTitleAr),
        team: text(input.team),
        teamAr: text(input.teamAr),
        isActive,
        updatedAt: new Date().toISOString(),
      })
      return user
    },
  },
  {
    method: "POST",
    segments: ["users", ":id", "reset-password"],
    handle: ({ params, body }) => {
      const user = db.accounts.find((account) => account.id === params[0])
      if (!user) throw new ApiError("User was not found.", 404)
      const password = (body as UserBody).newPassword ?? ""
      if (password.length < 8)
        reject({ newPassword: ["Password must be at least 8 characters."] })
      return undefined
    },
  },
]
