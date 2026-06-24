import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
  updateDoc,
  writeBatch,
  type QueryDocumentSnapshot,
} from "firebase/firestore"
import { auth, db } from "@/firebase/config"
import {
  getUserRole,
  type FirestoreUserRole,
} from "./userService"

/** Matches context/data-model.md `farms` collection */
export interface Farm {
  farmId: string
  name: string
  location: string
  ownerId: string
  employees: string[]
}

const FARMS = "farms"
const ANIMALS = "animals"
const READINGS = "readings"
const USERS = "users"
const FARM_OWNERS = "farm_owners"
const EXECUTIVE_MANAGERS = "executive_managers"

const BATCH_LIMIT = 500

function requireAuthUid(): string {
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error("Not authenticated")
  return uid
}

async function assertCanCreateFarm(callerUid: string, ownerId: string): Promise<void> {
  const role = await getUserRole(callerUid)
  if (role !== "farm_owner" && role !== "super_admin") {
    throw new Error("Only farm_owner and super_admin can create farms")
  }
  if (role === "farm_owner" && ownerId !== callerUid) {
    throw new Error("Farm owners can only create farms for themselves")
  }
}

async function assertFarmOwnerRole(ownerId: string): Promise<void> {
  const snap = await getDoc(doc(db, USERS, ownerId))
  if (!snap.exists()) throw new Error("Owner user not found")
  const r = snap.get("role") as FirestoreUserRole | undefined
  if (r !== "farm_owner") throw new Error("Farm ownerId must be a farm_owner user")
}

async function canAccessFarm(
  callerUid: string,
  farm: Farm,
): Promise<boolean> {
  const role = await getUserRole(callerUid)
  if (role === "super_admin") return true
  if (role === "farm_owner" && farm.ownerId === callerUid) return true
  if (role === "executive_manager") {
    const em = await getDoc(doc(db, EXECUTIVE_MANAGERS, callerUid))
    if (!em.exists()) return false
    const assigned = em.get("assignedFarms") as string[] | undefined
    return Array.isArray(assigned) && assigned.includes(farm.farmId)
  }
  return false
}

async function assertCanWriteFarm(callerUid: string, farm: Farm): Promise<void> {
  const role = await getUserRole(callerUid)
  if (role === "super_admin") return
  if (role === "farm_owner" && farm.ownerId === callerUid) return
  throw new Error("Not allowed to modify this farm")
}

function farmFromDoc(id: string, data: Record<string, unknown>): Farm {
  return {
    farmId: (data.farmId as string) ?? id,
    name: String(data.name ?? ""),
    location: String(data.location ?? ""),
    ownerId: String(data.ownerId ?? ""),
    employees: Array.isArray(data.employees)
      ? (data.employees as string[])
      : [],
  }
}

export type FarmCreateInput = Pick<Farm, "name" | "location"> &
  Partial<Pick<Farm, "employees">>

/**
 * Creates a farm document and appends `farmId` to `farm_owners/{ownerId}.assignedFarms`.
 * Only `farm_owner` and `super_admin` may call; farm owners may only use their own `ownerId`.
 */
export async function createFarm(
  ownerId: string,
  farmData: FarmCreateInput,
): Promise<string> {
  const callerUid = requireAuthUid()
  await assertCanCreateFarm(callerUid, ownerId)
  await assertFarmOwnerRole(ownerId)

  const farmRef = doc(collection(db, FARMS))
  const farmId = farmRef.id
  const employees = farmData.employees ?? []

  try {
    await setDoc(farmRef, {
      farmId,
      name: farmData.name,
      location: farmData.location,
      ownerId,
      employees,
    })
  } catch (err) {
    throw new Error(`[Step 1 - create farm doc] ${err instanceof Error ? err.message : err}`)
  }

  try {
    await setDoc(
      doc(db, FARM_OWNERS, ownerId),
      { assignedFarms: arrayUnion(farmId) },
      { merge: true },
    )
  } catch (err) {
    throw new Error(`[Step 2 - update farm_owners] ${err instanceof Error ? err.message : err}`)
  }

  return farmId
}

/**
 * Lists farms owned by `ownerId`. Caller must be `super_admin` or the same `ownerId`.
 */
export async function getFarmsByOwner(ownerId: string): Promise<Farm[]> {
  const callerUid = requireAuthUid()
  const role = await getUserRole(callerUid)
  if (role !== "super_admin" && ownerId !== callerUid) {
    throw new Error("Not allowed to list farms for this owner")
  }

  const q = query(collection(db, FARMS), where("ownerId", "==", ownerId))
  const snap = await getDocs(q)
  return snap.docs.map((d: QueryDocumentSnapshot) =>
    farmFromDoc(d.id, d.data() as Record<string, unknown>),
  )
}

