"use client"

import { useEffect, useState } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { Topbar } from "@/components/layout/topbar"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/lib/auth-context"
import { GlassmorphicCard } from "@/components/ui/glassmorphic-card"
import { AnimalsTable } from "@/components/tables/animals-table"
import { StatCard } from "@/components/ui/stat-card"
import { UpdateFarmModalOwner } from "@/components/modals/update-farm-modal-owner"
import { mockFarms, mockAnimals } from "@/lib/mock-data"
import { Button } from "@/components/ui/button"
import { getFarmById } from "@/lib/farmService"
import { getAnimalsByFarm } from "@/lib/animalService"
import { serviceFarmToUi, serviceAnimalToUi } from "@/lib/firebaseDataMappers"
import type { Animal, Farm } from "@/lib/types"

export default function FarmDetailPage() {
  const { user, firebaseSignedIn } = useAuth()
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const reload = () => setReloadKey((k) => k + 1)

  const [farm, setFarm] = useState<Farm | undefined>(() =>
    mockFarms.find((f) => f.id === user?.farmId),
  )
  const [farmAnimals, setFarmAnimals] = useState<Animal[]>(() =>
    mockAnimals.filter((a) => a.farmId === user?.farmId),
  )

  useEffect(() => {
    let cancelled = false
    const farmId = user?.farmId
    async function load() {
      if (!firebaseSignedIn || !farmId) {
        if (!cancelled) {
          setFarm(mockFarms.find((f) => f.id === farmId))
          setFarmAnimals(mockAnimals.filter((a) => a.farmId === farmId))
        }
        return
      }
      try {
        const svcFarm = await getFarmById(farmId)
        if (!svcFarm) throw new Error("Farm not found")
        const svcAnimals = await getAnimalsByFarm(farmId)
        if (!cancelled) {
          setFarm(serviceFarmToUi(svcFarm, { totalCows: svcAnimals.length }))
          setFarmAnimals(svcAnimals.map(serviceAnimalToUi))
        }
      } catch {
        if (!cancelled) {
          setFarm(mockFarms.find((f) => f.id === farmId))
          setFarmAnimals(mockAnimals.filter((a) => a.farmId === farmId))
        }
      }
    }
    void load()
    return () => { cancelled = true }
  }, [firebaseSignedIn, user?.farmId, reloadKey])

  if (!farm) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">Farm not found</p>
          </div>
        </AppLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["owner", "superadmin"]}>
      <AppLayout>
        <Topbar
          title={farm.name}
          subtitle={farm.location}
          action={<Button onClick={() => setShowUpdateModal(true)}>Edit Farm</Button>}
        />

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GlassmorphicCard>
              <p className="text-sm text-muted-foreground mb-2">Location</p>
              <p className="text-2xl font-bold text-foreground">{farm.location}</p>
            </GlassmorphicCard>
            <GlassmorphicCard>
              <p className="text-sm text-muted-foreground mb-2">Farm Size</p>
              <p className="text-2xl font-bold text-foreground">{farm.size} acres</p>
            </GlassmorphicCard>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard label="Total Animals" value={farmAnimals.length} icon="🐄" />
            <StatCard label="Healthy" value={farmAnimals.filter((a) => a.status === "healthy").length} icon="✅" />
            <StatCard label="In Treatment" value={farmAnimals.filter((a) => a.status === "treated").length} icon="🏥" />
            <StatCard
              label="Quarantined"
              value={farmAnimals.filter((a) => a.status === "quarantined").length}
              icon="🚫"
            />
          </div>

          <AnimalsTable animals={farmAnimals} />
        </div>
      </AppLayout>

      <UpdateFarmModalOwner
        open={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        farm={farm}
        onFarmUpdated={reload}
      />
    </ProtectedRoute>
  )
}
