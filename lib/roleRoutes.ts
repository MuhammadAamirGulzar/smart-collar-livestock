import type { User, UserRole } from "@/lib/types"
import type { FirestoreUserRole } from "@/lib/userService"

/** Post-login destination for Firebase users (Firestore roles). */
export function getFirebaseHomeByFirestoreRole(role: FirestoreUserRole): string {
  if (role === "super_admin") return "/admin"
  if (role === "farm_owner") return "/owner"
  return "/manager"
}

/** Demo / mock session always uses the legacy dashboard route. */
export function getDemoHomePath(): string {
  return "/dashboard"
}

/**
 * Primary “home” route for the shell sidebar and redirects.
 * Firebase sessions use role-specific roots; demo uses `/dashboard`.
 */
export function getHomePathForSession(
  user: User | null,
  isFirebaseSession: boolean,
): string {
  if (!user) return getDemoHomePath()
  if (!isFirebaseSession) return getDemoHomePath()
  const byUiRole: Record<UserRole, string> = {
    superadmin: "/admin",
    owner: "/owner",
    "executive-manager": "/manager",
  }
  return byUiRole[user.role] ?? getDemoHomePath()
}

/** Whether the pathname is the role home for the current user (for active nav). */
export function isRoleHomePath(
  pathname: string,
  user: User | null,
  isFirebaseSession: boolean,
): boolean {
  if (!user) return false
  return pathname === getHomePathForSession(user, isFirebaseSession)
}
