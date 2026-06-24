import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  deleteUser,
  type User as FirebaseAuthUser,
  type UserCredential,
} from "firebase/auth"
import {
  collection,
  doc,
  getDoc,
  getDocs,
  writeBatch,
  serverTimestamp,
  type Timestamp,
} from "firebase/firestore"
import { auth, db } from "@/firebase/config"

/** Stored in Firestore `users.role` — matches context/data-model.md */
export type FirestoreUserRole = "super_admin" | "farm_owner" | "executive_manager"

export interface UserProfile {
  uid: string
  name: string
  email: string
  role: FirestoreUserRole
  createdAt?: Timestamp
  phone?: string
  cnic?: string
  contactNumber?: string
  address?: string
  ownerId?: string
}

const USERS = "users"
const FARM_OWNERS = "farm_owners"
const EXECUTIVE_MANAGERS = "executive_managers"

function roleFromFirestore(value: unknown): FirestoreUserRole | null {
  if (value === "super_admin" || value === "farm_owner" || value === "executive_manager") {
    return value
  }
  return null
}

async function writeNewUserProfile(
  uid: string,
  email: string,
  name: string,
  role: Exclude<FirestoreUserRole, "super_admin">,
): Promise<void> {
  const batch = writeBatch(db)
  const userRef = doc(db, USERS, uid)
  batch.set(userRef, {
    userId: uid,
    name,
    email,
    role,
    createdAt: serverTimestamp(),
  })

  if (role === "farm_owner") {
    batch.set(doc(db, FARM_OWNERS, uid), {
      userId: uid,
      assignedFarms: [],
    })
  } else {
    batch.set(doc(db, EXECUTIVE_MANAGERS, uid), {
      userId: uid,
      assignedFarms: [],
    })
  }

  await batch.commit()
}

/**
 * Register a farm owner: Firebase Auth user + `users` + `farm_owners` (empty assignedFarms).
 * Does not allow super_admin registration.
 */
export async function registerFarmOwner(
  email: string,
  password: string,
  name: string,
): Promise<UserCredential> {
  const cred = await createUserWithEmailAndPassword(auth, email, password)
  try {
    await updateProfile(cred.user, { displayName: name })
    await writeNewUserProfile(cred.user.uid, email, name, "farm_owner")
  } catch (e) {
    await deleteUser(cred.user)
    throw e
  }
  return cred
}

/**
 * Register an executive manager: Firebase Auth user + `users` + `executive_managers`.
 * Does not allow super_admin registration.
 */
export async function registerExecutiveManager(
  email: string,
  password: string,
  name: string,
): Promise<UserCredential> {
  const cred = await createUserWithEmailAndPassword(auth, email, password)
  try {
    await updateProfile(cred.user, { displayName: name })
    await writeNewUserProfile(cred.user.uid, email, name, "executive_manager")
  } catch (e) {
    await deleteUser(cred.user)
    throw e
  }
  return cred
}

export async function loginUser(email: string, password: string): Promise<UserCredential> {
  return signInWithEmailAndPassword(auth, email, password)
}

export async function logoutUser(): Promise<void> {
  clearCurrentUserProfileCache()
  await signOut(auth)
}

/**
 * Current Firebase Auth user plus Firestore `users/{uid}` profile (including role).
 */
export async function getCurrentUser(): Promise<UserProfile | null> {
  const firebaseUser = auth.currentUser
  if (!firebaseUser) return null

  const snap = await getDoc(doc(db, USERS, firebaseUser.uid))
  if (!snap.exists()) return null

  const data = snap.data() as Record<string, unknown>

  const role = roleFromFirestore(data.role)
  if (!role) return null

  return {
    uid: firebaseUser.uid,
    name: (data.name as string) ?? firebaseUser.displayName ?? "",
    email: (data.email as string) ?? firebaseUser.email ?? "",
    role,
    createdAt: data.createdAt as Timestamp | undefined,
    phone: (data.phone as string) || undefined,
    cnic: (data.cnic as string) || undefined,
    contactNumber: (data.contactNumber as string) || undefined,
    address: (data.address as string) || undefined,
    ownerId: (data.ownerId as string) || undefined,
  }
}

// --- In-memory cache for the signed-in Auth user’s Firestore `users/{uid}` doc ---

let cachedProfileUid: string | null = null
let cachedProfile: UserProfile | null = null
let cachedProfileReady = false

function clearCurrentUserProfileCache(): void {
  cachedProfileUid = null
  cachedProfile = null
  cachedProfileReady = false
}

/** Clears cached `users/{uid}` profile/role for the current Auth user (e.g. after sign-out). */
export function resetCurrentUserProfileCache(): void {
  clearCurrentUserProfileCache()
}

