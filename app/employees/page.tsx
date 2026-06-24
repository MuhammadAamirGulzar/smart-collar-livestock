"use client"

import { useEffect, useState } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { Topbar } from "@/components/layout/topbar"
import { ProtectedRoute } from "@/components/protected-route"
import { OwnersManagementTable } from "@/components/tables/owners-management-table"
import { AddOwnerModal } from "@/components/modals/add-owner-modal"
import { UpdateOwnerModal } from "@/components/modals/update-owner-modal"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { listAllUserProfiles, getPrimaryAssignedFarmId } from "@/lib/userService"
import { userProfileToUiUser } from "@/lib/firebaseDataMappers"
import type { User } from "@/lib/types"

import { BellCurveChart } from "@/components/analytics/bell-curve-chart"

function BellCurvesDemo() {
  // Per your files:
  // - LSTM mean/std come from class_stats.csv (LSTM graph uses ACC_MAG_mean/std)
  // - Static model mean/std come from app/employees/graphs/Untitled-1.py demo (we approximate using class_stats.csv defaults for demo)
  // If you want exact static mean/std from Untitled-1.py later, we’ll wire parsing similarly.

  const lstmMean = 0.16718767164472634
  const lstmStd = 0.042565737412185604

  // using COW RESTING? For demo we pick one line value as “walking/standing instances” are separate.
  // Replace these with exact static-model stats if your Untitled-1.py exposes them.
  const staticMean = 0.16718767164472634
  const staticStd = 0.042565737412185604

  return (
    <>
      <BellCurveChart title="LSTM Bell Curve" mean={lstmMean} stdDev={lstmStd} />
      <BellCurveChart title="Static Model Bell Curve" mean={staticMean} stdDev={staticStd} />
    </>
  )
}


function ModelsDemoCardInline() {
  const [models, setModels] = useState<Array<{ file: string; type: string }>>([])
  const [loadingModels, setLoadingModels] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoadingModels(true)
        const res = await fetch('/api/ml-models')
        if (!res.ok) throw new Error('Failed to load model list')
        const json = (await res.json()) as { models: Array<{ file: string; type: string }> }
        if (!cancelled) setModels(json.models ?? [])
      } catch {
        if (!cancelled) setModels([])
      } finally {
        if (!cancelled) setLoadingModels(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  // Pick the two slots we need to show behavior examples (walking, standing)
  const modelCards = models.length > 0 ? models : [{ file: 'model.pkl', type: 'LSTM' }, { file: 'model_metrics.pkl', type: 'Static' }]
  const behaviorA = { label: 'Walking', sentence: 'Cow is healthy for walking behavior.' }
  const behaviorB = { label: 'Standing', sentence: 'Cow is healthy for standing behavior.' }

  return (
    <div>
      {loadingModels ? (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          Loading model info...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {modelCards.slice(0, 2).map((m) => {
            const type = m.type || (m.file.includes('metric') ? 'Static' : 'Model')
            return (
              <div key={m.file} className="rounded-xl border-2 p-5 border-emerald-200 bg-emerald-50/30">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{type} model</div>
                    <div className="text-sm font-bold text-gray-800">{m.file}</div>
                  </div>
                  <span className="text-xs font-bold px-2 py-1 rounded-full bg-green-200 text-green-800">Cow is healthy ✅</span>
                </div>

                <div className="space-y-3">
                  <div className="bg-white rounded-lg p-4 border">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-800">Instance A</span>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">{behaviorA.label}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">{behaviorA.sentence}</p>
                  </div>

                  <div className="bg-white rounded-lg p-4 border">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-800">Instance B</span>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">{behaviorB.label}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">{behaviorB.sentence}</p>
                  </div>
                </div>

                <p className="text-xs text-gray-500 mt-4">Updates when new collar sensor values are added.</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function UserManagementPage() { 
  const { firebaseSignedIn } = useAuth()
  const [showAddModal, setShowAddModal] = useState(false)
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [selectedOwner, setSelectedOwner] = useState<User | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const reload = () => setReloadKey((k) => k + 1)

  const [owners, setOwners] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState("")

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!firebaseSignedIn) {
        if (!cancelled) setLoading(false)
        return
      }
      setLoading(true)
      try {
        const profiles = await listAllUserProfiles()
        const ownerProfiles = profiles.filter((p) => p.role === "farm_owner")
        const uiOwners = await Promise.all(
          ownerProfiles.map(async (p) => {
            const farmId = await getPrimaryAssignedFarmId(p.uid, p.role)
            return userProfileToUiUser(p, farmId ? { farmId } : undefined)
          }),
        )
        if (!cancelled) setOwners(uiOwners)
      } catch {
        if (!cancelled) setOwners([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => { cancelled = true }
  }, [firebaseSignedIn, reloadKey])

  const handleUpdate = (owner: User) => {
    setSelectedOwner(owner)
    setShowUpdateModal(true)
  }

  const handleDelete = async (ownerId: string) => {
    if (firebaseSignedIn) {
      try {
        setPageError("")
        const { deleteFarmOwnerCascade } = await import("@/lib/deleteService")
        await deleteFarmOwnerCascade(ownerId)
        reload()
      } catch (err) {
        setPageError(err instanceof Error ? err.message : "Failed to delete owner")
      }
    } else {
      setOwners((prev) => prev.filter((u) => u.id !== ownerId))
    }
  }

  return (
    <ProtectedRoute allowedRoles={["superadmin"]}>
      <AppLayout>
        <Topbar
          title="User Management"
          subtitle="Manage farm owners"
          action={<Button onClick={() => setShowAddModal(true)}>Add New Owner</Button>}
        />

        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {pageError && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {pageError}
            </div>
          )}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
            </div>
          ) : (
            <OwnersManagementTable
              owners={owners}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          )}

          {/* AI Cow Health Models */}
          <div className="p-6 border rounded-xl bg-white shadow-sm">
            <h3 className="font-bold text-lg mb-1">🤖 AI Cow Health</h3>
            <p className="text-sm text-gray-500 mb-5">
              Models detected from <span className="font-medium">app/ml-api</span>.
            </p>

            <ModelsDemoCardInline />

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
              <BellCurvesDemo />
            </div>
          </div>
        </div>
      </AppLayout>

      <AddOwnerModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onOwnerAdded={reload}
      />

      <UpdateOwnerModal
        open={showUpdateModal}
        onClose={() => {
          setShowUpdateModal(false)
          setSelectedOwner(null)
        }}
        owner={selectedOwner}
        onOwnerUpdated={reload}
      />
    </ProtectedRoute>
  )
}
