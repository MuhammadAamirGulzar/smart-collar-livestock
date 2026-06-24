import { NextResponse } from "next/server"
import { seedUsers } from "@/lib/seedUsers"

export async function POST() {
  try {
    const { ownerId, managerId } = await seedUsers()
    return NextResponse.json({ success: true, ownerId, managerId })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }
}