function userProfileFromUserDoc(
  uid: string,
  data: Record<string, unknown>,
  firebaseUser: FirebaseAuthUser,
): UserProfile | null {
  const role = roleFromFirestore(data.role)
  if (!role) return null
  return {
    uid,
    name: (data.name as string) ?? firebaseUser.displayName ?? "",
    email: (data.email as string) ?? firebaseUser.email ?? "",
    role,
    createdAt: data.createdAt as Timestamp | undefined,
    phone: (data.phone as string) || undefined,
    cnic: (data.cnic as string) || undefined,
    contactNumber: (data.contactNumber as string) || undefined,
    address: (data.address as string) || undefined,
    ownerId: (data.ownerId as string) || undefined,
  }
}

/**
 * Loads `users/{uid}` for `auth.currentUser` and stores it in memory for this UID
 * until the Auth user changes or signs out.
 */
async function ensureCurrentUserProfileCached(): Promise<UserProfile | null> {
  const firebaseUser = auth.currentUser
  if (!firebaseUser) {
    clearCurrentUserProfileCache()
    return null
  }
  const { uid } = firebaseUser
  if (cachedProfileReady && cachedProfileUid === uid) {
    return cachedProfile
  }

  const snap = await getDoc(doc(db, USERS, uid))
  if (!snap.exists()) {
    cachedProfileUid = uid
    cachedProfile = null
    cachedProfileReady = true
    return null
  }

  const profile = userProfileFromUserDoc(
    uid,
    snap.data() as Record<string, unknown>,
    firebaseUser,
  )
  cachedProfileUid = uid
  cachedProfile = profile
  cachedProfileReady = true
  return cachedProfile
}

/**
 * Returns the Firestore role for the currently signed-in Firebase Auth user.
 * Reads `users/{uid}` once per session (per UID), then serves from memory.
 */
export async function getCurrentUserRole(): Promise<FirestoreUserRole | null> {
  const profile = await ensureCurrentUserProfileCached()
  return profile?.role ?? null
}

/**
 * Returns the full Firestore user profile for the current Auth user, with the same
 * in-memory caching as {@link getCurrentUserRole}.
 */
export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  return ensureCurrentUserProfileCached()
}

/** Role from Firestore `users/{uid}` (document id = Auth UID). Null if missing or invalid role field. */
export async function getUserRole(uid: string): Promise<FirestoreUserRole | null> {
  const snap = await getDoc(doc(db, USERS, uid))
  if (!snap.exists()) return null
  return roleFromFirestore(snap.get("role"))
}

/** First assigned farm for navigation (owners/managers may have several). */
export async function getPrimaryAssignedFarmId(
  uid: string,
  role: FirestoreUserRole,
): Promise<string | undefined> {
  if (role === "super_admin") return undefined
  if (role === "farm_owner") {
    const snap = await getDoc(doc(db, FARM_OWNERS, uid))
    if (!snap.exists()) return undefined
    const assigned = snap.get("assignedFarms") as string[] | undefined
    return Array.isArray(assigned) && assigned.length > 0 ? assigned[0] : undefined
  }
  if (role === "executive_manager") {
    const snap = await getDoc(doc(db, EXECUTIVE_MANAGERS, uid))
    if (!snap.exists()) return undefined
    const assigned = snap.get("assignedFarms") as string[] | undefined
    return Array.isArray(assigned) && assigned.length > 0 ? assigned[0] : undefined
  }
  return undefined
}

/** All `users` docs with a valid `role`. `super_admin` only. */
export async function listAllUserProfiles(): Promise<UserProfile[]> {
  const firebaseUser = auth.currentUser
  if (!firebaseUser) throw new Error("Not authenticated")
  if ((await getUserRole(firebaseUser.uid)) !== "super_admin") {
    throw new Error("Not allowed to list users")
  }
  const snap = await getDocs(collection(db, USERS))
  const out: UserProfile[] = []
  for (const d of snap.docs) {
    const data = d.data() as Record<string, unknown>
    const role = roleFromFirestore(data.role)
    if (!role) continue
    out.push({
      uid: d.id,
      name: (data.name as string) ?? "",
      email: (data.email as string) ?? "",
      role,
      createdAt: data.createdAt as Timestamp | undefined,
      phone: (data.phone as string) || undefined,
      cnic: (data.cnic as string) || undefined,
      contactNumber: (data.contactNumber as string) || undefined,
      address: (data.address as string) || undefined,
      ownerId: (data.ownerId as string) || undefined,
    })
  }
  return out
}
