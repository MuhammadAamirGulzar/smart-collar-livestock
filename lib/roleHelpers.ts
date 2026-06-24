import type { UserProfile } from "./userService"
import type { User } from "./types"

/**
 * Frontend-only checks aligned with context/rbac.md (Super Admin, Farm Owner, Executive Manager).
 * Supports Firestore `users.role` values and legacy mock/UI roles from `lib/types`.
 * Never trust these for authorization — enforce in Firestore rules and backend.
 */

/** Super Admin — full access (rbac.md). */
const SUPER_ADMIN_ROLES = new Set(["super_admin", "superadmin"])

/** Farm Owner — own farms, animals, assign executives (rbac.md). */
const FARM_OWNER_ROLES = new Set(["farm_owner", "owner"])

/** Executive Manager — assigned farms only (rbac.md). */
const EXECUTIVE_MANAGER_ROLES = new Set(["executive_manager", "executive-manager"])

export type RoleCheckUser = UserProfile | User | { role: string } | null | undefined

export function isSuperAdmin(user: RoleCheckUser): boolean {
  return user != null && SUPER_ADMIN_ROLES.has(user.role)
}

export function isFarmOwner(user: RoleCheckUser): boolean {
  return user != null && FARM_OWNER_ROLES.has(user.role)
}

export function isExecutiveManager(user: RoleCheckUser): boolean {
  return user != null && EXECUTIVE_MANAGER_ROLES.has(user.role)
}
