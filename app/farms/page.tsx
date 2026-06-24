"use client"

import { useEffect, useState } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { Topbar } from "@/components/layout/topbar"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/lib/auth-context"
import { FarmsManagementTable } from "@/components/tables/farms-management-table"
import { OwnerFarmsManagementTable } from "@/components/tables/owner-farms-management-table"
import { AddFarmModal } from "@/components/modals/add-farm-modal"
import { AddFarmModalOwner } from "@/components/modals/add-farm-modal-owner"
import { UpdateFarmModal } from "@/components/modals/update-farm-modal"
import { UpdateFarmModalOwner } from "@/components/modals/update-farm-modal-owner"
import { Button } from "@/components/ui/button"
import type { Farm, User } from "@/lib/types"
import { getAllFarms, getFarmsByOwner, createFarm, deleteFarm } from "@/lib/farmService"
import { getAnimalsByFarm } from "@/lib/animalService"
import {
  getPrimaryAssignedFarmId,
  listAllUserProfiles,
} from "@/lib/userService"
import {
  serviceFarmToUi,
  userProfileToUiUser,
} from "@/lib/firebaseDataMappers"

export default function FarmsPage() {
  const { user, firebaseSignedIn } = useAuth()
  const [showAddModal, setShowAddModal] = useState(false)
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null)

  const [allFarms, setAllFarms] = useState<Farm[]>([])
  const [directoryUsers, setDirectoryUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [reloadKey, setReloadKey] = useState(0)
  const [pageError, setPageError] = useState("")

  const isSuperAdmin = user?.role === "superadmin"

  const reload = () => setReloadKey((k) => k + 1)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!firebaseSignedIn || !user) {
        if (!cancelled) setLoading(false)
        return
      }
      setLoading(true)
      try {
        if (user.role === "superadmin") {
          const svcFarms = await getAllFarms()
          const animalGroups = await Promise.all(
            svcFarms.map((f) =>
              getAnimalsByFarm(f.farmId).catch(() => []),
            ),
          )
          const uiFarms = svcFarms.map((f, i) => {
            const animals = animalGroups[i] || []
            const totalCows = animals.length
            const totalActiveCollars = animals.filter((a) => a.collarId).length
            return serviceFarmToUi(f, { totalCows, totalActiveCollars })
          })
          const profiles = await listAllUserProfiles()
          const uiUsers = await Promise.all(
            profiles.map(async (p) => {
              const farmId =
                p.role === "farm_owner" || p.role === "executive_manager"
                  ? await getPrimaryAssignedFarmId(p.uid, p.role)
                  : undefined
              return userProfileToUiUser(p, farmId ? { farmId } : undefined)
            }),
          )
          if (!cancelled) {
            setAllFarms(uiFarms)
            setDirectoryUsers(uiUsers)
          }
        } else if (user.role === "owner") {
          const svc = await getFarmsByOwner(user.id)
          const animalGroups = await Promise.all(
            svc.map((f) =>
              getAnimalsByFarm(f.farmId).catch(() => []),
            ),
          )
          const uiFarms = svc.map((f, i) => {
            const animals = animalGroups[i] || []
            const totalCows = animals.length
            const totalActiveCollars = animals.filter((a) => a.collarId).length
            return serviceFarmToUi(f, { totalCows, totalActiveCollars })
          })
          if (!cancelled) {
            setAllFarms(uiFarms)
          }
        }
      } catch {
        if (!cancelled) {
          setAllFarms([])
          setDirectoryUsers([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [firebaseSignedIn, user, reloadKey])

  const userFarms = isSuperAdmin
    ? allFarms
    : allFarms.filter((f) => f.ownerId === user?.id)

  const owners = directoryUsers.filter((u) => u.role === "owner")

  const handleAddFarm = async (newFarmData: { name?: string; farmName?: string; location?: string; ownerId?: string }) => {
    const farmName = newFarmData.farmName || newFarmData.name || "Unnamed Farm"
    const location = newFarmData.location || "Unknown Location"

    if (firebaseSignedIn) {
      try {
        setPageError("")
        const ownerId = newFarmData.ownerId || user?.id || ""
        await createFarm(ownerId, { name: farmName, location })
        reload()
      } catch (err) {
        setPageError(err instanceof Error ? err.message : "Failed to create farm")
      }
    } else {
      const newFarm: Farm = {
        id: Math.random().toString(36).substr(2, 9),
        name: farmName,
        location,
        size: 0,
        createdAt: new Date().toISOString(),
        ownerId: newFarmData.ownerId || user?.id,
      }
      setAllFarms([newFarm, ...allFarms])
    }
    setShowAddModal(false)
  }

  const handleUpdate = (farm: Farm) => {
    setSelectedFarm(farm)
    setShowUpdateModal(true)
  }

  const handleDelete = async (farmId: string) => {
    if (firebaseSignedIn) {
      try {
        setPageError("")
        await deleteFarm(farmId)
        reload()
      } catch (err) {
        setPageError(err instanceof Error ? err.message : "Failed to delete farm")
      }
    } else {
      setAllFarms(allFarms.filter((f) => f.id !== farmId))
    }
  }

  return (
    <ProtectedRoute allowedRoles={["owner", "superadmin"]}>
      <AppLayout>
        <Topbar
          title="Farms"
          subtitle={isSuperAdmin ? "Manage all farms" : "Manage your farms"}
          action={
            <Button onClick={() => setShowAddModal(true)}>Add New Farm</Button>
          }
        />

        <div className="flex-1 overflow-y-auto p-8">
          {pageError && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {pageError}
            </div>
          )}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
            </div>
          ) : isSuperAdmin ? (
            <FarmsManagementTable
              farms={userFarms}
              users={directoryUsers}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ) : (
            <OwnerFarmsManagementTable
              farms={userFarms}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          )}
        </div>
      </AppLayout>

      {/* Modals */}
      {isSuperAdmin ? (
        <>
          <AddFarmModal
            open={showAddModal}
            onClose={() => setShowAddModal(false)}
            owners={owners}
            onAddFarm={handleAddFarm} // Connected
          />

          <UpdateFarmModal
            open={showUpdateModal}
            onClose={() => {
              setShowUpdateModal(false)
              setSelectedFarm(null)
            }}
            farm={selectedFarm}
            owners={owners}
            onFarmUpdated={reload}
          />
        </>
      ) : (
        <>
          <AddFarmModalOwner
            open={showAddModal}
            onClose={() => setShowAddModal(false)}
            ownerId={user?.id || ""}
            onAddFarm={handleAddFarm} // Connected
          />

          <UpdateFarmModalOwner
            open={showUpdateModal}
            onClose={() => {
              setShowUpdateModal(false)
              setSelectedFarm(null)
            }}
            farm={selectedFarm}
            onFarmUpdated={reload}
          />
        </>
      )}
    </ProtectedRoute>
  )
}