import { auth } from "@/firebase/config"

/**
 * Thin sync helpers around the shared Firebase Auth instance.
 * Safe when no user is signed in (returns null / false).
 * Use from app code instead of reading `auth` directly in UI layers.
 */

/**
 * @returns {import("firebase/auth").User | null}
 */
export function getAuthUser() {
  try {
    return auth.currentUser ?? null
  } catch {
    return null
  }
}

/**
 * @returns {boolean}
 */
export function isLoggedIn() {
  try {
    return auth.currentUser != null
  } catch {
    return false
  }
}

/**
 * @returns {string | null} Firebase Auth UID, or null if not signed in.
 */
export function getUserId() {
  try {
    return auth.currentUser?.uid ?? null
  } catch {
    return null
  }
}
