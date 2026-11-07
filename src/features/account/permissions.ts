/**
 * The role matrix of the workspace. The API enforces the same rules (see `Policies.cs` in the
 * backend); this copy only decides what to show, so a user never sees a button that would end
 * in a "forbidden" error. Keep the two in step.
 *
 * Admin       everything.
 * Sales       create offers; view customers (with history), materials and bank accounts and create new ones.
 * Accountant  data import and every catalogue feature; offers are read only.
 */
export type Role = "Admin" | "Sales" | "Accountant"

export const ROLES: readonly Role[] = ["Admin", "Sales", "Accountant"]

export type Permission = /** Create, edit, duplicate, revise and change the status of offers. */
"offers.write" | /** Create a customer, material or bank account. */
"catalog.create" | /** Edit an existing customer, material or bank account. */
"catalog.edit" | /** Data import. */
"import.use" | /** The Users screen. */
"users.manage"

const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  Admin: [
    "offers.write",
    "catalog.create",
    "catalog.edit",
    "import.use",
    "users.manage",
  ],
  Sales: ["offers.write", "catalog.create"],
  Accountant: ["catalog.create", "catalog.edit", "import.use"],
}

/** The role named by the API, or undefined for a missing or unknown value. */
export function normalizeRole(
  value: string | undefined | null,
): Role | undefined {
  return ROLES.find(
    (role) => role.toLowerCase() === value?.trim().toLowerCase(),
  )
}

/** Whether a role holds a permission. An unknown role holds none. */
export function roleCan(
  role: Role | undefined,
  permission: Permission,
): boolean {
  return role !== undefined && ROLE_PERMISSIONS[role].includes(permission)
}
