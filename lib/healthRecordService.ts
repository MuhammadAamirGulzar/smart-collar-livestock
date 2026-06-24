import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  type QueryDocumentSnapshot,
} from "firebase/firestore"
import { auth, db } from "@/firebase/config"
import { getUserRole, type FirestoreUserRole } from "./userService"

export interface HealthRecord {
  recordId: string
  farmId: string
  collarId: string
  notes: string
  treatment: string
  veterinarian: string
  date: string
}

const HEALTH_RECORDS = "health_records"

const ALLOWED_ROLES: FirestoreUserRole[] = [
  "super_admin",
  "farm_owner",
  "executive_manager",
]

function requireAuthUid(): string {
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error("Not authenticated")
  return uid
}

async function assertAllowedRole(): Promise<void> {
  const uid = requireAuthUid()
  const role = await getUserRole(uid)
  if (!role || !ALLOWED_ROLES.includes(role)) {
    throw new Error("Not authorised to manage health records")
  }
}

function recordFromDoc(id: string, data: Record<string, unknown>): HealthRecord {
  return {
    recordId: id,
    farmId: String(data.farmId ?? ""),
    collarId: String(data.collarId ?? ""),
    notes: String(data.notes ?? ""),
    treatment: String(data.treatment ?? ""),
    veterinarian: String(data.veterinarian ?? ""),
    date: String(data.date ?? ""),
  }
}

export type HealthRecordCreateInput = Omit<HealthRecord, "recordId">

export async function addHealthRecord(input: HealthRecordCreateInput): Promise<string> {
  await assertAllowedRole()
  const ref = doc(collection(db, HEALTH_RECORDS))
  await setDoc(ref, { ...input })
  return ref.id
}

export async function getHealthRecordsByFarm(farmId: string): Promise<HealthRecord[]> {
  await assertAllowedRole()
  const q = query(collection(db, HEALTH_RECORDS), where("farmId", "==", farmId))
  const snap = await getDocs(q)
  return snap.docs.map((d: QueryDocumentSnapshot) =>
    recordFromDoc(d.id, d.data() as Record<string, unknown>),
  )
}

export async function updateHealthRecord(
  recordId: string,
  data: Partial<Omit<HealthRecord, "recordId">>,
): Promise<void> {
  await assertAllowedRole()
  const payload: Record<string, unknown> = {}
  if (data.collarId !== undefined) payload.collarId = data.collarId
  if (data.notes !== undefined) payload.notes = data.notes
  if (data.treatment !== undefined) payload.treatment = data.treatment
  if (data.veterinarian !== undefined) payload.veterinarian = data.veterinarian
  if (data.date !== undefined) payload.date = data.date
  if (Object.keys(payload).length === 0) return
  await updateDoc(doc(db, HEALTH_RECORDS, recordId), payload)
}

export async function deleteHealthRecord(recordId: string): Promise<void> {
  await assertAllowedRole()
  await deleteDoc(doc(db, HEALTH_RECORDS, recordId))
}
