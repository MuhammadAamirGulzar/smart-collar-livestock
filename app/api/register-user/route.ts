import { NextRequest, NextResponse } from "next/server"
import admin from "firebase-admin"
import { getAdminApp } from "@/lib/firebaseAdmin"

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, role, phone, cnic, contactNumber, address, ownerId } = await req.json()

    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { error: "email, password, name, and role are required" },
        { status: 400 },
      )
    }

    if (role !== "farm_owner" && role !== "executive_manager") {
      return NextResponse.json(
        { error: "role must be farm_owner or executive_manager" },
        { status: 400 },
      )
    }

    const app = getAdminApp()
    const authAdmin = app.auth()
    const db = app.firestore()

    const userRecord = await authAdmin.createUser({
      email,
      password,
      displayName: name,
    })
    const uid = userRecord.uid

    const batch = db.batch()

    batch.set(db.collection("users").doc(uid), {
      userId: uid,
      name,
      email,
      role,
      phone: phone || "",
      cnic: cnic || "",
      contactNumber: contactNumber || "",
      address: address || "",
      ownerId: ownerId || "",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    if (role === "farm_owner") {
      batch.set(db.collection("farm_owners").doc(uid), {
        userId: uid,
        ownerId: ownerId || "",
        name,
        phone: phone || "",
        cnic: cnic || "",
        contactNumber: contactNumber || "",
        address: address || "",
        assignedFarms: [],
      })
    } else {
      batch.set(db.collection("executive_managers").doc(uid), {
        userId: uid,
        name,
        phone: phone || "",
        cnic: cnic || "",
        contactNumber: contactNumber || "",
        address: address || "",
        assignedFarms: [],
      })
    }

    await batch.commit()

    return NextResponse.json({ success: true, uid })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)

    if (message.includes("email-already-exists")) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 },
      )
    }

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
