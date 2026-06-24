import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  setDoc,
  Timestamp,
  where,
  writeBatch,
  type QueryDocumentSnapshot,
} from "firebase/firestore"
import { auth, db } from "@/firebase/config"
import { getAnimalById } from "./animalService"
import { getFarmById } from "./farmService"
import { getUserRole, type FirestoreUserRole } from "./userService"

/** Matches context/sensor-data.md categories */
export const READING_CATEGORIES = [
  "rumination",
  "eating",
  "walking",
  "grazing",
  "mounting",
] as const

export type ReadingCategory = (typeof READING_CATEGORIES)[number]

/** Matches context/data-model.md + sensor-data.md `readings` documents */
export interface Reading {
  readingId: string
  animalId: string
  farmId: string
  timestamp: Timestamp
  category: ReadingCategory
  gyroscope: [number, number, number]
  accelerometer: [number, number, number]
}

export type ReadingTimestampInput = Date | number | Timestamp

export type ReadingWriteInput = {
  animalId: string
  farmId: string
  timestamp: ReadingTimestampInput
  category: ReadingCategory
  gyroscope: [number, number, number]
  accelerometer: [number, number, number]
}

const READINGS = "readings"
const BATCH_LIMIT = 500

const READING_SERVICE_ROLES: FirestoreUserRole[] = [
  "super_admin",
  "farm_owner",
  "executive_manager",
]

function requireAuthUid(): string {
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error("Not authenticated")
  return uid
}

async function assertReadingServiceRole(): Promise<void> {
  const uid = requireAuthUid()
  const role = await getUserRole(uid)
  if (!role || !READING_SERVICE_ROLES.includes(role)) {
    throw new Error(
      "Only super_admin, farm_owner, and executive_manager can access readings",
    )
  }
}

function isReadingCategory(v: unknown): v is ReadingCategory {
  return (
    typeof v === "string" &&
    (READING_CATEGORIES as readonly string[]).includes(v)
  )
}

function isVec3(v: unknown): v is [number, number, number] {
  return (
    Array.isArray(v) &&
    v.length === 3 &&
    v.every((n) => typeof n === "number" && Number.isFinite(n))
  )
}

function toFirestoreTimestamp(t: ReadingTimestampInput): Timestamp {
  if (t instanceof Timestamp) return t
  if (typeof t === "number") return Timestamp.fromMillis(t)
  if (t instanceof Date) return Timestamp.fromDate(t)
  throw new Error("timestamp must be a Date, Unix ms number, or Timestamp")
}

function assertValidReadingWriteInput(data: ReadingWriteInput): void {
  if (!data.animalId?.trim()) throw new Error("animalId is required")
  if (!data.farmId?.trim()) throw new Error("farmId is required")
  if (!isReadingCategory(data.category)) {
    throw new Error(
      `category must be one of: ${READING_CATEGORIES.join(", ")}`,
    )
  }
  if (!isVec3(data.gyroscope)) {
    throw new Error("gyroscope must be a tuple of three finite numbers [x, y, z]")
  }
  if (!isVec3(data.accelerometer)) {
    throw new Error(
      "accelerometer must be a tuple of three finite numbers [x, y, z]",
    )
  }
  toFirestoreTimestamp(data.timestamp)
}

function readingPayload(data: ReadingWriteInput): Record<string, unknown> {
  return {
    animalId: data.animalId,
    farmId: data.farmId,
    timestamp: toFirestoreTimestamp(data.timestamp),
    category: data.category,
    gyroscope: [data.gyroscope[0], data.gyroscope[1], data.gyroscope[2]],
    accelerometer: [
      data.accelerometer[0],
      data.accelerometer[1],
      data.accelerometer[2],
    ],
  }
}

function readingFromDoc(
  id: string,
  data: Record<string, unknown>,
): Reading | null {
  const ts = data.timestamp
  if (!(ts instanceof Timestamp)) return null
  if (!isReadingCategory(data.category)) return null
  if (!isVec3(data.gyroscope) || !isVec3(data.accelerometer)) return null

  return {
    readingId: id,
    animalId: String(data.animalId ?? ""),
    farmId: String(data.farmId ?? ""),
    timestamp: ts,
    category: data.category,
    gyroscope: [data.gyroscope[0], data.gyroscope[1], data.gyroscope[2]],
    accelerometer: [
      data.accelerometer[0],
      data.accelerometer[1],
      data.accelerometer[2],
    ],
  }
}

async function assertAnimalOnFarm(
  animalId: string,
  farmId: string,
): Promise<void> {
  const animal = await getAnimalById(animalId)
  if (!animal) throw new Error("Animal not found")
  if (animal.farmId !== farmId) {
    throw new Error("animalId does not belong to the given farmId")
  }
}

