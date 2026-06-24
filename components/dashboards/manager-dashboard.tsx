"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AppLayout } from "@/components/layout/app-layout"
import { Topbar } from "@/components/layout/topbar"
import { AnimalsManagementTable } from "@/components/tables/animals-management-table"
import { useAuth } from "@/lib/auth-context"
import { getFarmById } from "@/lib/farmService"
import { getAnimalsByFarm, deleteAnimal } from "@/lib/animalService"
import { serviceAnimalToUi, serviceFarmToUi } from "@/lib/firebaseDataMappers"
import type { Animal, Farm } from "@/lib/types"
import {
  Activity,
  Stethoscope,
  AlertTriangle,
  Heart,
  MapPin,
  ClipboardList,
  Syringe,
  Beef,
  TrendingUp,
  ArrowRight,
  PieChart,
  CheckCircle2,
  Loader2,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { predictActivity } from "@/lib/activityPredictor"

const COLLARS = ["COL-001", "COL-002", "COL-003", "COL-004", "COL-005"]

export function ManagerDashboard() {
  const { user, firebaseSignedIn } = useAuth()
  const router = useRouter()

  const [reloadKey, setReloadKey] = useState(0)
  const reload = () => setReloadKey((k) => k + 1)

  const [userFarm, setUserFarm] = useState<Farm | undefined>(undefined)
  const [farmAnimals, setFarmAnimals] = useState<Animal[]>([])
  const [loading, setLoading] = useState(true)

  // ── Activity predictions ──
  const [activityMap, setActivityMap] = useState<Record<string, string>>({})

  async function refreshActivities() {
    const newMap: Record<string, string> = {}
    await Promise.all(
      COLLARS.map(async (collarId, index) => {
        const offset = index * 30
        const { data, error } = await supabase
          .from("sensor_data")
          .select("accel_x, accel_y, accel_z, gyro_x, gyro_y, gyro_z")
          .eq("device_id", "migrated_device")
          .order("id", { ascending: false })
          .range(offset, offset + 9)
        if (!error && data && data.length >= 10) {
          const prediction = predictActivity(data)
          if (prediction) newMap[collarId] = prediction
        }
      })
    )
    setActivityMap(newMap)
  }

  // Auto-refresh activities every 30 seconds
  useEffect(() => {
    void refreshActivities()
    const interval = setInterval(() => void refreshActivities(), 30000)
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
        if (!cancelled) setLoading(false)
        return
      }
      setLoading(true)
      try {
        const svcFarm = await getFarmById(farmId)
        if (!svcFarm) throw new Error("missing farm")
        const uiFarm = serviceFarmToUi(svcFarm)
        const svcAnimals = await getAnimalsByFarm(farmId)
        const uiAnimals = svcAnimals.map(serviceAnimalToUi)
        if (!cancelled) {
          setUserFarm(uiFarm)
          setFarmAnimals(uiAnimals)
        }
      } catch {
        if (!cancelled) {
          setUserFarm(undefined)
          setFarmAnimals([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [firebaseSignedIn, user?.farmId, user?.role, reloadKey])

  const healthyCount = farmAnimals.filter((a) => a.status === "healthy").length
  const sickCount = farmAnimals.filter((a) => a.status === "sick").length
  const treatedCount = farmAnimals.filter((a) => a.status === "treated").length
  const estrusCount = farmAnimals.filter((a) => a.inEstrus === true).length

  // Merge activity predictions into animals
  const animalsWithActivity = farmAnimals.map((animal) => {
    const activity = activityMap[animal.collarId ?? ""]
    if (!activity) return animal
    return {
      ...animal,
      activityLevel: activity === "walking"
        ? "high"
        : ("low" as "low" | "normal" | "high"),
    }
  })

  const handleDeleteAnimal = async (animalId: string) => {
    if (firebaseSignedIn) {
      try {
        await deleteAnimal(animalId)
        reload()
      } catch (err) {
        console.error("Failed to delete animal:", err)
      }
    } else {
      setFarmAnimals((prev) => prev.filter((a) => a.id !== animalId))
    }
  }

  return (
    <AppLayout>
      {/* Main Background Container */}
      <div className="flex-1 h-full overflow-y-auto bg-gradient-to-br from-cyan-50/50 via-blue-50/30 to-indigo-50/50 dark:from-slate-950 dark:to-slate-900">

        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 size={36} className="animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="p-8 space-y-8">
            <Topbar
              title="Executive Manager Dashboard"
              subtitle="Daily Operations & Health Management"
            />

            {/* 1. Farm Info Hero Section */}
            {userFarm && (
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 to-cyan-600 p-8 text-white shadow-xl">
                <div className="absolute right-0 top-0 h-full w-1/3 bg-white/10 skew-x-12 transform origin-bottom-right"></div>
                <div className="absolute right-10 top-5 text-white/20">
                  <ClipboardList size={140} />
                </div>

                <div className="relative z-10">
                  <div className="flex items-center space-x-2 mb-2 opacity-90">
                    <MapPin size={18} />
                    <span className="text-sm font-medium">{userFarm.location}</span>
                  </div>
                  <h2 className="text-3xl font-bold tracking-tight mb-6">{userFarm.name}</h2>

                  <div className="flex items-center gap-6">
                    <div className="bg-white/20 backdrop-blur-md rounded-xl p-4 border border-white/30 min-w-[150px]">
                      <p className="text-xs text-blue-100 uppercase tracking-wider mb-1">Under Management</p>
                      <div className="flex items-end gap-2">
                        <p className="text-2xl font-bold">{farmAnimals.length}</p>
                        <p className="text-sm mb-1 opacity-80">Heads</p>
                      </div>
                    </div>

                    <div className="hidden md:block bg-white/20 backdrop-blur-md rounded-xl p-4 border border-white/30 min-w-[150px]">
                      <p className="text-xs text-blue-100 uppercase tracking-wider mb-1">Health Status</p>
                      <div className="flex items-center gap-2">
                        <Activity size={20} className="text-green-300" />
                        <span className="font-bold">Operational</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Health Status Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

              {/* Healthy */}
              <div className="bg-white/70 dark:bg-slate-800/60 backdrop-blur-md p-6 rounded-3xl border border-green-100 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-2xl text-green-600">
                    <CheckCircle2 size={24} />
                  </div>
                  <span className="flex items-center text-xs font-bold text-green-600 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-full">
                    <TrendingUp size={12} className="mr-1" /> Stable
                  </span>
                </div>
                <p className="text-sm text-gray-500 font-medium">Healthy Animals</p>
                <h3 className="text-3xl font-extrabold text-gray-800 dark:text-gray-100">{healthyCount}</h3>
              </div>

              {/* In Treatment */}
              <div className="bg-white/70 dark:bg-slate-800/60 backdrop-blur-md p-6 rounded-3xl border border-indigo-100 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-2xl text-indigo-600">
                    <Syringe size={24} />
                  </div>
                  <span className="flex items-center text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-full">
                    Active Care
                  </span>
                </div>
                <p className="text-sm text-gray-500 font-medium">In Treatment</p>
                <h3 className="text-3xl font-extrabold text-gray-800 dark:text-gray-100">{treatedCount}</h3>
              </div>

              {/* Sick */}
              <div className="bg-white/70 dark:bg-slate-800/60 backdrop-blur-md p-6 rounded-3xl border border-red-100 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-red-100 dark:bg-red-900/50 rounded-2xl text-red-600">
                    <AlertTriangle size={24} />
                  </div>
                  <span className="flex items-center text-xs font-bold text-red-600 bg-red-50 dark:bg-red-900/30 px-2 py-1 rounded-full">
                    Attention
                  </span>
                </div>
                <p className="text-sm text-gray-500 font-medium">Sick / Quarantine</p>
                <h3 className="text-3xl font-extrabold text-gray-800 dark:text-gray-100">{sickCount}</h3>
              </div>

              {/* Estrus */}
              <div className="bg-white/70 dark:bg-slate-800/60 backdrop-blur-md p-6 rounded-3xl border border-pink-100 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-pink-100 dark:bg-pink-900/50 rounded-2xl text-pink-600">
                    <Heart size={24} />
                  </div>
                </div>
                <p className="text-sm text-gray-500 font-medium">Reproductive Cycle</p>
                <h3 className="text-3xl font-extrabold text-gray-800 dark:text-gray-100">{estrusCount}</h3>
              </div>
            </div>

            {/* 3. Main Actions & Data Area */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

              {/* Left Column: Animals Table */}
              <div className="xl:col-span-2 space-y-6">
                <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-md rounded-3xl border border-white/20 dark:border-slate-700 shadow-xl overflow-hidden p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center">
                      <Beef className="mr-2 text-blue-500" size={20} />
                      Live Herd Inventory
                    </h3>
                    <span className="text-xs text-gray-400">
                      🤖 ML Activity · auto-refreshes every 30s
                    </span>
                  </div>

                  {/* Activity Legend */}
                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                      High = Walking
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
                      Low = Resting
                    </span>
                  </div>

                  <AnimalsManagementTable
                    animals={animalsWithActivity}
                    onDelete={handleDeleteAnimal}
                  />
                </div>
              </div>

              {/* Right Column: Quick Actions & Summary */}
              <div className="space-y-6">

                {/* Quick Actions */}
                <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-md rounded-3xl border border-white/20 dark:border-slate-700 shadow-xl p-6">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <button
                      onClick={() => router.push("/animals")}
                      className="w-full group relative flex items-center p-4 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md hover:shadow-lg hover:scale-[1.02] transition-all"
                    >
                      <div className="p-2 bg-white/20 rounded-xl mr-4">
                        <Beef size={20} />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-sm">Manage Animals</p>
                        <p className="text-xs text-blue-100">Add, Edit or Transfer</p>
                      </div>
                      <ArrowRight
                        className="absolute right-4 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1"
                        size={18}
                      />
                    </button>

                    <button
                      onClick={() => router.push("/health-records")}
                      className="w-full group relative flex items-center p-4 rounded-2xl bg-white border border-gray-100 text-gray-800 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    >
                      <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl mr-4 text-emerald-600">
                        <ClipboardList size={20} />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-sm">Health Records</p>
                        <p className="text-xs text-gray-500">Log Vaccinations & Treatments</p>
                      </div>
                      <ArrowRight
                        className="absolute right-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1"
                        size={18}
                      />
                    </button>
                  </div>
                </div>

                {/* KPI Summary Cards */}
                <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-md rounded-3xl border border-white/20 dark:border-slate-700 shadow-xl p-6">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center">
                    <PieChart className="mr-2 text-gray-500" size={18} />
                    Performance
                  </h3>

                  <div className="space-y-4">
                    {/* Health Compliance */}
                    <div className="p-4 rounded-2xl bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800">
                      <div className="flex justify-between items-end mb-1">
                        <p className="text-sm font-semibold text-green-800 dark:text-green-200">Health Compliance</p>
                        <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                          {farmAnimals.length > 0
                            ? Math.round((healthyCount / farmAnimals.length) * 100)
                            : 0}%
                        </p>
                      </div>
                      <div className="w-full bg-green-200 dark:bg-green-900 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{
                            width: `${farmAnimals.length > 0
                              ? Math.round((healthyCount / farmAnimals.length) * 100)
                              : 0}%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    {/* Attention Required */}
                    <div className="p-4 rounded-2xl bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-semibold text-orange-800 dark:text-orange-200">Attention Needed</p>
                          <p className="text-xs text-orange-600/80 dark:text-orange-400">Sick or Treating</p>
                        </div>
                        <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                          {sickCount + treatedCount}
                        </p>
                      </div>
                    </div>

                    {/* Total Count */}
                    <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Total Animals</p>
                          <p className="text-xs text-gray-500">Under Management</p>
                        </div>
                        <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                          {farmAnimals.length}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        )}
      </div>
    </AppLayout>
  )
}