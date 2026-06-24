"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { SuperAdminDashboard } from "@/components/dashboards/superadmin-dashboard"
import { getHomePathForSession } from "@/lib/roleRoutes"

function AdminGate() {
  const { user, firebaseSignedIn, authHydrated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authHydrated || !user) return
    if (user.role !== "superadmin") {
      router.replace(getHomePathForSession(user, firebaseSignedIn))
    }
  }, [user, firebaseSignedIn, authHydrated, router])

  if (!authHydrated || !user || user.role !== "superadmin") return null
  return <SuperAdminDashboard />
}

export default function AdminHomePage() {
  return (
    <ProtectedRoute>
      <AdminGate />
    </ProtectedRoute>
  )
}
