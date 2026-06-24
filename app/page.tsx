"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { getHomePathForSession } from "@/lib/roleRoutes"

export default function HomePage() {
  const router = useRouter()
  const { user, authHydrated, firebaseSignedIn } = useAuth()

  useEffect(() => {
    if (!authHydrated) return
    if (user) {
      router.push(getHomePathForSession(user, firebaseSignedIn))
    } else {
      router.push("/login")
    }
  }, [user, router, authHydrated, firebaseSignedIn])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}




