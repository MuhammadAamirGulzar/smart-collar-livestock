import {
  arrayRemove,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  writeBatch,
  type DocumentReference,
  type QueryDocumentSnapshot,
  type QuerySnapshot,
} from "firebase/firestore"
import { auth, db } from "@/firebase/config"
import { getAnimalById } from "./animalService"
import { type Farm, getFarmById } from "./farmService"
import { getUserRole, type FirestoreUserRole } from "./userService"

const FARMS = "farms"
const ANIMALS = "animals"
const READINGS = "readings"
const USERS = "users"
const FARM_OWNERS = "farm_owners"
const EXECUTIVE_MANAGERS = "executive_managers"

const BATCH_LIMIT = 500

/** Tracks totals deleted per collection for caller diagnostics. */
export interface CleanDatabaseResult {
  farms: number
  animals: number
  readings: number
  users: number
  farmOwners: number
  executiveManagers: number
}

/**
 * Deletes all Firestore documents in batches, respecting the 500-op limit.
 * Returns how many documents were deleted from the snapshot.
 */
async function batchDeleteSnapshot(snap: QuerySnapshot): Promise<number> {
  const docs = snap.docs
  if (docs.length === 0) return 0

  let batch = writeBatch(db)
  let count = 0
  let total = 0

  for (const d of docs) {
    batch.delete(d.ref)
    count++
    total++
    if (count >= BATCH_LIMIT) {
      await batch.commit()
      batch = writeBatch(db)
      count = 0
    }
  }

  if (count > 0) await batch.commit()
  return total
}

/**
 * Wipes all non-admin Firestore data: readings, animals, farms, farm_owners,
 * executive_managers, and users (preserving super_admin accounts).
 *
 * Firebase Auth users are intentionally left intact.
 *
 * Caller must be authenticated as `super_admin`.
 */
export async function cleanDatabase(): Promise<CleanDatabaseResult> {
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error("Not authenticated")
  const role = await getUserRole(uid)
  if (role !== "super_admin") {
    throw new Error("Only super_admin can run cleanDatabase")
  }

  const result: CleanDatabaseResult = {
    farms: 0,
    animals: 0,
    readings: 0,
    users: 0,
    farmOwners: 0,
    executiveManagers: 0,
  }

  // 1. Readings first (leaf data, no dependents)
  result.readings = await batchDeleteSnapshot(
    await getDocs(collection(db, READINGS)),
  )

  // 2. Animals (depend on farms, but no child collections)
  result.animals = await batchDeleteSnapshot(
    await getDocs(collection(db, ANIMALS)),
  )

  // 3. Farms
  result.farms = await batchDeleteSnapshot(
    await getDocs(collection(db, FARMS)),
  )

  // 4. Farm-owners role docs
  result.farmOwners = await batchDeleteSnapshot(
    await getDocs(collection(db, FARM_OWNERS)),
  )

  // 5. Executive-managers role docs
  result.executiveManagers = await batchDeleteSnapshot(
    await getDocs(collection(db, EXECUTIVE_MANAGERS)),
  )

  // 6. Users — skip super_admin docs
  const usersSnap = await getDocs(collection(db, USERS))
  const nonAdminRefs: DocumentReference[] = []
  for (const d of usersSnap.docs) {
    if ((d.data() as { role?: string }).role === "super_admin") continue
    nonAdminRefs.push(d.ref)
  }

  if (nonAdminRefs.length > 0) {
    let batch = writeBatch(db)
    let count = 0
    for (const ref of nonAdminRefs) {
      batch.delete(ref)
      count++
      if (count >= BATCH_LIMIT) {
        await batch.commit()
        batch = writeBatch(db)
        count = 0
      }
    }
    if (count > 0) await batch.commit()
    result.users = nonAdminRefs.length
  }

  return result
}

function requireAuthUid(): string {
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error("Not authenticated")
  return uid
}

const DELETE_SERVICE_ROLES: FirestoreUserRole[] = [
  "super_admin",
  "farm_owner",
  "executive_manager",
]

async function assertAnimalOrReadingDeleteRole(): Promise<void> {
  const uid = requireAuthUid()
  const role = await getUserRole(uid)
  if (!role || !DELETE_SERVICE_ROLES.includes(role)) {
    throw new Error(
      "Only super_admin, farm_owner, and executive_manager can perform this delete",
    )
  }
}

async function assertCanWriteFarm(callerUid: string, farm: Farm): Promise<void> {
  const role = await getUserRole(callerUid)
  if (role === "super_admin") return
  if (role === "farm_owner" && farm.ownerId === callerUid) return
  throw new Error("Not allowed to modify this farm")
}

type BatchUpdate = { ref: DocumentReference; data: Record<string, unknown> }

/**
 * Runs delete + optional update operations, committing before exceeding 500 ops per batch.
 * Matches Firestore batch limit (context/cascading-deletes.md).
 */
async function commitBatchedDeletesAndUpdates(
  deleteRefs: DocumentReference[],
  updates: BatchUpdate[],
): Promise<void> {
  let batch = writeBatch(db)
  let count = 0

  const flush = async () => {
    if (count > 0) {
      await batch.commit()
      batch = writeBatch(db)
      count = 0
    }
  }

  const pushDelete = async (ref: DocumentReference) => {
    batch.delete(ref)
    count++
    if (count >= BATCH_LIMIT) await flush()
  }

  const pushUpdate = async (op: BatchUpdate) => {
    batch.set(op.ref, op.data, { merge: true })
    count++
    if (count >= BATCH_LIMIT) await flush()
  }

  for (const ref of deleteRefs) await pushDelete(ref)
  for (const op of updates) await pushUpdate(op)
  await flush()
}

