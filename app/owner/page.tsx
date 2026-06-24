"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { OwnerDashboard } from "@/components/dashboards/owner-dashboard"
import { getHomePathForSession } from "@/lib/roleRoutes"

function OwnerGate() {
  const { user, firebaseSignedIn, authHydrated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authHydrated || !user) return
    if (user.role !== "owner") {
      router.replace(getHomePathForSession(user, firebaseSignedIn))
    }
  }, [user, firebaseSignedIn, authHydrated, router])

  if (!authHydrated || !user || user.role !== "owner") return null
  return <OwnerDashboard />
}

export default function OwnerHomePage() {
  return (
    <ProtectedRoute>
      <OwnerGate />
    </ProtectedRoute>
  )
}
