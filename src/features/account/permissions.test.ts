import { describe, expect, it } from "vitest"

import { normalizeRole, roleCan, ROLES, type Permission } from "./permissions"

const ALL: Permission[] = [
  "offers.write",
  "catalog.create",
  "catalog.edit",
  "import.use",
  "users.manage",
]

const allowed = (role: Parameters<typeof roleCan>[0]) =>
  ALL.filter((permission) => roleCan(role, permission))

describe("role permissions", () => {
  it("gives the admin everything", () => {
    expect(allowed("Admin")).toEqual(ALL)
  })

  it("lets sales create offers and catalogue records, but not edit, import or manage users", () => {
    expect(allowed("Sales")).toEqual(["offers.write", "catalog.create"])
  })

  it("keeps offers read only for the accountant, who can import and edit the catalogue", () => {
    expect(allowed("Accountant")).toEqual([
      "catalog.create",
      "catalog.edit",
      "import.use",
    ])
  })

  it("only the admin sees the users screen", () => {
    expect(ROLES.filter((role) => roleCan(role, "users.manage"))).toEqual([
      "Admin",
    ])
  })

  it("grants nothing to a missing or unknown role", () => {
    expect(allowed(undefined)).toEqual([])
    expect(allowed(normalizeRole("SalesUser"))).toEqual([])
  })

  it("reads the role name the API sends, ignoring case and spaces", () => {
    expect(normalizeRole("admin")).toBe("Admin")
    expect(normalizeRole(" Accountant ")).toBe("Accountant")
    expect(normalizeRole("Sales")).toBe("Sales")
    expect(normalizeRole(undefined)).toBeUndefined()
  })
})
