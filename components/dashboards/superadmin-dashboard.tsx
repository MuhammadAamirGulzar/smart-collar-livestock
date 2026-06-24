"use client"

import { useEffect, useState } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { Topbar } from "@/components/layout/topbar"
import { FarmsTable } from "@/components/tables/farms-table"
import { OwnersTable } from "@/components/tables/owners-table"
import { Tractor, Users, Activity, HeartPulse, Database, Server, CheckCircle2, TrendingUp, Trash2, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { getAllFarms } from "@/lib/farmService"
import { getAnimalsByFarm } from "@/lib/animalService"
import { getPrimaryAssignedFarmId, listAllUserProfiles } from "@/lib/userService"
import { cleanDatabase, type CleanDatabaseResult } from "@/lib/deleteService"
import {
  serviceAnimalToUi,
  serviceFarmToUi,
  userProfileToUiUser,
} from "@/lib/firebaseDataMappers"
import type { Animal, Farm, User } from "@/lib/types"

export function SuperAdminDashboard() {
  const { firebaseSignedIn, user } = useAuth()
  const [tableFarms, setTableFarms] = useState<Farm[]>([])
  const [tableAnimals, setTableAnimals] = useState<Animal[]>([])
  const [tableUsers, setTableUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [cleaning, setCleaning] = useState(false)
  const [cleanResult, setCleanResult] = useState<CleanDatabaseResult | null>(null)
  const [cleanError, setCleanError] = useState<string | null>(null)
  const [confirmStep, setConfirmStep] = useState(false)

  async function handleCleanDatabase() {
    if (!confirmStep) {
      setConfirmStep(true)
      return
    }
    setConfirmStep(false)
    setCleaning(true)
    setCleanResult(null)
    setCleanError(null)
    try {
      const result = await cleanDatabase()
      setCleanResult(result)
      setTableFarms([])
      setTableAnimals([])
      setTableUsers((prev) => prev.filter((u) => u.role === "superadmin"))
    } catch (err) {
      setCleanError(err instanceof Error ? err.message : "Cleanup failed")
    } finally {
      setCleaning(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!firebaseSignedIn || user?.role !== "superadmin") {
        setLoading(false)
        return
      }
      setLoading(true)
      try {
        const svcFarms = await getAllFarms()
        const animalGroups = await Promise.all(
          svcFarms.map((f) =>
            getAnimalsByFarm(f.farmId).catch(() => []),
          ),
        )
        const uiAnimals = animalGroups.flat().map(serviceAnimalToUi)
        const animalCountByFarm = new Map<string, number>()
        for (const a of uiAnimals) {
          animalCountByFarm.set(
            a.farmId,
            (animalCountByFarm.get(a.farmId) ?? 0) + 1,
          )
        }
        const uiFarms = svcFarms.map((f) =>
          serviceFarmToUi(f, { totalCows: animalCountByFarm.get(f.farmId) ?? 0 }),
        )
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
          setTableFarms(uiFarms)
          setTableAnimals(uiAnimals)
          setTableUsers(uiUsers)
        }
      } catch {
        if (!cancelled) {
          setTableFarms([])
          setTableAnimals([])
          setTableUsers([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [firebaseSignedIn, user?.role])

  const totalFarms = tableFarms.length
  const totalAnimals = tableAnimals.length
  const totalOwners = tableUsers.filter((u) => u.role === "owner").length
  const healthyAnimals = tableAnimals.filter((a) => a.status === "healthy").length
  const totalUsers = tableUsers.length

  return (
    <AppLayout>
      {/* Main Content Container with Gradient Theme */}
      <div className="flex-1 h-full overflow-y-auto bg-gradient-to-br from-emerald-50/50 via-teal-50/30 to-blue-50/50 dark:from-slate-950 dark:to-slate-900">
        
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 size={36} className="animate-spin text-emerald-600" />
          </div>
        ) : (
        <div className="p-8 space-y-8">
          <Topbar
            title="SuperAdmin Dashboard"
            subtitle="Overview of your entire farm network"
          />

          {/* Modern Stats Grid (Replaces old StatCards) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Total Farms Card */}
            <div className="relative overflow-hidden p-6 rounded-3xl bg-white/70 dark:bg-slate-800/60 backdrop-blur-md border border-emerald-100 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Tractor size={80} className="text-emerald-600 rotate-12" />
              </div>
              <div className="flex items-center space-x-4 mb-2">
                <div className="p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600">
                  <Tractor size={24} />
                </div>
                <span className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Farms</span>
              </div>
              <div className="flex items-baseline space-x-2">
                <h3 className="text-3xl font-extrabold text-gray-800 dark:text-white">{totalFarms}</h3>
                <span className="text-xs font-medium text-emerald-600 flex items-center bg-emerald-50 px-2 py-0.5 rounded-full">
                  <TrendingUp size={10} className="mr-1" /> +12%
                </span>
              </div>
            </div>

            {/* Total Animals Card */}
            <div className="relative overflow-hidden p-6 rounded-3xl bg-white/70 dark:bg-slate-800/60 backdrop-blur-md border border-orange-100 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Activity size={80} className="text-orange-600 rotate-12" />
              </div>
              <div className="flex items-center space-x-4 mb-2">
                <div className="p-3 rounded-2xl bg-orange-100 dark:bg-orange-900/50 text-orange-600">
                  <Activity size={24} />
                </div>
                <span className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Animals</span>
              </div>
              <div className="flex items-baseline space-x-2">
                <h3 className="text-3xl font-extrabold text-gray-800 dark:text-white">{totalAnimals}</h3>
                <span className="text-xs font-medium text-orange-600 flex items-center bg-orange-50 px-2 py-0.5 rounded-full">
                  <TrendingUp size={10} className="mr-1" /> +5%
                </span>
              </div>
            </div>

            {/* Healthy Animals Card */}
            <div className="relative overflow-hidden p-6 rounded-3xl bg-white/70 dark:bg-slate-800/60 backdrop-blur-md border border-blue-100 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <HeartPulse size={80} className="text-blue-600 rotate-12" />
              </div>
              <div className="flex items-center space-x-4 mb-2">
                <div className="p-3 rounded-2xl bg-blue-100 dark:bg-blue-900/50 text-blue-600">
                  <HeartPulse size={24} />
                </div>
                <span className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Healthy</span>
              </div>
              <div className="flex items-baseline space-x-2">
                <h3 className="text-3xl font-extrabold text-gray-800 dark:text-white">{healthyAnimals}</h3>
                <span className="text-xs font-medium text-blue-600 flex items-center bg-blue-50 px-2 py-0.5 rounded-full">
                  98% Rate
                </span>
              </div>
            </div>

            {/* Owners Card */}
            <div className="relative overflow-hidden p-6 rounded-3xl bg-white/70 dark:bg-slate-800/60 backdrop-blur-md border border-purple-100 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Users size={80} className="text-purple-600 rotate-12" />
              </div>
              <div className="flex items-center space-x-4 mb-2">
                <div className="p-3 rounded-2xl bg-purple-100 dark:bg-purple-900/50 text-purple-600">
                  <Users size={24} />
                </div>
                <span className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Owners</span>
              </div>
              <div className="flex items-baseline space-x-2">
                <h3 className="text-3xl font-extrabold text-gray-800 dark:text-white">{totalOwners}</h3>
                <span className="text-xs font-medium text-purple-600 flex items-center bg-purple-50 px-2 py-0.5 rounded-full">
                  <CheckCircle2 size={10} className="mr-1" /> Active
                </span>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            
            {/* Left Column: Farms Table */}
            <div className="xl:col-span-2 space-y-6">
              <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-md rounded-3xl border border-white/20 dark:border-slate-700 shadow-xl overflow-hidden p-1">
                 <div className="p-4 border-b border-gray-100 dark:border-slate-800">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center">
                      <Tractor className="mr-2 text-emerald-500" size={20} />
                      Farm Network Overview
                    </h3>
                 </div>
                 {/* Existing Farms Table Component */}
                 <div className="p-2">
                    <FarmsTable farms={tableFarms} users={tableUsers} />
                 </div>
              </div>

              <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-md rounded-3xl border border-white/20 dark:border-slate-700 shadow-xl overflow-hidden p-1">
                 <div className="p-4 border-b border-gray-100 dark:border-slate-800">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center">
                      <Users className="mr-2 text-purple-500" size={20} />
                      Owner Management
                    </h3>
                 </div>
                 {/* Existing Owners Table Component */}
                 <div className="p-2">
                    <OwnersTable users={tableUsers} farms={tableFarms} animals={tableAnimals} />
                 </div>
              </div>
            </div>

            {/* Right Column: System Status */}
            <div className="xl:col-span-1">
              <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-slate-700 shadow-xl p-6 sticky top-6">
                <h2 className="text-xl font-bold mb-6 text-gray-800 dark:text-white flex items-center">
                  <Server className="mr-2 text-gray-400" />
                  System Status
                </h2>
                
                <div className="space-y-4">
                  {/* System Operational */}
                  <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800 transition-transform hover:scale-[1.02]">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-emerald-600 mr-3">
                        <CheckCircle2 size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">All Systems</p>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400">Operational</p>
                      </div>
                    </div>
                    <span className="text-lg font-bold text-emerald-700 dark:text-emerald-300">100%</span>
                  </div>

                  {/* Database Status */}
                  <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800 transition-transform hover:scale-[1.02]">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 mr-3">
                        <Database size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Database</p>
                        <p className="text-xs text-blue-600 dark:text-blue-400">Connected</p>
                      </div>
                    </div>
                    <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
                  </div>

                  {/* Registered Users */}
                  <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 rounded-2xl border border-purple-100 dark:border-purple-800 transition-transform hover:scale-[1.02]">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-purple-600 mr-3">
                        <Users size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-purple-900 dark:text-purple-100">Registered Users</p>
                        <p className="text-xs text-purple-600 dark:text-purple-400">In System</p>
                      </div>
                    </div>
                    <span className="text-lg font-bold text-purple-700 dark:text-purple-300">{totalUsers}</span>
                  </div>
                </div>

                {/* Database Cleanup */}
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-slate-700">
                  <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                    Danger Zone
                  </h3>

                  {!confirmStep ? (
                    <button
                      onClick={handleCleanDatabase}
                      disabled={cleaning}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-semibold text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors disabled:opacity-50"
                    >
                      {cleaning ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                      {cleaning ? "Cleaning..." : "Clean Database"}
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                        This will delete ALL farms, animals, readings, and non-admin users. Are you sure?
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={handleCleanDatabase}
                          className="flex-1 px-4 py-2 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 transition-colors"
                        >
                          Yes, delete everything
                        </button>
                        <button
                          onClick={() => setConfirmStep(false)}
                          className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {cleanResult && (
                    <div className="mt-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 space-y-1">
                      <p className="font-semibold">Cleanup complete:</p>
                      <p>Farms: {cleanResult.farms} &middot; Animals: {cleanResult.animals} &middot; Readings: {cleanResult.readings}</p>
                      <p>Users: {cleanResult.users} &middot; Owners: {cleanResult.farmOwners} &middot; Managers: {cleanResult.executiveManagers}</p>
                    </div>
                  )}

                  {cleanError && (
                    <p className="mt-3 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 font-medium">
                      {cleanError}
                    </p>
                  )}
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