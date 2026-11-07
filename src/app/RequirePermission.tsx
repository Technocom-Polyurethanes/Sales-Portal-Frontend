import type { ReactNode } from "react"

import Skeleton from "../components/ui/Skeleton"
import { usePermissions } from "../features/account/hooks/usePermissions"
import type { Permission } from "../features/account/permissions"
import ForbiddenPage from "./pages/ForbiddenPage"

/**
 * Renders its children only for a role holding the permission. The API refuses the calls anyway;
 * this keeps the page itself, and its empty error states, away from the wrong role.
 */
export default function RequirePermission({
  permission,
  children,
}: {
  permission: Permission
  children: ReactNode
}) {
  const { can, pending } = usePermissions()

  // The role arrives with the profile; until then neither show the page nor deny it.
  if (pending) return <Skeleton className="h-40 w-full" />
  if (!can(permission)) return <ForbiddenPage />
  return <>{children}</>
}