/** All farm documents. `super_admin` only. */
export async function getAllFarms(): Promise<Farm[]> {
  const callerUid = requireAuthUid()
  const role = await getUserRole(callerUid)
  if (role !== "super_admin") {
    throw new Error("Not allowed to list all farms")
  }
  const snap = await getDocs(collection(db, FARMS))
  return snap.docs.map((d: QueryDocumentSnapshot) =>
    farmFromDoc(d.id, d.data() as Record<string, unknown>),
  )
}

/**
 * Loads one farm. Allowed for `super_admin`, owning `farm_owner`, or assigned `executive_manager`.
 */
export async function getFarmById(farmId: string): Promise<Farm | null> {
  const callerUid = requireAuthUid()
  const ref = doc(db, FARMS, farmId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  const farm = farmFromDoc(snap.id, snap.data() as Record<string, unknown>)
  if (!(await canAccessFarm(callerUid, farm))) {
    throw new Error("Not allowed to access this farm")
  }
  return farm
}

export type FarmUpdateInput = Partial<Pick<Farm, "name" | "location" | "employees">> & {
  size?: number
  totalCows?: number
  totalActiveCollars?: number
  totalInactiveCollars?: number
  ownerId?: string
}

/** Updates farm fields. `super_admin` or owning `farm_owner` only (per rules.md farms write). */
export async function updateFarm(
  farmId: string,
  data: FarmUpdateInput,
): Promise<void> {
  const callerUid = requireAuthUid()
  const ref = doc(db, FARMS, farmId)
  const snap = await getDoc(ref)
  if (!snap.exists()) throw new Error("Farm not found")
  const farm = farmFromDoc(snap.id, snap.data() as Record<string, unknown>)
  await assertCanWriteFarm(callerUid, farm)

  const payload: Record<string, unknown> = {}
  if (data.name !== undefined) payload.name = data.name
  if (data.location !== undefined) payload.location = data.location
  if (data.employees !== undefined) payload.employees = data.employees
  if (data.size !== undefined) payload.size = data.size
  if (data.totalCows !== undefined) payload.totalCows = data.totalCows
  if (data.totalActiveCollars !== undefined) payload.totalActiveCollars = data.totalActiveCollars
  if (data.totalInactiveCollars !== undefined) payload.totalInactiveCollars = data.totalInactiveCollars

  if (data.ownerId !== undefined && data.ownerId !== farm.ownerId) {
    await assertFarmOwnerRole(data.ownerId)
    payload.ownerId = data.ownerId
    const batch = writeBatch(db)
    batch.update(ref, payload)
    batch.set(doc(db, FARM_OWNERS, farm.ownerId), { assignedFarms: arrayRemove(farmId) }, { merge: true })
    batch.set(doc(db, FARM_OWNERS, data.ownerId), { assignedFarms: arrayUnion(farmId) }, { merge: true })
    await batch.commit()
    return
  }

  if (Object.keys(payload).length === 0) return
  await updateDoc(ref, payload)
}

/**
 * Deletes the farm, related animals and readings, updates `farm_owners` and executive `assignedFarms`.
 * Matches context/cascading-deletes.md (batched, max 500 ops per batch).
 */
export async function deleteFarm(farmId: string): Promise<void> {
  const callerUid = requireAuthUid()
  const farmRef = doc(db, FARMS, farmId)
  const farmSnap = await getDoc(farmRef)
  if (!farmSnap.exists()) throw new Error("Farm not found")
  const farm = farmFromDoc(farmSnap.id, farmSnap.data() as Record<string, unknown>)
  await assertCanWriteFarm(callerUid, farm)

  const ownerId = farm.ownerId
  const animalsSnap = await getDocs(
    query(collection(db, ANIMALS), where("farmId", "==", farmId)),
  )
  const readingsSnap = await getDocs(
    query(collection(db, READINGS), where("farmId", "==", farmId)),
  )

  const deleteRefs = [
    ...animalsSnap.docs.map((d: QueryDocumentSnapshot) => d.ref),
    ...readingsSnap.docs.map((d: QueryDocumentSnapshot) => d.ref),
    farmRef,
  ]

  const metaOps: Array<{ ref: ReturnType<typeof doc>; data: Record<string, unknown> }> = []

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

  let batch = writeBatch(db)
  let count = 0

  const commitIfNeeded = async () => {
    if (count >= BATCH_LIMIT) {
      await batch.commit()
      batch = writeBatch(db)
      count = 0
    }
  }

  for (const r of deleteRefs) {
    batch.delete(r)
    count++
    await commitIfNeeded()
  }

  for (const op of metaOps) {
    batch.set(op.ref, op.data, { merge: true })
    count++
    await commitIfNeeded()
  }

  if (count > 0) await batch.commit()
}
