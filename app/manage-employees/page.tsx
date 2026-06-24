"use client"

import { useEffect, useState } from "react"
import { doc, getDoc, updateDoc, arrayRemove } from "firebase/firestore"
import { AppLayout } from "@/components/layout/app-layout"
import { Topbar } from "@/components/layout/topbar"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/lib/auth-context"
import { EmployeesManagementTable } from "@/components/tables/employees-management-table"
import { AddEmployeeModal } from "@/components/modals/add-employee-modal"
import { UpdateEmployeeModal } from "@/components/modals/update-employee-modal"
import { Button } from "@/components/ui/button"
import type { Employee, Farm } from "@/lib/types"
import { db } from "@/firebase/config"
import { getFarmsByOwner } from "@/lib/farmService"
import { serviceFarmToUi } from "@/lib/firebaseDataMappers"

export default function EmployeesPage() {
  const { user, firebaseSignedIn } = useAuth()
  const [showAddModal, setShowAddModal] = useState(false)
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const reload = () => setReloadKey((k) => k + 1)

  const [ownerFarms, setOwnerFarms] = useState<Farm[]>([])
  const [ownerEmployees, setOwnerEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState("")
  const [svcFarmIds, setSvcFarmIds] = useState<Map<string, string>>(new Map())

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!firebaseSignedIn || user?.role !== "owner" || !user?.id) {
        if (!cancelled) setLoading(false)
        return
      }
      setLoading(true)
      try {
        const svcFarms = await getFarmsByOwner(user.id)
        const uiFarms = svcFarms.map((f) => serviceFarmToUi(f))
        if (!cancelled) setOwnerFarms(uiFarms)

        const farmIdMap = new Map<string, string>()
        const employees: Employee[] = []
        for (const sf of svcFarms) {
          for (const empId of sf.employees ?? []) {
            farmIdMap.set(empId + sf.farmId, sf.farmId)
            try {
              const snap = await getDoc(doc(db, "users", empId))
              if (!snap.exists()) continue
              const data = snap.data() as { name?: string; email?: string; role?: string; phone?: string }
              if (data.role !== "executive_manager") continue
              employees.push({
                id: empId,
                farmId: sf.farmId,
                name: String(data.name ?? ""),
                email: String(data.email ?? ""),
                phone: String(data.phone ?? ""),
                role: "executive-manager",
                joinDate: "—",
              })
            } catch {
              continue
            }
          }
        }
        if (!cancelled) {
          setOwnerEmployees(employees)
          setSvcFarmIds(farmIdMap)
        }
      } catch {
        if (!cancelled) {
          setOwnerFarms([])
          setOwnerEmployees([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => { cancelled = true }
  }, [firebaseSignedIn, user?.id, user?.role, reloadKey])

  const handleUpdate = (employee: Employee) => {
    setSelectedEmployee(employee)
    setShowUpdateModal(true)
  }

  const handleDelete = async (employeeId: string) => {
    if (firebaseSignedIn) {
      try {
        setPageError("")
        const emp = ownerEmployees.find((e) => e.id === employeeId)
        if (emp) {
          const farmRef = doc(db, "farms", emp.farmId)
          await updateDoc(farmRef, { employees: arrayRemove(employeeId) })
          const emRef = doc(db, "executive_managers", employeeId)
          await updateDoc(emRef, { assignedFarms: arrayRemove(emp.farmId) })
        }
        reload()
      } catch (err) {
        setPageError(err instanceof Error ? err.message : "Failed to remove employee")
      }
    } else {
      setOwnerEmployees((prev) => prev.filter((e) => e.id !== employeeId))
    }
  }

  return (
    <ProtectedRoute allowedRoles={["owner"]}>
      <AppLayout>
        <Topbar
          title="Employees"
          subtitle="Manage your farm employees"
          action={
            <Button onClick={() => setShowAddModal(true)}>Add New Employee</Button>
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
          ) : (
            <EmployeesManagementTable
              employees={ownerEmployees}
              farms={ownerFarms}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          )}
        </div>
      </AppLayout>

      <AddEmployeeModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        farms={ownerFarms}
        existingEmployees={ownerEmployees}
        onEmployeeAdded={reload}
      />

      <UpdateEmployeeModal
        open={showUpdateModal}
        onClose={() => {
          setShowUpdateModal(false)
          setSelectedEmployee(null)
        }}
        employee={selectedEmployee}
        farms={ownerFarms}
        existingEmployees={ownerEmployees}
        onEmployeeUpdated={reload}
      />
    </ProtectedRoute>
  )
}