/**
 * Persists one reading as its own document (no array aggregation).
 * Verifies farm access and that the animal belongs to `farmId`.
 */
export async function addReading(data: ReadingWriteInput): Promise<string> {
  await assertReadingServiceRole()
  assertValidReadingWriteInput(data)
  await assertAnimalOnFarm(data.animalId, data.farmId)

  const ref = doc(collection(db, READINGS))
  await setDoc(ref, readingPayload(data))
  return ref.id
}

/**
 * Batch-writes up to 500 operations per commit (Firestore limit).
 * Validates shape once, resolves unique animals/farms in parallel, then commits chunks.
 */
export async function addBatchReadings(
  readingsArray: ReadingWriteInput[],
): Promise<string[]> {
  if (readingsArray.length === 0) return []

  await assertReadingServiceRole()
  for (const r of readingsArray) assertValidReadingWriteInput(r)

  const uniqueAnimalIds = [...new Set(readingsArray.map((r) => r.animalId))]

  const animalById = new Map(
    await Promise.all(
      uniqueAnimalIds.map(async (id) => {
        const animal = await getAnimalById(id)
        return [id, animal] as const
      }),
    ),
  )

  for (const id of uniqueAnimalIds) {
    if (!animalById.get(id)) throw new Error(`Animal not found: ${id}`)
  }

  for (const r of readingsArray) {
    const a = animalById.get(r.animalId)!
    if (a.farmId !== r.farmId) {
      throw new Error(
        `animalId ${r.animalId} does not belong to farmId ${r.farmId}`,
      )
    }
  }

  const ids: string[] = []

  for (let i = 0; i < readingsArray.length; i += BATCH_LIMIT) {
    const chunk = readingsArray.slice(i, i + BATCH_LIMIT)
    const batch = writeBatch(db)
    const chunkIds: string[] = []

    for (const r of chunk) {
      const ref = doc(collection(db, READINGS))
      chunkIds.push(ref.id)
      batch.set(ref, readingPayload(r))
    }

    await batch.commit()
    ids.push(...chunkIds)
  }

  return ids
}

/**
 * All readings for an animal, oldest first. Farm access via `getAnimalById`.
 */
export async function getReadingsByAnimal(
  animalId: string,
): Promise<Reading[]> {
  await assertReadingServiceRole()
  const animal = await getAnimalById(animalId)
  if (!animal) throw new Error("Animal not found")

  const q = query(
    collection(db, READINGS),
    where("animalId", "==", animalId),
    orderBy("timestamp", "asc"),
  )
  const snap = await getDocs(q)
  return snap.docs
    .map((d: QueryDocumentSnapshot) =>
      readingFromDoc(d.id, d.data() as Record<string, unknown>),
    )
    .filter((r): r is Reading => r !== null)
}

/**
 * All readings for a farm, oldest first.
 */
export async function getReadingsByFarm(farmId: string): Promise<Reading[]> {
  await assertReadingServiceRole()
  const farm = await getFarmById(farmId)
  if (!farm) throw new Error("Farm not found")

  const q = query(
    collection(db, READINGS),
    where("farmId", "==", farmId),
    orderBy("timestamp", "asc"),
  )
  const snap = await getDocs(q)
  return snap.docs
    .map((d: QueryDocumentSnapshot) =>
      readingFromDoc(d.id, d.data() as Record<string, unknown>),
    )
    .filter((r): r is Reading => r !== null)
}

/**
 * Readings for one animal within [start, end] inclusive, oldest first.
 */
export async function getReadingsByTimeRange(
  animalId: string,
  start: ReadingTimestampInput,
  end: ReadingTimestampInput,
): Promise<Reading[]> {
  await assertReadingServiceRole()
  const animal = await getAnimalById(animalId)
  if (!animal) throw new Error("Animal not found")

  const startTs = toFirestoreTimestamp(start)
  const endTs = toFirestoreTimestamp(end)
  if (startTs.toMillis() > endTs.toMillis()) {
    throw new Error("start must be before or equal to end")
  }

  const q = query(
    collection(db, READINGS),
    where("animalId", "==", animalId),
    where("timestamp", ">=", startTs),
    where("timestamp", "<=", endTs),
    orderBy("timestamp", "asc"),
  )
  const snap = await getDocs(q)
  return snap.docs
    .map((d: QueryDocumentSnapshot) =>
      readingFromDoc(d.id, d.data() as Record<string, unknown>),
    )
    .filter((r): r is Reading => r !== null)
}
