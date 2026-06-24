"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore"
import { db } from "@/firebase/config"
import { useAuth } from "@/lib/auth-context"
import type { Employee, Farm } from "@/lib/types"

interface UpdateEmployeeModalProps {
  open: boolean
  onClose: () => void
  employee: Employee | null
  farms: Farm[]
  existingEmployees: Employee[]
  onEmployeeUpdated?: () => void
}

export function UpdateEmployeeModal({ open, onClose, employee, farms, existingEmployees, onEmployeeUpdated }: UpdateEmployeeModalProps) {
  const { firebaseSignedIn } = useAuth()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    farmId: "",
  })
  const [showManagerAlert, setShowManagerAlert] = useState(false)

  useEffect(() => {
    if (employee) {
      setFormData({
        name: employee.name,
        email: employee.email,
        phone: employee.phone || "",
        farmId: employee.farmId,
      })
    }
  }, [employee])

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "")
    return digits.slice(0, 11)
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value)
    setFormData({ ...formData, phone: formatted })
  }

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    if (!firebaseSignedIn) {
      setError("You must be signed in to update an employee.")
      return
    }

    const farmHasManager = existingEmployees.some(
      (emp) => emp.farmId === formData.farmId && emp.role === "executive-manager" && emp.id !== employee?.id
    )

    if (farmHasManager) {
      setShowManagerAlert(true)
      return
    }

    if (employee) {
      setSubmitting(true)
      try {
        await updateDoc(doc(db, "users", employee.id), {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
        })

        if (formData.farmId !== employee.farmId) {
          await updateDoc(doc(db, "farms", employee.farmId), { employees: arrayRemove(employee.id) })
          await updateDoc(doc(db, "executive_managers", employee.id), { assignedFarms: arrayRemove(employee.farmId) })
          await updateDoc(doc(db, "farms", formData.farmId), { employees: arrayUnion(employee.id) })
          await updateDoc(doc(db, "executive_managers", employee.id), { assignedFarms: arrayUnion(formData.farmId) })
        }
        onClose()
        onEmployeeUpdated?.()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update employee")
      } finally {
        setSubmitting(false)
      }
    }
  }

  if (!employee) return null

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Update Employee</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^A-Za-z\s]/g, "")
                  setFormData({ ...formData, name: value })
                }}
                onKeyDown={(e) => {
                  if (/[0-9]/.test(e.key)) {
                    e.preventDefault()
                  }
                }}
                placeholder="Enter employee name"
                title="Name cannot contain numbers"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter email address"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number (11 digits)</Label>
              <Input
                id="phone"
                type="text"
                value={formData.phone}
                onChange={handlePhoneChange}
                onKeyDown={(e) => {
                  if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '.') {
                    e.preventDefault()
                  }
                }}
                placeholder="03001234567"
                maxLength={11}
                pattern="\d{11}"
                title="Phone number must be exactly 11 digits"
                required
              />
              <p className="text-xs text-muted-foreground">{formData.phone.length}/11 digits</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="farmId">Select Farm</Label>
              <select
                id="farmId"
                value={formData.farmId}
                onChange={(e) => setFormData({ ...formData, farmId: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                required
              >
                <option value="">Select a farm</option>
                {farms.map((farm) => (
                  <option key={farm.id} value={farm.id}>
                    {farm.name}
                  </option>
                ))}
              </select>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Updating..." : "Update Employee"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showManagerAlert} onOpenChange={setShowManagerAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Manager Already Assigned</AlertDialogTitle>
            <AlertDialogDescription>
              This farm already has an Executive Manager assigned. Please select a different farm or remove the existing manager first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogAction onClick={() => setShowManagerAlert(false)}>
            OK
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

