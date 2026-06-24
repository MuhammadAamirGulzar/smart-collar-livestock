"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { ManagerDashboard } from "@/components/dashboards/manager-dashboard"
import { getHomePathForSession } from "@/lib/roleRoutes"

function ManagerGate() {
  const { user, firebaseSignedIn, authHydrated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authHydrated || !user) return
    if (user.role !== "executive-manager") {
      router.replace(getHomePathForSession(user, firebaseSignedIn))
    }
  }, [user, firebaseSignedIn, authHydrated, router])

  if (!authHydrated || !user || user.role !== "executive-manager") return null
  return <ManagerDashboard />
}

export default function ManagerHomePage() {
  return (
    <ProtectedRoute>
      <ManagerGate />
    </ProtectedRoute>
  )
}