/**
 * Deletes all `readings` where `animalId` matches (batched, max 500 ops per commit).
 * Caller must be able to access the animal's farm (via `getAnimalById`).
 */
export async function deleteReadingsByAnimal(animalId: string): Promise<void> {
  await assertAnimalOrReadingDeleteRole()
  const animal = await getAnimalById(animalId)
  if (!animal) throw new Error("Animal not found")

  const readingsSnap = await getDocs(
    query(collection(db, READINGS), where("animalId", "==", animalId)),
  )
  const deleteRefs = readingsSnap.docs.map(
    (d: QueryDocumentSnapshot) => d.ref,
  )
  await commitBatchedDeletesAndUpdates(deleteRefs, [])
}

/**
 * Deletes all readings for the animal, then the animal document.
 * No readings are left pointing at a removed animal.
 */
export async function deleteAnimalCascade(animalId: string): Promise<void> {
  await assertAnimalOrReadingDeleteRole()
  const animal = await getAnimalById(animalId)
  if (!animal) throw new Error("Animal not found")

  const readingsSnap = await getDocs(
    query(collection(db, READINGS), where("animalId", "==", animalId)),
  )
  const readingRefs = readingsSnap.docs.map(
    (d: QueryDocumentSnapshot) => d.ref,
  )
  const animalRef = doc(db, ANIMALS, animalId)
  await commitBatchedDeletesAndUpdates(readingRefs, [])
  await commitBatchedDeletesAndUpdates([animalRef], [])
}

/**
 * Deletes farm, all animals on the farm, all readings with that `farmId`,
 * removes `farmId` from `farm_owners` and executive `assignedFarms`.
 * Matches context/cascading-deletes.md "Delete Farm".
 */
export async function deleteFarmCascade(farmId: string): Promise<void> {
  const callerUid = requireAuthUid()
  const farm = await getFarmById(farmId)
  if (!farm) throw new Error("Farm not found")
  await assertCanWriteFarm(callerUid, farm)

  const farmRef = doc(db, FARMS, farmId)
  const ownerId = farm.ownerId

  const animalsSnap = await getDocs(
    query(collection(db, ANIMALS), where("farmId", "==", farmId)),
  )
  const readingsSnap = await getDocs(
    query(collection(db, READINGS), where("farmId", "==", farmId)),
  )

  const deleteRefs: DocumentReference[] = [
    ...animalsSnap.docs.map((d: QueryDocumentSnapshot) => d.ref),
    ...readingsSnap.docs.map((d: QueryDocumentSnapshot) => d.ref),
    farmRef,
  ]

  const metaOps: BatchUpdate[] = []

  const ownerRef = doc(db, FARM_OWNERS, ownerId)
  const ownerSnap = await getDoc(ownerRef)
  if (ownerSnap.exists()) {
    metaOps.push({
      ref: ownerRef,
      data: { assignedFarms: arrayRemove(farmId) },
    })
  }

  for (const userId of farm.employees) {
    const u = await getDoc(doc(db, USERS, userId))
    if (!u.exists()) continue
    const r = u.get("role") as FirestoreUserRole | undefined
    if (r !== "executive_manager") continue
    const emRef = doc(db, EXECUTIVE_MANAGERS, userId)
    const emSnap = await getDoc(emRef)
    if (emSnap.exists()) {
      metaOps.push({
        ref: emRef,
        data: { assignedFarms: arrayRemove(farmId) },
      })
    }
  }

  await commitBatchedDeletesAndUpdates(deleteRefs, metaOps)
}

/**
 * Calls the server-side Admin SDK endpoint to delete a Firebase Auth user.
 * Requires the caller to be signed in (ID token is sent as Bearer auth).
 */
async function deleteAuthUser(uid: string): Promise<void> {
  const idToken = await auth.currentUser?.getIdToken()
  if (!idToken) throw new Error("Cannot get ID token for auth deletion")

  const res = await fetch("/api/delete-auth-user", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ uid }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Auth deletion failed (${res.status})`)
  }
}

/**
 * Deletes a farm owner: all their farms (cascade), then the user + farm_owners docs,
 * and finally their Firebase Auth account.
 * Matches context/cascading-deletes.md "Delete Farm Owner". super_admin only.
 */
export async function deleteFarmOwnerCascade(ownerUid: string): Promise<void> {
  const callerUid = requireAuthUid()
  const callerRole = await getUserRole(callerUid)
  if (callerRole !== "super_admin") throw new Error("Only super_admin can delete farm owners")

  const farmsSnap = await getDocs(
    query(collection(db, FARMS), where("ownerId", "==", ownerUid)),
  )
  for (const farmDoc of farmsSnap.docs) {
    await deleteFarmCascade(farmDoc.id)
  }

  const deleteRefs: DocumentReference[] = []

  const ownerDocRef = doc(db, FARM_OWNERS, ownerUid)
  if ((await getDoc(ownerDocRef)).exists()) deleteRefs.push(ownerDocRef)

  const userDocRef = doc(db, USERS, ownerUid)
  if ((await getDoc(userDocRef)).exists()) deleteRefs.push(userDocRef)

  await commitBatchedDeletesAndUpdates(deleteRefs, [])

  await deleteAuthUser(ownerUid)
}
