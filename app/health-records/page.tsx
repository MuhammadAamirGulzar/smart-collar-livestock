"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/lib/auth-context"

export default function HealthRecordsPage() {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user) {
      // Redirect based on user role
      if (user.role === "owner") {
        router.replace("/health-records-owner")
      } else if (user.role === "executive-manager") {
        router.replace("/health-records-manager")
      }
    }
  }, [user, router])

  return (
    <ProtectedRoute allowedRoles={["owner", "executive-manager"]}>
      <div className="h-screen"></div>
    </ProtectedRoute>
  )
}



