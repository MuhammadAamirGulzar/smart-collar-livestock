"use client"

import type React from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: string[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, authHydrated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authHydrated) return

    if (!user) {
      router.push("/login")
      return
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      router.push("/unauthorized")
    }
  }, [user, router, allowedRoles, authHydrated])

  if (!authHydrated) return null

  if (!user) return null

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return null
  }

  return <>{children}</>
}
