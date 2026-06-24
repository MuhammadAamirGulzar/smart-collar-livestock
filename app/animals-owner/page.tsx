"use client"

import { useEffect, useState } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { Topbar } from "@/components/layout/topbar"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/lib/auth-context"
import { AnimalsManagementTable } from "@/components/tables/animals-management-table"
import { AddAnimalModal } from "@/components/modals/add-animal-modal"
import { mockAnimals, mockFarms } from "@/lib/mock-data"
import { Button } from "@/components/ui/button"
import type { Animal } from "@/lib/types"
import { getFarmsByOwner, type Farm as ServiceFarm } from "@/lib/farmService"
import { getAnimalsByFarm, deleteAnimal } from "@/lib/animalService"
import { serviceAnimalToUi } from "@/lib/firebaseDataMappers"

export default function AnimalsOwnerPage() {
  const { user, firebaseSignedIn } = useAuth()
  const [showAddModal, setShowAddModal] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [pageError, setPageError] = useState("")
  const reload = () => setReloadKey((k) => k + 1)

  const [ownerFarms, setOwnerFarms] = useState<ServiceFarm[]>([])
  const [ownerAnimals, setOwnerAnimals] = useState<Animal[]>(() => {
    const ownerFarmIds = mockFarms
      .filter((f) => f.ownerId === user?.id)
      .map((f) => f.id)
    return mockAnimals.filter((a) => ownerFarmIds.includes(a.farmId))
  })

  useEffect(() => {
    const ownerFarmIds = mockFarms
      .filter((f) => f.ownerId === user?.id)
      .map((f) => f.id)
    setOwnerAnimals(mockAnimals.filter((a) => ownerFarmIds.includes(a.farmId)))
  }, [user?.id])

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!firebaseSignedIn || user?.role !== "owner" || !user?.id) {
        if (!cancelled) {
          const ownerFarmIds = mockFarms
            .filter((f) => f.ownerId === user?.id)
            .map((f) => f.id)
          setOwnerAnimals(mockAnimals.filter((a) => ownerFarmIds.includes(a.farmId)))
        }
        return
      }
      try {
        const svcFarms = await getFarmsByOwner(user.id)
        if (!cancelled) setOwnerFarms(svcFarms)
        const groups = await Promise.all(
          svcFarms.map((f) => getAnimalsByFarm(f.farmId)),
        )
        const ui = groups.flat().map(serviceAnimalToUi)
        if (!cancelled) setOwnerAnimals(ui)
      } catch {
        if (!cancelled) {
          const ownerFarmIds = mockFarms
            .filter((f) => f.ownerId === user?.id)
            .map((f) => f.id)
          setOwnerAnimals(mockAnimals.filter((a) => ownerFarmIds.includes(a.farmId)))
        }
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [firebaseSignedIn, user?.id, user?.role, reloadKey])

  const handleDelete = async (animalId: string) => {
    if (firebaseSignedIn) {
      try {
        setPageError("")
        await deleteAnimal(animalId)
        reload()
      } catch (err) {
        setPageError(err instanceof Error ? err.message : "Failed to delete animal")
      }
    } else {
      setOwnerAnimals((prev) => prev.filter((a) => a.id !== animalId))
    }
  }

  return (
    <ProtectedRoute allowedRoles={["owner"]}>
      <AppLayout>
        <Topbar
          title="Animals"
          subtitle="Manage your animals"
          action={
            <Button onClick={() => setShowAddModal(true)}>Add New Animal</Button>
          }
        />

        <div className="flex-1 overflow-y-auto p-8">
          {pageError && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {pageError}
            </div>
          )}
          <AnimalsManagementTable
            animals={ownerAnimals}
            onDelete={handleDelete}
          />
        </div>
      </AppLayout>

      <AddAnimalModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        farms={ownerFarms.map((f) => ({ id: f.farmId, name: f.name }))}
        farmId={user?.farmId || ""}
        onAnimalAdded={reload}
      />
    </ProtectedRoute>
  )
}

