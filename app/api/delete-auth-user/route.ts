import { NextResponse } from "next/server"
import admin from "firebase-admin"
import { readFileSync, existsSync } from "fs"
import { join } from "path"

function getAdminApp() {
  if (admin.apps.length > 0) return admin.apps[0]!

  const keyPath = join(process.cwd(), "serviceAccountKey.json")
  if (!existsSync(keyPath)) {
    throw new Error("serviceAccountKey.json not found in project root.")
  }

  const serviceAccount = JSON.parse(readFileSync(keyPath, "utf-8"))
  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  })
}

/**
 * Deletes a Firebase Auth user by UID.
 * Caller must provide a valid Firebase ID token from a super_admin user.
 */
export async function POST(request: Request) {
  try {
    const app = getAdminApp()
    const authAdmin = app.auth()
    const db = app.firestore()

    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing authorization token" }, { status: 401 })
    }
    const idToken = authHeader.slice(7)
    const decoded = await authAdmin.verifyIdToken(idToken)

    const callerSnap = await db.collection("users").doc(decoded.uid).get()
    if (!callerSnap.exists || callerSnap.data()?.role !== "super_admin") {
      return NextResponse.json({ error: "Only super_admin can delete auth users" }, { status: 403 })
    }

    const body = await request.json()
    const uid = body?.uid
    if (!uid || typeof uid !== "string") {
      return NextResponse.json({ error: "Missing or invalid uid" }, { status: 400 })
    }

    if (uid === decoded.uid) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 })
    }

    await authAdmin.deleteUser(uid)

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (message.includes("no user record")) {
      return NextResponse.json({ success: true, note: "Auth user already deleted" })
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
