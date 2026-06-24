import { NextResponse } from "next/server"
import admin from "firebase-admin"
import { readFileSync, existsSync } from "fs"
import { join } from "path"

function getAdminApp() {
  if (admin.apps.length > 0) return admin.apps[0]!

  const keyPath = join(process.cwd(), "serviceAccountKey.json")
  if (!existsSync(keyPath)) {
    throw new Error(
      "serviceAccountKey.json not found in project root. " +
        "Download it from Firebase Console → Project Settings → Service Accounts → Generate New Private Key.",
    )
  }

  const serviceAccount = JSON.parse(readFileSync(keyPath, "utf-8"))
  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  })
}

const OWNER_EMAIL = "owner@farm.com"
const MANAGER_EMAIL = "manager@farm.com"

const FARMS_SEED = [
  {
    name: "Al-Baraka Dairy Farm",
    location: "Lahore, Punjab",
  },
  {
    name: "Madina Livestock Farm",
    location: "Karachi, Sindh",
  },
]

const ANIMALS_SEED = [
  // Farm 0 animals
  { farmIndex: 0, name: "Gulabi", species: "Sahiwal", estrusCycle: "true" },
  { farmIndex: 0, name: "Hira", species: "Holstein Friesian", estrusCycle: "false" },
  { farmIndex: 0, name: "Chandni", species: "Cholistani", estrusCycle: "false" },
  { farmIndex: 0, name: "Rani", species: "Sahiwal", estrusCycle: "true" },
  // Farm 1 animals
  { farmIndex: 1, name: "Sona", species: "Cholistani", estrusCycle: "false" },
  { farmIndex: 1, name: "Moti", species: "Red Sindhi", estrusCycle: "false" },
  { farmIndex: 1, name: "Neela", species: "Red Sindhi", estrusCycle: "true" },
]

const READING_CATEGORIES = ["rumination", "eating", "walking", "grazing", "mounting"] as const

function randomVec3(base: number, spread: number): [number, number, number] {
  const r = () => +(base + (Math.random() - 0.5) * spread).toFixed(3)
  return [r(), r(), r()]
}

function generateReadings(
  animalId: string,
  farmId: string,
  count: number,
): Array<{
  animalId: string
  farmId: string
  timestamp: admin.firestore.Timestamp
  category: string
  gyroscope: [number, number, number]
  accelerometer: [number, number, number]
}> {
  const now = Date.now()
  const readings = []
  for (let i = 0; i < count; i++) {
    const ts = now - (count - i) * 60_000 * 15
    readings.push({
      animalId,
      farmId,
      timestamp: admin.firestore.Timestamp.fromMillis(ts),
      category: READING_CATEGORIES[Math.floor(Math.random() * READING_CATEGORIES.length)],
      gyroscope: randomVec3(0.5, 2),
      accelerometer: randomVec3(9.8, 3),
    })
  }
  return readings
}

export async function POST() {
  const logs: string[] = []

  try {
    const app = getAdminApp()
    const db = app.firestore()
    const authAdmin = app.auth()

    // Resolve UIDs
    let ownerUid: string
    let managerUid: string
    try {
      ownerUid = (await authAdmin.getUserByEmail(OWNER_EMAIL)).uid
      managerUid = (await authAdmin.getUserByEmail(MANAGER_EMAIL)).uid
      logs.push(`Owner UID: ${ownerUid}`)
      logs.push(`Manager UID: ${managerUid}`)
    } catch {
      logs.push("ERROR: Could not find owner or manager in Firebase Auth.")
      return NextResponse.json({ success: false, logs }, { status: 500 })
    }

    // Check if farms already exist for this owner
    const existingFarms = await db
      .collection("farms")
      .where("ownerId", "==", ownerUid)
      .get()
    if (!existingFarms.empty) {
      logs.push(
        `Owner already has ${existingFarms.size} farm(s). Skipping farm creation to avoid duplicates.`,
      )
      logs.push("If you want to re-seed, delete existing farms first.")
      return NextResponse.json({ success: true, logs })
    }

    // --- Create Farms ---
    const farmIds: string[] = []
    for (const farmSeed of FARMS_SEED) {
      const farmRef = db.collection("farms").doc()
      const farmId = farmRef.id
      farmIds.push(farmId)

      await farmRef.set({
        farmId,
        name: farmSeed.name,
        location: farmSeed.location,
        ownerId: ownerUid,
        employees: [managerUid],
      })
      logs.push(`Created farm "${farmSeed.name}" (${farmId})`)
    }

    // --- Update farm_owners.assignedFarms (keyed by Firebase UID) ---
    await db
      .collection("farm_owners")
      .doc(ownerUid)
      .update({
        assignedFarms: admin.firestore.FieldValue.arrayUnion(...farmIds),
      })
    logs.push(`Updated farm_owners/${ownerUid} assignedFarms: [${farmIds.join(", ")}]`)

    // --- Update executive_managers.assignedFarms ---
    await db
      .collection("executive_managers")
      .doc(managerUid)
      .update({
        assignedFarms: admin.firestore.FieldValue.arrayUnion(...farmIds),
      })
    logs.push(`Updated executive_managers/${managerUid} assignedFarms: [${farmIds.join(", ")}]`)

    // --- Create Animals ---
    const animalIds: Array<{ animalId: string; farmId: string; name: string }> = []

    for (const animalSeed of ANIMALS_SEED) {
      const farmId = farmIds[animalSeed.farmIndex]
      const animalRef = db.collection("animals").doc()
      const animalId = animalRef.id

      await animalRef.set({
        animalId,
        name: animalSeed.name,
        species: animalSeed.species,
        farmId,
        estrusCycle: animalSeed.estrusCycle,
      })
      animalIds.push({ animalId, farmId, name: animalSeed.name })
      logs.push(`  Created animal "${animalSeed.name}" on farm ${animalSeed.farmIndex + 1}`)
    }

    // --- Create Sample Readings (10 per animal) ---
    logs.push("\nCreating sample sensor readings...")
    let totalReadings = 0

    for (const animal of animalIds) {
      const readings = generateReadings(animal.animalId, animal.farmId, 10)
      const batch = db.batch()
      for (const r of readings) {
        const ref = db.collection("readings").doc()
        batch.set(ref, r)
      }
      await batch.commit()
      totalReadings += readings.length
    }
    logs.push(`Created ${totalReadings} readings across ${animalIds.length} animals.`)

    logs.push("\nAll done! Farms, animals, and readings are ready in Firestore.")
    logs.push("Log in as any user to see the data on the dashboard.")
    return NextResponse.json({ success: true, logs })
  } catch (err) {
    logs.push(`\nFATAL: ${err instanceof Error ? err.message : String(err)}`)
    return NextResponse.json({ success: false, logs }, { status: 500 })
  }
}
