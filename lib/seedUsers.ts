import admin from "firebase-admin"
import { getAdminApp } from "./firebaseAdmin"

const SEED_OWNER_ID = "OWN-001"

const SEED_USERS = [
  {
    email: "owner@farm.com",
    password: "omer123",
    name: "Farm Owner",
    role: "farm_owner" as const,
    customOwnerId: SEED_OWNER_ID,
  },
  {
    email: "manager@farm.com",
    password: "tasmiah123",
    name: "Manager",
    role: "executive_manager" as const,
    customOwnerId: "",
  },
] as const

async function getOrCreateAuthUser(
  authAdmin: admin.auth.Auth,
  email: string,
  password: string,
  displayName: string,
): Promise<string> {
  try {
    const existing = await authAdmin.getUserByEmail(email)
    return existing.uid
  } catch {
    const created = await authAdmin.createUser({ email, password, displayName })
    return created.uid
  }
}

export async function seedUsers(): Promise<{ ownerId: string; managerId: string }> {
  const app = getAdminApp()
  const db = app.firestore()
  const authAdmin = app.auth()

  let ownerId = ""
  let managerId = ""

  for (const u of SEED_USERS) {
    const uid = await getOrCreateAuthUser(authAdmin, u.email, u.password, u.name)

    const userDocRef = db.collection("users").doc(uid)
    const snap = await userDocRef.get()

    if (!snap.exists) {
      const batch = db.batch()

      batch.set(userDocRef, {
        userId: uid,
        name: u.name,
        email: u.email,
        role: u.role,
        ownerId: u.customOwnerId,
        phone: "",
        cnic: "",
        contactNumber: "",
        address: "",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      })

      if (u.role === "farm_owner") {
        batch.set(db.collection("farm_owners").doc(uid), {
          userId: uid,
          ownerId: u.customOwnerId,
          name: u.name,
          phone: "",
          cnic: "",
          contactNumber: "",
          address: "",
          assignedFarms: [],
        })
      } else {
        batch.set(db.collection("executive_managers").doc(uid), {
          userId: uid,
          assignedFarms: [],
        })
      }

      await batch.commit()
    }

    if (u.role === "farm_owner") ownerId = uid
    if (u.role === "executive_manager") managerId = uid
  }

  return { ownerId, managerId }
}
