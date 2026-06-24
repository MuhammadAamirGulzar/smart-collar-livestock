"use client"

import { useEffect, useRef, useState } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { Topbar } from "@/components/layout/topbar"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/lib/auth-context"
import { AnimalsManagementTable } from "@/components/tables/animals-management-table"
import { AddAnimalModal } from "@/components/modals/add-animal-modal"
import { mockAnimals } from "@/lib/mock-data"
import { Button } from "@/components/ui/button"
import type { Animal } from "@/lib/types"
import { getAnimalsByFarm, deleteAnimal } from "@/lib/animalService"
import { getReadingsByFarm } from "@/lib/readingService"
import type { Reading } from "@/lib/readingService"
import { serviceAnimalToUi } from "@/lib/firebaseDataMappers"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  LayoutList, Activity, Footprints, BedDouble,
  Utensils, Heart, Leaf, BrainCircuit,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { predictActivity } from "@/lib/activityPredictor"

// Import ALL Analytics Components
import { RestingBehaviorView } from "@/components/analytics/resting-behavior-view"
import { WalkingBehaviorView } from "@/components/analytics/walking-behavior-view"
import { EatingBehaviorView } from "@/components/analytics/eating-behavior-view"
import { MountingBehaviorView } from "@/components/analytics/mounting-behavior-view"
import { RuminationBehaviorView } from "@/components/analytics/rumination-behavior-view"
import { BehaviorPredictionForm } from "@/components/analytics/behavior-prediction-form"

// Collar index map for Supabase offset
const COLLARS = ["COL-001", "COL-002", "COL-003", "COL-004", "COL-005"]

// Fetch latest 10 sensor rows for a collar (by offset)
async function fetchSensorRows(collarIndex: number) {
  const offset = collarIndex * 30
  const { data, error } = await supabase
    .from("sensor_data")
    .select("accel_x, accel_y, accel_z, gyro_x, gyro_y, gyro_z")
    .eq("device_id", "migrated_device")
    .order("id", { ascending: false })
    .range(offset, offset + 9) // 10 rows
  if (error || !data) return []
  return data
}

