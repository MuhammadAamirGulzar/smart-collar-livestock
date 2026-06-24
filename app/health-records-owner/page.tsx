"use client"

import { useEffect, useState } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { Topbar } from "@/components/layout/topbar"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/lib/auth-context"
import { HealthRecordsManagementTable } from "@/components/tables/health-records-management-table"
import { AddHealthRecordModal } from "@/components/modals/add-health-record-modal"
import { UpdateHealthRecordModal } from "@/components/modals/update-health-record-modal"
import { Button } from "@/components/ui/button"
import type { HealthRecord } from "@/lib/types"
import { getFarmsByOwner } from "@/lib/farmService"
import { getAnimalsByFarm } from "@/lib/animalService"
import {
  getHealthRecordsByFarm,
  deleteHealthRecord,
} from "@/lib/healthRecordService"

interface CollarOption {
  collarId: string
  animalName: string
  farmId: string
}

export default function HealthRecordsOwnerPage() {
  const { user, firebaseSignedIn } = useAuth()
  const [showAddModal, setShowAddModal] = useState(false)
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<HealthRecord | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [pageError, setPageError] = useState("")
  const reload = () => setReloadKey((k) => k + 1)

  const [records, setRecords] = useState<HealthRecord[]>([])
  const [collars, setCollars] = useState<CollarOption[]>([])

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!firebaseSignedIn || user?.role !== "owner" || !user?.id) return
      try {
        const svcFarms = await getFarmsByOwner(user.id)

        const collarOpts: CollarOption[] = []
        for (const f of svcFarms) {
          const animals = await getAnimalsByFarm(f.farmId)
          for (const a of animals) {
            if (a.collarId) {
              collarOpts.push({ collarId: a.collarId, animalName: a.name, farmId: f.farmId })
            }
          }
        }

        const allRecords: HealthRecord[] = []
        for (const f of svcFarms) {
          const recs = await getHealthRecordsByFarm(f.farmId)
          for (const r of recs) {
            allRecords.push({
              id: r.recordId,
              animalId: "",
              collarId: r.collarId,
              date: r.date,
              notes: r.notes,
              treatment: r.treatment,
              veterinarian: r.veterinarian,
            })
          }
        }

        if (!cancelled) {
          setCollars(collarOpts)
          setRecords(allRecords)
        }
      } catch {
        if (!cancelled) {
          setRecords([])
          setCollars([])
        }
      }
    }
    void load()
    return () => { cancelled = true }
  }, [firebaseSignedIn, user?.id, user?.role, reloadKey])

  const handleUpdate = (record: HealthRecord) => {
    setSelectedRecord(record)
    setShowUpdateModal(true)
  }

  const handleDelete = async (recordId: string) => {
    if (!firebaseSignedIn) return
    try {
      setPageError("")
      await deleteHealthRecord(recordId)
      reload()
    } catch (err) {
      setPageError(err instanceof Error ? err.message : "Failed to delete record")
    }
  }

  return (
    <ProtectedRoute allowedRoles={["owner"]}>
      <AppLayout>
        <Topbar
          title="Health Records"
          subtitle="Manage animal health records"
          action={
            <Button onClick={() => setShowAddModal(true)}>Add New Record</Button>
          }
        />

        <div className="flex-1 overflow-y-auto p-8">
          {pageError && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {pageError}
            </div>
          )}
          <HealthRecordsManagementTable
            healthRecords={records}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
          />
        </div>
      </AppLayout>

      <AddHealthRecordModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        collars={collars}
        onRecordAdded={reload}
      />

      <UpdateHealthRecordModal
        open={showUpdateModal}
        onClose={() => {
          setShowUpdateModal(false)
          setSelectedRecord(null)
        }}
        record={selectedRecord}
      />
    </ProtectedRoute>
  )
}
