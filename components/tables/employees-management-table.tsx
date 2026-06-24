"use client"

import { useState } from "react"
import type { Employee, Farm } from "@/lib/types"
import { GlassmorphicCard } from "@/components/ui/glassmorphic-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Pencil, Trash2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface EmployeesManagementTableProps {
  employees: Employee[]
  farms: Farm[]
  onUpdate: (employee: Employee) => void
  onDelete: (employeeId: string) => void
}

export function EmployeesManagementTable({ employees, farms, onUpdate, onDelete }: EmployeesManagementTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [employeeToDelete, setEmployeeToDelete] = useState<string | null>(null)

  // Filter employees based on search term
  const filteredEmployees = employees.filter((employee) => {
    const farm = farms.find((f) => f.id === employee.farmId)
    const searchLower = searchTerm.toLowerCase()
    
    return (
      employee.name.toLowerCase().includes(searchLower) ||
      employee.email.toLowerCase().includes(searchLower) ||
      farm?.name.toLowerCase().includes(searchLower)
    )
  })

  const handleDeleteClick = (employeeId: string) => {
    setEmployeeToDelete(employeeId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (employeeToDelete) {
      onDelete(employeeToDelete)
      setDeleteDialogOpen(false)
      setEmployeeToDelete(null)
    }
  }

  return (
    <>
      <GlassmorphicCard>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Employees</h2>
          <Input
            placeholder="Search employees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-white/20 dark:border-white/10">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Employee Name</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Email</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Role</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Join Date</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Assigned Farm</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    No employees found
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((employee) => {
                  const farm = farms.find((f) => f.id === employee.farmId)
                  
                  return (
                    <tr key={employee.id} className="border-b border-white/10 dark:border-white/5 hover:bg-white/5">
                      <td className="py-3 px-4 font-medium text-foreground">{employee.name}</td>
                      <td className="py-3 px-4 text-foreground">{employee.email}</td>
                      <td className="py-3 px-4">
                        <span className="text-xs font-semibold px-2 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 capitalize">
                          {employee.role.replace("-", " ")}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-foreground">{new Date(employee.joinDate).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-foreground">{farm?.name || "N/A"}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onUpdate(employee)}
                            className="h-8 w-8 p-0"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteClick(employee.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </GlassmorphicCard>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the employee.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