export default function AnimalsManagerPage() {
  const { user, firebaseSignedIn } = useAuth()
  const [showAddModal, setShowAddModal] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [pageError, setPageError] = useState("")
  const reload = () => setReloadKey((k) => k + 1)

  const [behaviorType, setBehaviorType] = useState("resting")

  const [managerAnimals, setManagerAnimals] = useState<Animal[]>(() =>
    mockAnimals.filter((a) => a.farmId === user?.farmId)
  )
  const farmReadingsRef = useRef<Reading[]>([])

  // Activity predictions from Supabase sensor data
  const [activityMap, setActivityMap] = useState<Record<string, string>>({})

  useEffect(() => {
    setManagerAnimals(mockAnimals.filter((a) => a.farmId === user?.farmId))
  }, [user?.farmId])

  // ── Fetch activity predictions for all collars ──
  async function refreshActivities() {
    const newMap: Record<string, string> = {}
    await Promise.all(
      COLLARS.map(async (collarId, index) => {
        const rows = await fetchSensorRows(index)
        if (rows.length >= 10) {
          const prediction = predictActivity(rows)
          if (prediction) newMap[collarId] = prediction
        }
      })
    )
    setActivityMap(newMap)
  }

  // Auto-refresh activities every 30 seconds
  useEffect(() => {
    void refreshActivities()
    const interval = setInterval(() => {
      void refreshActivities()
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    let cancelled = false
    const farmId = user?.farmId
    async function load() {
      if (
        !firebaseSignedIn ||
        user?.role !== "executive-manager" ||
        !farmId
      ) {
        if (!cancelled) {
          farmReadingsRef.current = []
          setManagerAnimals(mockAnimals.filter((a) => a.farmId === farmId))
        }
        return
      }
      try {
        const svcAnimals = await getAnimalsByFarm(farmId)
        const uiAnimals = svcAnimals.map(serviceAnimalToUi)

        try {
          const resp = await fetch("/api/latest-activity", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ farmId }),
          })
          const data = (await resp.json().catch(() => null)) as
            | {
                results: Array<{
                  animalId: string
                  activityLevel?: "low" | "normal" | "high"
                  status: "healthy" | "sick" | "treated" | "quarantined"
                }>
              }
            | null

          if (!cancelled && data?.results) {
            const byAnimalId = new Map(data.results.map((r) => [r.animalId, r]))
            const merged = uiAnimals.map((a) => {
              const r =
                byAnimalId.get(a.id) ?? byAnimalId.get((a as any).animalId)
              return {
                ...a,
                ...(r?.activityLevel ? { activityLevel: r.activityLevel } : {}),
                ...(r?.status ? { status: r.status } : {}),
              }
            })
            if (!cancelled) setManagerAnimals(merged)
          } else {
            if (!cancelled) setManagerAnimals(uiAnimals)
          }
        } catch {
          if (!cancelled) setManagerAnimals(uiAnimals)
        }
      } catch {
        if (!cancelled) {
          farmReadingsRef.current = []
          setManagerAnimals(mockAnimals.filter((a) => a.farmId === farmId))
        }
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [firebaseSignedIn, user?.farmId, user?.role, reloadKey])

  // Merge activity predictions into animals list
  const animalsWithActivity = managerAnimals.map((animal) => {
    const activity = activityMap[animal.collarId ?? ""]
    if (!activity) return animal
    return {
      ...animal,
      activityLevel:
        activity === "walking"
          ? "high"
          : ("low" as "low" | "normal" | "high"),
    }
  })

  const handleDelete = async (animalId: string) => {
    if (firebaseSignedIn) {
      try {
        setPageError("")
        await deleteAnimal(animalId)
        reload()
      } catch (err) {
        setPageError(
          err instanceof Error ? err.message : "Failed to delete animal"
        )
      }
    } else {
      setManagerAnimals((prev) => prev.filter((a) => a.id !== animalId))
    }
  }

  return (
    <ProtectedRoute allowedRoles={["executive-manager"]}>
      <AppLayout>
        <Topbar
          title="Animals"
          subtitle="Manage your animals, view analytics, and predict behaviors"
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

          {/* Activity Level Legend */}
          <div className="mb-4 flex items-center gap-4 text-xs text-gray-500">
            <span className="font-semibold text-gray-700">🤖 ML Activity:</span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
              High = Walking
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
              Low = Resting
            </span>
            <span className="text-gray-400">• Auto-refreshes every 30s</span>
          </div>

          <Tabs defaultValue="list" className="w-full space-y-6">

            {/* MAIN TABS NAVIGATOR */}
            <div className="flex items-center justify-between">
              <TabsList className="grid w-[600px] grid-cols-3">
                <TabsTrigger value="list" className="flex items-center gap-2">
                  <LayoutList className="h-4 w-4" />
                  List View
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Behavior Analytics
                </TabsTrigger>
                <TabsTrigger value="prediction" className="flex items-center gap-2">
                  <BrainCircuit className="h-4 w-4" />
                  Prediction
                </TabsTrigger>
              </TabsList>
            </div>

            {/* TAB 1: LIST VIEW */}
            <TabsContent value="list" className="mt-0">
              <div className="rounded-md border bg-white shadow-sm">
                <AnimalsManagementTable
                  animals={animalsWithActivity}
                  onDelete={handleDelete}
                />
              </div>
            </TabsContent>

            {/* TAB 2: ANALYTICS VIEW */}
            <TabsContent value="analytics" className="mt-0 space-y-6">

              {/* BEHAVIOR TOGGLE BUTTONS */}
              <div className="flex flex-wrap items-center gap-2 p-1 bg-muted/30 w-fit rounded-lg border">
                <Button
                  variant={behaviorType === "resting" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setBehaviorType("resting")}
                  className="gap-2"
                >
                  <BedDouble className="h-4 w-4" />
                  Resting
                </Button>

                <Button
                  variant={behaviorType === "walking" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setBehaviorType("walking")}
                  className="gap-2"
                >
                  <Footprints className="h-4 w-4" />
                  Walking
                </Button>

                <Button
                  variant={behaviorType === "eating" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setBehaviorType("eating")}
                  className="gap-2"
                >
                  <Utensils className="h-4 w-4" />
                  Eating
                </Button>

                <Button
                  variant={behaviorType === "mounting" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setBehaviorType("mounting")}
                  className="gap-2"
                >
                  <Heart className="h-4 w-4" />
                  Mounting
                </Button>

                <Button
                  variant={behaviorType === "rumination" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setBehaviorType("rumination")}
                  className="gap-2"
                >
                  <Leaf className="h-4 w-4" />
                  Rumination
                </Button>
              </div>

              {/* GRAPHS CONTAINER */}
              <div className="rounded-md border bg-slate-50/50 p-6 min-h-[500px]">
                {behaviorType === "resting" && <RestingBehaviorView />}
                {behaviorType === "walking" && <WalkingBehaviorView />}
                {behaviorType === "eating" && <EatingBehaviorView />}
                {behaviorType === "mounting" && <MountingBehaviorView />}
                {behaviorType === "rumination" && <RuminationBehaviorView />}
              </div>
            </TabsContent>

            {/* TAB 3: PREDICTION VIEW */}
            <TabsContent value="prediction" className="mt-0">
              <BehaviorPredictionForm />
            </TabsContent>

          </Tabs>
        </div>
      </AppLayout>

      <AddAnimalModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        farms={user?.farmId ? [{ id: user.farmId, name: "My Farm" }] : []}
        farmId={user?.farmId || ""}
        onAnimalAdded={reload}
      />
    </ProtectedRoute>
  )
}