/**
 * The role matrix of the workspace. The API enforces the same rules (see `Policies.cs` in the
 * backend); this copy only decides what to show, so a user never sees a button that would end
 * in a "forbidden" error. Keep the two in step.
 *
 * Admin       everything.
 * Sales       create and delete offers; view, create and delete customers, materials and banks.
 * Accountant  data import and every catalogue feature including deletion; offers are read only.
 */
export type Role = "Admin" | "Sales" | "Accountant"

export const ROLES: readonly Role[] = ["Admin", "Sales", "Accountant"]

export type Permission = /** Create, edit, duplicate, revise and change the status of offers. */
"offers.write" | /** Delete an offer. */
"offers.delete" | /** Create a customer, material or bank account. */
"catalog.create" | /** Edit an existing customer, material or bank account. */
"catalog.edit" | /** Delete a customer, material or bank account. */
"catalog.delete" | /** Data import. */
"import.use" | /** The Users screen and its delete action. */
"users.manage"

const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  Admin: [
    "offers.write",
    "offers.delete",
    "catalog.create",
    "catalog.edit",
    "catalog.delete",
    "import.use",
    "users.manage",
  ],
  Sales: ["offers.write", "offers.delete", "catalog.create", "catalog.delete"],
  Accountant: [
    "catalog.create",
    "catalog.edit",
    "catalog.delete",
    "import.use",
  ],
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
