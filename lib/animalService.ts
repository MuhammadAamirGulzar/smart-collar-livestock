import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  type QueryDocumentSnapshot,
} from "firebase/firestore"
import { auth, db } from "@/firebase/config"
import { getFarmById } from "./farmService"
import { getUserRole, type FirestoreUserRole } from "./userService"

/** Matches context/data-model.md `animals` collection */
export interface Animal {
  animalId: string
  name: string
  species: string
  farmId: string
  age?: number
  collarId?: string
  estrusCycle?: string | number
}

const ANIMALS = "animals"

const ANIMAL_SERVICE_ROLES: FirestoreUserRole[] = [
  "super_admin",
  "farm_owner",
  "executive_manager",
]

function requireAuthUid(): string {
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error("Not authenticated")
  return uid
}

async function assertAnimalServiceRole(): Promise<void> {
  const uid = requireAuthUid()
  const role = await getUserRole(uid)
  if (!role || !ANIMAL_SERVICE_ROLES.includes(role)) {
    throw new Error(
      "Only super_admin, farm_owner, and executive_manager can access animals",
    )
  }
}

function animalFromDoc(id: string, data: Record<string, unknown>): Animal {
  const estrus = data.estrusCycle
  const estrusCycle =
    estrus === undefined || estrus === null
      ? undefined
      : typeof estrus === "string" || typeof estrus === "number"
        ? estrus
        : undefined

  return {
    animalId: (data.animalId as string) ?? id,
    name: String(data.name ?? ""),
    species: String(data.species ?? ""),
    farmId: String(data.farmId ?? ""),
    ...(typeof data.age === "number" ? { age: data.age } : {}),
    ...(typeof data.collarId === "string" ? { collarId: data.collarId } : {}),
    ...(estrusCycle !== undefined ? { estrusCycle } : {}),
  }
}

export type AnimalCreateInput = Pick<Animal, "name" | "species"> &
  Partial<Pick<Animal, "age" | "collarId" | "estrusCycle">>

export type AnimalUpdateInput = Partial<
  Pick<Animal, "name" | "species" | "estrusCycle">
>

/**
 * Creates an animal under `farmId`. Caller must be super_admin, farm_owner, or executive_manager
 * with access to the farm (see context/rules.md).
 */
export async function addAnimal(
  farmId: string,
  animalData: AnimalCreateInput,
): Promise<string> {
  await assertAnimalServiceRole()
  const farm = await getFarmById(farmId)
  if (!farm) throw new Error("Farm not found")

  const animalRef = doc(collection(db, ANIMALS))
  const animalId = animalRef.id

  const payload: Record<string, unknown> = {
    animalId,
    name: animalData.name,
    species: animalData.species,
    farmId,
  }
  if (animalData.age !== undefined) payload.age = animalData.age
  if (animalData.collarId !== undefined) payload.collarId = animalData.collarId
  if (animalData.estrusCycle !== undefined) payload.estrusCycle = animalData.estrusCycle

  await setDoc(animalRef, payload)
  return animalId
}

/**
 * Lists animals for a farm. Farm access is enforced via `getFarmById`.
 */
export async function getAnimalsByFarm(farmId: string): Promise<Animal[]> {
  await assertAnimalServiceRole()
  const farm = await getFarmById(farmId)
  if (!farm) throw new Error("Farm not found")

  const q = query(collection(db, ANIMALS), where("farmId", "==", farmId))
  const snap = await getDocs(q)
  return snap.docs.map((d: QueryDocumentSnapshot) =>
    animalFromDoc(d.id, d.data() as Record<string, unknown>),
  )
}

/**
 * Loads one animal if it exists and the caller may access its farm.
 */
export async function getAnimalById(animalId: string): Promise<Animal | null> {
  await assertAnimalServiceRole()
  const ref = doc(db, ANIMALS, animalId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null

  const animal = animalFromDoc(snap.id, snap.data() as Record<string, unknown>)
  const farm = await getFarmById(animal.farmId)
  if (!farm) return null
  return animal
}

/**
 * Updates `name`, `species`, and/or `estrusCycle`. Changing `farmId` is not supported here.
 */
export async function updateAnimal(
  animalId: string,
  data: AnimalUpdateInput,
): Promise<void> {
  await assertAnimalServiceRole()
  const ref = doc(db, ANIMALS, animalId)
  const snap = await getDoc(ref)
  if (!snap.exists()) throw new Error("Animal not found")

  const animal = animalFromDoc(snap.id, snap.data() as Record<string, unknown>)
  const farm = await getFarmById(animal.farmId)
  if (!farm) throw new Error("Farm not found")

  const payload: Record<string, unknown> = {}
  if (data.name !== undefined) payload.name = data.name
  if (data.species !== undefined) payload.species = data.species
  if (data.estrusCycle !== undefined) payload.estrusCycle = data.estrusCycle
  if (Object.keys(payload).length === 0) return
  await updateDoc(ref, payload)
}

/**
 * Deletes the animal document. Caller must have farm access for that animal's `farmId`.
 */
export async function deleteAnimal(animalId: string): Promise<void> {
  await assertAnimalServiceRole()
  const ref = doc(db, ANIMALS, animalId)
  const snap = await getDoc(ref)
  if (!snap.exists()) throw new Error("Animal not found")

  const animal = animalFromDoc(snap.id, snap.data() as Record<string, unknown>)
  const farm = await getFarmById(animal.farmId)
  if (!farm) throw new Error("Farm not found")

  await deleteDoc(ref)
}
