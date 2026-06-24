"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { doc, getDoc } from "firebase/firestore"
import { AppLayout } from "@/components/layout/app-layout"
import { Topbar } from "@/components/layout/topbar"
import { AnimalsTable } from "@/components/tables/animals-table"
import { useAuth } from "@/lib/auth-context"
import { db } from "@/firebase/config"
import { getFarmsByOwner } from "@/lib/farmService"
import { getAnimalsByFarm } from "@/lib/animalService"
import {
  serviceAnimalToUi,
  serviceFarmToUi,
} from "@/lib/firebaseDataMappers"
import type { Animal, Employee, Farm } from "@/lib/types"
import { 
  Beef, 
  Activity, 
  Thermometer, 
  Heart, 
  Scale, 
  CalendarDays, 
  MapPin, 
  ChevronDown, 
  ClipboardPlus, 
  UserCog,
  Users,
  Building2,
  TrendingUp,
  AlertCircle,
  Loader2
} from "lucide-react"

const USERS = "users"

export function OwnerDashboard() {
  const { user, firebaseSignedIn } = useAuth()
  const router = useRouter()
  const [ownerFarms, setOwnerFarms] = useState<Farm[]>([])
  const [allAnimals, setAllAnimals] = useState<Animal[]>([])
  const [allEmployees, setAllEmployees] = useState<Employee[]>([])
  const [selectedFarmId, setSelectedFarmId] = useState(user?.farmId || "")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.farmId) setSelectedFarmId(user.farmId)
  }, [user?.farmId])

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (
        !firebaseSignedIn ||
        user?.role !== "owner" ||
        !user?.id
      ) {
        if (!cancelled) setLoading(false)
        return
      }
      setLoading(true)
      try {
        const svcFarms = await getFarmsByOwner(user.id)
        const uiFarms = svcFarms.map((f) => serviceFarmToUi(f))
        const animalGroups = await Promise.all(
          svcFarms.map((f) => getAnimalsByFarm(f.farmId)),
        )
        const uiAnimals = animalGroups.flat().map(serviceAnimalToUi)
        const employeesFlat: Employee[] = []
        for (let i = 0; i < svcFarms.length; i++) {
          const sf = svcFarms[i]
          const farmUi = uiFarms[i]
          for (const empId of sf.employees ?? []) {
            const snap = await getDoc(doc(db, USERS, empId))
            if (!snap.exists()) continue
            const data = snap.data() as { name?: string; email?: string; role?: string }
            if (data.role !== "executive_manager") continue
            employeesFlat.push({
              id: empId,
              farmId: farmUi.id,
              name: String(data.name ?? ""),
              email: String(data.email ?? ""),
              role: "executive-manager",
              joinDate: "—",
            })
          }
        }
        if (!cancelled) {
          setOwnerFarms(uiFarms)
          setAllAnimals(uiAnimals)
          setAllEmployees(employeesFlat)
          if (uiFarms.length > 0) {
            setSelectedFarmId((prev) => {
              if (prev && uiFarms.some((x) => x.id === prev)) return prev
              return uiFarms[0].id
            })
          }
        }
      } catch {
        if (!cancelled) {
          setOwnerFarms([])
          setAllAnimals([])
          setAllEmployees([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [firebaseSignedIn, user?.id, user?.role])

  const currentFarm = ownerFarms.find((f) => f.id === selectedFarmId)
  const farmAnimals = allAnimals.filter((a) => a.farmId === selectedFarmId)
  const farmEmployees = allEmployees.filter((e) => e.farmId === selectedFarmId)

  const healthyCount = farmAnimals.filter((a) => a.status === "healthy").length
  const sickCount = farmAnimals.filter((a) => a.status === "sick").length
  const estrusCount = farmAnimals.filter((a) => a.inEstrus === true).length
  const avgAge =
    farmAnimals.length > 0 ? Math.round(farmAnimals.reduce((sum, a) => sum + a.age, 0) / farmAnimals.length) : 0
  const totalWeight = farmAnimals.reduce((sum, a) => sum + a.weight, 0)

  return (
    <AppLayout>
      {/* Background Container */}
      <div className="flex-1 h-full overflow-y-auto bg-gradient-to-br from-green-50/50 via-emerald-50/30 to-teal-50/50 dark:from-slate-950 dark:to-slate-900">
        
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 size={36} className="animate-spin text-emerald-600" />
          </div>
        ) : (
        <div className="p-8 space-y-8">
          <Topbar
            title="Owner Dashboard"
            subtitle={`Overview for ${currentFarm?.name || "Your Farm"}`}
          />

          {/* 1. Farm Overview Header Card */}
          {currentFarm && (
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-600 p-8 text-white shadow-xl">
              <div className="absolute right-0 top-0 h-full w-1/3 bg-white/5 skew-x-12 transform"></div>
              <div className="absolute right-20 bottom-[-20px] text-white/10 rotate-12">
                <Building2 size={180} />
              </div>

              <div className="relative z-10 flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                <div>
                  <div className="flex items-center space-x-2 mb-2 opacity-90">
                    <MapPin size={18} />
                    <span className="text-sm font-medium">{currentFarm.location}</span>
                  </div>
                  <h2 className="text-4xl font-bold tracking-tight mb-6">{currentFarm.name}</h2>
                  
                  <div className="flex gap-8">
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                      <p className="text-xs text-emerald-100 uppercase tracking-wider mb-1">Farm Size</p>
                      <p className="text-xl font-bold">{currentFarm.size} <span className="text-sm font-normal opacity-80">acres</span></p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                      <p className="text-xs text-emerald-100 uppercase tracking-wider mb-1">Established</p>
                      <p className="text-xl font-bold">{new Date(currentFarm.createdAt).getFullYear()}</p>
                    </div>
                  </div>
                </div>

                {/* Farm Selector Dropdown */}
                {ownerFarms.length > 1 && (
                  <div className="bg-white/20 backdrop-blur-md p-1 rounded-xl border border-white/30">
                    <div className="relative">
                      <select
                        id="farm-select"
                        value={selectedFarmId}
                        onChange={(e) => setSelectedFarmId(e.target.value)}
                        className="appearance-none bg-transparent text-white font-semibold py-2 pl-4 pr-10 rounded-lg focus:outline-none focus:bg-white/10 cursor-pointer"
                      >
                        {ownerFarms.map((farm) => (
                          <option key={farm.id} value={farm.id} className="text-slate-900">
                            {farm.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" size={16} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 2. Key Statistics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Animals */}
            <div className="bg-white/70 dark:bg-slate-800/60 backdrop-blur-md p-6 rounded-3xl border border-emerald-100 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/50 rounded-2xl text-emerald-600">
                  <Beef size={24} />
                </div>
                <span className="flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-full">
                  <TrendingUp size={12} className="mr-1" /> +3%
                </span>
              </div>
              <p className="text-sm text-gray-500 font-medium">Total Livestock</p>
              <h3 className="text-3xl font-extrabold text-gray-800 dark:text-gray-100">{farmAnimals.length}</h3>
            </div>

            {/* Healthy */}
            <div className="bg-white/70 dark:bg-slate-800/60 backdrop-blur-md p-6 rounded-3xl border border-blue-100 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-2xl text-blue-600">
                  <Activity size={24} />
                </div>
                <span className="flex items-center text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-full">
                  Stable
                </span>
              </div>
              <p className="text-sm text-gray-500 font-medium">Healthy Animals</p>
              <h3 className="text-3xl font-extrabold text-gray-800 dark:text-gray-100">{healthyCount}</h3>
            </div>

            {/* Sick */}
            <div className="bg-white/70 dark:bg-slate-800/60 backdrop-blur-md p-6 rounded-3xl border border-red-100 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-red-100 dark:bg-red-900/50 rounded-2xl text-red-600">
                  <Thermometer size={24} />
                </div>
                {sickCount > 0 && (
                  <span className="flex items-center text-xs font-bold text-red-600 bg-red-50 dark:bg-red-900/30 px-2 py-1 rounded-full animate-pulse">
                    <AlertCircle size={12} className="mr-1" /> Action Needed
                  </span>
                )}
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
              <p className="text-sm text-gray-500 font-medium">In Estrus Cycle</p>
              <h3 className="text-3xl font-extrabold text-gray-800 dark:text-gray-100">{estrusCount}</h3>
            </div>
          </div>

          {/* 3. Metrics Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-white/50 border border-white/60 shadow-sm flex items-center space-x-4">
              <div className="bg-orange-100 p-3 rounded-full text-orange-600"><CalendarDays size={20}/></div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Avg Age</p>
                <p className="text-xl font-bold">{avgAge} <span className="text-sm font-normal text-gray-400">years</span></p>
              </div>
            </div>
            <div className="p-6 rounded-3xl bg-white/50 border border-white/60 shadow-sm flex items-center space-x-4">
              <div className="bg-indigo-100 p-3 rounded-full text-indigo-600"><Scale size={20}/></div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Total Biomass</p>
                <p className="text-xl font-bold">{totalWeight.toLocaleString()} <span className="text-sm font-normal text-gray-400">kg</span></p>
              </div>
            </div>
            <div className="p-6 rounded-3xl bg-white/50 border border-white/60 shadow-sm flex items-center space-x-4">
              <div className="bg-green-100 p-3 rounded-full text-green-600"><Activity size={20}/></div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Herd Health Score</p>
                <p className="text-xl font-bold text-green-600">{Math.round((healthyCount / farmAnimals.length) * 100) || 0}%</p>
              </div>
            </div>
          </div>

          {/* 4. Animals List Table */}
          <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-md rounded-3xl border border-white/20 dark:border-slate-700 shadow-xl overflow-hidden p-6">
             <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center">
                <Beef className="mr-2 text-emerald-500" size={20} />
                Herd Overview
             </h3>
             <AnimalsTable animals={farmAnimals} />
          </div>

          {/* 5. Quick Actions & Staff Split View */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Quick Actions */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 ml-1">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => router.push("/health-records")}
                  className="p-6 rounded-3xl bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex flex-col items-center justify-center gap-3 group"
                >
                  <ClipboardPlus size={32} className="group-hover:rotate-12 transition-transform"/>
                  <span className="font-semibold text-sm">Health Check</span>
                </button>

                <button 
                  onClick={() => router.push("/manage-employees")}
                  className="p-6 rounded-3xl bg-white border border-gray-200 text-gray-700 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex flex-col items-center justify-center gap-3 group dark:bg-slate-800 dark:border-slate-700 dark:text-gray-200"
                >
                  <UserCog size={32} className="text-blue-500 group-hover:rotate-12 transition-transform"/>
                  <span className="font-semibold text-sm">Manage Staff</span>
                </button>
              </div>
            </div>

            {/* Staff List */}
            <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-md rounded-3xl border border-white/20 dark:border-slate-700 shadow-xl p-6">
               <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center">
                  <Users className="mr-2 text-blue-500" size={20} />
                  Farm Staff
               </h3>
               {farmEmployees.length > 0 ? (
                 <div className="space-y-3">
                   {farmEmployees.map((employee) => (
                     <div key={employee.id} className="flex items-center justify-between p-3 bg-white/50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-blue-200 transition-colors">
                       <div className="flex items-center gap-3">
                         <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 font-bold">
                            {employee.name.charAt(0)}
                         </div>
                         <div>
                           <p className="font-bold text-sm text-gray-800 dark:text-gray-200">{employee.name}</p>
                           <p className="text-xs text-gray-500">{employee.email}</p>
                         </div>
                       </div>
                       <span className="text-[10px] font-bold uppercase tracking-wide px-3 py-1 bg-blue-50 text-blue-600 rounded-full dark:bg-blue-900/30 dark:text-blue-300">
                         {employee.role.replace("executive-", "")}
                       </span>
                     </div>
                   ))}
                 </div>
               ) : (
                 <div className="text-center py-8 text-gray-400 text-sm">No staff members assigned yet.</div>
               )}
            </div>

          </div>
        </div>
        )}
      </div>
    </AppLayout>
  )
}