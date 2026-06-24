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
import { getAnimalsByFarm } from "@/lib/animalService"
import { getHealthRecordsByFarm, deleteHealthRecord } from "@/lib/healthRecordService"
import { supabase } from "@/lib/supabase"

// ── INTERFACES ──
interface CollarOption {
  collarId: string
  animalName: string
  farmId: string
}

interface GyroRecord {
  gyro_x: number
  gyro_y: number
  gyro_z: number
}

interface CollarData {
  collarId: string
  records: GyroRecord[]
  loading: boolean
  shown: boolean
}

interface PredictionResult {
  fileName: string
  isHealthy: boolean
  totalRows: number
  dominantLabel: string
  labelCounts: Record<string, number>
  avgAccMag: number
  avgGyroMag: number
  confidence: number
}

// ── CONSTANTS ──
const COLLARS = ["COL-001", "COL-002", "COL-003", "COL-004", "COL-005"]

// ── HELPER ──
function analyzeCSV(csvText: string, fileName: string): PredictionResult {
  const lines = csvText.trim().split("\n")
  const headers = lines[0].split(",").map((h) => h.trim().replace(/\t/g, ""))
  const rows = lines.slice(1).filter((l) => l.trim() !== "")

  const labelIndex = headers.indexOf("label")
  const accMagMeanIndex = headers.indexOf("ACC_MAG_mean")
  const gyroMagMeanIndex = headers.indexOf("GYRO_MAG_mean")

  const labelCounts: Record<string, number> = {}
  let totalAccMag = 0
  let totalGyroMag = 0

  rows.forEach((row) => {
    const cols = row.split(",")
    const label = cols[labelIndex]?.trim().replace(/\t/g, "") ?? "unknown"
    labelCounts[label] = (labelCounts[label] ?? 0) + 1
    totalAccMag += parseFloat(cols[accMagMeanIndex] ?? "0") || 0
    totalGyroMag += parseFloat(cols[gyroMagMeanIndex] ?? "0") || 0
  })

  const totalRows = rows.length
  const avgAccMag = totalAccMag / totalRows
  const avgGyroMag = totalGyroMag / totalRows

  const dominantLabel =
    Object.entries(labelCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "unknown"

  const healthyLabels = ["rumination", "grazing", "standing", "walking", "lying"]
  const unhealthyLabels = ["abnormal", "distress", "sick", "irregular", "unknown"]

  let healthyCount = 0
  let unhealthyCount = 0
  Object.entries(labelCounts).forEach(([label, count]) => {
    const l = label.toLowerCase()
    if (healthyLabels.some((h) => l.includes(h))) healthyCount += count
    else if (unhealthyLabels.some((u) => l.includes(u))) unhealthyCount += count
    else healthyCount += count
  })

  const healthyRatio = healthyCount / (healthyCount + unhealthyCount)
  const isHealthy = healthyRatio >= 0.5
  const confidence = Math.round(
    isHealthy ? healthyRatio * 100 : (1 - healthyRatio) * 100
  )

  return {
    fileName,
    isHealthy,
    totalRows,
    dominantLabel,
    labelCounts,
    avgAccMag: parseFloat(avgAccMag.toFixed(4)),
    avgGyroMag: parseFloat(avgGyroMag.toFixed(6)),
    confidence,
  }
}

// ── AUTO PREDICTOR COMPONENT ──
function AutoPredictor() {
  const [result1, setResult1] = useState<PredictionResult | null>(null)
  const [result2, setResult2] = useState<PredictionResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadBothCSVs() {
      setLoading(true)
      setError(null)
      try {
        const [res1, res2] = await Promise.all([fetch("/1.csv"), fetch("/2.csv")])
        if (!res1.ok || !res2.ok)
          throw new Error("CSV files not found in /public folder")
        const [text1, text2] = await Promise.all([res1.text(), res2.text()])
        setResult1(analyzeCSV(text1, "1.csv"))
        setResult2(analyzeCSV(text2, "2.csv"))
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load CSV files")
      } finally {
        setLoading(false)
      }
    }
    void loadBothCSVs()
  }, [])

  return (
    <div className="p-6 border rounded-xl bg-white shadow-sm">
      <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
        <span>🤖</span> Cow Health AI Analyzer
      </h3>
      <p className="text-sm text-gray-500 mb-5">
        Automatically analyzing collar sensor data to predict cow health status.
      </p>

      {loading && (
        <div className="flex items-center gap-3 text-blue-600 text-sm font-medium py-4">
          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8z"
            />
          </svg>
          AI is analyzing collar data...
        </div>
      )}

      {error && (
        <div className="text-red-500 text-sm font-medium py-2">❌ {error}</div>
      )}

      {!loading && !error && result1 && result2 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[result1, result2].map((result) => (
            <div
              key={result.fileName}
              className={`rounded-xl border-2 p-5 ${
                result.isHealthy
                  ? "border-green-400 bg-green-50"
                  : "border-red-400 bg-red-50"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {result.fileName}
                </span>
                <span
                  className={`text-xs font-bold px-2 py-1 rounded-full ${
                    result.isHealthy
                      ? "bg-green-200 text-green-800"
                      : "bg-red-200 text-red-800"
                  }`}
                >
                  {result.confidence}% confidence
                </span>
              </div>

              <p
                className={`text-2xl font-bold mb-1 ${
                  result.isHealthy ? "text-green-700" : "text-red-700"
                }`}
              >
                {result.isHealthy ? "✅ HEALTHY" : "⚠️ ABNORMAL"}
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Dominant behavior:{" "}
                <span className="font-semibold capitalize">
                  {result.dominantLabel}
                </span>
              </p>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-white rounded-lg p-3 border text-center">
                  <p className="text-xs text-gray-500">Total Rows</p>
                  <p className="text-lg font-bold text-gray-800">{result.totalRows}</p>
                </div>
                <div className="bg-white rounded-lg p-3 border text-center">
                  <p className="text-xs text-gray-500">Avg Acc Magnitude</p>
                  <p className="text-lg font-bold text-gray-800">{result.avgAccMag}</p>
                </div>
                <div className="bg-white rounded-lg p-3 border text-center">
                  <p className="text-xs text-gray-500">Avg Gyro Magnitude</p>
                  <p className="text-lg font-bold text-gray-800">{result.avgGyroMag}</p>
                </div>
                <div className="bg-white rounded-lg p-3 border text-center">
                  <p className="text-xs text-gray-500">Unique Behaviors</p>
                  <p className="text-lg font-bold text-gray-800">
                    {Object.keys(result.labelCounts).length}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2 uppercase">
                  Behavior Breakdown
                </p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(result.labelCounts).map(([label, count]) => (
                    <span
                      key={label}
                      className="px-2 py-1 bg-white border rounded-full text-xs text-gray-700"
                    >
                      {label}: <span className="font-bold">{count}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── MAIN PAGE ──
export default function HealthRecordsManagerPage() {
  const { user, firebaseSignedIn } = useAuth()

  const [showAddModal, setShowAddModal] = useState(false)
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<HealthRecord | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [pageError, setPageError] = useState("")
  const [records, setRecords] = useState<HealthRecord[]>([])
  const [collars, setCollars] = useState<CollarOption[]>([])

  const [collarDataMap, setCollarDataMap] = useState<Record<string, CollarData>>(
    Object.fromEntries(
      COLLARS.map((c) => [
        c,
        { collarId: c, records: [], loading: false, shown: false },
      ])
    )
  )

  const reload = () => setReloadKey((k) => k + 1)

  useEffect(() => {
    let cancelled = false
    const farmId = user?.farmId
    async function load() {
      if (!firebaseSignedIn || user?.role !== "executive-manager" || !farmId)
        return
      try {
        const animals = await getAnimalsByFarm(farmId)
        const collarOpts: CollarOption[] = animals
          .filter((a) => a.collarId)
          .map((a) => ({ collarId: a.collarId!, animalName: a.name, farmId }))

        const recs = await getHealthRecordsByFarm(farmId)
        const uiRecords: HealthRecord[] = recs.map((r) => ({
          id: r.recordId,
          animalId: "",
          collarId: r.collarId,
          date: r.date,
          notes: r.notes,
          treatment: r.treatment,
          veterinarian: r.veterinarian,
        }))

        if (!cancelled) {
          setCollars(collarOpts)
          setRecords(uiRecords)
        }
      } catch {
        if (!cancelled) {
          setRecords([])
          setCollars([])
        }
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [firebaseSignedIn, user?.farmId, user?.role, reloadKey])

  async function fetchCollarData(collarId: string) {
    if (collarDataMap[collarId].shown) {
      setCollarDataMap((prev) => ({
        ...prev,
        [collarId]: { ...prev[collarId], shown: false },
      }))
      return
    }

    setCollarDataMap((prev) => ({
      ...prev,
      [collarId]: { ...prev[collarId], loading: true, shown: false },
    }))

    try {
      const collarIndex = COLLARS.indexOf(collarId)
      const offset = collarIndex * 30

      const { data: rows, error } = await supabase
        .from("sensor_data")
        .select("gyro_x, gyro_y, gyro_z")
        .eq("device_id", "migrated_device")
        .order("id", { ascending: false })
        .range(offset, offset + 29)

      if (error) throw error

      setCollarDataMap((prev) => ({
        ...prev,
        [collarId]: { collarId, records: rows ?? [], loading: false, shown: true },
      }))
    } catch {
      setCollarDataMap((prev) => ({
        ...prev,
        [collarId]: { ...prev[collarId], loading: false, shown: false },
      }))
    }
  }

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
      setPageError(
        err instanceof Error ? err.message : "Failed to delete record"
      )
    }
  }

  return (
    <ProtectedRoute allowedRoles={["executive-manager"]}>
      <AppLayout>
        <Topbar
          title="Health Records"
          subtitle="Manage animal health records"
          action={
            <Button onClick={() => setShowAddModal(true)}>Add New Record</Button>
          }
        />

        <div className="flex-1 overflow-y-auto p-8 space-y-6">

          {/* ── COLLAR GYRO DATA SECTION ── */}
          <div className="p-6 border rounded-xl bg-white shadow-sm">
            <h3 className="font-bold text-lg mb-1">🐄 Collar Sensor Data</h3>
            <p className="text-sm text-gray-500 mb-5">
              Click a collar button to view its gyroscope readings from the sensor.
            </p>

            <div className="flex flex-wrap gap-3 mb-6">
              {COLLARS.map((collarId) => {
                const state = collarDataMap[collarId]
                return (
                  <button
                    key={collarId}
                    onClick={() => fetchCollarData(collarId)}
                    disabled={state.loading}
                    className={`px-5 py-2 rounded-lg font-medium text-sm transition-all shadow-sm border
                      ${
                        state.shown
                          ? "bg-green-600 text-white border-green-600"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                      }
                      ${
                        state.loading
                          ? "opacity-60 cursor-not-allowed"
                          : "cursor-pointer"
                      }
                    `}
                  >
                    {state.loading ? "Loading..." : collarId}
                  </button>
                )
              })}
            </div>

            <div className="space-y-6">
              {COLLARS.filter((c) => collarDataMap[c].shown).map((collarId) => {
                const state = collarDataMap[collarId]
                return (
                  <div key={collarId} className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-b">
                      <div>
                        <span className="font-semibold text-gray-800">
                          {collarId}
                        </span>
                        <span className="ml-2 text-xs text-gray-500">
                          {collarId === "COL-001"
                            ? "Latest 30 records"
                            : "Next 30 records"}
                        </span>
                      </div>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                        {state.records.length} records
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100 text-gray-600 text-xs uppercase">
                          <tr>
                            <th className="px-4 py-3 text-left">#</th>
                            <th className="px-4 py-3 text-left">Gyro X</th>
                            <th className="px-4 py-3 text-left">Gyro Y</th>
                            <th className="px-4 py-3 text-left">Gyro Z</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {state.records.map((row, i) => (
                            <tr key={i} className="hover:bg-gray-50">
                              <td className="px-4 py-2 text-gray-400 text-xs">
                                {i + 1}
                              </td>
                              <td className="px-4 py-2 font-mono">
                                {row.gyro_x?.toFixed(4) ?? "—"}
                              </td>
                              <td className="px-4 py-2 font-mono">
                                {row.gyro_y?.toFixed(4) ?? "—"}
                              </td>
                              <td className="px-4 py-2 font-mono">
                                {row.gyro_z?.toFixed(4) ?? "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── AI PREDICTOR ── */}
          <AutoPredictor />

          {/* ── PAGE ERROR ── */}
          {pageError && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {pageError}
            </div>
          )}

          {/* ── HEALTH RECORDS TABLE ── */}
          <div className="bg-white rounded-xl shadow-sm border">
            <HealthRecordsManagementTable
              healthRecords={records}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          </div>
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