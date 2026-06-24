"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { SuperAdminDashboard } from "@/components/dashboards/superadmin-dashboard"
import { OwnerDashboard } from "@/components/dashboards/owner-dashboard"
import { ManagerDashboard } from "@/components/dashboards/manager-dashboard"
import { getHomePathForSession } from "@/lib/roleRoutes"

export default function DashboardPage() {
  const { user, firebaseSignedIn, authHydrated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authHydrated || !user) return
    if (firebaseSignedIn) {
      const dest = getHomePathForSession(user, true)
      if (dest !== "/dashboard") {
        router.replace(dest)
      }
    }
  }, [user, firebaseSignedIn, authHydrated, router])

  return (
    <ProtectedRoute>
      {user?.role === "superadmin" && <SuperAdminDashboard />}
      {user?.role === "owner" && <OwnerDashboard />}
      {user?.role === "executive-manager" && <ManagerDashboard />}
    </ProtectedRoute>
  )
}
