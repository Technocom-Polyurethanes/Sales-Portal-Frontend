import { useCallback, useMemo } from "react"

import {
  normalizeRole,
  roleCan,
  type Permission,
  type Role,
} from "../permissions"
import { useSession } from "./useSession"

export type PermissionsValue = {
  role: Role | undefined
  can: (permission: Permission) => boolean
  /** True while the signed in profile is still being loaded, so the role is not known yet. */
  pending: boolean
}

/** The role of the signed in user and what it allows. */
export function usePermissions(): PermissionsValue {
  const { user, loading } = useSession()
  const role = useMemo(() => normalizeRole(user?.role), [user?.role])
  const can = useCallback(
    (permission: Permission) => roleCan(role, permission),
    [role],
  )

  return { role, can, pending: !user && loading }
}
